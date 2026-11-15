// Compare dates grid panel with timeline strip (step 6, PLAN D1 / D9). Lane A owns this file.
// Grid: sites as rows, landing dates as columns; each cell = verdict for a 7-day stay starting
// that day, straight from getDaily() (the daily summary). Timeline strip: hourly sunlight /
// Earth-in-view for the selected site over the same dates, from getTimeline().
import { V, type Verdict, type Weights, type RankFilter } from "./data";
import { stayFor, verdictIcon, createPanelRoot, esc, pct, VERDICT_WORDS, EDGE_WORDS, addDays, whyWeights, WHY_WEIGHTS_CSS, WEIGHT_KEYS } from "./shared";
import type { MountPanel, PanelProps } from "./types";
import { KID_VERDICT, KID_CSS, kidDate, teacher } from "./kid";

const COLS = 28;          // landing dates shown at once
const BEFORE = 7;         // columns before the selected date when the window is (re)centred
const SHIFT = 14;         // days moved by the earlier/later buttons

interface DailyRow { date: string; pctLit: number; pctComms: number; pctBoth: number; longestDarkHours: number; pctSunEdge: number; pctEarthEdge: number; verdict: Verdict }
interface Daily { sites: Record<string, (DailyRow | null)[]>; STAY_DAYS: number }

