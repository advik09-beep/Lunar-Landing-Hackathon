// visibility.js — data contract v1 (approved 2026-11-14, PLAN D4), MOCK build.
// Every number below is made up but plausible, so Lane B can build steps 3, 4
// and 6. The real version (step 5) reads /data files from JPL Horizons, keeps
// these exact shapes, and sets MOCK = false.
//
// Conventions (all functions):
//   - Times in: ISO 8601 UTC string with Z, or ms since epoch. Dates in getDaily: "YYYY-MM-DD" (UTC day).
//   - Angles out: degrees. Azimuth clockwise from north (N=0, E=90).
//   - Outside coverage: throws RangeError("OUT_OF_COVERAGE ...") — no extrapolation.
//   - No next change inside coverage: null (never 0).
//   - Everything is synchronous except loadSite() and loadDaily().
import sites from "../data/sites.js";

export const MOCK = true; // real version sets false
export const API_VERSION = "1.0.0";
// READY = callable now with the documented shape. MOCK says whether the values are real.
export const READY = {
  listSites: true, getState: true, getSummary: true,
  loadSite: true, getCoverage: true, getTimeline: true,
  loadDaily: true, getDaily: true,
  getSceneState: false, getHorizon: false,
};

// Verdict numbers, PLAN D5 (signed by both humans 2026-11-14).
export const VERDICT_RULE = { STAY_DAYS: 7, CLEAR_PCT: 90, OUT_PCT: 10, EDGE_DEG: 2 };
const { STAY_DAYS, CLEAR_PCT, OUT_PCT, EDGE_DEG } = VERDICT_RULE;
const RULE_TEXT =
  `on the edge: Sun or Earth within ${EDGE_DEG}° of the horizon more than 50% of the time; ` +
  `otherwise clear: Sun and Earth both up at least ${CLEAR_PCT}% of the time; ` +
  `out: both up ${OUT_PCT}% of the time or less; partial: anything in between.`;

const SOURCE = MOCK
  ? "MOCK — made-up values, not JPL Horizons"
  : "JPL Horizons API, observer coord@301, quantity 4 (airless apparent AZ-EL)";
const H = 3.6e6;
const PERIOD_H = 708.7; // ~29.53-day lunar day, fake sun cycle
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const toMs = (t) => {
  const ms = typeof t === "number" ? t : Date.parse(t);
  if (!Number.isFinite(ms)) throw new TypeError("bad time " + t);
  return ms;
};
const iso = (ms) => new Date(ms).toISOString().replace(".000Z", "Z");
const site = (id) => {
  const s = sites.find((x) => x.id === id);
  if (!s) throw new Error("unknown site " + id);
  return s;
};

// ---- coverage (mock mirrors the planned real coverage: 2026-2029 + 30 days around each past landing)
const MAIN = [Date.parse("2026-01-01T00:00:00Z"), Date.parse("2030-01-01T00:00:00Z")];
function rangesFor(s) {
  const r = [MAIN];
  if (s.landingDate) {
    const t = Date.parse(s.landingDate);
    if (t < MAIN[0]) {
      const d = Math.floor(t / 864e5) * 864e5; // landing day 00:00Z
      r.unshift([d - 15 * 864e5, d + 15 * 864e5]);
    }
  }
  return r;
}
const covered = (s, a, b = a) => rangesFor(s).some(([lo, hi]) => a >= lo && b <= hi);
function needCoverage(s, a, b = a) {
  if (!covered(s, a, b)) throw new RangeError(`OUT_OF_COVERAGE ${s.id} ${iso(a)}..${iso(b)}`);
}

// ---- mock geometry (horizon is flat everywhere until step 7)
function raw(s, ms) {
  const h = ms / H;
  const sunPhase = (h / PERIOD_H) * 2 * Math.PI + (s.lon * Math.PI) / 180;
  const sunEl = 40 * Math.sin(sunPhase) * Math.cos((s.lat * Math.PI) / 180);
  const sunAz = ((((h / PERIOD_H) * 360 + 90) % 360) + 360) % 360;
  const earthEl = Math.abs(s.lat) > 80 ? 2 + 3 * Math.sin(h / 50) : clamp(80 - Math.abs(s.lat), 0, 85);
  const earthAz = ((s.lon > 0 ? 270 : 90) + 5 * Math.sin(h / 300) + 360) % 360;
  const horizonEl = () => 0; // flat: horizon elevation is 0 at every azimuth
  const sunMarginDeg = sunEl - horizonEl(sunAz);
  const earthMarginDeg = earthEl - horizonEl(earthAz);
  return {
    sunEl, sunAz, earthEl, earthAz,
    sunMarginDeg, earthMarginDeg,
    lit: sunMarginDeg > 0, comms: earthMarginDeg > 0,
    sunEdge: Math.abs(sunMarginDeg) <= EDGE_DEG,
    earthEdge: Math.abs(earthMarginDeg) <= EDGE_DEG,
  };
}

// Hours (whole, hourly resolution) until flag changes; null if no change inside coverage within 60 days.
function hoursToChange(s, ms, key) {
  const now = raw(s, ms)[key];
  for (let i = 1; i <= 60 * 24; i++) {
    const t = ms + i * H;
    if (!covered(s, t)) return null;
    if (raw(s, t)[key] !== now) return i;
  }
  return null;
}

// ---- existing exports (shapes unchanged; new fields only added)
export function listSites() {
  return sites.map(({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note }) =>
    ({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note }));
}

