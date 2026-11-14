// Step 7: terrain horizon profile for one site from LOLA GDR south polar DEMs (data/raw/,
// fetched by scripts/fetch_lola.mjs). Writes data/ephem/<siteId>/horizon.json.
// Usage: node scripts/compute_horizon.mjs [siteId=sp_malapert]
//
// Method (plain words):
//   - Observer = DEM surface at the site + MAST_M (assumed), on a sphere R = 1737.4 km
//     (LOLA heights are "relative to a radius of 1737.4 km", same sphere as our Horizons data).
//   - For rays every 0.1 deg of azimuth (clockwise from north), walk outward along the great circle.
//     Heights come from the finest DEM that covers the point: 20 m (<= 20 km, local window),
//     then 80 m (to 80S), 120 m (to 75S), 240 m (to 60S). Bilinear interpolation.
//   - Elevation angle of each terrain point is exact 3D geometry on the sphere (curvature included):
//     angle = atan2((R+h)cos(d/R) - (R+h_obs), (R+h)sin(d/R)).
//   - Stop a ray when even the highest point in the DEMs (label DERIVED_MAXIMUM) could not rise above
//     the best angle found so far at that distance (a hard bound, so the result is complete),
//     or at the 60S data edge (then the worst case beyond the edge is recorded).
//   - Bin i (i = 0..359) covers azimuths [i-0.5, i+0.5): the maximum over its ten 0.1-deg rays.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";
import { buildIndex } from "./build_index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "data", "raw");
const R = 1737400;          // m, reference sphere (LOLA label OFFSET; Horizons "Center radii")
const ENV = process.env;     // overrides for sensitivity tests only (HZ_DRY=1 prints, does not write)
const MAST_M = Number(ENV.HZ_MAST ?? 2);  // ASSUMED observer height above ground
const NEAR_KM = 20;         // use the 20 m DEM inside this distance
const RAYS_PER_DEG = Number(ENV.HZ_RAYS ?? 10);
const d2r = Math.PI / 180, r2d = 180 / Math.PI;

const siteId = process.argv[2] ?? "sp_malapert";
const site = sites.find((s) => s.id === siteId);
if (!site) throw new Error("unknown site " + siteId);

function label(name) {
  const t = readFileSync(join(RAW, `${name}.lbl`), "utf8");
  const num = (k) => Number(t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m"))[1]);
  if (!/relative to a radius of 1737\.4 km/.test(t.replace(/\s+/g, " "))) throw new Error(`${name}: height reference not 1737.4 km`);
  if (!/MEAN EARTH\/POLAR AXIS OF DE421/.test(t) || num("CENTER_LATITUDE") !== -90) throw new Error(`${name}: unexpected projection`);
  if (num("SCALING_FACTOR") !== 0.5 || num("SAMPLE_BITS") !== 16) throw new Error(`${name}: unexpected sample format`);
  return { N: num("LINES"), scale: num("MAP_SCALE"), off: num("LINE_PROJECTION_OFFSET"),
    maxLat: num("MAXIMUM_LATITUDE"), hMax: num("DERIVED_MAXIMUM") * 0.5 };
}

function dem(name, file, firstRow = 0) {
  const L = label(name);
  const buf = readFileSync(join(RAW, file));
  const data = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2); // LSB 16-bit; macOS/x86/ARM are little-endian
  const rows = data.length / L.N;
  return { name, ...L, data, firstRow, rows,
    // Height (m above 1737.4 km sphere) at lat/lon, or null if outside this DEM.
    at(lat, lon) {
      if (lat > this.maxLat) return null;
      const rr = 2 * R * Math.tan(((90 + lat) * d2r) / 2); // south: colatitude from the south pole = 90 + lat
      const col = this.off + (rr * Math.sin(lon * d2r)) / this.scale;  // 90E to the right
      const row = this.off - (rr * Math.cos(lon * d2r)) / this.scale;  // lon 0 up
      const r0 = Math.floor(row) - this.firstRow, c0 = Math.floor(col);
      if (r0 < 0 || r0 + 1 >= this.rows || c0 < 0 || c0 + 1 >= this.N) return null;
      const fr = row - Math.floor(row), fc = col - c0, N = this.N, D = this.data;
      const i = r0 * N + c0;
      return 0.5 * ((D[i] * (1 - fc) + D[i + 1] * fc) * (1 - fr) + (D[i + N] * (1 - fc) + D[i + N + 1] * fc) * fr);
    } };
}

