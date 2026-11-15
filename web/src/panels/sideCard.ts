// Side card panel (step 3, PLAN D3 / D9). Lane A owns this file.
// Shows, for the selected site and landing date: verdict in words, Sun and Earth status,
// horizon model, source and coverage, an Educator / Researcher switch, and a CSV download.
// v1.2: Sun and Earth status are shown at the shared hour of the stay (props.hour, default 0).
// All values come from /lib/visibility.js; nothing is calculated here except formatting.
import { V, type Site, type State, type Summary, type Horizon, type Metrics, type Sample } from "./data";
import { KID_VERDICT, KID_CSS, kidCategory, kidDate, kidSun, kidEarth, ring, weekStrip, teacher } from "./kid";
import { verdictIcon, createPanelRoot, esc, deg, az, pct, VERDICT_WORDS, verdictShort, addDays, fmtUtc, clampHour, whyWeights, WHY_WEIGHTS_CSS, WEIGHT_KEYS } from "./shared";
import type { MountPanel, PanelProps } from "./types";

type Mode = "plain" | "numbers"; // shown as Educator / Researcher

export const mountSideCard: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "sidecard", CSS + WHY_WEIGHTS_CSS + KID_CSS);
  const body = document.createElement("section");
  body.className = "card";
  body.setAttribute("aria-live", "polite");
  root.append(body);

  let current: PanelProps = { ...props };
  let mode: Mode = props.level === "researcher" ? "numbers" : "plain"; // v1.3: follows the shell's level when given
  let token = 0;
  let view: { site: Site; state: State; summary: Summary; horizon: Horizon; start: string; metrics: Metrics; samples: Sample[] } | null = null;
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
      const samples = V.getTimeline(site.id, start, V.VERDICT_RULE.STAY_DAYS).samples; // D32 Educator week strip
      view = { site, state, summary, horizon, start, metrics, samples };
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
    : `On day ${Math.floor(hourNow() / 24) + 1} of the stay (${fmtUtc(st.sampleUtc)})`;

  function paint() {
    if (!view) return;
    const { site, state, summary, horizon } = view;
    const w = VERDICT_WORDS[summary.verdict];
    const flat = state.horizonModel === "flat";
    const days = V.VERDICT_RULE.STAY_DAYS;
    const coords = `${Math.abs(site.lat).toFixed(5)}°${site.lat < 0 ? "S" : "N"}, ${Math.abs(site.lon).toFixed(5)}°${site.lon < 0 ? "W" : "E"}`;
    const pointNote = site.category === "candidate" ? site.note.split(" (")[0] : "";
    if (mode === "plain") { body.innerHTML = kidCard(); return; } // D32: Educator = seven-year-old card
    const horizonLabel = flat
      ? "Flat horizon: terrain is not modelled at this site."
      : "Terrain horizon from LOLA elevation data (one point; nearby spots differ, especially toward Earth).";

    body.innerHTML = `
      <header>
        <h2>${esc(site.name)}</h2>
        <p class="muted">${esc(coords)}; stay of ${days} days from ${esc(current.landingDate)} 00:00 UTC</p>
        <p class="small"><span class="tag cat" data-cat="${site.category}">${site.category === "historic" ? "HISTORIC LANDING" : "CANDIDATE SITE"}</span> ${esc(V.SITE_CATEGORIES[site.category])}</p>
        ${pointNote ? `<p class="muted small">${esc(pointNote)}.</p>` : ""}
      </header>
      ${current.level ? "" : `<div class="switch" role="group" aria-label="Reading level: Educator or Researcher">
        <button type="button" data-action="mode-plain" aria-pressed="false">Educator</button>
        <button type="button" data-action="mode-numbers" aria-pressed="true">Researcher</button>
      </div>`}
      <div class="verdict" data-verdict="${summary.verdict}">
        <span class="symbol" aria-hidden="true">${verdictIcon(summary.verdict, 30)}</span>
        <div><strong>${esc(w.label)}</strong><span class="why-short">: ${esc(verdictShort(summary.verdict, state.horizonModel))}</span></div>
      </div>
      <p class="horizon-label"><span class="tag" data-model="${state.horizonModel}">${flat ? "FLAT" : "TERRAIN"}</span> ${esc(horizonLabel)}</p>
      ${numbers()}
      <nav class="days" aria-label="Change landing date">
        <button type="button" data-action="prev-day">◀ Day before</button>
        <button type="button" data-action="next-day">Day after ▶</button>
      </nav>
      ${current.onOpenView ? `<nav class="exits" aria-label="Open another view">
        <button type="button" data-action="open-horizon">Stand here</button>
        <button type="button" data-action="open-compare">Compare other dates</button>
      </nav>` : ""}`;

    // ---- D32 Educator card: pictures first, one short sentence at a time, no degrees ----
    function kidCard(): string {
      const kv = KID_VERDICT[summary.verdict];
      const h = hourNow(), day = Math.floor(h / 24) + 1;
      const R = V.VERDICT_RULE;
      const latLon = `latitude ${Math.abs(site.lat).toFixed(2)} ${site.lat < 0 ? "south" : "north"}, longitude ${Math.abs(site.lon).toFixed(2)} ${site.lon < 0 ? "west" : "east"}`;
      return `
      <div class="kid">
        <header>
          <h2>${esc(site.shortName)}</h2>
          <p class="muted">${esc(kidCategory(site.category))}</p>
          <p>Landing on ${esc(kidDate(current.landingDate))}. We look at one week.</p>
        </header>
        ${current.level ? "" : `<div class="switch" role="group" aria-label="Reading level: Educator or Researcher">
          <button type="button" data-action="mode-plain" aria-pressed="true">Educator</button>
          <button type="button" data-action="mode-numbers" aria-pressed="false">Researcher</button></div>`}
        <div class="verdict" data-verdict="${summary.verdict}">
          <span class="symbol" aria-hidden="true">${verdictIcon(summary.verdict, 30)}</span>
          <p class="lead"><strong>${esc(kv.sentence)}</strong></p>
        </div>
        <div class="rings">${ring(summary.pctLit, "sun", "Sunshine")}${ring(summary.pctComms, "earth", "Earth in sight")}</div>
        <h3>The week, day by day</h3>
        ${weekStrip(view!.samples, h)}
        <h3>Now: day ${day} of the week</h3>
        <p class="now-sun">${esc(kidSun(state))}</p>
        <p class="now-earth">${esc(kidEarth(state))}</p>
        ${teacher(`
          <p>${esc(site.name)} (${esc(latLon)}). ${esc(V.SITE_CATEGORIES[site.category])}</p>
          <p>The week is a ${R.STAY_DAYS}-day stay from ${esc(current.landingDate)} 00:00 UTC. Over that week: sunlight ${pct(summary.pctLit)} of the hours, Earth in view ${pct(summary.pctComms)}, both together ${pct(summary.pctBoth)}, longest dark stretch ${summary.longestDarkHours} hours. “Now” is ${esc(fmtUtc(state.sampleUtc))}.</p>
          <p>How the week is rated: Tricky if the Sun or Earth sits within ${R.EDGE_DEG} degrees of the skyline for more than half the week (checked first); Great if the Sun and Earth are both in view at least ${R.CLEAR_PCT}% of the hours; Hard if ${R.OUT_PCT}% or less; Okay otherwise.</p>
          <p>The skyline comes from NASA's LOLA elevation maps for one point; the Sun and Earth positions come from NASA JPL Horizons. “Sunshine” means the Sun can be seen, not a promise of power. “Earth in sight” means a possible direct line of sight, not a guaranteed radio link.</p>`,
          "Why does the lander need to see both the Sun and Earth?")}
        ${scoreEducator()}
        <details class="why-weights south-pole"><summary>Why the south pole?</summary>
          <p>There is ice in dark craters there.</p>
          <p>Some high spots get sunshine for a long time.</p>
          <p>But the Sun stays low, so hills can hide it.</p>
          ${teacher(`${V.SOUTH_POLE.full.map((p) => `<p>${esc(p)}</p>`).join("")}
            <p class="small">Sources: ${V.SOUTH_POLE.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join("; ")}</p>`,
            "Why might ice stay frozen in a crater that never gets sunshine?")}
        </details>
        <nav class="days" aria-label="Change landing date">
          <button type="button" data-action="prev-day">◀ Day before</button>
          <button type="button" data-action="next-day">Day after ▶</button>
        </nav>
        ${current.onOpenView ? `<nav class="exits" aria-label="Open another view">
          <button type="button" data-action="open-horizon">Stand here</button>
          <button type="button" data-action="open-compare">Try other days</button>
        </nav>` : ""}
      </div>`;
    }

    // D17 Educator score in D32 words: one number, the best candidate place named; the details are for the teacher.
    function scoreEducator(): string {
      const r = V.getRanking(current.landingDate);
      const me = r.ranking.find((x) => x.siteId === site.id);
      const top = r.ranking[0];
      const topCand = V.getRanking(current.landingDate, undefined, "candidate").ranking.find((x) => x.available);
      if (!me?.available || !top?.available) return `<div class="score"><h3>${esc(V.SCORE_LABEL)}</h3><p class="muted">No score for this day.</p></div>`;
      const candLine = topCand
        ? (topCand.siteId === site.id ? "This is the best candidate place to land this week." : `Best candidate place to land this week: <strong>${esc(topCand.shortName)}</strong>.`)
        : "";
      const histLine = top.category === "historic"
        ? ` Counting past landings too, the highest score belongs to ${top.siteId === site.id ? "this site" : esc(top.shortName)} (${Math.round(top.score!)}), a past landing shown for comparison.` : "";
      return `<div class="score"><h3>${esc(V.SCORE_LABEL)}</h3>
        <p class="big"><strong>${Math.round(me.score!)}</strong> out of 100.</p>
        <details class="why-weights why-score"><summary>Why this score?</summary>
          <p>The score goes from 0 to 100.</p>
          <p>A high score means lots of sunshine and lots of time seeing Earth.</p>
          <p>Sunshine counts the most, because the lander needs power.</p>
          <p>It also helps when the Sun and Earth are high above the hills.</p>
          <p>And when the week stays good even if the landing is a few days late.</p>
          <p>Our team made these rules. They are not NASA rules.</p>
          ${teacher(`<p>${esc(V.WEIGHTS_EDUCATOR_TEXT)}</p><p>${esc(V.SCORE_OWN_FORMULA)} The Researcher view shows the formula and lets you change the weights.</p>`, "If you were planning a Moon landing, what would you count the most?")}
        </details>
        <p>${candLine}</p>
        ${teacher(`<p>${esc(V.SCORE_MEANING)}</p>
          <p>It uses the default weights. The top candidate site is ${topCand ? `${esc(topCand.shortName)} (${Math.round(topCand.score!)} out of 100)` : "not available"}.${histLine} The Researcher view explains the calculation.</p>`,
          "What else, besides sunshine and Earth, might a lander need?")}
      </div>`;
    }

    function numbers(): string {
      const hzAt = (el: number, margin: number) => el - margin;
      const change = (h: number | null, up: boolean, set: string, rise: string) =>
        h === null ? "no change within the data (up to 60 days)" : `${up ? set : rise} in ${h} h`;
      const ranges = V.getCoverage().sites.find((c) => c.siteId === site.id)?.ranges ?? [];
      return `
        <h3>${esc(atHour(state))}</h3>
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
          <li>Sun and Earth angles: NASA JPL Horizons, the Sun's and Earth's directions as seen from this site.</li>
          <li>Horizon: ${flat ? "flat (0° in every direction)" : `${esc(horizon.source)}${horizon.observer ? ` Observer ${Math.abs(horizon.observer.groundHeightM).toFixed(1)} m ${horizon.observer.groundHeightM >= 0 ? "above" : "below"} the 1737.4 km reference sphere + ${horizon.observer.mastM} m assumed mast.` : ""} ${horizon.verified ? "Checked by our method tests; not ground truth." : ""}`}</li>
          <li>Site coordinates: <a href="${esc(site.source)}" target="_blank" rel="noopener">${esc(site.source)}</a>${site.coordsVerified ? "" : " (unverified)"}</li>
          <li>Coverage for this site: ${ranges.map(([a, b]) => `${esc(fmtUtc(a))} to ${esc(fmtUtc(b))}`).join("; ")}.</li>
        </ul>
        <button type="button" class="csv" data-action="csv">Download hourly data (CSV)</button>`;
    }

    // D16 metrics (terrain-aware hourly data).
    function metricsHtml(): string {
      const m = view!.metrics;
      return `<h3>Power and communication over the ${V.VERDICT_RULE.STAY_DAYS}-day stay</h3>
        <table class="kv">
          <tr><th>Sunlight share</th><td>${pct(m.pctLit)}</td><th>Earth-in-view share</th><td>${pct(m.pctComms)}</td></tr>
          <tr><th>Longest dark stretch</th><td>${m.longestDarkHours} h</td><th>Longest contact gap</th><td>${m.longestContactGapHours} h</td></tr>
          <tr><th>Dark periods</th><td>${m.darkPeriods}</td><th>Contact windows</th><td>${m.contactWindows}</td></tr>
          <tr><th>Hours with part of the Sun's disc hidden</th><td>${m.partialSunHours}</td><th>Hours with Earth partly hidden (marginal)</th><td>${m.earthMarginalHours}</td></tr>
          <tr><th>Lunar-eclipse hours (Earth's shadow)</th><td>${m.eclipseHours}</td><th></th><td></td></tr>
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
      if (!me?.available) return `<h3>${esc(V.SCORE_LABEL)}</h3><p class="muted">Not available for this landing date.</p>`;
      const W = V.SCORE_DEFAULT_WEIGHTS, c = me.components!;
      return `<h3>${esc(V.SCORE_LABEL)}</h3>
        <p class="small"><strong>${esc(V.SCORE_OWN_FORMULA)}</strong></p>
        <p class="meaning">${esc(V.SCORE_MEANING)}</p>
        <p class="small">${esc(V.SCORE_FORMULA_TEXT)}</p>
        <table><thead><tr><th>Weight</th><th>Term</th><th>Value</th><th>Default weight</th></tr></thead><tbody>
          ${WEIGHT_KEYS.map(([k, w]) => `<tr><td>${w}</td><td>${esc(V.SCORE_TERMS[k])}</td><td>${c[k].toFixed(3)}</td><td>${W[k]}</td></tr>`).join("")}
        </tbody></table>
        ${whyWeights("researcher")}
        <p class="small">Score for this site at default weights: <strong>${me.score!.toFixed(1)}</strong> / 100 (rank ${r.ranking.indexOf(me) + 1} of ${r.ranking.filter((x) => x.available).length}). Adjust the weights and see the ranking update in <em>Compare</em>.</p>`;
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
      `# app,${V.APP_NAME} — ${V.APP_TAGLINE}`,
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
    a.download = `lunlux_${site.id}_${current.landingDate}_${V.VERDICT_RULE.STAY_DAYS}day.csv`;
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
      const levelChanged = next.level !== undefined && next.level !== current.level;
      if (next.level) mode = next.level === "researcher" ? "numbers" : "plain";
      current = { ...current, ...next };
      if (changed) load();
      else if (levelChanged && view && !hourChanged) { paint(); renderCalc(); }
      else if (hourChanged && view) { view.state = V.getState(view.site.id, Date.parse(view.start) + hourNow() * 3.6e6); paint(); renderCalc(); }
    },
    destroy() { token++; host.remove(); },
  };
};

