// Step 7 stage 3: sanity checks for a terrain horizon profile, plus a search of our
// Horizons data for hours where the flat horizon says "Sun up" and the terrain says "blocked".
// Usage: node scripts/check_horizon.mjs [siteId=sp_malapert]
// DEM checks run only if the raw LOLA files are present in data/raw/ (they are not in git).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FAR, fineProduct, isPolar, GLOBAL_FAR } from "./lola_maps.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteId = process.argv[2] ?? "sp_malapert";
const hz = JSON.parse(readFileSync(join(ROOT, "data", "ephem", siteId, "horizon.json"), "utf8"));
const R = 1737400, d2r = Math.PI / 180, r2d = 180 / Math.PI;
let fails = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); fails++; } else console.log("ok  ", m); };
const horizonAt = (az) => hz.elevationDeg[Math.round(az) % 360];

// 1. Shape and provenance.
ok(hz.model === "lola" && hz.resolutionDeg === 1 && hz.elevationDeg.length === 360 && hz.elevationDeg.every(Number.isFinite), "360 finite values, model lola, 1 deg bins");
ok(hz.edgeLimitedBins.length === 0, "no azimuth limited by the 60S data edge (search is complete for every bin)");

// 2. Geometry bounds. A point on the sphere at height h, seen from height hObs, can't appear lower
// than the tangent to the sphere of radius R+h: angle >= -acos((R+h)/(R+hObs)). Use the DEM minimum
// (label DERIVED_MINIMUM of the products, -9126.5 m) as the most negative height.
const hObs = hz.observer.heightAboveSphereM, Ro = R + hObs;
const lowest = -Math.acos((R - 9126.5) / Ro) * r2d;
ok(Math.min(...hz.elevationDeg) >= lowest, `horizon never below the tangent to the deepest terrain (${lowest.toFixed(2)} deg)`);
if (hObs > 0) {
  ok(Math.abs(hz.smoothSphereDipDeg - Math.acos(R / Ro) * r2d) < 1e-3, `smooth-sphere dip ${hz.smoothSphereDipDeg} deg for an observer ${hObs} m above the sphere`);
} else {
  ok(hz.smoothSphereDipDeg === null && hz.smoothSphereHorizonKm === null, `observer ${hObs} m BELOW the sphere: smooth-sphere dip recorded as undefined (null), not NaN`);
  // An observer below the reference sphere on a mast sees, at most, the mast-only dip below level over flat
  // local ground; real terrain around a basin floor should not drop much further below level.
  ok(Number.isFinite(hz.mastDipDeg) && Math.min(...hz.elevationDeg) > -3, `lowest horizon ${Math.min(...hz.elevationDeg).toFixed(2)} deg (mast-only dip ${hz.mastDipDeg} deg)`);
}
const below = hObs > 0 ? hz.elevationDeg.filter((e) => e < -hz.smoothSphereDipDeg).length : 0;
console.log(`     ${below} of 360 bins dip below the smooth-sphere horizon (terrain lower than the 1737.4 km sphere, e.g. toward the polar depressions)`);

