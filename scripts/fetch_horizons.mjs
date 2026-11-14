// Step 2 download script (Lane A). Fetches hourly apparent Sun and Earth
// azimuth/elevation for a lunar-surface observer from JPL Horizons.
//
// Output, one small file per chunk:
//   data/ephem/<siteId>/<YYYY>.json      calendar years 2026-2029, 00:00 Jan 1 .. 23:00 Dec 31 UTC
//   data/ephem/<siteId>/landing.json     landing day 00:00Z -15 d .. +15 d (inclusive), pre-2026 landings only
//   data/ephem/index.json                list of every chunk and its UTC range
//
// Usage:  node scripts/fetch_horizons.mjs [--force] [siteId ...]
//   Existing chunk files are skipped unless --force, so a failed run can be resumed.
//
// Horizons settings (confirmed in the docs, 2026-11-14; details in data/README.md):
//   API endpoint https://ssd.jpl.nasa.gov/api/horizons.api
//   EPHEM_TYPE=OBSERVER, CENTER='coord@301', COORD_TYPE=GEODETIC, SITE_COORD='E-lon,lat,alt_km'
//   COMMAND '10' = Sun, '399' = Earth; QUANTITIES='4' (airless apparent AZ-EL, degrees, az clockwise from N)
//   CSV_FORMAT=YES, data between $$SOE and $$EOE; time column is UT (= UTC after 1962).
//   The docs state no output-line limit for observer tables; we still keep each request
//   to one site x one target x one calendar year (<= 8784 rows) and pause between requests.

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";

const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "data", "ephem");
const ALT_KM = 0; // UNVERIFIED site heights: all sites at 0 km above the 1737.4 km reference sphere.
const YEARS = [2026, 2027, 2028, 2029];
const LANDING_HALF_DAYS = 15;
const DECIMALS = 3; // stored rounding: max error 0.0005 deg, far below the 0.1 deg acceptance tolerance
const PAUSE_MS = 1500;
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const hz = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " "); // "YYYY-MM-DD HH:MM"
const round = (x) => Number(x.toFixed(DECIMALS));

