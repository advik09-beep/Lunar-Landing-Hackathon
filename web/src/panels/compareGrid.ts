// Compare dates grid panel with timeline strip (step 6, PLAN D1 / D9). Lane A owns this file.
// Grid: sites as rows, landing dates as columns; each cell = verdict for a 7-day stay starting
// that day, straight from getDaily() (the daily summary). Timeline strip: hourly sunlight /
// Earth-in-view for the selected site over the same dates, from getTimeline().
import { V, type Verdict } from "./data";
import { createPanelRoot, esc, pct, VERDICT_WORDS, addDays } from "./shared";
import type { MountPanel, PanelProps } from "./types";

const COLS = 28;          // landing dates shown at once
const BEFORE = 7;         // columns before the selected date when the window is (re)centred
const SHIFT = 14;         // days moved by the earlier/later buttons

interface DailyRow { date: string; pctLit: number; pctComms: number; pctBoth: number; longestDarkHours: number; pctSunEdge: number; pctEarthEdge: number; verdict: Verdict }
interface Daily { sites: Record<string, (DailyRow | null)[]>; STAY_DAYS: number }

export const mountCompareGrid: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "comparegrid", CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);

  let current: PanelProps = { ...props };
  let windowStart = addDays(current.landingDate, -BEFORE);
  let token = 0;

  body.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const { action, site, date } = t.dataset;
    if (action === "cell" && site && date) { current.onSiteSelected(site); current.onDateSelected(date); }
    else if (action === "site" && site) current.onSiteSelected(site);
    else if (action === "date" && date) current.onDateSelected(date);
    else if (action === "earlier") { windowStart = addDays(windowStart, -SHIFT); render(); }
    else if (action === "later") { windowStart = addDays(windowStart, SHIFT); render(); }
  });

  async function render() {
    const my = ++token;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(current.landingDate)) { body.innerHTML = `<p class="warn">Pick a landing date.</p>`; return; }
    if (!body.innerHTML) body.innerHTML = `<p class="muted">Loading the daily summary…</p>`;
    try {
      await V.loadDaily();
    } catch (err) {
      if (my === token) body.innerHTML = `<p class="warn">Could not load the daily summary (${esc((err as Error).message)}).</p>`;
      return;
    }
    if (my !== token) return;
    const t0 = performance.now();
    const daily = (V as unknown as { getDaily(d: string, n: number): Daily }).getDaily(windowStart, COLS);
    const sites = V.listSites();
    const terrain = new Map(V.getCoverage().sites.map((c) => [c.siteId, c.terrain]));
    const dates = Array.from({ length: COLS }, (_, i) => addDays(windowStart, i));
    const days = daily.STAY_DAYS;

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
        const tip = `${s.name}, landing ${d}: ${w.label}. Over ${days} days: sunlight ${pct(r.pctLit)}, Earth in view ${pct(r.pctComms)}, both ${pct(r.pctBoth)}, longest dark ${r.longestDarkHours} h.`;
        return `<td class="${selCell ? "selcell" : ""}"><button type="button" class="v" data-verdict="${r.verdict}" data-action="cell" data-site="${s.id}" data-date="${d}" title="${esc(tip)}" aria-label="${esc(tip)}">${w.symbol}</button></td>`;
      }).join("");
      return `<tr class="${selRow ? "selrow" : ""}"><th scope="row"><button type="button" data-action="site" data-site="${s.id}" ${selRow ? 'aria-current="true"' : ""}>${esc(s.name)}</button> <span class="tag" data-model="${model === "FLAT" ? "flat" : "lola"}">${model}</span></th>${cells}</tr>`;
    }).join("");

    const strip = await stripHtml(current.siteId, dates, days);
    if (my !== token) return;
    const ms = Math.round(performance.now() - t0);

    body.innerHTML = `
      <header>
        <h2>Compare landing dates</h2>
        <p class="muted">Each cell is the verdict for a ${days}-day stay that starts at 00:00 UTC on that date. Click a cell to select that site and date.</p>
      </header>
      <div class="legend" aria-label="Legend">
        ${(Object.keys(VERDICT_WORDS) as Verdict[]).map((v) => `<span><b class="v" data-verdict="${v}" aria-hidden="true">${VERDICT_WORDS[v].symbol}</b> ${esc(VERDICT_WORDS[v].label)}</span>`).join("")}
        <span><b class="v na" aria-hidden="true">–</b> No data</span>
      </div>
      <nav class="window" aria-label="Move the date window">
        <button type="button" data-action="earlier">◀ ${SHIFT} days earlier</button>
        <span class="muted">${esc(dates[0])} to ${esc(dates[COLS - 1])}</span>
        <button type="button" data-action="later">${SHIFT} days later ▶</button>
      </nav>
      <div class="scroll"><table class="grid">
        <thead><tr><th scope="col" class="corner">Site</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${strip}
      <p class="muted small">Verdicts and percentages come from the daily summary (getDaily); the strip comes from hourly data (getTimeline). FLAT rows use a flat horizon; TERRAIN uses the LOLA horizon for one point. Updated in ${ms} ms.</p>`;
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
    const stay = selIdx >= 0
      ? `<rect x="${(selIdx * 24 * bw).toFixed(2)}" y="1" width="${(Math.min(days, dates.length - selIdx) * 24 * bw).toFixed(2)}" height="${Hh - 2}" class="stay"/>` : "";
    const ticks = dates.map((d, k) => (k % 7 === 0 ? `<text x="${(k * 24 * bw + 2).toFixed(1)}" y="${Hh + 14}">${d.slice(5)}</text>` : "")).join("");
    let summary = "";
    try {
      const s = V.getSummary(siteId, `${current.landingDate}T00:00:00Z`, days);
      summary = `Selected stay (${days} days from ${esc(current.landingDate)}): sunlight ${pct(s.pctLit)}, Earth in view ${pct(s.pctComms)}, both ${pct(s.pctBoth)}, longest dark stretch ${s.longestDarkHours} h.`;
    } catch { summary = `No data for a ${days}-day stay from ${esc(current.landingDate)}.`; }
    return `
      <h3>Hour by hour: ${esc(site.name)}</h3>
      <p class="muted small">Top half filled = sunlight; bottom half filled = Earth in view; both = full bar; neither = empty. Hatched = no data. The outlined block is the selected stay.</p>
      <svg class="strip" viewBox="0 0 ${W} ${Hh + 18}" role="img" aria-label="${esc(`Hourly sunlight and Earth in view for ${site.name}, ${dates[0]} to ${dates[dates.length - 1]}. ${summary}`)}">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="nodata-bg"/><line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern></defs>
        <rect x="0" y="0" width="${W}" height="${Hh}" class="bg"/>
        ${rects.join("")}
        <line x1="0" y1="${Hh / 2}" x2="${W}" y2="${Hh / 2}" class="mid"/>
        ${stay}
        ${ticks}
      </svg>
      <p class="small">${summary}${covered < dates.length ? ` <span class="warn">${dates.length - covered} day(s) in this window have no data.</span>` : ""}</p>`;
  }

  render();
  return {
    update(next) {
      const siteChanged = next.siteId !== undefined && next.siteId !== current.siteId;
      const dateChanged = next.landingDate !== undefined && next.landingDate !== current.landingDate;
      current = { ...current, ...next };
      if (dateChanged) {
        const i = Math.round((Date.parse(current.landingDate) - Date.parse(windowStart)) / 864e5);
        if (i < 0 || i >= COLS) windowStart = addDays(current.landingDate, -BEFORE); // recentre only if outside
      }
      if (siteChanged || dateChanged) render();
    },
    destroy() { token++; host.remove(); },
  };
};

