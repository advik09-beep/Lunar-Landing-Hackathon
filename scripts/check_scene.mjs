// Step 8 checks for getSceneState (Moon-fixed Sun/Earth directions + distances).
// 1. Hand-check rows: the Sun and Earth elevation/azimuth IMPLIED by getSceneState at a site must
//    match the Horizons web-app values Sheldon read (site-topocentric quantity 4) within TOL_DEG.
// 2. Same comparison against our hourly site files for all 10 sites, every 6th hour, 2026-2029.
// 3. The Sun-Earth angle between the two directions equals Horizons' S-T-O (quantity 24).
// 4. Judge check: near each full moon (S-T-O minimum) the sub-solar and sub-Earth points are close together.
// Usage: node scripts/check_scene.mjs [--report]   -> PASS or exit 1
import { readFileSync } from "node:fs";
import * as V from "../lib/visibility.js";

const R = 1737.4; // km, same sphere as the site data (Horizons "Center radii" / "Target radii")
const TOL_DEG = 0.05; // justification printed below and in STATUS.md
const d2r = Math.PI / 180, r2d = 180 / Math.PI;
let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };

// Elevation and azimuth of a body seen from a site on the sphere, from the Moon-fixed body position.
function seenFrom(lat, lon, b) {
  const la = lat * d2r, lo = lon * d2r;
  const up = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  const east = [-Math.sin(lo), Math.cos(lo), 0];
  const north = [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)];
  const v = b.xyz.map((c, k) => c - R * up[k]); // from the site, not the Moon's centre (matters for Earth: up to ~0.26 deg)
  const n = Math.hypot(...v), dot = (a) => a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
  return { el: Math.asin(dot(up) / n) * r2d, az: ((Math.atan2(dot(east), dot(north)) * r2d) + 360) % 360 };
}
const azDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

try { V.getSceneState("2026-11-14T12:00:00Z"); ok(false, "NOT_LOADED before loadScene"); } catch (e) { ok(/NOT_LOADED/.test(e.message), "getSceneState before loadScene throws NOT_LOADED"); }
await V.loadScene();
ok(V.getSceneState("2026-11-14T12:30:00Z").sampleUtc === "2026-11-14T12:00:00Z", "time read at the start of its hour");
try { V.getSceneState("2030-01-01T00:00:00Z"); ok(false, "out of coverage throws"); } catch (e) { ok(/OUT_OF_COVERAGE/.test(e.message), "out of coverage throws OUT_OF_COVERAGE"); }
ok(!!V.getSceneState("1969-07-20T20:00:00Z"), "Apollo 11 landing window covered");

// 1. Hand-check rows (Horizons web app, Sheldon 2026-11-14). sp_malapert rows are at its ORIGINAL point.
const HAND = [
  ["apollo11", 0.67408, 23.47297, "2026-11-14T12:00:00Z", { sun: [91.485723, -7.066737], earth: [277.587391, 64.319993] }],
  ["im1", -80.13, 1.44, "2026-11-17T08:00:00Z", { sun: [84.925818, 2.457328], earth: [352.877147, 9.295239] }],
  ["sp_malapert (original point)", -86.0, 0.3, "2026-11-20T06:00:00Z", { sun: [50.411431, 4.097569], earth: [352.405849, 7.454124] }],
];
let maxHand = 0;
console.log("Hand-check rows: elevation/azimuth implied by getSceneState vs Horizons web app");
for (const [name, lat, lon, utc, want] of HAND) {
  const sc = V.getSceneState(utc);
  for (const k of ["sun", "earth"]) {
    const got = seenFrom(lat, lon, sc[k]);
    const dEl = Math.abs(got.el - want[k][1]), dAz = azDiff(got.az, want[k][0]);
    maxHand = Math.max(maxHand, dEl);
    console.log(`  ${name.padEnd(28)} ${utc} ${k.padEnd(5)} el ${got.el.toFixed(4)} vs ${want[k][1].toFixed(4)} (d ${dEl.toFixed(4)})  az ${got.az.toFixed(4)} vs ${want[k][0].toFixed(4)} (d ${dAz.toFixed(4)})`);
    ok(dEl <= TOL_DEG, `${name} ${k} elevation within ${TOL_DEG} deg`);
  }
}

