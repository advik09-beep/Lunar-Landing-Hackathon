// visibility.js — data contract v1 (approved 2026-11-14, PLAN D4 + D8), REAL DATA build.
// Step 7: sp_malapert uses a LOLA terrain horizon (data/ephem/sp_malapert/horizon.json); other sites are flat.
// Values come from JPL Horizons files in /data (see data/README.md). No astronomy here:
// this module only reads samples and counts.
//
// Conventions (all functions):
//   - Times in: ISO 8601 UTC string with Z, or ms since epoch. Dates in getDaily: "YYYY-MM-DD" (UTC day).
//   - Data are hourly samples on the hour. A time is read at the start of its hour
//     (12:59 -> the 12:00 sample). No interpolation; derived change times are accurate to the hour.
//   - Angles out: degrees. Azimuth clockwise from north (N=0, E=90).
//   - Horizon: "lola" terrain profile where one exists (1-deg bins, bin i = [i-0.5, i+0.5)), else flat 0 deg.
//     margin = elevation - horizon at that azimuth; lit/comms = margin > 0. Sun and Earth are points.
//   - Outside coverage: throws RangeError("OUT_OF_COVERAGE ...") — no extrapolation.
//   - No next change inside coverage (or within 60 days): null (never 0).
//   - Async: loadSite(), loadDaily(). Everything else is synchronous and throws
//     Error("NOT_LOADED ...") if called before the matching load has resolved.
import sites from "../data/sites.js";
import { VERDICT_RULE, RULE_TEXT, verdictOf } from "./verdict.js";
import * as SCORE from "./score.js";
import { SUN_RADIUS_KM, EARTH_EQ_RADIUS_KM, IRRADIANCE_AT_MEAN_W_M2, MEAN_SUN_DISTANCE_KM, DISC_SOURCES, angularRadiusDeg, discFractionAbove, discCoveredFraction, separationDeg } from "./disc.js";
import { SCORE_DEFAULT_WEIGHTS, SCORE_FORMULA_TEXT, CLEARANCE_FULL_DEG, SLIP_DAYS, scoreOf } from "./score.js";
export { VERDICT_RULE };
export { SCORE_DEFAULT_WEIGHTS, SCORE_TERMS, SCORE_FORMULA_TEXT, SCORE_LABEL, SCORE_MEANING, WEIGHT_REASONS, WEIGHTS_STATEMENT,
  WEIGHTS_EDUCATOR_TEXT, CLEARANCE_FULL_DEG, SLIP_DAYS, scoreOf, baseScore, slipTolerance } from "./score.js";

export const MOCK = false; // real Horizons data (step 5)
export const API_VERSION = "1.7.0"; // 1.7: D21 site categories + ranking filter; D20 getConditions; slope
// (earlier) API_VERSION = "1.6.0"; // 1.6: D19 Sun and Earth as discs, Earth shadow, Sun distance
// (earlier) API_VERSION = "1.5.0"; // 1.5: D17 amendment (clearance, slip tolerance, "Sun and Earth score")
// (earlier) API_VERSION = "1.4.0"; // 1.1: setDataBase (PLAN D8), sampleUtc; 1.2: getHorizon + terrain horizons (step 7); 1.3: loadScene + getSceneState (step 8); 1.4: getMetrics, computePower (D16), scoreOf + getRanking (D17)
// READY = callable now with the documented shape.
export const READY = {
  listSites: true, getState: true, getSummary: true,
  loadSite: true, getCoverage: true, getTimeline: true,
  loadDaily: true, getDaily: true, setDataBase: true, loadScene: true,
  getMetrics: true, computePower: true, scoreOf: true, getRanking: true, getScore: true,
  getHorizon: true, getSceneState: true, // getSceneState: true after scripts/check_scene.mjs passed (2026-11-14)
};

const { STAY_DAYS, EDGE_DEG } = VERDICT_RULE;
const H = 3.6e6, D = 864e5;
const MAX_SCAN_H = 60 * 24;

