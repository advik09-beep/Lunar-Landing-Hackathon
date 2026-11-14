// visibility.js — data contract v1 (approved 2026-11-14, PLAN D4 + D8), REAL DATA build.
// Values come from JPL Horizons files in /data (see data/README.md). No astronomy here:
// this module only reads samples and counts.
//
// Conventions (all functions):
//   - Times in: ISO 8601 UTC string with Z, or ms since epoch. Dates in getDaily: "YYYY-MM-DD" (UTC day).
//   - Data are hourly samples on the hour. A time is read at the start of its hour
//     (12:59 -> the 12:00 sample). No interpolation; derived change times are accurate to the hour.
//   - Angles out: degrees. Azimuth clockwise from north (N=0, E=90). Horizon: flat until step 7.
//   - Outside coverage: throws RangeError("OUT_OF_COVERAGE ...") — no extrapolation.
//   - No next change inside coverage (or within 60 days): null (never 0).
//   - Async: loadSite(), loadDaily(). Everything else is synchronous and throws
//     Error("NOT_LOADED ...") if called before the matching load has resolved.
import sites from "../data/sites.js";
import { VERDICT_RULE, RULE_TEXT, verdictOf } from "./verdict.js";
export { VERDICT_RULE };

export const MOCK = false; // real Horizons data (step 5)
export const API_VERSION = "1.1.0"; // 1.1: setDataBase (PLAN D8), sampleUtc on getState
// READY = callable now with the documented shape.
export const READY = {
  listSites: true, getState: true, getSummary: true,
  loadSite: true, getCoverage: true, getTimeline: true,
  loadDaily: true, getDaily: true, setDataBase: true,
  getSceneState: false, getHorizon: false,
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
  indexP = null; dailyP = null; dailyData = null; indexData = null;
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
const siteData = new Map(); // siteId -> { runs: [{ start, sunAz, sunEl, earthAz, earthEl }], source }

export async function loadSite(siteId) {
  site(siteId);
  if (siteData.has(siteId)) return;
  if (!siteP.has(siteId)) {
    const p = (async () => {
      const idx = await loadIndex();
      const chunks = (idx.sites[siteId] ?? []).slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      const files = await Promise.all(chunks.map((c) => getJson("ephem/" + c.file)));
      const runs = [];
      for (const f of files) {
        const start = Date.parse(f.start);
        const last = runs.at(-1);
        if (last && start === last.start + last.sunEl.length * H) {
          for (const k of ["sunAz", "sunEl", "earthAz", "earthEl"]) last[k] = last[k].concat(f[k]);
        } else runs.push({ start, sunAz: f.sunAz, sunEl: f.sunEl, earthAz: f.earthAz, earthEl: f.earthEl });
      }
      siteData.set(siteId, { runs, source: files[0]?.source ?? "JPL Horizons" });
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

// Sample at an on-the-hour time, or null if not covered.
function sample(d, ms) {
  for (const r of d.runs) {
    const i = (ms - r.start) / H;
    if (i >= 0 && i < r.sunEl.length) {
      const sunEl = r.sunEl[i], earthEl = r.earthEl[i];
      const sunMarginDeg = sunEl - 0;   // flat horizon: horizon elevation 0 at every azimuth
      const earthMarginDeg = earthEl - 0;
      return {
        sunEl, sunAz: r.sunAz[i], earthEl, earthAz: r.earthAz[i],
        sunMarginDeg, earthMarginDeg,
        lit: sunMarginDeg > 0, comms: earthMarginDeg > 0,
        sunEdge: Math.abs(sunMarginDeg) <= EDGE_DEG,
        earthEdge: Math.abs(earthMarginDeg) <= EDGE_DEG,
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
export function listSites() {
  return sites.map(({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note }) =>
    ({ id, name, lat, lon, kind, landingDate, source, coordsVerified, note }));
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
    terrain: "flat", // legacy field; same meaning as horizonModel
    sunMarginDeg: r.sunMarginDeg, earthMarginDeg: r.earthMarginDeg,
    sunEdge: r.sunEdge, earthEdge: r.earthEdge, edgeDeg: EDGE_DEG,
    horizonModel: "flat",
    sampleUtc: iso(ms), // v1.1: the hourly sample these values come from
  };
}

export function getSummary(siteId, startUtc, days) {
  const d = data(siteId);
  const t0 = floorH(toMs(startUtc));
  const n = Math.round(days * 24);
  if (!(n > 0)) throw new RangeError("days must be > 0");
  need(d, siteId, t0, t0 + (n - 1) * H);
  let lit = 0, comms = 0, both = 0, sunEdge = 0, earthEdge = 0, dark = 0, longest = 0;
  for (let i = 0; i < n; i++) {
    const r = sample(d, t0 + i * H);
    if (r.lit) lit++; if (r.comms) comms++; if (r.lit && r.comms) both++;
    if (r.sunEdge) sunEdge++; if (r.earthEdge) earthEdge++;
    dark = r.lit ? 0 : dark + 1; longest = Math.max(longest, dark);
  }
  const pct = (k) => (100 * k) / n;
  const out = {
    pctLit: pct(lit), pctComms: pct(comms), pctBoth: pct(both), longestDarkHours: longest,
    pctSunEdge: pct(sunEdge), pctEarthEdge: pct(earthEdge),
  };
  out.verdict = verdictOf(out);
  out.verdictRule = RULE_TEXT;
  return out;
}

// Works after any loadSite() or loadDaily() has resolved (both load the index).
export function getCoverage() {
  if (!indexData) throw new Error("NOT_LOADED coverage (await loadDaily() or loadSite() first)");
  return {
    mock: MOCK, stepHours: 1, timeScale: "UTC",
    rangeEnd: "inclusive (last hourly sample)",
    sites: sites.map((s) => {
      const chunks = (indexData.sites[s.id] ?? []).slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      const ranges = [];
      for (const c of chunks) {
        const last = ranges.at(-1);
        if (last && Date.parse(c.start) === Date.parse(last[1]) + H) last[1] = c.end;
        else ranges.push([c.start, c.end]);
      }
      return { siteId: s.id, ranges, terrain: "flat" };
    }),
  };
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
    samples.push({ utc: iso(ms), ...sample(d, ms), horizonModel: "flat" });
  }
  return { siteId, stepHours, mock: MOCK, terrain: "flat", horizonModel: "flat", source: d.source, samples };
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
          const [litH, commsH, bothH, sunEdgeH, earthEdgeH, longestDarkH, verdict] = g.rows[i];
          row = {
            date, pctLit: pct(litH), pctComms: pct(commsH), pctBoth: pct(bothH), longestDarkHours: longestDarkH,
            pctSunEdge: pct(sunEdgeH), pctEarthEdge: pct(earthEdgeH), verdict,
          };
          break;
        }
      }
      out.sites[s.id].push(row);
    }
  }
  return out;
}
