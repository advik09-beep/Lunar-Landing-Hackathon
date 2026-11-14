// D10: find the highest ground within RADIUS_M of a point, on the LOLA 20 m south polar DEM
// window in data/raw/ (scripts/fetch_lola.mjs). Prints lat/lon/height of the highest pixel centre.
// Usage: node scripts/find_highest_point.mjs [lat=-86.0] [lon=0.3] [radius_m=1000]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAW = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "raw");
const [lat0 = -86.0, lon0 = 0.3, RADIUS_M = 1000] = process.argv.slice(2).map(Number);
const R = 1737400, N = 30400, OFF = 15199.5, SCALE = 20, d2r = Math.PI / 180, r2d = 180 / Math.PI;
const W = JSON.parse(readFileSync(join(RAW, "ldem_80s_20m_malapert_rows.json"), "utf8"));
const b = readFileSync(join(RAW, "ldem_80s_20m_malapert_rows.img"));
const D = new Int16Array(b.buffer, b.byteOffset, b.length / 2);

// PDS polar stereographic (catalog/dsmap_polar.cat), south: lon 0 up, 90E right, r = 2R tan(colat/2).
const toPix = (lat, lon) => { const rr = 2 * R * Math.tan(((90 + lat) * d2r) / 2); return [OFF - (rr * Math.cos(lon * d2r)) / SCALE, OFF + (rr * Math.sin(lon * d2r)) / SCALE]; };
const toLatLon = (row, col) => { const x = (col - OFF) * SCALE, y = (OFF - row) * SCALE; return [-90 + 2 * Math.atan(Math.hypot(x, y) / (2 * R)) * r2d, Math.atan2(x, y) * r2d]; };
const gc = (a, b) => { // great-circle distance (m) on the 1737.4 km sphere
  const [p1, l1, p2, l2] = [a[0] * d2r, a[1] * d2r, b[0] * d2r, b[1] * d2r];
  return 2 * R * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin((l2 - l1) / 2) ** 2));
};

const [r0, c0] = toPix(lat0, lon0);
const span = Math.ceil(RADIUS_M / SCALE) + 2;
let best = null;
for (let row = Math.round(r0) - span; row <= Math.round(r0) + span; row++) {
  for (let col = Math.round(c0) - span; col <= Math.round(c0) + span; col++) {
    const ll = toLatLon(row, col);
    const dist = gc([lat0, lon0], ll);
    if (dist > RADIUS_M) continue;
    const h = 0.5 * D[(row - W.firstRow) * N + col];
    if (!best || h > best.h) best = { h, lat: ll[0], lon: ll[1], dist, row, col };
  }
}
const here = 0.5 * D[(Math.round(r0) - W.firstRow) * N + Math.round(c0)];
console.log(JSON.stringify({ from: { lat: lat0, lon: lon0, heightM: here }, radiusM: RADIUS_M,
  highest: { lat: +best.lat.toFixed(5), lon: +best.lon.toFixed(5), heightM: best.h, distanceM: +best.dist.toFixed(0), row: best.row, col: best.col } }));