// ---- where the data files live
// Default: ../data/ relative to this module's URL. Built site: dist/assets/<bundle>.js -> dist/data/.
// Vite dev: /@fs/<repo>/lib/visibility.js -> /@fs/<repo>/data/. Node: file:///<repo>/data/.
// (The relative path is kept in a variable on purpose so Vite does not try to bundle the folder.)
const DEFAULT_REL = "../data/";
let dataBase = new URL(DEFAULT_REL, import.meta.url).href;

export function setDataBase(url) {
  const base = typeof location !== "undefined" ? new URL(url, location.href) : new URL(url);
  dataBase = base.href.endsWith("/") ? base.href : base.href + "/";
  indexP = null; dailyP = null; dailyData = null; indexData = null; sceneP = null; sceneRuns = null;
  siteData.clear(); siteP.clear();
}

async function getJson(rel) {
  const url = new URL(rel, dataBase);
  if (url.protocol === "file:") { // Node (check scripts). Specifier kept in a variable so bundlers ignore it.
    const fsName = "node:fs/promises";
    const { readFile } = await import(/* @vite-ignore */ fsName);
    return JSON.parse(await readFile(url, "utf8"));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`LOAD_FAILED ${url.href} (HTTP ${res.status})`);
  return res.json();
}

// ---- helpers
const toMs = (t) => {
  const ms = typeof t === "number" ? t : Date.parse(t);
  if (!Number.isFinite(ms)) throw new TypeError("bad time " + t);
  return ms;
};
const floorH = (ms) => Math.floor(ms / H) * H;
const iso = (ms) => new Date(ms).toISOString().replace(".000Z", "Z");
const site = (id) => {
  const s = sites.find((x) => x.id === id);
  if (!s) throw new Error("unknown site " + id);
  return s;
};

// ---- index + per-site hourly data
let indexP = null, indexData = null;
function loadIndex() {
  return (indexP ??= getJson("ephem/index.json").then((d) => (indexData = d)).catch((e) => { indexP = null; throw e; }));
}

const siteP = new Map();   // siteId -> Promise
const siteData = new Map(); // siteId -> { runs: [{ start, sunAz, sunEl, earthAz, earthEl }], source, horizon }

export async function loadSite(siteId) {
  site(siteId);
  if (siteData.has(siteId)) return;
  if (!siteP.has(siteId)) {
    const p = (async () => {
      const idx = await loadIndex();
      const chunks = (idx.sites[siteId] ?? []).slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      const [, files, horizon] = await Promise.all([
        loadScene(), // D19: hourly Sun and Earth distances (disc sizes, irradiance)
        Promise.all(chunks.map((c) => getJson("ephem/" + c.file))),
        idx.horizons?.[siteId] ? getJson("ephem/" + idx.horizons[siteId]) : null,
      ]);
      const runs = [];
      for (const f of files) {
        const start = Date.parse(f.start);
        const last = runs.at(-1);
        if (last && start === last.start + last.sunEl.length * H) {
          for (const k of ["sunAz", "sunEl", "earthAz", "earthEl"]) last[k] = last[k].concat(f[k]);
        } else runs.push({ start, sunAz: f.sunAz, sunEl: f.sunEl, earthAz: f.earthAz, earthEl: f.earthEl });
      }
      siteData.set(siteId, { runs, source: files[0]?.source ?? "JPL Horizons", horizon });
    })().catch((e) => { siteP.delete(siteId); throw e; });
    siteP.set(siteId, p);
  }
  await siteP.get(siteId);
}

function data(siteId) {
  site(siteId);
  const d = siteData.get(siteId);
  if (!d) throw new Error(`NOT_LOADED ${siteId} (await loadSite("${siteId}") first)`);
  return d;
}

const model = (d) => (d.horizon ? "lola" : "flat");
const legacyTerrain = (d) => (d.horizon ? "real" : "flat"); // PLAN's original seam values
// Terrain horizon elevation at an azimuth (flat: 0). Same lookup as scripts/build_daily.mjs.
const horizonAt = (d, az) => (d.horizon ? d.horizon.elevationDeg[Math.round(az) % 360] : 0);

// Sample at an on-the-hour time, or null if not covered.
// Hourly Sun and Earth distances from the scene data (D19). Same coverage as the site data.
function sceneDist(ms) {
  if (!sceneRuns) throw new Error("NOT_LOADED scene");
  for (const { start, f } of sceneRuns) {
    const i = (ms - start) / H;
    if (i >= 0 && i < f.count) return { sunDistKm: f.sunDistKm[i], earthDistKm: f.earthDistKm[i] };
  }
  return null;
}

