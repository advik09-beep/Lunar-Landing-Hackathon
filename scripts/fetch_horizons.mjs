// M1 download script (Lane A). Fetches hourly apparent Sun and Earth
// azimuth/elevation for a lunar-surface observer from JPL Horizons and writes
// one file per site to data/ephem/<siteId>.json.
//
// Usage:  node scripts/fetch_horizons.mjs [START] [STOP] [siteId ...]
//   START/STOP in UTC, "YYYY-MM-DD HH:MM". Defaults: the 7-day test window.
//
// Horizons settings (confirmed in the docs, 2026-11-14):
//   API endpoint ............ https://ssd.jpl.nasa.gov/api/horizons.api  (ssd-api.jpl.nasa.gov/doc/horizons.html)
//   EPHEM_TYPE=OBSERVER, CENTER='coord@301', COORD_TYPE=GEODETIC
//   SITE_COORD='E-lon,lat,alt_km'  (manual: E-long deg, lat deg, h km; Moon is east-longitude positive)
//   COMMAND '10' = Sun, '399' = Earth (manual)
//   QUANTITIES='4' = apparent AZ-EL, degrees, azimuth clockwise from north (manual)
//   CSV_FORMAT=YES, data between $$SOE and $$EOE (manual)
//   Time column is UT (UTC for dates after 1962, per output footer); START/STOP are read as UT.
//   No rate limit is documented for the API; we send one request at a time with a pause anyway.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";

const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "data", "ephem");
const ALT_KM = 0; // UNVERIFIED site heights: all sites at 0 km above the 1737.4 km reference sphere.
const TARGETS = { sun: "10", earth: "399" };
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

const [start = "2026-11-14 00:00", stop = "2026-11-21 00:00", ...only] = process.argv.slice(2);

function toIso(hz) {
  // " 2026-Nov-14 00:00" -> "2026-11-14T00:00:00Z"
  const m = hz.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Unparsed time: ${hz}`);
  const mo = String(MONTHS[m[2]]).padStart(2, "0");
  return `${m[1]}-${mo}-${m[3]}T${m[4]}:${m[5]}:00Z`;
}

async function query(site, target) {
  const params = {
    format: "json",
    COMMAND: `'${target}'`,
    OBJ_DATA: "NO",
    MAKE_EPHEM: "YES",
    EPHEM_TYPE: "OBSERVER",
    CENTER: "'coord@301'",
    COORD_TYPE: "GEODETIC",
    SITE_COORD: `'${site.lon},${site.lat},${ALT_KM}'`,
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: "'1 h'",
    QUANTITIES: "'4'",
    CSV_FORMAT: "YES",
  };
  const url = `${API}?${new URLSearchParams(params)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${site.id}/${target}`);
  const body = await res.json();
  if (body.error) throw new Error(`Horizons error for ${site.id}/${target}: ${body.error}`);
  const text = body.result;

  // Check the header says what we asked for.
  const need = ["MEAN_ME", "{East-longitude positive}", "Atmos refraction: NO (AIRLESS)", "Date__(UT)__HR:MN", "Azi_(a-app), Elev_(a-app)"];
  for (const n of need) if (!text.includes(n)) throw new Error(`Header check failed (${n}) for ${site.id}/${target}`);

  const block = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error(`No $$SOE block for ${site.id}/${target}`);
  const rows = block.trim().split("\n").map((line) => {
    const c = line.split(",");
    return { utc: toIso(c[0]), az: Number(c[3]), el: Number(c[4]) };
  });
  for (const r of rows) if (!Number.isFinite(r.az) || !Number.isFinite(r.el)) throw new Error(`Bad number in ${site.id}/${target} at ${r.utc}`);

  const header = text.split("\n").filter((l) => /^(Center geodetic|Center pole\/equ|Center radii|Atmos refraction|EOP coverage|Ephemeris \/ API|Target body name)/.test(l)).map((l) => l.trim());
  return { rows, header, version: body.signature?.version };
}

function checkHourly(rows) {
  for (let i = 1; i < rows.length; i++) {
    if (Date.parse(rows[i].utc) - Date.parse(rows[i - 1].utc) !== 3600e3) throw new Error(`Gap/step error at ${rows[i].utc}`);
  }
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT_DIR, { recursive: true });

const todo = sites.filter((s) => s.coordsVerified && s.lat != null && s.lon != null && (only.length === 0 || only.includes(s.id)));
for (const site of todo) {
  const sun = await query(site, TARGETS.sun);
  await pause(1000);
  const earth = await query(site, TARGETS.earth);
  await pause(1000);
  checkHourly(sun.rows);
  if (sun.rows.length !== earth.rows.length || sun.rows.some((r, i) => r.utc !== earth.rows[i].utc)) throw new Error(`Sun/Earth time mismatch for ${site.id}`);

  const out = {
    siteId: site.id,
    lat: site.lat,
    lon: site.lon,
    altKm: ALT_KM,
    altVerified: false,
    start: sun.rows[0].utc,
    stepHours: 1,
    count: sun.rows.length,
    timeScale: "UTC",
    azimuth: "degrees clockwise from north (N=0, E=90)",
    elevation: "degrees above the plane perpendicular to local zenith (flat horizon, no terrain)",
    source: "JPL Horizons API, observer coord@301, quantity 4 (airless apparent AZ-EL)",
    apiVersion: sun.version,
    fetchedUtc: new Date().toISOString(),
    horizonsHeader: { sun: sun.header, earth: earth.header },
    sunAz: sun.rows.map((r) => r.az),
    sunEl: sun.rows.map((r) => r.el),
    earthAz: earth.rows.map((r) => r.az),
    earthEl: earth.rows.map((r) => r.el),
  };
  writeFileSync(join(OUT_DIR, `${site.id}.json`), JSON.stringify(out));
  console.log(`${site.id}: ${out.count} rows ${out.start} .. ${sun.rows.at(-1).utc}`);
}