export function getState(siteId, utcTime) {
  const s = site(siteId);
  const ms = toMs(utcTime);
  needCoverage(s, ms);
  const r = raw(s, ms);
  return {
    sunEl: r.sunEl, sunAz: r.sunAz, earthEl: r.earthEl, earthAz: r.earthAz,
    lit: r.lit, comms: r.comms,
    hoursToSunChange: hoursToChange(s, ms, "lit"),
    hoursToEarthChange: hoursToChange(s, ms, "comms"),
    terrain: "flat", // legacy field; same meaning as horizonModel
    // v1 additions
    sunMarginDeg: r.sunMarginDeg, earthMarginDeg: r.earthMarginDeg,
    sunEdge: r.sunEdge, earthEdge: r.earthEdge, edgeDeg: EDGE_DEG,
    horizonModel: "flat",
  };
}

export function getSummary(siteId, startUtc, days) {
  const s = site(siteId);
  const t0 = toMs(startUtc);
  const n = Math.round(days * 24);
  if (!(n > 0)) throw new RangeError("days must be > 0");
  needCoverage(s, t0, t0 + (n - 1) * H);
  let lit = 0, comms = 0, both = 0, sunEdge = 0, earthEdge = 0, dark = 0, longest = 0;
  for (let i = 0; i < n; i++) {
    const r = raw(s, t0 + i * H);
    if (r.lit) lit++; if (r.comms) comms++; if (r.lit && r.comms) both++;
    if (r.sunEdge) sunEdge++; if (r.earthEdge) earthEdge++;
    dark = r.lit ? 0 : dark + 1; longest = Math.max(longest, dark);
  }
  const pct = (k) => (100 * k) / n;
  const out = {
    pctLit: pct(lit), pctComms: pct(comms), pctBoth: pct(both), longestDarkHours: longest,
    // v1 additions
    pctSunEdge: pct(sunEdge), pctEarthEdge: pct(earthEdge),
  };
  out.verdict = verdictOf(out);
  out.verdictRule = RULE_TEXT;
  return out;
}

function verdictOf({ pctBoth, pctSunEdge, pctEarthEdge }) {
  if (pctSunEdge > 50 || pctEarthEdge > 50) return "edge";
  if (pctBoth >= CLEAR_PCT) return "clear";
  if (pctBoth <= OUT_PCT) return "out";
  return "partial";
}

// ---- v1 additions
// Real version fetches /data/ephem/<siteId>.json. Call it once per site before the
// sync calls for that site. MOCK: resolves immediately. (Real version: sync calls
// before loading throw Error("NOT_LOADED") — build the await in now.)
const loadedSites = new Set();
export async function loadSite(siteId) {
  site(siteId);
  loadedSites.add(siteId);
}

export function getCoverage() {
  return {
    mock: MOCK, stepHours: 1, timeScale: "UTC",
    sites: sites.map((s) => ({
      siteId: s.id,
      ranges: rangesFor(s).map(([a, b]) => [iso(a), iso(b)]),
      terrain: "flat",
    })),
  };
}

// Samples start at startUtc rounded down to the whole hour. No interpolation.
export function getTimeline(siteId, startUtc, days, stepHours = 1) {
  const s = site(siteId);
  if (!loadedSites.has(siteId)) throw new Error("NOT_LOADED " + siteId);
  if (!Number.isInteger(stepHours) || stepHours < 1) throw new RangeError("stepHours must be a whole number >= 1");
  const t0 = Math.floor(toMs(startUtc) / H) * H;
  const n = Math.floor((days * 24) / stepHours);
  if (!(n > 0)) throw new RangeError("days too small for stepHours");
  needCoverage(s, t0, t0 + (n - 1) * stepHours * H);
  const samples = [];
  for (let i = 0; i < n; i++) {
    const ms = t0 + i * stepHours * H;
    samples.push({ utc: iso(ms), ...raw(s, ms), horizonModel: "flat" });
  }
  return { siteId, stepHours, mock: MOCK, terrain: "flat", horizonModel: "flat", source: SOURCE, samples };
}

// Real version fetches the small /data/daily.json. MOCK: resolves immediately.
let dailyLoaded = false;
export async function loadDaily() { dailyLoaded = true; }

// One row per site per landing date. Every field in a row describes a STAY_DAYS stay
// starting at 00:00Z on that date (row === getSummary(site, date, STAY_DAYS) + date).
// A row is null when that stay is outside the site's coverage.
export function getDaily(startDate, days) {
  if (!dailyLoaded) throw new Error("NOT_LOADED daily");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new TypeError("startDate must be YYYY-MM-DD");
  const d0 = Date.parse(startDate + "T00:00:00Z");
  if (!Number.isFinite(d0) || !(days >= 1)) throw new RangeError("bad startDate/days");
  const out = { apiVersion: API_VERSION, mock: MOCK, ...VERDICT_RULE, verdictRule: RULE_TEXT, sites: {} };
  for (const s of sites) {
    out.sites[s.id] = [];
    for (let i = 0; i < days; i++) {
      const t = d0 + i * 864e5;
      const date = iso(t).slice(0, 10);
      if (!covered(s, t, t + (STAY_DAYS * 24 - 1) * H)) { out.sites[s.id].push(null); continue; }
      const { verdictRule, ...row } = getSummary(s.id, t, STAY_DAYS); // rule text is given once, at top level
      out.sites[s.id].push({ date, ...row });
    }
  }
  return out;
}