// One hourly sample with the D19 rules:
//  (a) the Sun is a disc: skyline fraction = share of the disc above the terrain skyline;
//  (b) Earth's shadow: eclipse fraction = share of the Sun's disc covered by Earth's disc, seen from the site;
//      sunFraction = skyline fraction × (1 − eclipse fraction); lit = sunFraction ≥ 0.5;
//  (c) Earth in view (comms) only when its whole disc clears the skyline; partly hidden = earthMarginal;
//  (d) irradiance at the actual Sun distance this hour.
function sample(d, ms) {
  for (const r of d.runs) {
    const i = (ms - r.start) / H;
    if (i >= 0 && i < r.sunEl.length) {
      const sd = sceneDist(ms);
      if (!sd) return null;
      const sunEl = r.sunEl[i], earthEl = r.earthEl[i], sunAz = r.sunAz[i], earthAz = r.earthAz[i];
      const sunMarginDeg = sunEl - horizonAt(d, sunAz);
      const earthMarginDeg = earthEl - horizonAt(d, earthAz);
      const sunRadiusDeg = angularRadiusDeg(SUN_RADIUS_KM, sd.sunDistKm);
      const earthRadiusDeg = angularRadiusDeg(EARTH_EQ_RADIUS_KM, sd.earthDistKm);
      const sunSkylineFraction = discFractionAbove(sunMarginDeg, sunRadiusDeg);
      const eclipseFraction = discCoveredFraction(separationDeg(sunEl, sunAz, earthEl, earthAz), sunRadiusDeg, earthRadiusDeg);
      const sunFraction = sunSkylineFraction * (1 - eclipseFraction);
      return {
        sunEl, sunAz, earthEl, earthAz,
        sunMarginDeg, earthMarginDeg,
        lit: sunFraction >= 0.5,
        comms: earthMarginDeg >= earthRadiusDeg,
        sunEdge: Math.abs(sunMarginDeg) <= EDGE_DEG,
        earthEdge: Math.abs(earthMarginDeg) <= EDGE_DEG,
        // v1.6 (D19)
        sunFraction, sunSkylineFraction, eclipseFraction,
        earthMarginal: Math.abs(earthMarginDeg) < earthRadiusDeg,
        sunRadiusDeg, earthRadiusDeg,
        sunDistKm: sd.sunDistKm, earthDistKm: sd.earthDistKm,
        irradianceWm2: IRRADIANCE_AT_MEAN_W_M2 * (MEAN_SUN_DISTANCE_KM / sd.sunDistKm) ** 2,
      };
    }
  }
  return null;
}
function need(d, siteId, a, b = a) {
  for (let t = a; t <= b; t += H) {
    if (!sample(d, t)) throw new RangeError(`OUT_OF_COVERAGE ${siteId} ${iso(a)}..${iso(b)} (missing ${iso(t)})`);
  }
}
function hoursToChange(d, ms, key) {
  const now = sample(d, ms)[key];
  for (let i = 1; i <= MAX_SCAN_H; i++) {
    const s = sample(d, ms + i * H);
    if (!s) return null;
    if (s[key] !== now) return i;
  }
  return null;
}

// ---- contract exports
// D21: every site is either a candidate (a possible future landing point) or a historic landing
// (a past mission, shown as a comparison). Derived from the data: a site with a landing date is historic.
export const SITE_CATEGORIES = Object.freeze({
  candidate: "Candidate site (possible future landing point)",
  historic: "Historic landing (a past mission, shown for comparison)",
});
const categoryOf = (s) => (s.landingDate ? "historic" : "candidate");
export function listSites() {
  return sites.map(({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note }) =>
    ({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note, category: categoryOf({ landingDate }) }));
}