export const mountCompareGrid: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "comparegrid", CSS + WHY_WEIGHTS_CSS + KID_CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);

  let current: PanelProps = { ...props };
  let windowStart = addDays(current.landingDate, -BEFORE);
  let token = 0;
  // D17 best-site score: reading level and Researcher weights (live ranking).
  let scoreMode: "educator" | "researcher" = props.level ?? "educator"; // v1.3
  let weights: Weights = { ...V.SCORE_DEFAULT_WEIGHTS };
  let rankFilter: RankFilter = "all"; // D21: all sites / candidate sites / historic landings
  const stayN = () => stayFor(current.stayDays, scoreMode === "researcher"); // D33: Researcher stay length; Educator one week

  body.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.action === "rank-filter") { rankFilter = t.value as RankFilter; renderRanking(); return; }
    const k = t.dataset.weight as keyof Weights | undefined;
    if (!k) return;
    weights = { ...weights, [k]: Number(t.value) };
    const lab = body.querySelector(`[data-weight-label="${k}"]`);
    if (lab) lab.textContent = t.value;
    renderRanking();
  });

  body.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const { action, site, date } = t.dataset;
    if (action === "cell" && site && date) { current.onSiteSelected(site); current.onDateSelected(date); }
    else if (action === "site" && site) current.onSiteSelected(site);
    else if (action === "date" && date) current.onDateSelected(date);
    else if (action === "score-educator" || action === "score-researcher") { scoreMode = action === "score-educator" ? "educator" : "researcher"; render(); }
    else if (action === "reset-weights") { weights = { ...V.SCORE_DEFAULT_WEIGHTS }; renderScoreBox(); }
    else if (action === "earlier") { windowStart = addDays(windowStart, -SHIFT); render(); }
    else if (action === "later") { windowStart = addDays(windowStart, SHIFT); render(); }
  });

  async function render() {
    const my = ++token;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(current.landingDate)) { body.innerHTML = `<p class="warn">Pick a landing date.</p>`; return; }
    if (!body.innerHTML) body.innerHTML = `<p class="muted">Loading the daily summary…</p>`;
    try {
      await Promise.all([V.loadDaily(), V.loadDaily(stayN())]);
    } catch (err) {
      if (my === token) body.innerHTML = `<p class="warn">Could not load the daily summary (${esc((err as Error).message)}).</p>`;
      return;
    }
    if (my !== token) return;
    const t0 = performance.now();
    const daily = (V as unknown as { getDaily(d: string, n: number, stay: number): Daily }).getDaily(windowStart, COLS, stayN());
    const sites = V.listSites();
    const terrain = new Map(V.getCoverage().sites.map((c) => [c.siteId, c.terrain]));
    const dates = Array.from({ length: COLS }, (_, i) => addDays(windowStart, i));
    const days = daily.STAY_DAYS;
    const kid = scoreMode === "educator"; // D32: Educator = grid + one best-week sentence; strip, score box and tools in Researcher

    const head = dates.map((d) => {
      const sel = d === current.landingDate;
      const dt = new Date(d + "T00:00:00Z");
      const label = dt.getUTCDate() === 1 || d === dates[0]
        ? `${dt.toLocaleString("en", { month: "short", timeZone: "UTC" })} ${dt.getUTCDate()}` : String(dt.getUTCDate());
      return `<th scope="col" class="${sel ? "sel" : ""}"><button type="button" data-action="date" data-date="${d}" aria-label="Select landing date ${d}" ${sel ? 'aria-current="date"' : ""}>${esc(label)}</button></th>`;
    }).join("");

    const rows = sites.map((s) => {
      const selRow = s.id === current.siteId;
      const model = terrain.get(s.id) === "lola" ? "TERRAIN" : "FLAT";
      const cells = (daily.sites[s.id] ?? []).map((r, i) => {
        const d = dates[i];
        const selCell = selRow && d === current.landingDate;
        if (!r) return `<td class="na${selCell ? " selcell" : ""}" title="${esc(`${s.name}, ${d}: no data for this stay`)}"><span aria-label="${esc(`${s.name}, ${d}: no data`)}">–</span></td>`;
        const w = VERDICT_WORDS[r.verdict];
        const edgeWhy = r.verdict === "edge" ? ` (${EDGE_WORDS[model === "FLAT" ? "flat" : "lola"]})` : "";
        const tip = kid ? `${s.shortName}, landing ${kidDate(d)}: ${KID_VERDICT[r.verdict].label}.`
          : `${s.name}, landing ${d}: ${w.label}${edgeWhy}. Over ${days} days: sunlight ${pct(r.pctLit)}, Earth in view ${pct(r.pctComms)}, both ${pct(r.pctBoth)}, longest dark ${r.longestDarkHours} h.`;
        return `<td class="${selCell ? "selcell" : ""}"><button type="button" class="v" data-verdict="${r.verdict}" data-action="cell" data-site="${s.id}" data-date="${d}" title="${esc(tip)}" aria-label="${esc(tip)}">${verdictIcon(r.verdict, 24)}</button></td>`;
      }).join("");
      return `<tr class="${selRow ? "selrow" : ""}"><th scope="row"><button type="button" data-action="site" data-site="${s.id}" title="${esc(s.name)}" ${selRow ? 'aria-current="true"' : ""}>${esc(s.shortName)}</button>${model === "FLAT" ? ' <span class="tag" data-model="flat">FLAT</span>' : ""}${s.category === "historic" ? (kid ? ' <span class="tag hist" title="A lander really landed here">Landed here</span>' : ' <span class="tag hist" title="Historic landing, shown for comparison">Historic</span>') : ""}</th>${cells}</tr>`;
    }).join("");

    const strip = kid ? "" : await stripHtml(current.siteId, dates, days);
    if (my !== token) return;
    const ms = Math.round(performance.now() - t0);
    if (!kid) queueMicrotask(renderScoreBox);
    if (kid) { body.innerHTML = kidHtml(head, rows, dates, days); return; }

    body.innerHTML = `
      <header>
        <h2>Compare landing dates</h2>
        <p class="muted">Each cell is the verdict for a ${days}-day stay that starts at 00:00 UTC on that date. Click a cell to select that site and date.</p>
      </header>
      <div class="legend" aria-label="Legend">
        ${(Object.keys(VERDICT_WORDS) as Verdict[]).map((v) => `<span><b class="v" data-verdict="${v}" aria-hidden="true">${verdictIcon(v, 22)}</b> ${esc(VERDICT_WORDS[v].label)}</span>`).join("")}
        <span><b class="v na" aria-hidden="true">–</b> No data</span>
      </div>
      <p class="muted small">${verdictIcon("edge", 14)} On the edge: ${[...terrain.values()].some((t) => t !== "lola") ? `FLAT rows: ${esc(EDGE_WORDS.flat)}. TERRAIN rows: ${esc(EDGE_WORDS.lola)}.` : `${esc(EDGE_WORDS.lola)} (every site uses a terrain horizon).`}</p>
      <nav class="window" aria-label="Move the date window">
        <button type="button" data-action="earlier">◀ ${SHIFT} days earlier</button>
        <span class="muted">${esc(dates[0])} to ${esc(dates[COLS - 1])}</span>
        <button type="button" data-action="later">${SHIFT} days later ▶</button>
      </nav>
      <div class="scroll"><table class="grid"><colgroup><col class="sitecol"/></colgroup>
        <thead><tr><th scope="col" class="corner">Site</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${strip}
      <section class="score-box" aria-label="Best-site score"></section>
      <p class="muted small">Each cell summarises a ${days}-day stay; the strip shows it hour by hour. ${[...terrain.values()].some((t) => t !== "lola") ? "FLAT rows use a flat horizon; other rows use" : "Every site uses"} a terrain horizon from NASA's LOLA elevation maps, for one point per site.</p>`;
  }

  // ---- D32 Educator: the grid in plain words plus one sentence naming the best week ----
  function kidHtml(head: string, rows: string, dates: string[], days: number): string {
    const site = V.listSites().find((s) => s.id === current.siteId);
    let bw: { best: { date: string; score: number; pctBoth: number } | null; rule: string } | null = null;
    try { bw = (V as unknown as { getBestWeek(id: string, d: string, n: number): typeof bw }).getBestWeek(current.siteId, dates[0], dates.length); } catch { bw = null; }
    const best = bw?.best;
    const bestLine = best && site
      ? `<p class="lead best-week">For <strong>${esc(site.shortName)}</strong>, the best week to land in these four weeks starts on <strong>${esc(kidDate(best.date))}</strong>. <button type="button" class="pick" data-action="date" data-date="${best.date}">Pick that day</button></p>`
      : `<p class="lead best-week">We have no data for these weeks.</p>`;
    let top = "";
    try {
      const r = V.getRanking(current.landingDate, undefined, "candidate").ranking.find((x) => x.available);
      if (r) top = ` For a landing on ${esc(current.landingDate)}, the top candidate site by our ${esc(V.SCORE_LABEL)} is ${esc(r.shortName)} (${Math.round(r.score!)} out of 100).`;
    } catch { /* no score outside the data */ }
    const R = V.VERDICT_RULE;
    return `<div class="kid">
      <header><h2>Which day is best to land?</h2>
        <p>Each square is one landing day. Pick a square to look at it.</p></header>
      ${current.level ? "" : `<div class="switch" role="group" aria-label="Reading level: Educator or Researcher">
        <button type="button" data-action="score-educator" aria-pressed="true">Educator</button>
        <button type="button" data-action="score-researcher" aria-pressed="false">Researcher</button></div>`}
      <div class="legend" aria-label="Legend">
        ${(Object.keys(VERDICT_WORDS) as Verdict[]).map((v) => `<span><b class="v" data-verdict="${v}" aria-hidden="true">${verdictIcon(v, 22)}</b> ${esc(KID_VERDICT[v].label)}</span>`).join("")}
        <span><b class="v na" aria-hidden="true">–</b> No data</span>
        <span class="bright-note">Bright means a better week.</span>
      </div>
      <nav class="window" aria-label="Move the date window">
        <button type="button" data-action="earlier">◀ Earlier</button>
        <span class="muted">${esc(kidDate(dates[0]))} to ${esc(kidDate(dates[dates.length - 1]))}</span>
        <button type="button" data-action="later">Later ▶</button>
      </nav>
      <div class="scroll"><table class="grid"><colgroup><col class="sitecol"/></colgroup>
        <thead><tr><th scope="col" class="corner">Place</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${bestLine}
      ${teacher(`<p>Each square rates a ${days}-day stay that starts at 00:00 UTC on that date. Great: the Sun and Earth are both in view at least ${R.CLEAR_PCT}% of the hours. Hard: ${R.OUT_PCT}% or less. Tricky: the Sun or Earth sits within ${R.EDGE_DEG} degrees of the skyline for more than half the week (checked first). Okay: everything else.</p>
        <p>${esc(bw?.rule ?? "")}${top}</p>
        <p>Historic landings are past missions, included so classes can compare them with candidate sites. The Researcher view adds the hour-by-hour strip, the score with its weights, and the two-plan and requirements tools.</p>`,
        "Why does a good week at one place turn into a hard week a few days later?")}
    </div>`;
  }

  // ---- D17: best-site score for the selected landing date (PROTOTYPE) ----
  function renderScoreBox() {
    const box = body.querySelector(".score-box");
    if (!box) return;
    const terms = WEIGHT_KEYS;
    box.innerHTML = `
      <h3>${esc(V.SCORE_LABEL)} for a landing on ${esc(current.landingDate)}</h3>
      <p class="meaning">${esc(V.SCORE_MEANING)}</p>
      ${current.level ? "" : `<div class="switch" role="group" aria-label="Reading level: Educator or Researcher">
        <button type="button" data-action="score-educator" aria-pressed="${scoreMode === "educator"}">Educator</button>
        <button type="button" data-action="score-researcher" aria-pressed="${scoreMode === "researcher"}">Researcher</button>
      </div>`}
      ${scoreMode === "researcher" ? `
        <p class="small"><strong>${esc(V.SCORE_OWN_FORMULA)}</strong></p>
        <p class="small">${esc(V.SCORE_FORMULA_TEXT)}</p>
        <div class="weights">${terms.map(([k, w]) => `<label><span>${w}: ${esc(V.SCORE_TERMS[k])}</span>
          <input type="range" min="0" max="100" step="1" value="${weights[k]}" data-weight="${k}" aria-label="Weight ${w}"/> <b data-weight-label="${k}">${weights[k]}</b></label>`).join("")}</div>
        <button type="button" class="reset" data-action="reset-weights">Reset to default weights (${terms.map(([k, w]) => `${w} ${V.SCORE_DEFAULT_WEIGHTS[k]}`).join(", ")})</button>
        ${whyWeights("researcher")}` : whyWeights("educator")}
      <label class="filter">Show <select data-action="rank-filter">
        <option value="all"${rankFilter === "all" ? " selected" : ""}>All sites</option>
        <option value="candidate"${rankFilter === "candidate" ? " selected" : ""}>Candidate sites</option>
        <option value="historic"${rankFilter === "historic" ? " selected" : ""}>Historic landings (comparisons)</option></select></label>
      <div class="rank-out" aria-live="polite"></div>`;
    renderRanking();
  }

  function renderRanking() {
    const out = body.querySelector(".rank-out");
    if (!out) return;
    let r;
    try { r = V.getRanking(current.landingDate, scoreMode === "researcher" ? weights : V.SCORE_DEFAULT_WEIGHTS, rankFilter, stayN()); } catch { out.innerHTML = `<p class="muted">Not available for this date.</p>`; return; }
    const avail = r.ranking.filter((x) => x.available);
    if (!avail.length) { out.innerHTML = `<p class="muted">Not available for this date (outside the data range).</p>`; return; }
    const top = avail[0];
    const group = rankFilter === "candidate" ? "candidate site" : rankFilter === "historic" ? "historic landing" : "site";
    const histNote = (x: { category: string }) => (x.category === "historic" ? ` <span class="cmp">past landing, shown for comparison</span>` : "");
    if (scoreMode === "educator") {
      out.innerHTML = `<p class="big">For a landing on ${esc(current.landingDate)}, the top ${group} by our ${esc(V.SCORE_LABEL)} is <strong>${esc(top.shortName)}</strong>, scoring <strong>${Math.round(top.score!)}</strong> out of 100${top.category === "historic" ? " (a past landing, shown for comparison)" : ""}.</p>
        <ol class="rank">${avail.map((x) => `<li${x.siteId === current.siteId ? ' class="sel"' : ""}>${esc(x.shortName)}: ${Math.round(x.score!)}${histNote(x)}</li>`).join("")}</ol>
        <p class="muted small">Historic landings are past missions, included so educators can compare them with candidate sites.</p>
        <p class="muted small">Uses the default weights. The Researcher view explains the calculation.</p>`;
      return;
    }
    out.innerHTML = `<p class="small">${r.isDefault ? "Default weights." : "Custom weights: the ranking below is yours, not the Educator default."} Top site: <strong>${esc(top.shortName)}</strong> (${top.score === null ? "–" : top.score.toFixed(1)}).</p>
      <table class="ranktable"><thead><tr><th>#</th><th>Site</th><th>Score</th><th>S</th><th>E</th><th>D</th><th>G</th><th>C</th><th>T</th></tr></thead><tbody>
      ${avail.map((x, i) => `<tr${x.siteId === current.siteId ? ' class="sel"' : ""}><td>${i + 1}</td><td><button type="button" data-action="site" data-site="${x.siteId}" title="${esc(x.name)}">${esc(x.shortName)}</button>${histNote(x)}</td><td>${x.score === null ? "–" : x.score.toFixed(1)}</td>${WEIGHT_KEYS.map(([k]) => `<td>${x.components![k].toFixed(2)}</td>`).join("")}</tr>`).join("")}
      </tbody></table>
      ${r.ranking.length > avail.length ? `<p class="muted small">${r.ranking.length - avail.length} site(s) have no data for this date.</p>` : ""}`;
  }

  async function stripHtml(siteId: string, dates: string[], days: number): Promise<string> {
    const site = V.listSites().find((s) => s.id === siteId);
    if (!site) return "";
    try { await V.loadSite(siteId); } catch { return `<p class="warn">Timeline unavailable for ${esc(site.name)}.</p>`; }
    const n = dates.length * 24, W = 1000, Hh = 56, bw = W / n;
    const rects: string[] = [];
    let covered = 0;
    dates.forEach((d, k) => {
      let samples;
      try { samples = V.getTimeline(siteId, `${d}T00:00:00Z`, 1).samples; } catch { samples = null; }
      const x0 = k * 24 * bw;
      if (!samples) { rects.push(`<rect x="${x0.toFixed(2)}" y="0" width="${(24 * bw).toFixed(2)}" height="${Hh}" class="nodata"/>`); return; }
      covered++;
      samples.forEach((s, h) => {
        const x = (x0 + h * bw).toFixed(2), w = (bw + 0.05).toFixed(2);
        if (s.lit) rects.push(`<rect x="${x}" y="0" width="${w}" height="${Hh / 2 - 1}" class="sun"/>`);
        if (s.comms) rects.push(`<rect x="${x}" y="${Hh / 2 + 1}" width="${w}" height="${Hh / 2 - 1}" class="earth"/>`);
      });
    });
    const selIdx = dates.indexOf(current.landingDate);
    const hr = Math.min(days * 24 - 1, Math.max(0, Math.round(current.hour ?? 0))); // v1.2: shared hour cursor
    const cursor = selIdx >= 0 && selIdx * 24 + hr < n
      ? `<line x1="${((selIdx * 24 + hr + 0.5) * bw).toFixed(2)}" x2="${((selIdx * 24 + hr + 0.5) * bw).toFixed(2)}" y1="0" y2="${Hh}" class="cursor"/>` : "";
    const stay = selIdx >= 0
      ? `<rect x="${(selIdx * 24 * bw).toFixed(2)}" y="1" width="${(Math.min(days, dates.length - selIdx) * 24 * bw).toFixed(2)}" height="${Hh - 2}" class="stay"/>` : "";
    const ticks = dates.map((d, k) => (k % 7 === 0 ? `<text x="${(k * 24 * bw + 2).toFixed(1)}" y="${Hh + 14}">${d.slice(5)}</text>` : "")).join("");
    let summary = "";
    try {
      const s = V.getSummary(siteId, `${current.landingDate}T00:00:00Z`, days);
      summary = `Selected stay (${days} days from ${esc(current.landingDate)}): sunlight ${pct(s.pctLit)}, Earth in view ${pct(s.pctComms)}, both ${pct(s.pctBoth)}, longest dark stretch ${s.longestDarkHours} h.`;
    } catch { summary = `No data for a ${days}-day stay from ${esc(current.landingDate)}.`; }
    return `
      <h3>Hour by hour: ${esc(site.shortName)}</h3>
      <p class="muted small">Top half: sunlight. Bottom half: Earth in view. Outline: your stay; dashed line: the chosen hour.</p>
      <svg class="strip" viewBox="0 0 ${W} ${Hh + 18}" role="img" aria-label="${esc(`Hourly sunlight and Earth in view for ${site.name}, ${dates[0]} to ${dates[dates.length - 1]}. ${summary}`)}">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="nodata-bg"/><line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern></defs>
        <rect x="0" y="0" width="${W}" height="${Hh}" class="bg"/>
        ${rects.join("")}
        <line x1="0" y1="${Hh / 2}" x2="${W}" y2="${Hh / 2}" class="mid"/>
        ${stay}
        ${cursor}
        ${ticks}
      </svg>
      <p class="small">${summary}${covered < dates.length ? ` <span class="warn">${dates.length - covered} day(s) in this window have no data.</span>` : ""}</p>`;
  }

  render();
  return {
    update(next) {
      const hourChanged = next.hour !== undefined && next.hour !== current.hour;
      if (next.level && next.level !== scoreMode) { scoreMode = next.level; current = { ...current, level: next.level }; render(); }
      const siteChanged = next.siteId !== undefined && next.siteId !== current.siteId;
      const dateChanged = next.landingDate !== undefined && next.landingDate !== current.landingDate;
      const stayChanged = next.stayDays !== undefined && next.stayDays !== current.stayDays;
      current = { ...current, ...next };
      if (dateChanged) {
        const i = Math.round((Date.parse(current.landingDate) - Date.parse(windowStart)) / 864e5);
        if (i < 0 || i >= COLS) windowStart = addDays(current.landingDate, -BEFORE); // recentre only if outside
      }
      if (siteChanged || dateChanged || hourChanged || stayChanged) render();
    },
    destroy() { token++; host.remove(); },
  };
};

