// Side card panel (step 3, PLAN D3 / D9). Lane A owns this file.
// Shows, for the selected site and landing date: verdict in words, Sun and Earth status,
// horizon model, source and coverage, an Educator / Researcher switch, and a CSV download.
// v1.2: Sun and Earth status are shown at the shared hour of the stay (props.hour, default 0).
// All values come from /lib/visibility.js; nothing is calculated here except formatting.
import { V, type Site, type State, type Summary, type Horizon, type Metrics } from "./data";
import { createPanelRoot, esc, deg, az, pct, VERDICT_WORDS, verdictShort, addDays, fmtUtc, clampHour } from "./shared";
import type { MountPanel, PanelProps } from "./types";

type Mode = "plain" | "numbers"; // shown as Educator / Researcher

export const mountSideCard: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "sidecard", CSS);
  const body = document.createElement("section");
  body.className = "card";
  body.setAttribute("aria-live", "polite");
  root.append(body);

  let current: PanelProps = { ...props };
  let mode: Mode = "plain";
  let token = 0;
  let view: { site: Site; state: State; summary: Summary; horizon: Horizon; start: string; metrics: Metrics } | null = null;
  // D16 power calculator inputs (Researcher view); kept while the panel lives.
  const calc = { areaM2: 1, effPct: 30, panel: "tracking" as "tracking" | "fixed-flat", loadW: 100 };

  // Calculator inputs re-render only the result block, so typing keeps focus.
  body.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const k = t.dataset.calc;
    if (!k) return;
    if (k === "panel") calc.panel = t.value as "tracking" | "fixed-flat";
    else (calc as Record<string, number | string>)[k] = Number(t.value);
    renderCalc();
  });

  body.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const a = t.dataset.action;
    if (a === "mode-plain" || a === "mode-numbers") { mode = a === "mode-plain" ? "plain" : "numbers"; paint(); renderCalc(); }
    else if (a === "prev-day") current.onDateSelected(addDays(current.landingDate, -1));
    else if (a === "next-day") current.onDateSelected(addDays(current.landingDate, 1));
    else if (a === "csv") downloadCsv();
    else if (a === "open-horizon") current.onOpenView?.("horizon");
    else if (a === "open-compare") current.onOpenView?.("compare");
  });

  async function load() {
    const my = ++token;
    view = null;
    const site = V.listSites().find((s) => s.id === current.siteId);
    if (!site) { body.innerHTML = `<p class="warn">Unknown site “${esc(current.siteId)}”.</p>`; return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(current.landingDate)) { body.innerHTML = `<p class="warn">Pick a landing date.</p>`; return; }
    body.innerHTML = `<h2>${esc(site.name)}</h2><p class="muted">Loading Sun and Earth data…</p>`;
    try {
      await Promise.all([V.loadSite(site.id), V.loadDaily()]); // daily summary: best-site ranking (D17)
    } catch (err) {
      if (my !== token) return;
      body.innerHTML = `<h2>${esc(site.name)}</h2><p class="warn">Could not load data for this site (${esc((err as Error).message)}).</p>`;
      return;
    }
    if (my !== token) return;
    const start = `${current.landingDate}T00:00:00Z`;
    try {
      const state = V.getState(site.id, Date.parse(start) + hourNow() * 3.6e6);
      const summary = V.getSummary(site.id, start, V.VERDICT_RULE.STAY_DAYS);
      const horizon = V.getHorizon(site.id);
      const metrics = V.getMetrics(site.id, start, V.VERDICT_RULE.STAY_DAYS);
      view = { site, state, summary, horizon, start, metrics };
      paint();
      renderCalc();
    } catch (err) {
      const msg = (err as Error).message;
      if (!/OUT_OF_COVERAGE/.test(msg)) { body.innerHTML = `<h2>${esc(site.name)}</h2><p class="warn">${esc(msg)}</p>`; return; }
      const ranges = V.getCoverage().sites.find((c) => c.siteId === site.id)?.ranges ?? [];
      body.innerHTML = `
        <h2>${esc(site.name)}</h2>
        <p class="warn"><strong>Unavailable:</strong> we have no data for a ${V.VERDICT_RULE.STAY_DAYS}-day stay from ${esc(current.landingDate)}.</p>
        <p class="muted">Data covers: ${ranges.map(([a, b]) => `${esc(a.slice(0, 10))} to ${esc(b.slice(0, 10))}`).join("; ")}. We never guess outside these dates.</p>`;
    }
  }

  const hourNow = () => clampHour(current.hour, V.VERDICT_RULE.STAY_DAYS * 24);
  const atHour = (st: State) => hourNow() === 0
    ? `At the start of the stay (${fmtUtc(st.sampleUtc)})`
    : `At hour ${hourNow() + 1} of the stay (${fmtUtc(st.sampleUtc)})`;

  function paint() {
    if (!view) return;
    const { site, state, summary, horizon } = view;
    const w = VERDICT_WORDS[summary.verdict];
    const flat = state.horizonModel === "flat";
    const days = V.VERDICT_RULE.STAY_DAYS;
    const coords = `${Math.abs(site.lat).toFixed(5)}°${site.lat < 0 ? "S" : "N"}, ${Math.abs(site.lon).toFixed(5)}°${site.lon < 0 ? "W" : "E"}`;
    const pointNote = site.kind === "south-pole" ? site.note.split(" (")[0] : "";
    const horizonLabel = flat
      ? "Flat horizon: terrain is not modelled at this site."
      : "Terrain horizon from LOLA elevation data (one point; nearby spots differ, especially toward Earth).";

    body.innerHTML = `
      <header>
        <h2>${esc(site.name)}</h2>
        <p class="muted">${esc(coords)} · stay of ${days} days from ${esc(current.landingDate)} 00:00 UTC</p>
        ${pointNote ? `<p class="muted small">${esc(pointNote)}.</p>` : ""}
      </header>
      <div class="switch" role="group" aria-label="Reading level: Educator or Researcher">
        <button type="button" data-action="mode-plain" aria-pressed="${mode === "plain"}">Educator</button>
        <button type="button" data-action="mode-numbers" aria-pressed="${mode === "numbers"}">Researcher</button>
      </div>
      <div class="verdict" data-verdict="${summary.verdict}">
        <span class="symbol" aria-hidden="true">${w.symbol}</span>
        <div><strong>${esc(w.label)}</strong><span class="why-short">: ${esc(verdictShort(summary.verdict, state.horizonModel))}</span></div>
      </div>
      <p class="horizon-label"><span class="tag" data-model="${state.horizonModel}">${flat ? "FLAT" : "TERRAIN"}</span> ${esc(horizonLabel)}</p>
      ${mode === "plain" ? plain() : numbers()}
      <nav class="days" aria-label="Change landing date">
        <button type="button" data-action="prev-day">◀ Day before</button>
        <button type="button" data-action="next-day">Day after ▶</button>
      </nav>
      ${current.onOpenView ? `<nav class="exits" aria-label="Open another view">
        <button type="button" data-action="open-horizon">Stand here</button>
        <button type="button" data-action="open-compare">Compare other dates</button>
      </nav>` : ""}`;

    function plain(): string {
      return `
        <p class="why">${esc(whySentence(summary, flat))}</p>
        <h3>${esc(atHour(state))}</h3>
        <ul class="status">
          <li><strong>Sunlight:</strong> ${state.lit ? "yes" : "no"}${esc(sunNote(state))}</li>
          <li><strong>Earth in view:</strong> ${state.comms ? "yes" : "no"}${esc(earthNote(state))}</li>
        </ul>
        <p class="muted small">“Sunlight” means the Sun is above the horizon, not a promise of power. “Earth in view” means a possible direct line of sight, not a guaranteed link.</p>
        ${scoreEducator()}`;
    }

    // D17 Educator: one score, default weights, top site named in plain words, no formula.
    function scoreEducator(): string {
      const r = V.getRanking(current.landingDate);
      const me = r.ranking.find((x) => x.siteId === site.id);
      const top = r.ranking[0];
      if (!me?.available || !top?.available) return `<div class="score"><h3>Best-site score <span class="proto">PROTOTYPE</span></h3><p class="muted">Not available for this landing date.</p></div>`;
      const topLine = top.siteId === site.id
        ? `This is the top site for a landing on ${esc(current.landingDate)}.`
        : `The top site for a landing on ${esc(current.landingDate)} is <strong>${esc(top.name)}</strong> (${Math.round(top.score!)} out of 100).`;
      return `<div class="score"><h3>Best-site score <span class="proto">PROTOTYPE</span></h3>
        <p class="big"><strong>${Math.round(me.score!)}</strong> out of 100 for this site.</p>
        <p>${topLine}</p>
        <p class="muted small">Uses the default weights. The Researcher view explains the calculation.</p></div>`;
    }

    function numbers(): string {
      const hzAt = (el: number, margin: number) => el - margin;
      const change = (h: number | null, up: boolean, set: string, rise: string) =>
        h === null ? "no change within the data (up to 60 days)" : `${up ? set : rise} in ${h} h`;
      const ranges = V.getCoverage().sites.find((c) => c.siteId === site.id)?.ranges ?? [];
      const src = V.getTimeline(site.id, view!.start, 1).source;
      return `
        <h3>${esc(atHour(state))}, hourly sample</h3>
        <table>
          <thead><tr><th></th><th>Elevation</th><th>Azimuth</th><th>Horizon there</th><th>Margin</th><th>Next change</th></tr></thead>
          <tbody>
            <tr><th>Sun</th><td>${deg(state.sunEl)}</td><td>${az(state.sunAz)}</td><td>${deg(hzAt(state.sunEl, state.sunMarginDeg))}</td>
              <td>${deg(state.sunMarginDeg)} ${state.lit ? "(up)" : "(down)"}</td><td>${esc(change(state.hoursToSunChange, state.lit, "sunset", "sunrise"))}</td></tr>
            <tr><th>Earth</th><td>${deg(state.earthEl)}</td><td>${az(state.earthAz)}</td><td>${deg(hzAt(state.earthEl, state.earthMarginDeg))}</td>
              <td>${deg(state.earthMarginDeg)} ${state.comms ? "(in view)" : "(not in view)"}</td><td>${esc(change(state.hoursToEarthChange, state.comms, "Earthset", "Earthrise"))}</td></tr>
          </tbody>
        </table>
        <p class="muted small">Azimuth clockwise from north. Margin = elevation − horizon at that azimuth. Data are hourly; change times are to the hour.</p>
        <h3>Over the ${days}-day stay</h3>
        <table class="kv">
          <tr><th>Sunlight</th><td>${pct(summary.pctLit)}</td><th>Earth in view</th><td>${pct(summary.pctComms)}</td></tr>
          <tr><th>Both together</th><td>${pct(summary.pctBoth)}</td><th>Longest dark stretch</th><td>${summary.longestDarkHours} h</td></tr>
          <tr><th>Sun within ${state.edgeDeg}° of horizon</th><td>${pct(summary.pctSunEdge)}</td><th>Earth within ${state.edgeDeg}° of horizon</th><td>${pct(summary.pctEarthEdge)}</td></tr>
        </table>
        <p class="muted small">Verdict rule: ${esc(summary.verdictRule)}</p>
        ${metricsHtml()}
        ${powerHtml()}
        ${scoreResearcher()}
        <h3>Sources</h3>
        <ul class="sources small">
          <li>Sun and Earth angles: ${esc(src)}.</li>
          <li>Horizon: ${flat ? "flat (0° in every direction)" : `${esc(horizon.source)}${horizon.observer ? ` Observer ${Math.abs(horizon.observer.groundHeightM).toFixed(1)} m ${horizon.observer.groundHeightM >= 0 ? "above" : "below"} the 1737.4 km reference sphere + ${horizon.observer.mastM} m assumed mast.` : ""} ${esc(horizon.verifiedMeaning ?? "")}`}</li>
          <li>Site coordinates: <a href="${esc(site.source)}" target="_blank" rel="noopener">${esc(site.source)}</a>${site.coordsVerified ? "" : " (unverified)"}</li>
          <li>Coverage for this site: ${ranges.map(([a, b]) => `${esc(fmtUtc(a))} to ${esc(fmtUtc(b))}`).join("; ")}.</li>
        </ul>
        <button type="button" class="csv" data-action="csv">Download CSV (${days * 24} hourly rows)</button>`;
    }

    // D16 metrics (terrain-aware hourly data).
    function metricsHtml(): string {
      const m = view!.metrics;
      return `<h3>Power and comms metrics (${m.hours} h, terrain-aware)</h3>
        <table class="kv">
          <tr><th>Sunlight share</th><td>${pct(m.pctLit)}</td><th>Earth-in-view share</th><td>${pct(m.pctComms)}</td></tr>
          <tr><th>Longest dark stretch</th><td>${m.longestDarkHours} h</td><th>Longest contact gap</th><td>${m.longestContactGapHours} h</td></tr>
          <tr><th>Dark periods</th><td>${m.darkPeriods}</td><th>Contact windows</th><td>${m.contactWindows}</td></tr>
        </table>
        <p class="muted small">${esc(m.note)} ${esc(m.commsNote)}</p>`;
    }

    // D16 power calculator: inputs here; results in #calc-out (re-rendered on input).
    function powerHtml(): string {
      return `<h3>Power calculator <span class="proto">ESTIMATE</span></h3>
        <div class="calc">
          <label>Panel area (m²) <input type="number" min="0.01" step="0.1" value="${calc.areaM2}" data-calc="areaM2"/></label>
          <label>Efficiency (%) <input type="number" min="1" max="100" step="1" value="${calc.effPct}" data-calc="effPct"/></label>
          <label>Panel type <select data-calc="panel">
            <option value="tracking"${calc.panel === "tracking" ? " selected" : ""}>Sun-tracking</option>
            <option value="fixed-flat"${calc.panel === "fixed-flat" ? " selected" : ""}>Fixed flat (horizontal)</option></select></label>
          <label>Lander power draw (W) <input type="number" min="0" step="1" value="${calc.loadW}" data-calc="loadW"/></label>
        </div>
        <div class="calc-out" aria-live="polite"></div>`;
    }

    // D17 Researcher: formula + this site's components at default weights.
    function scoreResearcher(): string {
      const r = V.getRanking(current.landingDate);
      const me = r.ranking.find((x) => x.siteId === site.id);
      if (!me?.available) return `<h3>Best-site score <span class="proto">PROTOTYPE</span></h3><p class="muted">Not available for this landing date.</p>`;
      const W = V.SCORE_DEFAULT_WEIGHTS, c = me.components!;
      const row = (k: keyof typeof W, name: string) => `<tr><td>${esc(name)}</td><td>${esc(V.SCORE_TERMS[k])}</td><td>${c[k].toFixed(3)}</td><td>${W[k]}</td></tr>`;
      return `<h3>Best-site score <span class="proto">PROTOTYPE</span></h3>
        <p class="small">${esc(V.SCORE_FORMULA_TEXT)}</p>
        <table><thead><tr><th>Term</th><th>Meaning</th><th>Value</th><th>Default weight</th></tr></thead><tbody>
          ${row("sunlight", "wS")}${row("earth", "wE")}${row("shortDark", "wD")}${row("shortGap", "wG")}
        </tbody></table>
        <p class="small">Score for this site at default weights: <strong>${me.score!.toFixed(1)}</strong> / 100 (rank ${r.ranking.indexOf(me) + 1} of ${r.ranking.filter((x) => x.available).length}). Adjust the weights and see the ranking update in <em>Compare dates</em>.</p>`;
    }
  }

  function renderCalc() {
    const out = body.querySelector(".calc-out");
    if (!out || !view) return;
    try {
      const p = V.computePower({ siteId: view.site.id, startUtc: view.start, days: V.VERDICT_RULE.STAY_DAYS,
        areaM2: calc.areaM2, efficiency: calc.effPct / 100, panel: calc.panel, loadW: calc.loadW });
      const kwh = (wh: number) => `${(wh / 1000).toFixed(1)} kWh`;
      out.innerHTML = `<p class="small"><strong>Estimate</strong> for this ${p.hours}-hour stay:</p>
        <table class="kv">
          <tr><th>Average power</th><td>${p.averageW.toFixed(0)} W</td><th>Peak (panel facing the Sun)</th><td>${p.peakW.toFixed(0)} W</td></tr>
          <tr><th>Energy over the stay</th><td>${kwh(p.energyWh)}</td><th>Lander needs</th><td>${kwh(p.loadEnergyWh)}</td></tr>
          <tr><th>Balance</th><td>${p.balanceWh >= 0 ? "+" : "−"}${kwh(Math.abs(p.balanceWh))}${p.balanceWh < 0 ? " (deficit)" : ""}</td><th>Battery to survive the longest stretch with no panel power (${p.longestNoPowerHours} h)</th><td>${kwh(p.batteryWh)}</td></tr>
        </table>
        <p class="small">Assumptions:</p><ul class="small">${p.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`;
    } catch (err) {
      out.innerHTML = `<p class="warn small">${esc((err as Error).message)}</p>`;
    }
  }

  function downloadCsv() {
    if (!view) return;
    const { site, start } = view;
    const tl = V.getTimeline(site.id, start, V.VERDICT_RULE.STAY_DAYS);
    const s = tl.samples;
    const lines = [
      `# site_id,${site.id}`,
      `# site_name,${csvCell(site.name)}`,
      `# lat_deg,${site.lat}`,
      `# lon_east_deg,${site.lon}`,
      `# horizon_model,${tl.horizonModel}`,
      `# ephemeris_source,${csvCell(tl.source)}`,
      `# site_source,${csvCell(site.source)}`,
      `# mock,${V.MOCK}`,
      `# api_version,${V.API_VERSION}`,
      `# stay,${s[0].utc}..${s[s.length - 1].utc} (${V.VERDICT_RULE.STAY_DAYS} days, hourly; azimuth clockwise from north; UTC)`,
      "utc,sun_el_deg,sun_az_deg,sun_margin_deg,earth_el_deg,earth_az_deg,earth_margin_deg,sun_up,earth_in_view,sun_edge,earth_edge",
      ...s.map((r) => [r.utc, r.sunEl, r.sunAz, r.sunMarginDeg, r.earthEl, r.earthAz, r.earthMarginDeg, r.lit, r.comms, r.sunEdge, r.earthEdge].join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n") + "\n"], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.id}_${current.landingDate}_${V.VERDICT_RULE.STAY_DAYS}day.csv`;
    root.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  load();
  return {
    update(next) {
      const changed = (next.siteId !== undefined && next.siteId !== current.siteId) ||
        (next.landingDate !== undefined && next.landingDate !== current.landingDate);
      const hourChanged = next.hour !== undefined && next.hour !== current.hour;
      current = { ...current, ...next };
      if (changed) load();
      else if (hourChanged && view) { view.state = V.getState(view.site.id, Date.parse(view.start) + hourNow() * 3.6e6); paint(); renderCalc(); }
    },
    destroy() { token++; host.remove(); },
  };
};

function csvCell(s: string): string { return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

function whySentence(s: Summary, flat: boolean): string {
  const both = pct(s.pctBoth), lit = pct(s.pctLit), com = pct(s.pctComms);
  switch (s.verdict) {
    case "clear": return `Sunlight and Earth are in view together ${both} of the stay.`;
    case "partial": return `Sunlight and Earth are in view together only ${both} of the stay (sunlight ${lit}, Earth ${com}).`;
    case "out": return `Sunlight and Earth are in view together just ${both} of the stay (sunlight ${lit}, Earth ${com}).`;
    case "edge": {
      const who = s.pctSunEdge > 50 && s.pctEarthEdge > 50 ? "The Sun and Earth stay" : s.pctSunEdge > 50 ? "The Sun stays" : "Earth stays";
      return flat
        ? `${who} within 2° of the horizon for most of the stay, so terrain decides — and this site uses a flat horizon, so treat the answer as uncertain.`
        : `${who} within 2° of the terrain skyline for most of the stay: grazing the skyline, so small changes in position matter.`;
    }
  }
}
function sunNote(st: State): string {
  if (st.horizonModel === "flat") return st.lit ? ` — the Sun is ${deg(st.sunEl, 1)} above the horizon` : ` — the Sun is below the horizon`;
  if (st.sunEl > 0 && !st.lit) return ` — the Sun is ${deg(st.sunEl, 1)} above level but hidden behind terrain`;
  if (st.sunEl <= 0 && st.lit) return ` — the Sun is below level but visible over lower terrain from this high point`;
  return st.lit ? ` — the Sun clears the terrain by ${deg(st.sunMarginDeg, 1)}` : ` — the Sun is below the terrain horizon`;
}
function earthNote(st: State): string {
  if (st.horizonModel === "flat") return st.comms ? ` — Earth is ${deg(st.earthEl, 1)} above the horizon` : ` — Earth is below the horizon`;
  if (st.earthEl > 0 && !st.comms) return ` — Earth is ${deg(st.earthEl, 1)} above level but hidden behind terrain`;
  if (st.earthEl <= 0 && st.comms) return ` — Earth is below level but visible over lower terrain from this high point`;
  return st.comms ? ` — Earth clears the terrain by ${deg(st.earthMarginDeg, 1)}` : ` — Earth is below the terrain horizon`;
}

const CSS = `
.card { padding: 18px 20px; border: 1px solid var(--llp-border, #344b69); border-radius: 14px; background: var(--llp-bg, #132138); line-height: 1.5; }
h2 { margin: 0 0 4px; font-size: 1.2rem; }
h3 { margin: 18px 0 6px; font-size: .95rem; }
p { margin: 6px 0; }
.small { font-size: .82rem; }
.switch { display: inline-flex; margin: 12px 0; border: 1px solid var(--llp-border, #344b69); border-radius: 999px; overflow: hidden; }
.switch button { padding: 6px 16px; border: 0; background: transparent; color: inherit; }
.switch button[aria-pressed="true"] { background: var(--llp-accent, #2f5d9a); font-weight: 650; }
.verdict { display: flex; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 10px; border: 2px solid; }
.verdict .symbol { font-size: 1.6rem; line-height: 1; }
.verdict strong { font-size: 1.15rem; }
.verdict[data-verdict="clear"] { border-color: var(--llp-clear, #4fbf7a); background: rgba(79,191,122,.12); }
.verdict[data-verdict="partial"] { border-color: var(--llp-partial, #e0b84f); background: rgba(224,184,79,.12); }
.verdict[data-verdict="out"] { border-color: var(--llp-out, #e06a5f); background: rgba(224,106,95,.12); }
.verdict[data-verdict="edge"] { border-color: var(--llp-edge, #b48cf0); background: rgba(180,140,240,.12); border-style: dashed; }
.tag { display: inline-block; padding: 1px 7px; margin-right: 4px; border-radius: 6px; font-size: .72rem; font-weight: 700; letter-spacing: .06em; border: 1px solid currentColor; }
.tag[data-model="flat"] { color: var(--llp-warn, #ffd49d); }
.tag[data-model="lola"] { color: var(--llp-clear, #4fbf7a); }
.horizon-label { font-size: .88rem; }
.why { font-size: 1.02rem; }
ul { padding-left: 18px; margin: 6px 0; }
.status li { margin: 4px 0; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--llp-border, #344b69); vertical-align: top; }
thead th { color: var(--llp-muted, #a8bbd3); font-weight: 600; }
.kv th { color: var(--llp-muted, #a8bbd3); font-weight: 500; }
.sources a { color: var(--llp-link, #9cc6ff); word-break: break-all; }
.days { display: flex; justify-content: space-between; gap: 8px; margin-top: 16px; }
.days button, .csv { padding: 6px 12px; border: 1px solid var(--llp-border, #344b69); border-radius: 8px; background: transparent; color: inherit; }
.csv { margin-top: 10px; }
.exits { display: flex; gap: 8px; margin-top: 10px; }
.score { margin-top: 14px; padding: 10px 14px; border: 1px solid var(--llp-border, #344b69); border-radius: 10px; }
.score .big { font-size: 1.05rem; }
.proto { display: inline-block; padding: 0 6px; border-radius: 5px; font-size: .68rem; letter-spacing: .06em; border: 1px dashed var(--llp-warn, #ffd49d); color: var(--llp-warn, #ffd49d); vertical-align: middle; }
.calc { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px 12px; margin: 6px 0; font-size: .85rem; }
.calc label { display: grid; gap: 3px; color: var(--llp-muted, #a8bbd3); }
.calc input, .calc select { font: inherit; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--llp-border, #344b69); background: transparent; color: var(--llp-text, #ecf2ff); }
.exits button { flex: 1; padding: 8px 12px; border: 1px solid var(--llp-accent, #2f5d9a); border-radius: 8px; background: var(--llp-accent, #2f5d9a); color: inherit; font-weight: 600; }
`;