export function getState(siteId, utcTime) {
  const d = data(siteId);
  const ms = floorH(toMs(utcTime));
  need(d, siteId, ms);
  const r = sample(d, ms);
  return {
    sunEl: r.sunEl, sunAz: r.sunAz, earthEl: r.earthEl, earthAz: r.earthAz,
    lit: r.lit, comms: r.comms,
    hoursToSunChange: hoursToChange(d, ms, "lit"),
    hoursToEarthChange: hoursToChange(d, ms, "comms"),
    terrain: legacyTerrain(d), // legacy field from PLAN's seam: "real" | "flat"
    sunMarginDeg: r.sunMarginDeg, earthMarginDeg: r.earthMarginDeg,
    sunEdge: r.sunEdge, earthEdge: r.earthEdge, edgeDeg: EDGE_DEG,
    horizonModel: model(d),
    sampleUtc: iso(ms), // v1.1: the hourly sample these values come from
    // v1.6 (D19)
    sunFraction: r.sunFraction, sunSkylineFraction: r.sunSkylineFraction, eclipseFraction: r.eclipseFraction,
    earthMarginal: r.earthMarginal, sunRadiusDeg: r.sunRadiusDeg, earthRadiusDeg: r.earthRadiusDeg,
    sunDistKm: r.sunDistKm, earthDistKm: r.earthDistKm, irradianceWm2: r.irradianceWm2,
  };
}

// Whole-stay counts (integers), shared by getSummary, getMetrics and scripts/build_daily.mjs so they agree exactly.
//   litMilliH = round(1000 × Σ sunFraction)   (fractional sunlight hours, D19)
//   flag counts use lit (sunFraction ≥ 0.5) and comms (Earth's whole disc clears the skyline).
function stayCounts(d, siteId, t0, n) {
  need(d, siteId, t0, t0 + (n - 1) * H);
  let sumF = 0, litH = 0, commsH = 0, bothH = 0, sunEdgeH = 0, earthEdgeH = 0, dark = 0, longestDarkH = 0;
  let gap = 0, longestGapH = 0, darkPeriods = 0, contactWindows = 0, pL = null, pC = null;
  let sunClr = 0, earthClr = 0, partialSunH = 0, eclipseH = 0, earthMarginalH = 0;
  for (let i = 0; i < n; i++) {
    const r = sample(d, t0 + i * H);
    sumF += r.sunFraction;
    if (r.lit) litH++; if (r.comms) commsH++; if (r.lit && r.comms) bothH++;
    if (r.sunEdge) sunEdgeH++; if (r.earthEdge) earthEdgeH++;
    dark = r.lit ? 0 : dark + 1; longestDarkH = Math.max(longestDarkH, dark);
    gap = r.comms ? 0 : gap + 1; longestGapH = Math.max(longestGapH, gap);
    if (!r.lit && pL !== false) darkPeriods++;
    if (r.comms && pC !== true) contactWindows++;
    pL = r.lit; pC = r.comms;
    if (r.lit) sunClr += Math.min(r.sunMarginDeg, CLEARANCE_FULL_DEG) / CLEARANCE_FULL_DEG;
    if (r.comms) earthClr += Math.min(r.earthMarginDeg, CLEARANCE_FULL_DEG) / CLEARANCE_FULL_DEG;
    if (r.sunFraction > 0 && r.sunFraction < 1) partialSunH++;
    if (r.eclipseFraction > 0 && r.sunSkylineFraction > 0) eclipseH++;
    if (r.earthMarginal) earthMarginalH++;
  }
  return { n, litMilliH: Math.round(1000 * sumF), litH, commsH, bothH, sunEdgeH, earthEdgeH, longestDarkH, darkPeriods, contactWindows, longestGapH,
    sunClrPm: litH ? Math.round((1000 * sunClr) / litH) : 0, earthClrPm: commsH ? Math.round((1000 * earthClr) / commsH) : 0,
    partialSunH, eclipseH, earthMarginalH };
}
// Turn stay counts into the public numbers (used by getSummary, getMetrics and getDaily).
function fromCounts(c) {
  const pct = (k) => (100 * k) / c.n;
  const out = {
    hours: c.n,
    pctLit: (100 * c.litMilliH) / 1000 / c.n, // sunlight share: mean visible fraction of the Sun's disc (D19)
    pctComms: pct(c.commsH), pctBoth: pct(c.bothH), longestDarkHours: c.longestDarkH,
    pctSunEdge: pct(c.sunEdgeH), pctEarthEdge: pct(c.earthEdgeH),
    darkPeriods: c.darkPeriods, contactWindows: c.contactWindows, longestContactGapHours: c.longestGapH,
    sunClearance: c.sunClrPm / 1000, earthClearance: c.earthClrPm / 1000, clearance: Math.round((c.sunClrPm + c.earthClrPm) / 2) / 1000,
    litHours: c.litH, partialSunHours: c.partialSunH, eclipseHours: c.eclipseH, earthMarginalHours: c.earthMarginalH, // v1.6
  };
  out.verdict = verdictOf(out);
  return out;
}
/** For scripts/build_daily.mjs only: integer counts for one stay. */
export function _stayCountsFor(siteId, startUtc, days = STAY_DAYS) {
  return stayCounts(data(siteId), siteId, floorH(toMs(startUtc)), Math.round(days * 24));
}