const winName = `ldem_80s_20m_${ENV.HZ_WINDOW ?? siteId}_rows`; // HZ_WINDOW: use another site's 20 m window (dry runs)
const win = JSON.parse(readFileSync(join(RAW, `${winName}.json`), "utf8"));
const D20 = dem("ldem_80s_20m", `${winName}.img`, win.firstRow);
const FAR = [dem("ldem_80s_80m", "ldem_80s_80m.img"), dem("ldem_75s_120m", "ldem_75s_120m.img"), dem("ldem_60s_240m", "ldem_60s_240m.img")];
const H_MAX = Math.max(D20.hMax, ...FAR.map((d) => d.hMax));

// Great-circle destination from the site.
// Optional observer shift (metres north / east) for sensitivity tests.
const baseLat = Number(ENV.HZ_LAT ?? site.lat), baseLon = Number(ENV.HZ_LON ?? site.lon); // HZ_LAT/HZ_LON: dry-run another point
const obsLat = baseLat + (Number(ENV.HZ_NORTH_M ?? 0) / R) * r2d;
const obsLon = baseLon + (Number(ENV.HZ_EAST_M ?? 0) / (R * Math.cos(baseLat * d2r))) * r2d;
const phi1 = obsLat * d2r, lam1 = obsLon * d2r;
function dest(azDeg, dM) {
  const th = azDeg * d2r, dl = dM / R;
  const phi2 = Math.asin(Math.sin(phi1) * Math.cos(dl) + Math.cos(phi1) * Math.sin(dl) * Math.cos(th));
  const lam2 = lam1 + Math.atan2(Math.sin(th) * Math.sin(dl) * Math.cos(phi1), Math.cos(dl) - Math.sin(phi1) * Math.sin(phi2));
  return [phi2 * r2d, ((lam2 * r2d + 540) % 360) - 180];
}

const ground = D20.at(obsLat, obsLon);
const hObs = ground + MAST_M, Ro = R + hObs;
const angle = (h, dM) => Math.atan2((R + h) * Math.cos(dM / R) - Ro, (R + h) * Math.sin(dM / R)) * r2d;
const dipDeg = Math.acos(R / Ro) * r2d;                  // smooth-sphere horizon dip
const smoothHorizonKm = Math.sqrt(2 * R * hObs) / 1000;  // distance to the smooth-sphere horizon

const elevationDeg = new Array(360).fill(-Infinity), blockDistKm = new Array(360).fill(null),
  blockDem = new Array(360).fill(null), edgeWorstDeg = new Array(360).fill(null);
const demUse = {};
for (let k = 0; k < 360 * RAYS_PER_DEG; k++) {
  const az = (k - (RAYS_PER_DEG - 1) / 2) / RAYS_PER_DEG;   // bin 0 rays: -0.45..+0.45
  const bin = Math.round(az + 360) % 360;
  const azN = (az + 360) % 360;
  let best = -Infinity, bestD = null, bestDem = null, d = Math.max(D20.scale, Number(ENV.HZ_MIN_M ?? 0)); // HZ_MIN_M: sensitivity only
  for (;;) {
    if (best > -90 && angle(H_MAX, d) < best) break;     // nothing further can be higher
    const [lat, lon] = dest(azN, d);
    let h = null, used = null;
    if (d <= NEAR_KM * 1000) { h = D20.at(lat, lon); used = D20; }
    if (h === null) for (const g of FAR) { h = g.at(lat, lon); if (h !== null) { used = g; break; } }
    if (h === null) { // ran off the 60S DEM: record worst case for terrain beyond the edge
      const w = angle(H_MAX, d);
      edgeWorstDeg[bin] = Math.max(edgeWorstDeg[bin] ?? -Infinity, w);
      break;
    }
    const a = angle(h, d);
    if (a > best) { best = a; bestD = d; bestDem = used.name; }
    d += used.scale;
  }
  if (best > elevationDeg[bin]) { elevationDeg[bin] = best; blockDistKm[bin] = bestD / 1000; blockDem[bin] = bestDem; }
  demUse[bestDem] = (demUse[bestDem] ?? 0) + 1;
}

