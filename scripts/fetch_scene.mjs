// Step 8 download (Lane A): Moon-fixed directions and distances of the Sun and Earth, hourly,
// for the 3D scene's true lighting. Same coverage as the site data: 2026-2029 + each pre-2026
// landing window (landing day 00:00Z -15 d .. +15 d).
// Output: data/ephem/_scene/<YYYY>.json and _scene/landing_<siteId>.json, listed in ephem/index.json.
// Usage: node scripts/fetch_scene.mjs [--force]
//
// Horizons settings (confirmed in the manual / API doc and the output header, 2026-11-14):
//   EPHEM_TYPE=OBSERVER, COMMAND='301' (Moon), CENTER='500@399' (Earth centre), RANGE_UNITS=KM, CSV_FORMAT=YES
//   QUANTITIES='14,15,19,20,24':
//     14 ObsSub-LON/LAT  "Apparent planetodetic longitude and latitude of the center of the target disc seen by the
//                        OBSERVER at print-time" = the sub-Earth point on the Moon (Earth seen from the Moon at zenith).
//     15 SunSub-LON/LAT  "Apparent sub-solar longitude and latitude of the Sun on the target" (light-time Sun->Moon->observer).
//     19 r               "The Sun's apparent range ... relative to the target center" (km).
//     20 delta           "Apparent range ... of the target center relative to the observer" (km) = Earth-Moon distance.
//     24 S-T-O           Sun-Target-Observer angle at the Moon's centre (deg), used as an independent check.
//   Output header: "Target pole/equ : MOON_ME {East-longitude positive}", "Target radii : 1737.4, 1737.4, 1737.4 km"
//   (a sphere, so planetodetic latitude = planetocentric latitude). Longitudes are output 0..360 E.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";
import { pause } from "./horizons_api.mjs";
import { buildIndex } from "./build_index.mjs";

const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "ephem", "_scene");
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const force = process.argv.includes("--force");
const hz = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
const toIso = (t) => { const m = t.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})$/); if (!m) throw new Error("time " + t); return `${m[1]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${m[3]}T${m[4]}:${m[5]}:00Z`; };
const r4 = (x) => Number(x.toFixed(4)), r1 = (x) => Number(x.toFixed(1));

async function fetchChunk(label, start, stop) {
  const params = { format: "json", COMMAND: "'301'", OBJ_DATA: "NO", MAKE_EPHEM: "YES", EPHEM_TYPE: "OBSERVER", CENTER: "'500@399'",
    START_TIME: `'${hz(start)}'`, STOP_TIME: `'${hz(stop)}'`, STEP_SIZE: "'1 h'", QUANTITIES: "'14,15,19,20,24'", RANGE_UNITS: "KM", CSV_FORMAT: "YES" };
  let body;
  for (let a = 1; ; a++) {
    try { const res = await fetch(`${API}?${new URLSearchParams(params)}`); if (!res.ok) throw new Error("HTTP " + res.status); body = await res.json(); break; }
    catch (e) { if (a >= 3) throw new Error(`${label}: ${e.message}`); await pause(5000 * a); }
  }
  if (body.error) throw new Error(`Horizons error ${label}: ${body.error}`);
  const t = body.result;
  for (const need of ["Target pole/equ : MOON_ME", "{East-longitude positive}", "Target radii    : 1737.4, 1737.4, 1737.4 km", "Date__(UT)__HR:MN",
    "ObsSub-LON, ObsSub-LAT,  SunSub-LON, SunSub-LAT,", "r,       rdot,", "delta,     deldot,     S-T-O,"]) {
    if (!t.includes(need)) throw new Error(`header check failed (${need}) for ${label}`);
  }
  const rows = t.split("$$SOE")[1].split("$$EOE")[0].trim().split("\n").map((l) => {
    const c = l.split(",").map((x) => x.trim());
    // columns: time, solar flag, lunar flag, ObsSub-LON, ObsSub-LAT, SunSub-LON, SunSub-LAT, r, rdot, delta, deldot, S-T-O
    return { utc: toIso(c[0]), eLon: +c[3], eLat: +c[4], sLon: +c[5], sLat: +c[6], r: +c[7], delta: +c[9], sto: +c[11] };
  });
  rows.forEach((r, i) => {
    if (Date.parse(r.utc) !== start + i * 3600e3) throw new Error(`gap in ${label} at ${r.utc}`);
    if (![r.eLon, r.eLat, r.sLon, r.sLat, r.r, r.delta, r.sto].every(Number.isFinite)) throw new Error(`bad number in ${label} at ${r.utc}`);
  });
  if (Date.parse(rows.at(-1).utc) !== stop) throw new Error(`short table ${label}`);
  const header = t.split("\n").filter((l) => /^(Target pole\/equ|Target radii|Center geodetic|EOP coverage)/.test(l)).map((l) => l.trim());
  return { start: rows[0].utc, end: rows.at(-1).utc, stepHours: 1, count: rows.length, timeScale: "UTC",
    frame: "MOON_ME (Horizons target frame, east-longitude positive), lon 0..360 E",
    source: "JPL Horizons API, target 301, observer 500@399, quantities 14 (sub-Earth), 15 (sub-solar), 19 (Sun range), 20 (Earth range), 24 (S-T-O)",
    apiVersion: body.signature?.version, fetchedUtc: new Date().toISOString(), horizonsHeader: header,
    sunLon: rows.map((r) => r4(r.sLon)), sunLat: rows.map((r) => r4(r.sLat)), sunDistKm: rows.map((r) => r1(r.r)),
    earthLon: rows.map((r) => r4(r.eLon)), earthLat: rows.map((r) => r4(r.eLat)), earthDistKm: rows.map((r) => r1(r.delta)),
    stoDeg: rows.map((r) => r4(r.sto)) };
}

mkdirSync(OUT, { recursive: true });
const chunks = [2026, 2027, 2028, 2029].map((y) => ({ label: String(y), start: Date.UTC(y, 0, 1), stop: Date.UTC(y + 1, 0, 1) - 3600e3 }));
for (const s of sites) {
  if (!s.landingDate || Date.parse(s.landingDate) >= Date.UTC(2026, 0, 1)) continue;
  const d = Math.floor(Date.parse(s.landingDate) / 864e5) * 864e5;
  chunks.push({ label: `landing_${s.id}`, start: d - 15 * 864e5, stop: d + 15 * 864e5 });
}
for (const c of chunks) {
  const file = join(OUT, `${c.label}.json`);
  if (existsSync(file) && !force) { console.log("skip", c.label); continue; }
  const out = await fetchChunk(c.label, c.start, c.stop);
  writeFileSync(file, JSON.stringify(out));
  console.log(`${c.label}: ${out.count} rows ${out.start} .. ${out.end}`);
  await pause(1500);
}
buildIndex();
console.log("index written");