// 3. DEM read checks (raw files needed): the site's fine map agrees with the next coarser map that
// covers the site, and the coarse polar maps agree with each other (same orientation, same heights).
const RAW = join(ROOT, "data", "raw");
const FINE = fineProduct(hz.observer.lat, hz.observer.lon);
if (!isPolar(hz.observer.lat)) {
  // Global (cylindrical) site: 1024 px/deg tile window vs the 128 px/deg window, near the site.
  const files = [FINE, GLOBAL_FAR].map((p) => join(RAW, `${p}_${siteId}_rows.img`));
  if (files.every((f) => existsSync(f))) {
    const openC = (name) => {
      const t = readFileSync(join(RAW, `${name}.lbl`), "utf8");
      const num = (k) => Number(t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m"))[1]);
      const W = JSON.parse(readFileSync(join(RAW, `${name}_${siteId}_rows.json`), "utf8"));
      const b = readFileSync(join(RAW, `${name}_${siteId}_rows.img`));
      const D = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
      const res = num("MAP_RESOLUTION"), lpo = num("LINE_PROJECTION_OFFSET"), spo = num("SAMPLE_PROJECTION_OFFSET"), clon = num("CENTER_LONGITUDE"), ns = num("LINE_SAMPLES");
      // PDS catalog/dsmap.cat (0-based): sample = SPO + RES*(LON - CENTER_LONGITUDE), line = LPO - RES*LAT
      return (lat, lon) => { const l = Math.round(lpo - res * lat) - W.firstRow, sm = Math.round(spo + res * ((((lon % 360) + 360) % 360) - clon)); return l >= 0 && sm >= 0 && sm < ns && l * ns < D.length ? 0.5 * D[l * ns + sm] : NaN; };
    };
    const fine = openC(FINE), coarse = openC(GLOBAL_FAR);
    const pts = [];
    const lonSpan = 0.3 / Math.cos(hz.observer.lat * d2r);
    for (let i = 0; i < 200; i++) pts.push([hz.observer.lat + 0.3 * Math.sin(i * 1.7), hz.observer.lon + lonSpan * Math.cos(i * 2.3)]);
    const both = pts.map(([la, lo]) => [fine(la, lo), coarse(la, lo)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    const m = both.reduce((s, [a, b]) => s + Math.abs(a - b), 0) / both.length;
    const g = fine(hz.observer.lat, hz.observer.lon), gc = coarse(hz.observer.lat, hz.observer.lon);
    ok(Math.abs(g - gc) < 60, `site height 30 m tile ${g} m vs 237 m map ${gc} m (same place, same orientation)`);
    ok(both.length >= 150 && m < 60, `30 m tile (${FINE}) vs 237 m (${GLOBAL_FAR}), ${both.length} points within ~9 km: mean |diff| ${m.toFixed(1)} m`);
  } else console.log("skip DEM read checks (data/raw not present; run scripts/fetch_lola.mjs <siteId>)");
} else if (FAR.every((p) => existsSync(join(RAW, `${p}.img`))) && existsSync(join(RAW, `${FINE}_${siteId}_rows.img`))) {
  const lbl = (name) => { const t = readFileSync(join(RAW, `${name}.lbl`), "utf8"); const num = (k) => Number(t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m"))[1]); return { N: num("LINES"), off: num("LINE_PROJECTION_OFFSET"), scale: num("MAP_SCALE"), maxLat: num("MAXIMUM_LATITUDE") }; };
  const open = (name, file, firstRow = 0) => {
    const { N, off, scale, maxLat } = lbl(name);
    const b = readFileSync(join(RAW, file));
    const D = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
    const f = (lat, lon) => {
      const rr = 2 * R * Math.tan(((90 + lat) * d2r) / 2);
      const col = Math.round(off + (rr * Math.sin(lon * d2r)) / scale), row = Math.round(off - (rr * Math.cos(lon * d2r)) / scale) - firstRow;
      return 0.5 * D[row * N + col];
    };
    return Object.assign(f, { mapName: name, scale, maxLat });
  };
  const W = JSON.parse(readFileSync(join(RAW, `${FINE}_${siteId}_rows.json`), "utf8"));
  const fine = open(FINE, `${FINE}_${siteId}_rows.img`, W.firstRow);
  const far = FAR.map((p) => open(p, `${p}.img`));
  const coarse = far.find((g) => hz.observer.lat + 0.35 <= g.maxLat); // first coarser map covering every comparison point (site +-0.3 deg)
  const mad = (pts, a, b) => pts.reduce((s, [la, lo]) => s + Math.abs(a(la, lo) - b(la, lo)), 0) / pts.length;
  const near = [], ring = [];
  const lonSpan = 0.3 / Math.cos(hz.observer.lat * d2r); // ~9 km in both directions
  for (let i = 0; i < 200; i++) { // deterministic spread of points
    near.push([hz.observer.lat + 0.3 * Math.sin(i * 1.7), hz.observer.lon + lonSpan * Math.cos(i * 2.3)]);
    ring.push([-81 - 3 * ((i * 0.618) % 1), (i * 37) % 360 - 180]); // 81S-84S, all longitudes
  }
  const g = fine(hz.observer.lat, hz.observer.lon), gc = coarse(hz.observer.lat, hz.observer.lon);
  ok(Math.abs(g - gc) < 60, `site height ${fine.scale} m map ${g} m vs ${coarse.scale} m map ${gc} m (same place, same orientation)`);
  const m1 = mad(near, fine, coarse), m2 = mad(ring, far[0], far[1]), m3 = mad(ring, far[1], far[2]);
  ok(m1 < 60, `${fine.scale} m (${FINE}) vs ${coarse.scale} m (${coarse.mapName}), 200 points within ~9 km: mean |diff| ${m1.toFixed(1)} m`);
  ok(m2 < 150 && m3 < 250, `80 m vs 120 m: ${m2.toFixed(1)} m; 120 m vs 240 m: ${m3.toFixed(1)} m (200 points, 81-84S, all longitudes)`);
} else console.log("skip DEM read checks (data/raw not present; run scripts/fetch_lola.mjs <siteId>)");

// 4. Search our Horizons data (2026-2029 hourly) for flat-vs-terrain disagreements.
const dir = join(ROOT, "data", "ephem", siteId);
let farBest = null, farCount = 0;
let n = 0, sunBlocked = 0, sunUnblocked = 0, earthBlocked = 0, earthUnblocked = 0, best = null;
const examples = [];
for (const f of readdirSync(dir).filter((f) => /^\d{4}\.json$/.test(f)).sort()) {
  const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
  for (let i = 0; i < d.count; i++) {
    n++;
    const sh = horizonAt(d.sunAz[i]), eh = horizonAt(d.earthAz[i]);
    const flatLit = d.sunEl[i] > 0, terrLit = d.sunEl[i] > sh;
    if (flatLit && !terrLit) {
      sunBlocked++;
      const utc = new Date(Date.parse(d.start) + i * 3600e3).toISOString().replace(".000Z", "Z");
      const ex = { utc, sunAz: d.sunAz[i], sunEl: d.sunEl[i], horizonDeg: sh, blockKm: hz.blockDistKm[Math.round(d.sunAz[i]) % 360], by: sh - d.sunEl[i] };
      if (examples.length < 3) examples.push(ex);
      if (!best || ex.by > best.by && ex.sunEl >= 1) best = ex;
      // Robust case: blocker at least 2 km away (not the point's own local slope), Sun >= 1 deg up, >= 1 deg below terrain.
      if (ex.blockKm >= 2 && ex.sunEl >= 1 && ex.by >= 1) { farCount++; if (!farBest || ex.by > farBest.by) farBest = ex; }
    }
    if (!flatLit && terrLit) sunUnblocked++;
    if (d.earthEl[i] > 0 && d.earthEl[i] <= eh) earthBlocked++;
    if (d.earthEl[i] <= 0 && d.earthEl[i] > eh) earthUnblocked++;
  }
}
console.log(`     ${n} hours 2026-2029: Sun up on flat but blocked by terrain ${sunBlocked} h; Sun down on flat but visible over terrain ${sunUnblocked} h`);
console.log(`     Earth up on flat but blocked ${earthBlocked} h; Earth down on flat but visible ${earthUnblocked} h`);
for (const e of examples) console.log("     first cases:", JSON.stringify(e));
if (best) console.log("     clearest case (any distance):", JSON.stringify(best));
console.log(`     robust cases (blocker >= 2 km away, Sun >= 1 deg up, >= 1 deg below terrain): ${farCount} h`);
if (farBest) console.log("     clearest robust case:", JSON.stringify(farBest));
// Earth-facing horizon: what sets it (D10 rule: report ground closer than 500 m).
const earthBins = new Map();
for (const f of readdirSync(dir).filter((f) => /^\d{4}\.json$/.test(f))) {
  const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
  for (const a of d.earthAz) { const b = Math.round(a) % 360; earthBins.set(b, (earthBins.get(b) ?? 0) + 1); }
}
const total = [...earthBins.values()].reduce((a, b) => a + b, 0);
const nearHours = [...earthBins].filter(([b]) => hz.blockDistKm[b] < 0.5).reduce((a, [, n]) => a + n, 0);
const dists = [...earthBins.keys()].map((b) => hz.blockDistKm[b]);
const signed = [...earthBins.keys()].map((b) => (b > 180 ? b - 360 : b)); // Earth often straddles north
console.log(`     Earth directions used (azimuth ${(Math.min(...signed) + 360) % 360}..${(Math.max(...signed) + 360) % 360} deg): skyline ${Math.min(...dists).toFixed(2)}-${Math.max(...dists).toFixed(1)} km away; ${(100 * nearHours / total).toFixed(1)}% of hours have Earth in a direction set by ground < 500 m`);

// Step 7's pass test (PLAN) is for sp_malapert; other sites report these counts without requiring them.
if (siteId === "sp_malapert") {
  ok(sunBlocked > 0, "at least one hour: flat says Sun up, terrain says blocked");
  ok(farCount > 0, "at least one such hour where the blocking ridge is >= 2 km away");
}

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
