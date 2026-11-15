// Horizon view panel, "Stand here" (step 7, PLAN D9). Lane A owns this file.
// A 360° panorama for the selected site: compass direction left to right, elevation up/down,
// the horizon line from getHorizon (LOLA terrain or flat, labeled), and the Sun and Earth at a
// chosen hour plus their paths over the 7-day stay from getTimeline. Nothing is calculated here
// except drawing positions; visibility (lit/comms, margins) comes straight from /lib.
import { V, type Horizon, type Timeline, type Sample } from "./data";
import { createPanelRoot, esc, deg, az, fmtUtc, clampHour } from "./shared";
import type { MountPanel, PanelProps } from "./types";
import { KID_CSS, kidDate, kidSun, kidEarth, teacher } from "./kid";

const W = 1080, PX_PER_DEG = W / 360;   // 3 px per degree of azimuth
const H = 300, PAD_T = 14, PAD_B = 26;  // drawing height and margins (px)

export const mountHorizonView: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "horizonview", CSS + KID_CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);

  let current: PanelProps = { ...props };
  let hour = clampHour(props.hour, V.VERDICT_RULE.STAY_DAYS * 24); // v1.2: shared hour (local if the shell gives no onHourSelected)
  let token = 0;
  let data: { horizon: Horizon; tl: Timeline; name: string; yMin: number; yMax: number } | null = null;

  body.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.action === "hour") setHour(Number(t.value));
  });
  body.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t || !data) return;
    const n = data.tl.samples.length;
    if (t.dataset.action === "prev-hour") setHour(Math.max(0, hour - 1));
    else if (t.dataset.action === "next-hour") setHour(Math.min(n - 1, hour + 1));
  });

  // v1.2: with onHourSelected the shell owns the hour (we ask, it calls update({hour})); without it, the hour is local.
  function setHour(h: number) {
    if (current.onHourSelected) { current.onHourSelected(h); return; }
    showHour(h);
  }
  function showHour(h: number) {
    hour = h;
    const slider = body.querySelector<HTMLInputElement>("input[data-action=hour]");
    if (slider) slider.value = String(hour);
    drawDynamic();
  }

  async function load() {
    const my = ++token;
    data = null;
    const site = V.listSites().find((s) => s.id === current.siteId);
    if (!site) { body.innerHTML = `<p class="warn">Unknown site “${esc(current.siteId)}”.</p>`; return; }
    body.innerHTML = `<h2>Stand here: ${esc(site.name)}</h2><p class="muted">Loading…</p>`;
    try { await V.loadSite(site.id); } catch (err) {
      if (my === token) body.innerHTML = `<h2>Stand here: ${esc(site.name)}</h2><p class="warn">Could not load data (${esc((err as Error).message)}).</p>`;
      return;
    }
    if (my !== token) return;
    let tl: Timeline;
    try { tl = V.getTimeline(site.id, `${current.landingDate}T00:00:00Z`, V.VERDICT_RULE.STAY_DAYS); } catch (err) {
      const ranges = V.getCoverage().sites.find((c) => c.siteId === site.id)?.ranges ?? [];
      body.innerHTML = `<h2>Stand here: ${esc(site.name)}</h2>
        <p class="warn"><strong>Unavailable:</strong> no data for a ${V.VERDICT_RULE.STAY_DAYS}-day stay from ${esc(current.landingDate)}.</p>
        <p class="muted">Data covers: ${ranges.map(([a, b]) => `${esc(a.slice(0, 10))} to ${esc(b.slice(0, 10))}`).join("; ")}.</p>`;
      return;
    }
    const horizon = V.getHorizon(site.id);
    hour = Math.min(hour, tl.samples.length - 1);
    // Vertical range: fit the horizon and both paths, at least -5..+10 deg, rounded to 5 deg.
    const vals = [...horizon.elevationDeg, ...tl.samples.flatMap((s) => [s.sunEl, s.earthEl])];
    const yMin = Math.floor(Math.min(-5, ...vals) / 5) * 5, yMax = Math.ceil(Math.max(10, ...vals) / 5) * 5;
    data = { horizon, tl, name: site.name, yMin, yMax };
    drawStatic();
    drawDynamic();
  }

  const x = (azDeg: number) => (((azDeg % 360) + 360) % 360) * PX_PER_DEG;
  const y = (el: number) => { const d = data!; return PAD_T + ((d.yMax - el) / (d.yMax - d.yMin)) * (H - PAD_T - PAD_B); };

  function pathD(samples: Sample[], key: "sun" | "earth"): string {
    let d = "", prev: number | null = null;
    for (const s of samples) {
      const a = key === "sun" ? s.sunAz : s.earthAz, e = key === "sun" ? s.sunEl : s.earthEl;
      const jump = prev !== null && Math.abs(a - prev) > 180; // wrap across north: start a new segment
      d += `${d === "" || jump ? "M" : "L"}${x(a).toFixed(1)},${y(e).toFixed(1)}`;
      prev = a;
    }
    return d;
  }

  const kid = () => current.level === "educator"; // D32: Educator wording, no degrees

  function drawStatic() {
    const d = data!;
    const k = kid();
    const flat = d.horizon.model === "flat";
    const n = d.tl.samples.length;
    // Horizon polyline: bin i covers [i-0.5, i+0.5) deg, drawn as steps.
    let hz = "";
    for (let i = 0; i <= 360; i++) {
      const e = d.horizon.elevationDeg[i % 360];
      const xa = Math.max(0, (i - 0.5) * PX_PER_DEG), xb = Math.min(W, (i + 0.5) * PX_PER_DEG);
      hz += `${i === 0 ? "M" : "L"}${xa.toFixed(1)},${y(e).toFixed(1)}L${xb.toFixed(1)},${y(e).toFixed(1)}`;
    }
    const ground = `${hz}L${W},${H - PAD_B}L0,${H - PAD_B}Z`;
    const grid: string[] = [];
    const step = d.yMax - d.yMin > 60 ? 15 : d.yMax - d.yMin > 25 ? 10 : 5;
    for (let e = d.yMin; e <= d.yMax; e += step) {
      grid.push(`<line x1="0" x2="${W}" y1="${y(e)}" y2="${y(e)}" class="${e === 0 ? "level" : "grid"}"/>${k ? "" : `<text x="4" y="${y(e) - 3}" class="axis">${e > 0 ? "+" : ""}${e}°</text>`}`);
    }
    const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"].map((c, i) =>
      `<line x1="${i * 45 * PX_PER_DEG}" x2="${i * 45 * PX_PER_DEG}" y1="${PAD_T}" y2="${H - PAD_B}" class="grid"/><text x="${Math.min(W - 12, Math.max(2, i * 45 * PX_PER_DEG - 6))}" y="${H - 8}" class="axis compass">${c}${k || i * 45 === 360 ? "" : ` ${i * 45}°`}</text>`).join("");
    function panoSvg(kidMode: boolean): string {
      return `<svg class="pano" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pano-desc">
        <desc id="pano-desc">Panorama of the horizon with the Sun and Earth paths over the stay.</desc>
        <defs>
          <pattern id="ground" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" class="ground-bg"/><line x1="0" y1="0" x2="0" y2="8" class="ground-hatch"/>
          </pattern>
        </defs>
        <rect x="0" y="${PAD_T}" width="${W}" height="${H - PAD_T - PAD_B}" class="sky"/>
        ${grid.join("")}
        ${compass}
        <path d="${ground}" class="ground"/>
        <path d="${hz}" class="horizon"/>
        ${kidMode ? "" : `<text x="${W - 4}" y="${y(0) - 4}" class="axis level-label" text-anchor="end">level 0°</text>`}
        <path d="${pathD(d.tl.samples, "sun")}" class="path sun-path"/>
        <path d="${pathD(d.tl.samples, "earth")}" class="path earth-path"/>
        <g class="now"></g>
      </svg>`;
    }
    function controlsHtml(n: number, label: string): string {
      return `<div class="controls">
        <button type="button" data-action="prev-hour" aria-label="One hour earlier">◀</button>
        <label>${label} <input type="range" data-action="hour" min="0" max="${n - 1}" step="1" value="${hour}"/></label>
        <button type="button" data-action="next-hour" aria-label="One hour later">▶</button>
        <output class="when"></output>
      </div>`;
    }
    const desc = flat
      ? "Flat horizon: terrain is not modelled at this site, so the horizon is the level line (0°) in every direction."
      : `Terrain horizon from LOLA elevation data for one point${d.horizon.observer ? ` (${heightWords(d.horizon.observer.groundHeightM)}, ${d.horizon.observer.mastM} m assumed mast)` : ""}. Nearby spots differ, especially toward Earth.`;

    const site = V.listSites().find((x) => x.id === current.siteId)!;
    body.innerHTML = k ? `
      <div class="kid"><header>
        <h2>Stand here: ${esc(site.shortName)}</h2>
        <p>Turn all the way around. The bumpy line is the hills.</p>
        <p class="muted">Landing on ${esc(kidDate(current.landingDate))}. Move the slider to change the time.</p>
      </header></div>
      ${panoSvg(true)}
      <p class="small legend">
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="horizon"/></svg> hills</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect width="26" height="10" class="ground"/></svg> ground</span>
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="path sun-path"/></svg> where the Sun goes</span>
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="path earth-path"/></svg> where Earth goes</span>
      </p>
      ${controlsHtml(n, "Time")}
      <ul class="readout kid-readout" aria-live="polite"></ul>
      <div class="kid">${teacher(`<p>${esc(desc.replace(/ \(0°\)/, ""))}</p><p>Left to right is the compass: north, east, south, west, north. Up is higher in the sky. The Sun and Earth paths cover the ${V.VERDICT_RULE.STAY_DAYS}-day stay from ${esc(current.landingDate)} 00:00 UTC, one point per hour. A body counts as seen only when it is above the skyline; this is possible sunlight or a possible direct line of sight to Earth, not guaranteed power or a guaranteed link.</p>`,
        "Why can a hill hide the Sun even in the daytime?")}</div>` : `
      <header>
        <h2>Stand here: ${esc(d.name)}</h2>
        <p class="muted">Looking all the way around: compass direction left to right (N → E → S → W → N), height above level up and down. ${V.VERDICT_RULE.STAY_DAYS}-day stay from ${esc(current.landingDate)} 00:00 UTC.</p>
        <p class="small"><span class="tag" data-model="${d.horizon.model}">${flat ? "FLAT" : "TERRAIN"}</span> ${esc(desc)}</p>
      </header>
      ${panoSvg(false)}
      <p class="small legend">
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="horizon"/></svg> horizon (${flat ? "flat" : "terrain"})</span>
        <span><svg width="26" height="10" aria-hidden="true"><rect width="26" height="10" class="ground"/></svg> hatched = ground</span>
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="path sun-path"/></svg> Sun path (solid)</span>
        <span><svg width="26" height="10" aria-hidden="true"><line x1="0" y1="5" x2="26" y2="5" class="path earth-path"/></svg> Earth path (dotted)</span>
      </p>
      ${controlsHtml(n, "Hour of the stay")}
      <ul class="readout" aria-live="polite"></ul>
      <p class="muted small">Sun and Earth are treated as points (centres). Data are hourly. “In view” means above the ${flat ? "flat" : "terrain"} horizon: possible sunlight or a possible direct line of sight to Earth, not guaranteed power or a guaranteed link.</p>`;
  }

  function drawDynamic() {
    if (!data) return;
    const d = data, s = d.tl.samples[hour], n = d.tl.samples.length;
    const when = body.querySelector("output.when");
    if (when) when.textContent = kid() ? `Day ${Math.floor(hour / 24) + 1} of ${Math.round(n / 24)}, ${s.utc.slice(11, 16)}` : `${fmtUtc(s.utc)}; day ${Math.floor(hour / 24) + 1} of ${Math.round(n / 24)}`;
    const g = body.querySelector("g.now");
    if (g) {
      const sx = x(s.sunAz), sy = y(s.sunEl), ex = x(s.earthAz), ey = y(s.earthEl);
      g.innerHTML = `
        <line x1="${sx}" x2="${sx}" y1="${y(s.sunEl - s.sunMarginDeg)}" y2="${sy}" class="margin"/>
        <line x1="${ex}" x2="${ex}" y1="${y(s.earthEl - s.earthMarginDeg)}" y2="${ey}" class="margin"/>
        <g class="body sun ${s.lit ? "up" : "hidden"}" data-body="sun" data-x="${sx.toFixed(1)}" data-y="${sy.toFixed(1)}">
          <circle cx="${sx}" cy="${sy}" r="8"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${sx + 10 * Math.cos(a * Math.PI / 180)}" y1="${sy + 10 * Math.sin(a * Math.PI / 180)}" x2="${sx + 14 * Math.cos(a * Math.PI / 180)}" y2="${sy + 14 * Math.sin(a * Math.PI / 180)}"/>`).join("")}
          <text x="${sx + 16}" y="${sy - 10}" class="label">Sun${s.lit ? "" : " (hidden)"}</text>
        </g>
        <g class="body earth ${s.comms ? "up" : "hidden"}" data-body="earth" data-x="${ex.toFixed(1)}" data-y="${ey.toFixed(1)}">
          <circle cx="${ex}" cy="${ey}" r="8"/><line x1="${ex - 8}" y1="${ey}" x2="${ex + 8}" y2="${ey}"/><line x1="${ex}" y1="${ey - 8}" x2="${ex}" y2="${ey + 8}"/>
          <text x="${ex + 12}" y="${ey + 20}" class="label">Earth${s.comms ? "" : " (hidden)"}</text>
        </g>`;
    }
    const ro = body.querySelector("ul.readout");
    if (ro && kid()) {
      const bin = Math.round(s.sunAz) % 360, dist = d.horizon.blockDistKm?.[bin];
      const hill = !s.lit && s.sunEl > 0 && dist !== undefined ? ` The hill is about ${dist < 1 ? `${Math.round(dist * 1000)} metres` : `${Math.max(1, Math.round(dist))} km`} away.` : "";
      ro.innerHTML = `<li><strong>Sun:</strong> ${esc(kidSun(s))}${esc(hill)}</li><li><strong>Earth:</strong> ${esc(kidEarth(s))}</li>`;
      return;
    }
    const sunExtra = s.eclipseFraction > 0 && s.sunSkylineFraction > 0 ? ` <em>Lunar eclipse: Earth's shadow covers ${Math.round(s.eclipseFraction * 100)}% of the Sun's disc.</em>`
      : s.sunFraction > 0 && s.sunFraction < 1 ? ` <em>${Math.round(s.sunFraction * 100)}% of the Sun's disc is above the skyline.</em>` : "";
    const earthExtra = s.earthMarginal ? ` <em>Marginal: Earth's disc is partly hidden by the skyline; it counts as in view only when the whole disc clears.</em>` : "";
    if (ro) ro.innerHTML = `<li>${readout("Sun", s.sunEl, s.sunAz, s.sunMarginDeg, s.lit, d.horizon)}${sunExtra}</li><li>${readout("Earth", s.earthEl, s.earthAz, s.earthMarginDeg, s.comms, d.horizon)}${earthExtra}</li>`;
  }

  load();
  return {
    update(next) {
      const changed = (next.siteId !== undefined && next.siteId !== current.siteId) ||
        (next.landingDate !== undefined && next.landingDate !== current.landingDate);
      const levelChanged = next.level !== undefined && next.level !== current.level;
      current = { ...current, ...next };
      if (levelChanged && !changed && data) { drawStatic(); drawDynamic(); }
      if (next.hour !== undefined) hour = clampHour(next.hour, V.VERDICT_RULE.STAY_DAYS * 24);
      else if (changed && !current.onHourSelected) hour = 0; // v1.1 behaviour: new site/date starts at hour 1
      if (changed) load();
      else if (next.hour !== undefined && data) showHour(hour);
    },
    destroy() { token++; host.remove(); },
  };
};