const CSS = `
.card { padding: var(--_pad); border: 0; border-radius: 14px; background: var(--_glass); backdrop-filter: blur(var(--_glass-blur)); -webkit-backdrop-filter: blur(var(--_glass-blur)); line-height: 1.45; }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
h3 { margin: 18px 0 4px; font-size: .95rem; }
p { margin: 6px 0; }
.small { font-size: var(--_fs-sm); }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0; font-size: .85rem; align-items: center; }
.legend span { display: inline-flex; gap: 5px; align-items: center; white-space: nowrap; }
.window { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 8px 0; font-size: .85rem; }
.window button { padding: 5px 10px; border: 1px solid var(--_border); border-radius: 8px; background: transparent; color: inherit; }
.scroll { overflow-x: auto; }
table.grid { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 2px; font-size: .78rem; }
.grid col.sitecol { width: 9.5rem; }
.grid th, .grid td { padding: 0; text-align: center; }
.grid thead th button { width: 100%; padding: 2px 0; border: 0; background: transparent; color: var(--_muted); font-size: .72rem; white-space: nowrap; }
.grid thead th.sel button { color: var(--_text); font-weight: 700; text-decoration: underline; }
.grid th[scope="row"] { text-align: left; padding-right: 8px; white-space: nowrap; position: sticky; left: 0; background: transparent; overflow: hidden; text-overflow: ellipsis; }
.grid th[scope="row"] button { border: 0; background: transparent; color: inherit; padding: 2px 0; text-align: left; font-size: .8rem; max-width: 230px; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.grid tr.selrow th[scope="row"] button { font-weight: 700; }
.corner { text-align: left; color: var(--_muted); font-weight: 500; }
.v { display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 36px; height: 32px; /* D36: larger phase icons so Hard and Tricky read at a glance */ border-radius: 5px; border: 1px solid transparent; background: rgba(255,255,255,.04); padding: 0; line-height: 1; }
button.v { cursor: pointer; }
.legend .v { width: auto; background: transparent; }
.v.na, td.na span { display: inline-flex; align-items: center; justify-content: center; width: 100%; max-width: 36px; height: 32px; color: var(--_muted); background: transparent; border: 1px dashed var(--_border); border-radius: 5px; }
td.selcell .v, td.selcell span { outline: 3px solid var(--_text); outline-offset: 1px; }
.tag { display: inline-block; padding: 0 5px; border-radius: 5px; font-size: .62rem; font-weight: 700; letter-spacing: .05em; border: 1px solid currentColor; vertical-align: middle; }
.tag[data-model="flat"] { color: var(--_muted); }
.tag[data-model="lola"] { color: var(--_clear); }
svg.strip { width: 100%; height: auto; display: block; }
.filter { display: inline-flex; gap: 6px; align-items: center; margin: 6px 0 0 10px; font-size: .85rem; }
.filter select { font: inherit; padding: 2px 6px; border-radius: 6px; border: 1px solid var(--_border); background: transparent; color: inherit; }
.cmp { font-size: .75rem; color: var(--_muted); font-style: italic; }
.tag.hist { color: var(--_muted); }
.score-box { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--_divider); }
.score-box .big { font-size: 1.02rem; }
.proto { display: inline-block; padding: 0 6px; border-radius: 5px; font-size: .68rem; letter-spacing: .06em; border: 1px dashed var(--_muted); color: var(--_muted); vertical-align: middle; }
.switch { display: inline-flex; margin: 6px 0; border: 1px solid var(--_border); border-radius: 999px; overflow: hidden; }
.switch button { padding: 4px 14px; border: 0; background: transparent; color: inherit; font-size: .85rem; }
.switch button[aria-pressed="true"] { background: var(--_accent); color: var(--_on-accent); font-weight: 650; }
.weights { display: grid; grid-template-columns: auto 160px 2.5rem; justify-content: start; gap: 4px 10px; align-items: center; margin: 6px 0; font-size: .82rem; } /* D34: each slider sits right beside its label */
.weights label { display: contents; }
.reset { padding: 4px 10px; border: 1px solid var(--_border); border-radius: 8px; background: transparent; color: inherit; font-size: .8rem; }
ol.rank { margin: 6px 0; padding-left: 22px; font-size: .88rem; }
.rank li.sel, .ranktable tr.sel td { font-weight: 700; }
.ranktable { border-collapse: collapse; font-size: .82rem; margin-top: 6px; font-variant-numeric: tabular-nums; }
.ranktable th, .ranktable td { padding: 2px 8px; border-bottom: 1px solid var(--_border); text-align: left; }
.ranktable button { border: 0; background: transparent; color: inherit; padding: 0; font: inherit; cursor: pointer; text-decoration: underline; }
.strip .bg { fill: rgba(255,255,255,.04); }
.strip .sun { fill: var(--_sun); }
.strip .earth { fill: var(--_earth); }
.strip .mid { stroke: var(--_border); stroke-width: 1; }
.strip .stay { fill: none; stroke: var(--_text); stroke-width: 3; }
.strip .cursor { stroke: var(--_text); stroke-width: 2; stroke-dasharray: 4 2; }
.strip .nodata { fill: url(#hatch); }
.strip .nodata-bg { fill: transparent; }
.strip .hatch { stroke: var(--_border); stroke-width: 2; }
.strip text { fill: var(--_muted); font-size: 11px; }
.pick { margin-left: 6px; padding: 3px 10px; border: 1px solid var(--_accent); border-radius: 8px; background: var(--_accent); color: var(--_on-accent); font-size: .85rem; }
`;
