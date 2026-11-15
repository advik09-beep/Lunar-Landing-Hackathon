// D32 Learn tab (Educator view of the fourth tab): a simple visual report for a seven-year-old, built from
// OUR data, plus real NASA photos with their official source page and exact credit.
// Lane A owns this file. Every number comes from /lib/visibility.js; nothing is calculated here except
// picking maxima, run lengths and drawing positions from those numbers.
import { V, type Sample } from "./data";
import { createPanelRoot, esc } from "./shared";
import { KID_CSS, kidDate, kidAmount, ring, teacher } from "./kid";
import type { MountPanel, PanelProps } from "./types";
import earthriseUrl from "./img/nasa_apollo8_earthrise.jpg";
import southPoleUrl from "./img/nasa_pia13523_south_pole.jpg";

/** NASA photos: official page and the credit line exactly as NASA gives it (checked 2026-11-14). */
export const LEARN_PHOTOS = [
  { id: "earthrise", src: earthriseUrl, alt: "Earth rising above the grey edge of the Moon, against a black sky.",
    kid: "Earth seen from a spaceship flying around the Moon.",
    teacher: "Apollo 8 Earthrise. Earth seems to rise here only because the spacecraft was orbiting the Moon. Standing on the Moon's surface, Earth stays in almost the same spot in the sky (see “Earth stays in one spot” above).",
    credit: "Image Credit: NASA", page: "https://www.nasa.gov/image-article/apollo-8-earthrise/" },
  { id: "south-pole", src: southPoleUrl, alt: "Black-and-white map of the Moon's south pole, full of craters, with long dark shadows.",
    kid: "The Moon's south pole. Some deep craters here never get sunshine.",
    teacher: "Lunar South Pole (PIA13523): a mosaic from the camera on NASA's Lunar Reconnaissance Orbiter. Because the Sun stays near the horizon here, crater floors can stay in permanent shadow, which is where water ice can survive.",
    credit: "Credits: NASA/GSFC/Arizona State University", page: "https://science.nasa.gov/photojournal/the-lunar-south-pole" },
] as const;

/** Fixed examples so the explainers say the same thing every time (checked by scripts/check_d32.mjs). */
export const LEARN_EXAMPLES = Object.freeze({
  ridge: { siteId: "sp_malapert", utc: "2026-09-19T06:00:00Z" },
  high: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 30 },
  low: { siteId: "sp_malapert", start: "2026-11-14T00:00:00Z", days: 30 },
  dayNight: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 120 },
  earth: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 30 },
});

/** Facts for the explainers, straight from /lib. Exported for the checks. */
export function learnFacts() {
  const E = LEARN_EXAMPLES;
  const st = V.getState(E.ridge.siteId, E.ridge.utc);
  const hz = V.getHorizon(E.ridge.siteId);
  const bin = Math.round(st.sunAz) % 360;
  const tl = (x: { siteId: string; start: string; days: number }) => V.getTimeline(x.siteId, x.start, x.days).samples;
  const hi = tl(E.high), lo = tl(E.low), dn = tl(E.dayNight), ea = tl(E.earth);
  // Day and night: lengths of complete sunshine and night runs (hours), and sunrise-to-sunrise spans.
  const runs: { lit: boolean; hours: number; startIdx: number }[] = [];
  dn.forEach((s, i) => { const r = runs[runs.length - 1]; if (r && r.lit === s.lit) r.hours++; else runs.push({ lit: s.lit, hours: 1, startIdx: i }); });
  const whole = runs.slice(1, -1); // drop runs cut by the window edges
  const rises = whole.filter((r) => r.lit).map((r) => dn[r.startIdx].utc);
  return {
    ridge: { sunEl: st.sunEl, sunAz: st.sunAz, marginDeg: st.sunMarginDeg, skylineDeg: st.sunEl - st.sunMarginDeg, lit: st.lit,
      blockDistKm: hz.blockDistKm?.[bin] ?? null, horizon: hz.elevationDeg },
    highSunDeg: Math.max(...hi.map((s) => s.sunEl)), lowSunDeg: Math.max(...lo.map((s) => s.sunEl)),
    dayNight: { sunHours: whole.filter((r) => r.lit).map((r) => r.hours), nightHours: whole.filter((r) => !r.lit).map((r) => r.hours), sunrises: rises,
      sunriseToSunriseDays: rises.slice(1).map((r, i) => (Date.parse(r) - Date.parse(rises[i])) / 864e5), samples: dn },
    earth: { elMin: Math.min(...ea.map((s) => s.earthEl)), elMax: Math.max(...ea.map((s) => s.earthEl)),
      azMin: Math.min(...ea.map((s) => s.earthAz)), azMax: Math.max(...ea.map((s) => s.earthAz)),
      sunElMin: Math.min(...ea.map((s) => s.sunEl)), sunElMax: Math.max(...ea.map((s) => s.sunEl)), samples: ea },
  };
}