/** "4885.5 m above" / "1927.8 m below" the 1737.4 km reference sphere. */
function heightWords(m: number): string {
  return `${Math.abs(m).toFixed(1)} m ${m >= 0 ? "above" : "below"} the 1737.4 km reference sphere`;
}

// One sentence per body, in words, with the margin. Uses lit/comms and margins from /lib.
function readout(name: string, el: number, azDeg: number, margin: number, visible: boolean, hz: Horizon): string {
  const where = `azimuth ${az(azDeg)}`;
  const hzEl = el - margin;
  // D19: centre above the skyline but not counted (Earth: disc partly hidden; Sun: under half the disc visible, e.g. eclipse)
  if (!visible && margin > 0) return `<strong>${name}: not counted as in view</strong> — its centre is ${deg(margin)} above the ${hz.model === "flat" ? "flat horizon" : "skyline"}, but ${name === "Earth" ? "part of its disc is still hidden" : "less than half of its disc is visible"}; ${where}.`;
  if (hz.model === "flat") {
    return visible
      ? `<strong>${name}: in view</strong> — ${deg(margin)} above the flat horizon (${where}).`
      : `<strong>${name}: not in view</strong> — ${Math.abs(margin).toFixed(2)}° below the flat horizon (${where}).`;
  }
  const bin = Math.round(azDeg) % 360;
  const dist = hz.blockDistKm?.[bin];
  const ridge = dist !== undefined ? ` (the skyline there is ${dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} away)` : "";
  if (!visible && el > 0) {
    return `<strong>${name}: hidden behind terrain</strong> — it is ${deg(el)} above level, but the terrain horizon there is ${deg(hzEl)}, so it sits ${Math.abs(margin).toFixed(2)}° below the skyline${ridge}; ${where}.`;
  }
  if (!visible) return `<strong>${name}: not in view</strong> — ${deg(el)}, ${Math.abs(margin).toFixed(2)}° below the terrain horizon of ${deg(hzEl)}${ridge}; ${where}.`;
  if (el <= 0) return `<strong>${name}: in view over lower terrain</strong> — it is ${deg(el)} (below level), but the terrain horizon there is ${deg(hzEl)}, so it clears it by ${margin.toFixed(2)}°; ${where}.`;
  return `<strong>${name}: in view</strong> — ${margin.toFixed(2)}° above the terrain horizon of ${deg(hzEl)}${ridge}; ${where}.`;
}