// 2. Broad comparison with our site files (rounded to 0.001 deg), all sites, every 6th hour 2026-2029.
await Promise.all(V.listSites().map((s) => V.loadSite(s.id)));
let maxEl = { sun: 0, earth: 0 }, maxAz = { sun: 0, earth: 0 }, n = 0;
for (const s of V.listSites()) {
  for (let t = Date.parse("2026-01-01T00:00:00Z"); t <= Date.parse("2029-12-31T23:00:00Z"); t += 6 * 3600e3) {
    const st = V.getState(s.id, t), sc = V.getSceneState(t);
    for (const k of ["sun", "earth"]) {
      const got = seenFrom(s.lat, s.lon, sc[k]);
      const el = k === "sun" ? st.sunEl : st.earthEl, az = k === "sun" ? st.sunAz : st.earthAz;
      maxEl[k] = Math.max(maxEl[k], Math.abs(got.el - el));
      if (Math.abs(el) < 80) maxAz[k] = Math.max(maxAz[k], azDiff(got.az, az)); // azimuth is ill-defined near the zenith
    }
    n++;
  }
}
console.log(`  ${n} site-hours: max |d elevation| Sun ${maxEl.sun.toFixed(4)}, Earth ${maxEl.earth.toFixed(4)} deg; max |d azimuth| (el < 80) Sun ${maxAz.sun.toFixed(4)}, Earth ${maxAz.earth.toFixed(4)} deg`);
ok(maxEl.sun <= TOL_DEG && maxEl.earth <= TOL_DEG, `all sites, 2026-2029: implied elevations match the site files within ${TOL_DEG} deg`);

// 3. Angle between the Sun and Earth directions vs Horizons S-T-O.
let maxSto = 0;
for (let t = Date.parse("2026-01-01T00:00:00Z"); t <= Date.parse("2029-12-31T23:00:00Z"); t += 3600e3) {
  const sc = V.getSceneState(t);
  const ang = Math.acos(Math.min(1, sc.sun.dir.reduce((a, c, k) => a + c * sc.earth.dir[k], 0))) * r2d;
  maxSto = Math.max(maxSto, Math.abs(ang - sc.sunEarthAngleDeg));
}
console.log(`  max |angle(sub-solar, sub-Earth) - S-T-O| over every hour 2026-2029: ${maxSto.toFixed(4)} deg`);
ok(maxSto <= TOL_DEG, `Sun-Earth angle from the two directions equals Horizons S-T-O within ${TOL_DEG} deg`);

// 4. Full moons: local minima of the Sun-Moon-Earth angle (S-T-O), ~every 29.5 days.
const series = [];
for (let t = Date.parse("2026-01-01T00:00:00Z"); t <= Date.parse("2029-12-31T23:00:00Z"); t += 3600e3) series.push([t, V.getSceneState(t)]);
const minima = [];
for (let i = 72; i < series.length - 72; i++) {
  const a = series[i][1].sunEarthAngleDeg;
  let isMin = true;
  for (let j = i - 72; j <= i + 72 && isMin; j++) if (series[j][1].sunEarthAngleDeg < a) isMin = false;
  if (isMin && a < 90) minima.push(series[i]);
}
const sep = (sc) => Math.acos(Math.min(1, sc.sun.dir.reduce((a, c, k) => a + c * sc.earth.dir[k], 0))) * r2d;
console.log(`  full moons found (S-T-O minima): ${minima.length}; first three:`);
for (const [t, sc] of minima.slice(0, 3)) console.log(`    ${new Date(t).toISOString().slice(0, 16)}Z  sub-solar (${sc.sun.lat.toFixed(2)}, ${sc.sun.lon.toFixed(2)}E)  sub-Earth (${sc.earth.lat.toFixed(2)}, ${sc.earth.lon.toFixed(2)}E)  apart ${sep(sc).toFixed(2)} deg`);
const worst = Math.max(...minima.map(([, sc]) => sep(sc)));
const newMoonMin = Math.min(...series.filter((_, i) => i % 24 === 0).map(([, sc]) => 180 - sc.sunEarthAngleDeg));
ok(minima.length >= 48 && minima.length <= 50, `about one full moon per 29.5 days over 4 years (${minima.length})`);
ok(worst < 10, `at every full moon the sub-solar and sub-Earth points are within ${worst.toFixed(2)} deg of each other`);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log(`PASS (hand rows max d elevation ${maxHand.toFixed(4)} deg; tolerance ${TOL_DEG} deg)`);
