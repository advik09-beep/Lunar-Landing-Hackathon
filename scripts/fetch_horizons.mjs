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
import { query, pause, ALT_KM } from "./horizons_api.mjs";
import { buildIndex } from "./build_index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "data", "ephem");
const YEARS = [2026, 2027, 2028, 2029];
const LANDING_HALF_DAYS = 15;
const DECIMALS = 3; // stored rounding: max error 0.0005 deg, far below the 0.1 deg acceptance tolerance
const PAUSE_MS = 1500;

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const round = (x) => Number(x.toFixed(DECIMALS));

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

buildIndex();
console.log("index written");