export function getSummary(siteId, startUtc, days) {
  const d = data(siteId);
  const n = Math.round(days * 24);
  if (!(n > 0)) throw new RangeError("days must be > 0");
  const m = fromCounts(stayCounts(d, siteId, floorH(toMs(startUtc)), n));
  return { pctLit: m.pctLit, pctComms: m.pctComms, pctBoth: m.pctBoth, longestDarkHours: m.longestDarkHours,
    pctSunEdge: m.pctSunEdge, pctEarthEdge: m.pctEarthEdge, verdict: m.verdict, verdictRule: RULE_TEXT,
    partialSunHours: m.partialSunHours, eclipseHours: m.eclipseHours, earthMarginalHours: m.earthMarginalHours };
}

// Works after any loadSite() or loadDaily() has resolved (both load the index).
export function getCoverage() {
  if (!indexData) throw new Error("NOT_LOADED coverage (await loadDaily() or loadSite() first)");
  return {
    mock: MOCK, stepHours: 1, timeScale: "UTC",
    rangeEnd: "inclusive (last hourly sample)",
    sites: sites.map((s) => ({ siteId: s.id, ranges: mergeRanges(indexData.sites[s.id] ?? []), terrain: indexData.horizons?.[s.id] ? "lola" : "flat" })),
    scene: mergeRanges(indexData.scene ?? []), // getSceneState coverage (v1.3)
  };
}
function mergeRanges(list) {
  const ranges = [];
  for (const c of list.slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start))) {
    const last = ranges.at(-1);
    if (last && Date.parse(c.start) === Date.parse(last[1]) + H) last[1] = c.end;
    else ranges.push([c.start, c.end]);
  }
  return ranges;
}

// Samples start at startUtc rounded down to the whole hour. No interpolation.
export function getTimeline(siteId, startUtc, days, stepHours = 1) {
  const d = data(siteId);
  if (!Number.isInteger(stepHours) || stepHours < 1) throw new RangeError("stepHours must be a whole number >= 1");
  const t0 = floorH(toMs(startUtc));
  const n = Math.floor((days * 24) / stepHours);
  if (!(n > 0)) throw new RangeError("days too small for stepHours");
  need(d, siteId, t0, t0 + (n - 1) * stepHours * H);
  const samples = [];
  for (let i = 0; i < n; i++) {
    const ms = t0 + i * stepHours * H;
    samples.push({ utc: iso(ms), ...sample(d, ms), horizonModel: model(d) });
  }
  return { siteId, stepHours, mock: MOCK, terrain: legacyTerrain(d), horizonModel: model(d), source: d.source, samples };
}

// Terrain horizon profile for the horizon view. Needs loadSite(siteId).
// Flat sites: 360 zeros, model "flat" — never a made-up profile.
export function getHorizon(siteId) {
  const d = data(siteId);
  if (!d.horizon) {
    return { siteId, model: "flat", resolutionDeg: 1, elevationDeg: new Array(360).fill(0),
      source: "flat horizon (no terrain data for this site)", verified: false };
  }
  const h = d.horizon;
  return {
    siteId, model: "lola", resolutionDeg: 1, elevationDeg: h.elevationDeg.slice(),
    source: h.source, verified: h.verified, verifiedMeaning: h.verifiedMeaning,
    azimuth: h.azimuth, blockDistKm: h.blockDistKm.slice(), observer: { ...h.observer },
    smoothSphereDipDeg: h.smoothSphereDipDeg, method: h.method,
  };
}