const r3 = (x) => Number(x.toFixed(3));
const edgeBins = edgeWorstDeg.map((w, i) => (w !== null && w > elevationDeg[i] ? i : null)).filter((i) => i !== null);
const out = {
  siteId, model: "lola", resolutionDeg: 1, verified: true,
  verifiedMeaning: "passed Lane A method checks (scripts/check_horizon.mjs); not ground truth",
  azimuth: "bin i covers [i-0.5, i+0.5) deg, clockwise from north (same as Horizons quantity 4)",
  elevationDeg: elevationDeg.map(r3),
  blockDistKm: blockDistKm.map((x) => r3(x)),
  blockDem,
  edgeLimitedBins: edgeBins,
  edgeWorstCaseDeg: edgeBins.map((i) => r3(edgeWorstDeg[i])),
  observer: { lat: site.lat, lon: site.lon, groundHeightM: r3(ground), mastM: MAST_M, mastAssumed: true,
    heightAboveSphereM: r3(hObs), sphereRadiusM: R },
  smoothSphereDipDeg: r3(dipDeg), smoothSphereHorizonKm: r3(smoothHorizonKm),
  demMaxHeightM: H_MAX,
  method: "rays every 0.1 deg; exact spherical geometry; 20 m DEM to 20 km, then 80 m (to 80S), 120 m (to 75S), 240 m (to 60S); bilinear; ray stops when the DEM maximum height could no longer exceed the best angle; bin = max of 10 rays",
  source: "LRO LOLA GDR polar DEMs (PDS Geosciences): ldem_80s_20m, ldem_80s_80m, ldem_75s_120m, ldem_60s_240m — https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/",
  builtUtc: new Date().toISOString(),
};
if (ENV.HZ_DUMP) writeFileSync(ENV.HZ_DUMP, JSON.stringify(out)); // sensitivity only
if (ENV.HZ_DRY) {
  const pick = (a) => a.map((i) => out.elevationDeg[i].toFixed(2)).join(" ");
  console.log(JSON.stringify({ mast: MAST_M, rays: RAYS_PER_DEG, north_m: ENV.HZ_NORTH_M ?? 0, east_m: ENV.HZ_EAST_M ?? 0,
    ground: r3(ground), az_0_90_180_270: pick([0, 90, 180, 270]), az_350_355: pick([350, 352, 354, 356, 358]),
    earth_bins: [351, 352, 353, 354, 355, 356, 357, 358, 359, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `${i}:${out.elevationDeg[i].toFixed(2)}@${out.blockDistKm[i]}km`).join(" ") }));
  process.exit(0);
}
writeFileSync(join(ROOT, "data", "ephem", siteId, "horizon.json"), JSON.stringify(out));
buildIndex(); // so lib/visibility.js and build_daily.mjs see the new horizon (then run: node scripts/build_daily.mjs)
console.log(`observer ground ${ground.toFixed(1)} m (+${MAST_M} m mast) above 1737.4 km sphere; smooth-sphere dip ${dipDeg.toFixed(3)} deg at ${smoothHorizonKm.toFixed(1)} km`);
console.log(`horizon min ${Math.min(...elevationDeg).toFixed(3)} max ${Math.max(...elevationDeg).toFixed(3)} deg; blocking DEM per ray:`, demUse);
console.log(`bins where the 60S edge could hide something higher: ${edgeBins.length}`);