function toIso(t) {
  const m = t.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Unparsed time: ${t}`);
  return `${m[1]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${m[3]}T${m[4]}:${m[5]}:00Z`;
}

async function query(site, target, startMs, stopMs) {
  const params = {
    format: "json", COMMAND: `'${target}'`, OBJ_DATA: "NO", MAKE_EPHEM: "YES",
    EPHEM_TYPE: "OBSERVER", CENTER: "'coord@301'", COORD_TYPE: "GEODETIC",
    SITE_COORD: `'${site.lon},${site.lat},${ALT_KM}'`,
    START_TIME: `'${hz(startMs)}'`, STOP_TIME: `'${hz(stopMs)}'`, STEP_SIZE: "'1 h'",
    QUANTITIES: "'4'", CSV_FORMAT: "YES",
  };
  let body;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${API}?${new URLSearchParams(params)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.json();
      break;
    } catch (e) {
      if (attempt >= 3) throw new Error(`${site.id}/${target}: ${e.message}`);
      await pause(5000 * attempt);
    }
  }
  if (body.error) throw new Error(`Horizons error for ${site.id}/${target}: ${body.error}`);
  const text = body.result;
  const need = ["{East-longitude positive}", "Atmos refraction: NO (AIRLESS)", "Date__(UT)__HR:MN", "Azi_(a-app), Elev_(a-app)"];
  for (const n of need) if (!text.includes(n)) throw new Error(`Header check failed (${n}) for ${site.id}/${target}`);
  if (!/Center pole\/equ\s*:\s*MEAN_ME \(high precision\)/.test(text)) throw new Error(`Not the high-precision MEAN_ME frame for ${site.id}/${target}`);

  const block = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error(`No $$SOE block for ${site.id}/${target}`);
  const rows = block.trim().split("\n").map((line) => {
    const c = line.split(",");
    return { utc: toIso(c[0]), az: Number(c[3]), el: Number(c[4]) };
  });
  rows.forEach((r, i) => {
    if (!Number.isFinite(r.az) || !Number.isFinite(r.el)) throw new Error(`Bad number in ${site.id}/${target} at ${r.utc}`);
    if (Date.parse(r.utc) !== startMs + i * 3600e3) throw new Error(`Gap/step error in ${site.id}/${target} at ${r.utc}`);
  });
  if (Date.parse(rows.at(-1).utc) !== stopMs) throw new Error(`Short table for ${site.id}/${target}`);
  const header = text.split("\n")
    .filter((l) => /^(Center geodetic|Center pole\/equ|Center radii|Atmos refraction|EOP file|EOP coverage)/.test(l))
    .map((l) => l.trim());
  return { rows, header, version: body.signature?.version };
}

function chunksFor(site) {
  const out = YEARS.map((y) => ({ label: String(y), start: Date.UTC(y, 0, 1), stop: Date.UTC(y + 1, 0, 1) - 3600e3 }));
  if (site.landingDate && Date.parse(site.landingDate) < Date.UTC(YEARS[0], 0, 1)) {
    const d = Math.floor(Date.parse(site.landingDate) / 864e5) * 864e5;
    out.unshift({ label: "landing", start: d - LANDING_HALF_DAYS * 864e5, stop: d + LANDING_HALF_DAYS * 864e5 });
  }
  return out;
}

const todo = sites.filter((s) => s.coordsVerified && s.lat != null && s.lon != null && (only.length === 0 || only.includes(s.id)));
for (const site of todo) {
  mkdirSync(join(OUT_DIR, site.id), { recursive: true });
  for (const ch of chunksFor(site)) {
    const file = join(OUT_DIR, site.id, `${ch.label}.json`);
    if (existsSync(file) && !force) { console.log(`skip ${site.id}/${ch.label}`); continue; }
    const sun = await query(site, "10", ch.start, ch.stop);
    await pause(PAUSE_MS);
    const earth = await query(site, "399", ch.start, ch.stop);
    await pause(PAUSE_MS);
    if (sun.rows.length !== earth.rows.length) throw new Error(`Sun/Earth length mismatch ${site.id}/${ch.label}`);
    const out = {
      siteId: site.id, lat: site.lat, lon: site.lon, altKm: ALT_KM, altVerified: false,
      start: sun.rows[0].utc, end: sun.rows.at(-1).utc, stepHours: 1, count: sun.rows.length,
      decimals: DECIMALS, timeScale: "UTC",
      source: "JPL Horizons API, observer coord@301, quantity 4 (airless apparent AZ-EL)",
      apiVersion: sun.version, fetchedUtc: new Date().toISOString(),
      horizonsHeader: sun.header,
      sunAz: sun.rows.map((r) => round(r.az)), sunEl: sun.rows.map((r) => round(r.el)),
      earthAz: earth.rows.map((r) => round(r.az)), earthEl: earth.rows.map((r) => round(r.el)),
    };
    writeFileSync(file, JSON.stringify(out));
    console.log(`${site.id}/${ch.label}: ${out.count} rows ${out.start} .. ${out.end}`);
  }
}

// Rebuild the index from whatever chunk files exist.
const index = { stepHours: 1, timeScale: "UTC", decimals: DECIMALS, sites: {} };
for (const id of readdirSync(OUT_DIR).filter((d) => !d.includes("."))) {
  index.sites[id] = readdirSync(join(OUT_DIR, id)).filter((f) => f.endsWith(".json")).sort().map((f) => {
    const d = JSON.parse(readFileSync(join(OUT_DIR, id, f), "utf8"));
    return { file: `${id}/${f}`, start: d.start, end: d.end, count: d.count };
  });
}
writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 1));
console.log("index written");