// ---- scene state (step 8): Sun and Earth seen from the Moon, in the Moon-fixed frame
// Data: data/ephem/_scene/*.json (scripts/fetch_scene.mjs), Horizons target 301 from 500@399,
// quantities 14 (sub-Earth point), 15 (sub-solar point), 19 (Sun range), 20 (Earth range), 24 (S-T-O).
let sceneP = null, sceneRuns = null;
export async function loadScene() {
  await (sceneP ??= (async () => {
    const idx = await loadIndex();
    const files = await Promise.all((idx.scene ?? []).map((c) => getJson("ephem/" + c.file)));
    sceneRuns = files.map((f) => ({ start: Date.parse(f.start), f })).sort((a, b) => a.start - b.start);
  })().catch((e) => { sceneP = null; throw e; }));
}

const lonPM = (lon) => Number((((lon + 540) % 360) - 180).toFixed(4)); // 0..360 E -> -180..180 E
function body(lonDeg, latDeg, distKm) {
  const la = latDeg * Math.PI / 180, lo = lonDeg * Math.PI / 180;
  const dir = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  return { lon: lonPM(lonDeg), lat: latDeg, distKm, dir, xyz: dir.map((c) => c * distKm) };
}

// Moon-fixed frame (Horizons MOON_ME, east-positive): +X = 0°N 0°E (mean Earth direction),
// +Y = 0°N 90°E, +Z = north pole; right-handed; km, from the Moon's centre. The Moon does not
// rotate in this frame: the Sun and Earth move. Hourly samples; a time is read at the start of its hour.
export function getSceneState(utcTime) {
  if (!sceneRuns) throw new Error("NOT_LOADED scene (await loadScene() first)");
  const ms = floorH(toMs(utcTime));
  for (const { start, f } of sceneRuns) {
    const i = (ms - start) / H;
    if (i >= 0 && i < f.count) {
      return {
        utc: iso(ms), sampleUtc: iso(ms),
        frame: "MOON_ME", frameNote: "Moon-fixed, east-positive; +X = 0°N 0°E, +Y = 0°N 90°E, +Z = north pole; origin = Moon centre",
        unit: "km",
        sun: body(f.sunLon[i], f.sunLat[i], f.sunDistKm[i]),     // sub-solar point + Sun distance
        earth: body(f.earthLon[i], f.earthLat[i], f.earthDistKm[i]), // sub-Earth point + Earth distance
        sunEarthAngleDeg: f.stoDeg[i], // Sun-Moon-Earth angle at the Moon's centre (Horizons S-T-O): ~0 at full moon, ~180 at new moon
        source: f.source, mock: MOCK,
      };
    }
  }
  throw new RangeError(`OUT_OF_COVERAGE scene ${iso(ms)}`);
}

// ---- D16: power and comms metrics (terrain-aware: lit/comms use the site's horizon) ----------
// Runs that touch the start or end of the stay are counted; their true length may be longer.
export function getMetrics(siteId, startUtc, days = STAY_DAYS) {
  const d = data(siteId);
  const t0 = floorH(toMs(startUtc));
  const n = Math.round(days * 24);
  if (!(n > 0)) throw new RangeError("days must be > 0");
  const m = fromCounts(stayCounts(d, siteId, t0, n));
  return {
    siteId, startUtc: iso(t0), horizonModel: model(d), ...m,
    note: "Hourly data. Sunlight share = mean visible fraction of the Sun's disc (terrain and Earth's shadow). A dark hour has less than half the disc visible. Dark periods / contact windows that touch the start or end of the stay are counted, and may continue beyond it.",
    commsNote: "Earth in view = Earth's whole disc clears the skyline; partly hidden hours are reported as marginal. This is line-of-sight geometry only: a data rate needs antenna size, transmitter power, frequency and the receiving station network, which are not modelled.",
  };
}