const CSS = `
.card { padding: 18px 20px; border: 1px solid var(--llp-border, #344b69); border-radius: 14px; background: var(--llp-bg, #132138); line-height: 1.45; }
h2 { margin: 0 0 4px; font-size: 1.2rem; }
h3 { margin: 18px 0 4px; font-size: .95rem; }
p { margin: 6px 0; }
.small { font-size: .82rem; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0; font-size: .85rem; align-items: center; }
.window { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 8px 0; font-size: .85rem; }
.window button { padding: 5px 10px; border: 1px solid var(--llp-border, #344b69); border-radius: 8px; background: transparent; color: inherit; }
.scroll { overflow-x: auto; }
table.grid { border-collapse: separate; border-spacing: 2px; font-size: .78rem; }
.grid th, .grid td { padding: 0; text-align: center; }
.grid thead th button { width: 26px; padding: 2px 0; border: 0; background: transparent; color: var(--llp-muted, #a8bbd3); font-size: .72rem; white-space: nowrap; }
.grid thead th.sel button { color: var(--llp-text, #ecf2ff); font-weight: 700; text-decoration: underline; }
.grid th[scope="row"] { text-align: left; padding-right: 8px; white-space: nowrap; position: sticky; left: 0; background: var(--llp-bg, #132138); }
.grid th[scope="row"] button { border: 0; background: transparent; color: inherit; padding: 2px 0; text-align: left; font-size: .8rem; max-width: 230px; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
.grid tr.selrow th[scope="row"] button { font-weight: 700; }
.corner { text-align: left; color: var(--llp-muted, #a8bbd3); font-weight: 500; }
.v { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 5px; border: 1px solid transparent; color: #0b1322; font-weight: 700; font-size: .85rem; line-height: 1; padding: 0; }
button.v { cursor: pointer; }
.v[data-verdict="clear"] { background: var(--llp-clear, #4fbf7a); }
.v[data-verdict="partial"] { background: var(--llp-partial, #e0b84f); }
.v[data-verdict="out"] { background: var(--llp-out, #e06a5f); }
.v[data-verdict="edge"] { background: var(--llp-edge, #b48cf0); border: 1px dashed #0b1322; }
.v.na, td.na span { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: var(--llp-muted, #a8bbd3); background: transparent; border: 1px dashed var(--llp-border, #344b69); border-radius: 5px; }
td.selcell .v, td.selcell span { outline: 3px solid var(--llp-text, #ecf2ff); outline-offset: 1px; }
.tag { display: inline-block; padding: 0 5px; border-radius: 5px; font-size: .62rem; font-weight: 700; letter-spacing: .05em; border: 1px solid currentColor; vertical-align: middle; }
.tag[data-model="flat"] { color: var(--llp-warn, #ffd49d); }
.tag[data-model="lola"] { color: var(--llp-clear, #4fbf7a); }
svg.strip { width: 100%; height: auto; display: block; }
.strip .bg { fill: rgba(255,255,255,.04); }
.strip .sun { fill: var(--llp-sun, #f2c94c); }
.strip .earth { fill: var(--llp-earth, #5aa9e6); }
.strip .mid { stroke: var(--llp-border, #344b69); stroke-width: 1; }
.strip .stay { fill: none; stroke: var(--llp-text, #ecf2ff); stroke-width: 3; }
.strip .nodata { fill: url(#hatch); }
.strip .nodata-bg { fill: transparent; }
.strip .hatch { stroke: var(--llp-border, #344b69); stroke-width: 2; }
.strip text { fill: var(--llp-muted, #a8bbd3); font-size: 11px; }
`;