const CSS = `
.card { padding: var(--_pad); border: 0; border-radius: 14px; background: var(--_glass); backdrop-filter: blur(var(--_glass-blur)); -webkit-backdrop-filter: blur(var(--_glass-blur)); line-height: 1.45; }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
p { margin: 6px 0; }
.small { font-size: var(--_fs-sm); }
.tag { display: inline-block; padding: 1px 7px; margin-right: 4px; border-radius: 6px; font-size: .72rem; font-weight: 700; letter-spacing: .06em; border: 1px solid currentColor; }
.tag[data-model="flat"] { color: var(--_muted); }
.tag[data-model="lola"] { color: var(--_clear); }
svg.pano { width: 100%; height: auto; display: block; margin-top: 8px; }
.sky { fill: var(--_sky); }
.grid { stroke: rgba(255,255,255,.08); stroke-width: 1; }
.level { stroke: var(--_muted); stroke-width: 1; stroke-dasharray: 6 4; }
.axis { fill: var(--_muted); font-size: 11px; }
.compass { font-weight: 600; }
.ground { fill: url(#ground); }
.ground-bg { fill: var(--_ground); }
.ground-hatch { stroke: var(--_ground-line); stroke-width: 3; }
.legend .ground { fill: var(--_ground); stroke: var(--_ground-line); }
.horizon { fill: none; stroke: var(--_horizon); stroke-width: 2; }
.path { fill: none; stroke-width: 2; }
.sun-path { stroke: var(--_sun); opacity: .75; }
.earth-path { stroke: var(--_earth); stroke-dasharray: 2 4; opacity: .9; }
.margin { stroke: var(--_text); stroke-width: 1; stroke-dasharray: 3 3; }
.body circle { stroke: #0b1322; stroke-width: 2; }
.body line { stroke-width: 2; }
.sun circle { fill: var(--_sun); } .sun line { stroke: var(--_sun); }
.earth circle { fill: var(--_earth); } .earth line { stroke: #0b1322; }
.body.hidden circle { fill-opacity: .35; stroke-dasharray: 3 2; stroke: var(--_text); }
.label { fill: var(--_text); font-size: 13px; font-weight: 700; paint-order: stroke; stroke: #0b1322; stroke-width: 3px; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; }
.legend span { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; }
.controls { display: flex; align-items: center; gap: 8px; margin: 10px 0 4px; flex-wrap: wrap; }
.controls label { display: flex; align-items: center; gap: 8px; font-size: .85rem; flex: 1; min-width: 260px; }
.controls input[type=range] { flex: 1; }
.controls button { padding: 4px 10px; border: 1px solid var(--_border); border-radius: 8px; background: transparent; color: inherit; }
.when { font-variant-numeric: tabular-nums; font-size: .88rem; }
.readout { padding-left: 18px; margin: 6px 0; }
.readout li { margin: 4px 0; }
`;