// Mean solar irradiance at the Moon: NASA NSSDCA Moon Fact Sheet, "Solar irradiance (W/m2) 1361.0"
// (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html, last updated 11 January 2024).
export const SOLAR_IRRADIANCE_W_M2 = IRRADIANCE_AT_MEAN_W_M2; // at the mean Sun distance; scaled hourly by distance (D19)
export const SOLAR_IRRADIANCE_SOURCE = DISC_SOURCES.irradiance + ", https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html";
export { DISC_SOURCES };

/**
 * D16 power calculator — an ESTIMATE. opts: { siteId, startUtc, days = 7, areaM2, efficiency (0..1),
 * panel: "tracking" | "fixed-flat", loadW }. Hourly: power = irradiance × area × efficiency × f, where
 * f = 1 for a sun-tracking panel and f = sin(Sun elevation) for a fixed flat (horizontal) panel, and
 * f = 0 whenever the Sun is hidden (terrain-aware) or, for a flat panel, at or below level.
 */
export function computePower(opts) {
  const { siteId, startUtc, days = STAY_DAYS, areaM2, efficiency, panel, loadW } = opts;
  if (!(areaM2 > 0)) throw new RangeError("areaM2 must be > 0");
  if (!(efficiency > 0 && efficiency <= 1)) throw new RangeError("efficiency must be in (0, 1]");
  if (panel !== "tracking" && panel !== "fixed-flat") throw new RangeError('panel must be "tracking" or "fixed-flat"');
  if (!(loadW >= 0)) throw new RangeError("loadW must be >= 0");
  const d = data(siteId);
  const t0 = floorH(toMs(startUtc));
  const n = Math.round(days * 24);
  need(d, siteId, t0, t0 + (n - 1) * H);
  const perSunW = SOLAR_IRRADIANCE_W_M2 * areaM2 * efficiency; // W facing the Sun at the mean distance
  let energyWh = 0, run = 0, longestNoPower = 0, poweredHours = 0, irrSum = 0;
  const hourlyW = [];
  for (let i = 0; i < n; i++) {
    const r = sample(d, t0 + i * H);
    // D19: visible fraction of the Sun's disc (terrain + Earth's shadow) and the actual Sun distance this hour
    const geom = panel === "tracking" ? 1 : Math.max(0, Math.sin(r.sunEl * Math.PI / 180));
    const w = r.irradianceWm2 * areaM2 * efficiency * r.sunFraction * geom;
    irrSum += r.irradianceWm2;
    hourlyW.push(w);
    energyWh += w; // 1-hour steps
    if (w > 0) { poweredHours++; run = 0; } else { run++; longestNoPower = Math.max(longestNoPower, run); }
  }
  const averageW = energyWh / n, loadEnergyWh = loadW * n;
  return {
    siteId, startUtc: iso(t0), hours: n, panel, areaM2, efficiency, loadW, horizonModel: model(d),
    irradianceWm2: SOLAR_IRRADIANCE_W_M2, meanIrradianceWm2: irrSum / n, peakW: perSunW,
    averageW, energyWh, loadEnergyWh, balanceWh: energyWh - loadEnergyWh,
    poweredHours, longestNoPowerHours: longestNoPower,
    batteryWh: loadW * longestNoPower, // energy to run the load through the longest stretch with no panel power
    hourlyW, estimate: true,
    assumptions: [
      `Solar irradiance ${SOLAR_IRRADIANCE_W_M2} W/m² at the mean Sun distance of 149.598 million km (${DISC_SOURCES.irradiance}), scaled every hour by (149.598 million km ÷ actual Sun distance)²; this stay averages ${(irrSum / n).toFixed(1)} W/m².`,
      panel === "tracking" ? "Sun-tracking panel: always faces the Sun when the Sun is visible." : "Fixed flat panel lying horizontal: output scales with sin(Sun elevation); zero when the Sun is at or below level.",
      "The Sun is a disc (radius from NASA's 695,700 km): power scales with the share of the disc above the terrain skyline and not covered by Earth (lunar eclipses). Sunlight scattered by Earth's atmosphere during eclipses is not modelled.",
      "Terrain horizon for one point; hourly steps (each hour's value held for the hour).",
      "Panel efficiency is the overall efficiency you enter; no losses for dust, temperature, ageing, wiring or power conversion.",
      "Battery = load × longest stretch with no panel power; no allowance for battery efficiency, depth of discharge or heaters.",
      "Constant load; no shadowing by the lander itself.",
    ],
  };
}