export async function renderLearn(body: HTMLElement, current: PanelProps, isCurrent: () => boolean): Promise<void> {
  const ids = [...new Set([current.siteId, ...Object.values(LEARN_EXAMPLES).map((x) => x.siteId)])];
  body.innerHTML = `<p class="muted">Getting the pictures ready…</p>`;
  try { await Promise.all([...ids.map((id) => V.loadSite(id)), V.loadDaily()]); } catch (err) {
    if (isCurrent()) body.innerHTML = `<p class="warn">Could not load data (${esc((err as Error).message)}).</p>`;
    return;
  }
  if (!isCurrent()) return;
  const F = learnFacts();
  const site = V.listSites().find((s) => s.id === current.siteId);
  let mine = "";
  try {
    const sm = V.getSummary(current.siteId, `${current.landingDate}T00:00:00Z`, V.VERDICT_RULE.STAY_DAYS);
    mine = `<section class="mine"><h3>Your place: ${esc(site?.shortName ?? current.siteId)}</h3>
      <p>Landing on ${esc(kidDate(current.landingDate))}.</p>
      <div class="rings">${ring(sm.pctLit, "sun", "Sunshine")}${ring(sm.pctComms, "earth", "Earth in sight")}</div>
      <p>Sunshine ${esc(kidAmount(sm.pctLit))}. Earth in sight ${esc(kidAmount(sm.pctComms))}.</p></section>`;
  } catch { mine = `<section class="mine"><h3>Your place</h3><p>We have no data for that week.</p></section>`; }
  const dn = F.dayNight, sunDays = Math.round(avg(dn.sunHours) / 24), nightDays = Math.round(avg(dn.nightHours) / 24);
  const r = F.ridge;
  body.innerHTML = `<div class="kid learn">
    <header><h2>Learn: sunshine and Earth on the Moon</h2>
      <p class="lead">A lander needs sunshine for power. It needs to see Earth to send messages home.</p></header>
    ${mine}

    <section><h3>1. A hill can hide the Sun</h3>
      ${ridgeSvg(r)}
      <p>The Sun is up in the sky.</p>
      <p>But a tall hill is in the way.</p>
      <p>So the lander gets no sunshine.</p>
      ${teacher(`<p>Real skyline at Malapert (high ground near NASA's candidate region) on 19 September 2026 at 06:00 UTC. The Sun is ${r.sunEl.toFixed(2)} degrees above level, but the terrain skyline in that direction stands ${r.skylineDeg.toFixed(2)} degrees high, set by a ridge ${r.blockDistKm === null ? "nearby" : `${r.blockDistKm.toFixed(2)} km`} to the east. A flat-ground model would call this hour sunny; with terrain it is dark. Skyline from NASA's LOLA elevation maps, Sun position from NASA JPL Horizons.</p>`,
        "Can you remember a time a building or a tree hid the Sun from you?")}</section>

    <section><h3>2. Near the poles, the Sun stays low</h3>
      <div class="pair">${skySvg(F.highSunDeg, "Apollo 11", "near the middle of the Moon")}${skySvg(F.lowSunDeg, "Malapert", "near the south pole")}</div>
      <p>Near the middle of the Moon, the Sun climbs high.</p>
      <p>Near the south pole, the Sun stays close to the ground.</p>
      <p>That is why hills matter so much there.</p>
      ${teacher(`<p>Highest Sun in the 30 days from 14 November 2026: Apollo 11 about ${Math.round(F.highSunDeg)} degrees above level, Malapert about ${Math.round(F.lowSunDeg)} degrees (NASA JPL Horizons). The Moon's axis is tilted only about 1.5 degrees, so at the poles the Sun always skims the horizon (NASA SVS 5229).</p>`,
        "If the Sun stayed low all day where you live, what would your shadow look like?")}</section>

    <section><h3>3. A day on the Moon lasts about a month</h3>
      ${dayNightSvg(dn.samples)}
      <p>On the Moon, sunshine lasts about ${words(sunDays)} days.</p>
      <p>Then night lasts about ${words(nightDays)} days.</p>
      <p>On Earth, a whole day and night take just one day.</p>
      ${teacher(`<p>At Apollo 11 from 14 November 2026: complete sunshine stretches of ${list(dn.sunHours.map((h) => (h / 24).toFixed(1)))} days and nights of ${list(dn.nightHours.map((h) => (h / 24).toFixed(1)))} days. Sunrise to sunrise: ${list(dn.sunriseToSunriseDays.map((d) => d.toFixed(1)))} days (hourly data, so each is good to about an hour). One lunar day, noon to noon, averages about 29.5 Earth days.</p>`,
        "What would you do during a night that lasts two weeks?")}</section>

    <section><h3>4. Earth stays in one spot</h3>
      ${earthSvg(F.earth.samples)}
      <p>The Sun crosses the Moon's sky.</p>
      <p>Earth stays in almost the same spot.</p>
      <p>That is because the Moon always shows Earth the same face.</p>
      ${teacher(`<p>At Apollo 11 over the 30 days from 14 November 2026, Earth's height stays between ${Math.round(F.earth.elMin)} and ${Math.round(F.earth.elMax)} degrees and its compass direction between ${Math.round(F.earth.azMin)} and ${Math.round(F.earth.azMax)} degrees, while the Sun goes from ${Math.round(F.earth.sunElMin)} to ${Math.round(F.earth.sunElMax)} degrees (below the ground at night). The small wobble is called libration. Positions from NASA JPL Horizons.</p>`,
        "If Earth never moves in the Moon's sky, could you use it to find your way?")}</section>

    <section><h3>5. Real NASA photos</h3>
      <div class="photos">${LEARN_PHOTOS.map((p) => `<figure class="photo" data-photo="${p.id}">
        <img src="${p.src}" alt="${esc(p.alt)}" loading="lazy" width="320"/>
        <figcaption><p>${esc(p.kid)}</p>
          <p class="credit">${esc(p.credit)}; <a href="${esc(p.page)}" target="_blank" rel="noopener">NASA source page</a></p>
          ${teacher(`<p>${esc(p.teacher)}</p>`, p.id === "earthrise" ? "Why does Earth look like it is rising in this photo?" : "Why might ice hide in the dark craters?")}</figcaption></figure>`).join("")}</div></section>
  </div>`;
}

export const mountLearn: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "learn", CARD_CSS + KID_CSS + LEARN_CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);
  let current: PanelProps = { ...props }, token = 0;
  const go = () => { const my = ++token; renderLearn(body, current, () => my === token); };
  go();
  return {
    update(next) {
      const changed = (next.siteId !== undefined && next.siteId !== current.siteId) || (next.landingDate !== undefined && next.landingDate !== current.landingDate);
      current = { ...current, ...next };
      if (changed) go();
    },
    destroy() { token++; host.remove(); },
  };
};

const list = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const words = (n: number) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"][n] ?? String(n);

function ridgeSvg(r: { sunEl: number; sunAz: number; horizon: number[]; lit: boolean }): string {
  // East half of the real skyline (azimuth 20..160), drawn tall so the ridge reads clearly.
  const a0 = 20, a1 = 160, W = 560, H = 200, lo = -6, hi = 12;
  const x = (a: number) => ((a - a0) / (a1 - a0)) * W, y = (e: number) => ((hi - e) / (hi - lo)) * H;
  let d = "";
  for (let a = a0; a <= a1; a++) d += `${a === a0 ? "M" : "L"}${x(a).toFixed(1)},${y(r.horizon[a % 360]).toFixed(1)}`;
  const sx = x(r.sunAz), sy = y(r.sunEl);
  return `<svg class="pic" viewBox="0 0 ${W} ${H}" role="img" aria-label="A real hill skyline with the Sun just above level but behind the hill.">
    <rect width="${W}" height="${H}" class="sky"/>
    <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="level"/>
    <g class="sunpic hidden"><circle cx="${sx}" cy="${sy}" r="11"/></g>
    <path d="${d}L${W},${H}L0,${H}Z" class="ground"/><path d="${d}" class="hill"/>
    <text x="${sx > W / 2 ? sx - 16 : sx + 16}" y="${sy - 16}" class="lab" text-anchor="${sx > W / 2 ? "end" : "start"}">Sun (behind the hill)</text></svg>
    <p class="key"><span class="ki"><span class="k line"></span>The real hills</span><span class="ki"><span class="k level"></span>Where flat ground would be</span></p>`;
}
function skySvg(maxEl: number, name: string, where: string): string {
  const W = 260, H = 150, cx = W / 2, gy = 120, R = 100, k = (Math.max(0, maxEl) * Math.PI) / 180;
  const sx = cx + R * Math.cos(k), sy = gy - R * Math.sin(k); // drawn at the real angle; no number shown
  return `<figure class="sky-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${name}: the Sun's highest point in the sky`)}">
    <path d="M${cx - R},${gy} A${R},${R} 0 0 1 ${cx + R},${gy}" class="dome"/>
    <line x1="10" x2="${W - 10}" y1="${gy}" y2="${gy}" class="hill"/>
    <line x1="${cx}" x2="${sx}" y1="${gy}" y2="${sy}" class="ray"/>
    <g class="sunpic"><circle cx="${sx}" cy="${sy}" r="10"/></g>
    <rect x="${cx - 6}" y="${gy - 10}" width="12" height="10" class="lander"/></svg>
    <figcaption><strong>${esc(name)}</strong> ${esc(where)}</figcaption></figure>`;
}
function dayNightSvg(s: Sample[]): string {
  const W = 700, H = 46, bw = W / s.length;
  const bars = s.map((x, i) => (x.lit ? `<rect x="${(i * bw).toFixed(2)}" y="0" width="${(bw + 0.1).toFixed(2)}" height="${H}" class="sun"/>` : "")).join("");
  const weeks = Array.from({ length: Math.floor(s.length / 168) }, (_, k) => `<line x1="${((k + 1) * 168 * bw).toFixed(1)}" x2="${((k + 1) * 168 * bw).toFixed(1)}" y1="${H}" y2="${H + 6}" class="tick"/>`).join("");
  return `<svg class="pic" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="About four months at Apollo 11: long stretches of sunshine and long nights.">
    <rect width="${W}" height="${H}" class="night"/>${bars}${weeks}</svg>
    <p class="key"><span class="ki"><span class="k sun"></span>Sunshine</span><span class="ki"><span class="k night"></span>Night</span><span class="ki">Each tick: one week</span></p>`;
}
function earthSvg(s: Sample[]): string {
  const W = 560, H = 200, lo = -90, hi = 90;
  const x = (a: number) => (((a % 360) + 360) % 360) / 360 * W, y = (e: number) => ((hi - e) / (hi - lo)) * H;
  const sun = s.filter((_, i) => i % 6 === 0).map((p) => `<circle cx="${x(p.sunAz).toFixed(1)}" cy="${y(p.sunEl).toFixed(1)}" r="2.5" class="sundot"/>`).join("");
  const earth = s.filter((_, i) => i % 6 === 0).map((p) => `<circle cx="${x(p.earthAz).toFixed(1)}" cy="${y(p.earthEl).toFixed(1)}" r="3" class="earthdot"/>`).join("");
  const ex = x(s[0].earthAz), ey = y(s[0].earthEl);
  return `<svg class="pic" viewBox="0 0 ${W} ${H}" role="img" aria-label="Over a month, the Sun's dots spread across the whole sky, while Earth's dots stay in one small cluster.">
    <rect width="${W}" height="${y(0)}" class="sky"/><rect y="${y(0)}" width="${W}" height="${H - y(0)}" class="groundflat"/>
    ${sun}${earth}<text x="${ex < W / 2 ? ex + 14 : ex - 14}" y="${Math.max(18, ey + 5)}" class="lab" text-anchor="${ex < W / 2 ? "start" : "end"}">Earth</text>
    ${["N", "E", "S", "W"].map((c, i) => `<text x="${i * W / 4 + 4}" y="${H - 6}" class="lab small">${c}</text>`).join("")}</svg>
    <p class="key"><span class="ki"><span class="k sun dot"></span>The Sun, every 6 hours for a month</span><span class="ki"><span class="k earth dot"></span>Earth, same times</span></p>`;
}

export const CARD_CSS = `
.card { padding: var(--_pad); border: 0; border-radius: 14px; background: var(--_glass); backdrop-filter: blur(var(--_glass-blur)); -webkit-backdrop-filter: blur(var(--_glass-blur)); line-height: 1.5; }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
h3 { margin: 18px 0 6px; font-size: 1rem; }
`;
export const LEARN_CSS = `
.learn section { padding-top: 10px; border-top: 1px solid var(--_divider); margin-top: 12px; }
.learn h3 { border-top: 0; padding-top: 0; margin-top: 4px; } /* one divider per section (the section rule), not two */
.learn svg.pic, .learn .pair, .learn .photos { max-width: 560px; }
.k.dot { width: 10px; height: 10px; border-radius: 50%; } .k.line { height: 3px; background: var(--_horizon); } .k.level { height: 0; border-top: 2px dashed var(--_muted); }
svg.pic { width: 100%; height: auto; display: block; margin: 6px 0; }
.pic .sky, .sky-fig .sky { fill: var(--_sky); }
.pic .level { stroke: var(--_muted); stroke-dasharray: 6 4; }
.pic .ground { fill: var(--_ground); } .pic .groundflat { fill: var(--_ground); }
.pic .hill, .sky-fig .hill { fill: none; stroke: var(--_horizon); stroke-width: 2.5; }
.sunpic circle { fill: var(--_sun); stroke: #0b1322; stroke-width: 2; }
.lab { fill: var(--_text); font-size: 14px; font-weight: 650; paint-order: stroke; stroke: #0b1322; stroke-width: 3px; }
.lab.small { font-size: 12px; font-weight: 500; fill: var(--_muted); }
.pair { display: flex; gap: 14px; flex-wrap: wrap; }
.sky-fig { margin: 0; flex: 1; min-width: 200px; }
.sky-fig svg { width: 100%; height: auto; }
.sky-fig .dome { fill: var(--_sky); stroke: rgba(255,255,255,.15); }
.sky-fig .ray { stroke: var(--_sun); stroke-dasharray: 4 3; stroke-width: 2; }
.sky-fig .lander { fill: var(--_text); }
.sky-fig figcaption { font-size: .9rem; }
.pic .night { fill: rgba(255,255,255,.06); } .pic .sun { fill: var(--_sun); } .pic .tick { stroke: var(--_muted); }
.sundot { fill: var(--_sun); opacity: .8; } .earthdot { fill: var(--_earth); }
.photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.photo { margin: 0; } .photo img { width: 100%; height: auto; border-radius: 10px; display: block; }
.photo .credit { font-size: .78rem; color: var(--_muted); }
.photo a { color: var(--_link); }
.mine .rings { margin: 6px 0; }
`;
