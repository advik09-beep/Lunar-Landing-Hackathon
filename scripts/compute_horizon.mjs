// Step 7 / D12: terrain horizon profile for one site from LOLA GDR DEMs, polar or global cylindrical (data/raw/,
// fetched by scripts/fetch_lola.mjs). Writes data/ephem/<siteId>/horizon.json.
// Usage: node scripts/compute_horizon.mjs [siteId=sp_malapert]
//
// Method (plain words):
//   - Observer = DEM surface at the site + MAST_M (assumed), on a sphere R = 1737.4 km
//     (LOLA heights are "relative to a radius of 1737.4 km", same sphere as our Horizons data).
//   - For rays every 0.1 deg of azimuth (clockwise from north), walk outward along the great circle.
//     Heights come from the finest DEM that covers the point (scripts/lola_maps.mjs): the site's fine map
//     (20/30/60 m polar, or ~30 m global tile) within 20 km, then coarser maps. Bilinear interpolation.
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
import { farProducts, fineProduct, isPolar, GLOBAL_FAR_HALF_DEG as GLOBAL_HALF } from "./lola_maps.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "data", "raw");
const R = 1737400;          // m, reference sphere (LOLA label OFFSET; Horizons "Center radii")
const ENV = process.env;     // overrides for sensitivity tests only (HZ_DRY=1 prints, does not write)
const MAST_M = Number(ENV.HZ_MAST ?? 2);  // ASSUMED observer height above ground
const NEAR_KM = 20;         // use the site's fine DEM window inside this distance
const RAYS_PER_DEG = Number(ENV.HZ_RAYS ?? 10);
const d2r = Math.PI / 180, r2d = 180 / Math.PI;

const siteId = process.argv[2] ?? "sp_malapert";
const site = sites.find((s) => s.id === siteId);
if (!site) throw new Error("unknown site " + siteId);