// ---- D17: best-site ranking for a landing date (PROTOTYPE), from the daily summary ----------
// filter (D21): "all" | "candidate" | "historic". Historic landings are comparisons, not proposals.
export function getRanking(landingDate, weights = SCORE_DEFAULT_WEIGHTS, filter = "all") {
  if (!["all", "candidate", "historic"].includes(filter)) throw new RangeError('filter must be "all", "candidate" or "historic"');
  // Window of rows within ±SLIP_DAYS for the slip-tolerance term (null rows = outside the data, skipped).
  const from = new Date(Date.parse(landingDate + "T00:00:00Z") - SLIP_DAYS * D).toISOString().slice(0, 10);
  const daily = getDaily(from, 2 * SLIP_DAYS + 1);
  const out = sites.filter((s) => filter === "all" || categoryOf(s) === filter).map((s) => {
    const win = daily.sites[s.id], r = win[SLIP_DAYS], category = categoryOf(s);
    if (!r) return { siteId: s.id, name: s.name, category, score: null, available: false };
    const sc = scoreOf(r, weights, win);
    return { siteId: s.id, name: s.name, category, score: sc.score, components: sc.components, metrics: r, available: true };
  });
  out.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return { landingDate, weights: { ...SCORE_DEFAULT_WEIGHTS, ...weights }, isDefault: JSON.stringify({ ...SCORE_DEFAULT_WEIGHTS, ...weights }) === JSON.stringify(SCORE_DEFAULT_WEIGHTS),
    formula: SCORE_FORMULA_TEXT, prototype: true, filter, ranking: out };
}

// One site's score from its hourly data (same result as getRanking for that site). Needs loadSite(siteId).
export function getScore(siteId, landingDate, weights = SCORE_DEFAULT_WEIGHTS) {
  const t = Date.parse(landingDate + "T00:00:00Z");
  const m = getMetrics(siteId, t);
  const win = [];
  for (let k = -SLIP_DAYS; k <= SLIP_DAYS; k++) { try { win.push(getMetrics(siteId, t + k * D)); } catch (e) { if (!(e instanceof RangeError)) throw e; } }
  return { ...scoreOf(m, weights, win), metrics: m, label: SCORE.SCORE_LABEL, prototype: true };
}

// ---- daily summary (data/daily.json, built by scripts/build_daily.mjs)
let dailyP = null, dailyData = null;
export async function loadDaily() {
  await (dailyP ??= Promise.all([getJson("daily.json"), loadIndex()])
    .then(([d]) => { dailyData = d; })
    .catch((e) => { dailyP = null; throw e; }));
}

// One row per site per landing date. Every field in a row describes a STAY_DAYS stay
// starting at 00:00Z on that date (row === getSummary(site, date, STAY_DAYS) + date).
// A row is null when that stay is outside the site's coverage.
export function getDaily(startDate, days) {
  if (!dailyData) throw new Error("NOT_LOADED daily (await loadDaily() first)");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new TypeError("startDate must be YYYY-MM-DD");
  const d0 = Date.parse(startDate + "T00:00:00Z");
  if (!Number.isFinite(d0) || !(days >= 1)) throw new RangeError("bad startDate/days");
  const N = dailyData.hoursPerStay;
  const pct = (k) => (100 * k) / N;
  const out = { apiVersion: API_VERSION, mock: MOCK, ...VERDICT_RULE, verdictRule: RULE_TEXT, sites: {} };
  for (const s of sites) {
    const segs = dailyData.sites[s.id] ?? [];
    out.sites[s.id] = [];
    for (let k = 0; k < days; k++) {
      const t = d0 + k * D;
      const date = iso(t).slice(0, 10);
      let row = null;
      for (const g of segs) {
        const i = Math.round((t - Date.parse(g.firstDate + "T00:00:00Z")) / D);
        if (i >= 0 && i < g.rows.length) {
          const c = Object.fromEntries(dailyData.columns.map((k, j) => [k, g.rows[i][j]]));
          c.n = N;
          row = { date, ...fromCounts(c) };
          break;
        }
      }
      out.sites[s.id].push(row);
    }
  }
  return out;
}