function csvCell(s: string): string { return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

const CSS = `
.card { padding: var(--_pad); border: 0; border-radius: 14px; background: var(--_glass); backdrop-filter: blur(var(--_glass-blur)); -webkit-backdrop-filter: blur(var(--_glass-blur)); line-height: 1.5; }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
h3 { margin: 18px 0 6px; font-size: .95rem; }
p { margin: 6px 0; }
.small { font-size: var(--_fs-sm); }
.switch { display: inline-flex; margin: 12px 0; border: 1px solid var(--_border); border-radius: 999px; overflow: hidden; }
.switch button { padding: 6px 16px; border: 0; background: transparent; color: inherit; }
.switch button[aria-pressed="true"] { background: var(--_accent); font-weight: 650; }
.verdict { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--_divider); border-bottom: 1px solid var(--_divider); }
.verdict .symbol { display: inline-flex; width: 30px; height: 30px; flex: none; }
.tag { display: inline-block; padding: 1px 7px; margin-right: 4px; border-radius: 6px; font-size: .72rem; font-weight: 700; letter-spacing: .06em; border: 1px solid currentColor; }
.tag[data-model="flat"] { color: var(--_muted); }
.tag[data-model="lola"] { color: var(--_clear); }
.horizon-label { font-size: .88rem; }
.why { font-size: 1.02rem; }
ul { padding-left: 18px; margin: 6px 0; }
.status li { margin: 4px 0; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; font-variant-numeric: tabular-nums; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--_border); vertical-align: top; }
thead th { color: var(--_muted); font-weight: 600; }
.kv th { color: var(--_muted); font-weight: 500; }
.sources a { color: var(--_link); word-break: break-all; }
.days { display: flex; justify-content: space-between; gap: 8px; margin-top: 16px; }
.days button, .csv { padding: 6px 12px; border: 1px solid var(--_border); border-radius: 8px; background: transparent; color: inherit; }
.csv { margin-top: 10px; }
.exits { display: flex; gap: 8px; margin-top: 10px; }
.score { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--_divider); }
.score .big { font-size: 1.05rem; }
.tag.cat[data-cat="historic"] { color: var(--_muted); }
.tag.cat[data-cat="candidate"] { color: var(--_link); }
.proto { display: inline-block; padding: 0 6px; border-radius: 5px; font-size: .68rem; letter-spacing: .06em; border: 1px dashed var(--_muted); color: var(--_muted); vertical-align: middle; }
.calc { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px 12px; margin: 6px 0; font-size: .85rem; }
.calc label { display: grid; gap: 3px; color: var(--_muted); }
.calc input, .calc select { font: inherit; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--_border); background: transparent; color: var(--_text); }
.exits button { flex: 1; padding: 8px 12px; border: 1px solid var(--_accent); border-radius: 8px; background: var(--_accent); color: inherit; font-weight: 600; }
`;