function label(name) {
  const t = readFileSync(join(RAW, `${name}.lbl`), "utf8");
  const num = (k) => Number(t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m"))[1]);
  if (!/relative to a radius of 1737\.4 km/.test(t.replace(/\s+/g, " "))) throw new Error(`${name}: height reference not 1737.4 km`);
  const opt = (k) => { const m = t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m")); return m ? Number(m[1]) : NaN; };
  const proj = (t.match(/MAP_PROJECTION_TYPE\s*=\s*"([^"]+)"/) || [])[1];
  if (!/MEAN EARTH\/POLAR AXIS OF DE421/.test(t)) throw new Error(`${name}: unexpected frame`);
  if (num("SCALING_FACTOR") !== 0.5 || num("SAMPLE_BITS") !== 16) throw new Error(`${name}: unexpected sample format`);
  if (proj === "POLAR STEREOGRAPHIC") {
    if (num("CENTER_LATITUDE") !== -90) throw new Error(`${name}: not south polar`);
    return { proj: "polar", N: num("LINES"), samples: num("LINE_SAMPLES"), scale: num("MAP_SCALE"), off: num("LINE_PROJECTION_OFFSET"),
      maxLat: num("MAXIMUM_LATITUDE"), hMax: opt("DERIVED_MAXIMUM") * 0.5 };
  }
  if (proj === "SIMPLE CYLINDRICAL") {
    if (!/POSITIVE_LONGITUDE_DIRECTION\s*=\s*"EAST"/.test(t)) throw new Error(`${name}: longitude not east-positive`);
    // PDS catalog/dsmap.cat: SAMPLE = NINT(SPO + RES*(LON - CENTER_LONGITUDE)) + 1, LINE = NINT(LPO - RES*(LAT - CENTER_LATITUDE)) + 1 (1-based)
    const res = num("MAP_RESOLUTION");
    return { proj: "cyl", N: num("LINES"), samples: num("LINE_SAMPLES"), res, scale: Math.round((2 * Math.PI * R) / (360 * res)),
      lpo: num("LINE_PROJECTION_OFFSET"), spo: num("SAMPLE_PROJECTION_OFFSET"), clat: num("CENTER_LATITUDE"), clon: num("CENTER_LONGITUDE"),
      minLat: num("MINIMUM_LATITUDE"), maxLat: num("MAXIMUM_LATITUDE"), west: num("WESTERNMOST_LONGITUDE"), east: num("EASTERNMOST_LONGITUDE"),
      hMax: opt("DERIVED_MAXIMUM") * 0.5 };
  }
  throw new Error(`${name}: unknown projection ${proj}`);
}

function dem(name, file, firstRow = 0) {
  const L = label(name);
  const buf = readFileSync(join(RAW, file));
  const data = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2); // LSB 16-bit; macOS/x86/ARM are little-endian
  const W = L.samples;
  const rows = data.length / W;
  return { name, ...L, data, firstRow, rows,
    // Height (m above 1737.4 km sphere) at lat/lon, or null if outside this DEM (or outside its fetched rows).
    at(lat, lon) {
      let row, col;
      if (this.proj === "polar") {
        if (lat > this.maxLat) return null;
        const rr = 2 * R * Math.tan(((90 + lat) * d2r) / 2); // south: colatitude from the south pole = 90 + lat
        col = this.off + (rr * Math.sin(lon * d2r)) / this.scale;  // 90E to the right
        row = this.off - (rr * Math.cos(lon * d2r)) / this.scale;  // lon 0 up
      } else {
        const lon360 = ((lon % 360) + 360) % 360;
        if (lat < this.minLat || lat > this.maxLat || lon360 < this.west || lon360 > this.east) return null;
        col = this.spo + this.res * (lon360 - this.clon); // 0-based, pixel centres on integers
        row = this.lpo - this.res * (lat - this.clat);
      }
      const r0 = Math.floor(row) - this.firstRow, c0 = Math.floor(col);
      if (r0 < 0 || r0 + 1 >= this.rows || c0 < 0 || c0 + 1 >= W) return null;
      const fr = row - Math.floor(row), fc = col - c0, N = W, D = this.data;
      const i = r0 * N + c0;
      return 0.5 * ((D[i] * (1 - fc) + D[i + 1] * fc) * (1 - fr) + (D[i + N] * (1 - fc) + D[i + N + 1] * fc) * fr);
    } };
}

const FINE = fineProduct(site.lat, site.lon);  // finest map covering the site (scripts/lola_maps.mjs)
const POLAR = isPolar(site.lat);
const winName = `${FINE}_${ENV.HZ_WINDOW ?? siteId}_rows`; // HZ_WINDOW: use another site's window (dry runs)
const win = JSON.parse(readFileSync(join(RAW, `${winName}.json`), "utf8"));
const D20 = dem(FINE, `${winName}.img`, win.firstRow); // (name kept from step 7; it is the fine map, 20-60 m)
const FAR_PRODUCTS = farProducts(site.lat);
const FAR = FAR_PRODUCTS.map((p) => {
  if (POLAR) return dem(p, `${p}.img`); // whole polar files
  const w = JSON.parse(readFileSync(join(RAW, `${p}_${siteId}_rows.json`), "utf8")); // global: row window
  return dem(p, `${p}_${siteId}_rows.img`, w.firstRow);
});
// Stopping bound: the highest terrain that could exist where a ray can go.
//  polar: the label DERIVED_MAXIMUM of the polar maps (polar maps cover the whole search area);
//  global: the highest point in the site's fetched windows + 500 m margin (the 237 m map smooths peaks);
//  rays leaving the windows are flagged as edge-limited, as before.
const winMax = (g) => { let m = -Infinity; for (let i = 0; i < g.data.length; i++) if (g.data[i] > m) m = g.data[i]; return m * 0.5; };
const H_MAX = POLAR ? Math.max(D20.hMax, ...FAR.map((d) => d.hMax)) : Math.max(winMax(D20), ...FAR.map(winMax)) + 500;

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
// Smooth-sphere horizon dip relative to the 1737.4 km reference sphere. Defined only for an observer
// ABOVE that sphere; the Apollo sites (maria) are 1.4-2.6 km BELOW it, so there it is null.
const aboveSphere = hObs > 0;
const dipDeg = aboveSphere ? Math.acos(R / Ro) * r2d : null;
const smoothHorizonKm = aboveSphere ? Math.sqrt(2 * R * hObs) / 1000 : null;
// Dip for the mast alone over a smooth sphere through the ground point (always defined).
const mastDipDeg = Math.acos((R + ground) / Ro) * r2d;

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
// Local slope at the observer (D18: NASA lists "terrain slope" among landing-region criteria). Plane through
// heights 1 pixel and 100 m north/south/east/west of the point on the fine map (bilinear); downslope azimuth
// clockwise from north.
function slopeAt(baseM) {
  const at = (n, e) => D20.at(obsLat + (n / R) * r2d, obsLon + (e / (R * Math.cos(obsLat * d2r))) * r2d);
  const hn = at(baseM, 0), hs = at(-baseM, 0), he = at(0, baseM), hw = at(0, -baseM);
  if ([hn, hs, he, hw].some((h) => h === null)) return null;
  const gN = (hn - hs) / (2 * baseM), gE = (he - hw) / (2 * baseM);
  return { baselineM: baseM, slopeDeg: r3(Math.atan(Math.hypot(gN, gE)) * r2d), downslopeAzimuthDeg: r3(((Math.atan2(-gE, -gN) * r2d) + 360) % 360) };
}
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
  smoothSphereDipDeg: dipDeg === null ? null : r3(dipDeg), smoothSphereHorizonKm: smoothHorizonKm === null ? null : r3(smoothHorizonKm),
  smoothSphereNote: aboveSphere ? "dip of a smooth 1737.4 km sphere seen from the observer" : "observer is below the 1737.4 km reference sphere, so a dip relative to it is undefined (null)",
  mastDipDeg: Number(mastDipDeg.toFixed(4)), // smooth sphere through the ground point, seen from the mast top
  demMaxHeightM: H_MAX,
  method: `rays every 0.1 deg; exact spherical geometry; ${D20.scale} m DEM (${FINE}) to ${NEAR_KM} km, then ${FAR.map((g) => POLAR ? `${g.scale} m (to ${-g.maxLat}S)` : `${g.scale} m (${g.name}, rows within ${GLOBAL_HALF} deg of latitude)`).join(", ")}; bilinear; ray stops when the highest possible terrain (${Math.round(H_MAX)} m) could no longer exceed the best angle; bin = max of 10 rays`,
  source: `LRO LOLA GDR ${POLAR ? "polar" : "global cylindrical"} DEMs (PDS Geosciences): ${[FINE, ...FAR_PRODUCTS].join(", ")} — https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/${POLAR ? "polar" : "cylindrical"}/img/`,
  maps: { fine: { product: FINE, metersPerPixel: D20.scale, withinKm: NEAR_KM }, far: FAR.map((g) => (POLAR ? { product: g.name, metersPerPixel: g.scale, toLatitude: g.maxLat } : { product: g.name, metersPerPixel: g.scale, rowsWithinDegLat: GLOBAL_HALF })) },
  searchBoundM: Math.round(H_MAX),
  localSlope: { pixel: slopeAt(D20.scale), over100m: slopeAt(100), map: FINE, note: "plane fit through heights 1 pixel / 100 m north, south, east and west of the observer on the fine map; one point, not a landing-ellipse survey" },
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
console.log(`observer ground ${ground.toFixed(1)} m (+${MAST_M} m mast) relative to the 1737.4 km sphere; ` +
  (aboveSphere ? `smooth-sphere dip ${dipDeg.toFixed(3)} deg at ${smoothHorizonKm.toFixed(1)} km` : `below the sphere: smooth-sphere dip undefined; mast-only dip ${mastDipDeg.toFixed(4)} deg`));
console.log(`horizon min ${Math.min(...elevationDeg).toFixed(3)} max ${Math.max(...elevationDeg).toFixed(3)} deg; blocking DEM per ray:`, demUse);
console.log(`bins where the 60S edge could hide something higher: ${edgeBins.length}`);
