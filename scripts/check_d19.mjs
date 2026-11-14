// D19 checks: Sun and Earth as discs, Earth's shadow (lunar eclipses), actual Sun distance.
// The eclipse dates we find in 2026-2029 must match NASA's published list, both ways.
// NASA list: https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html ("Eclipse Predictions by Fred Espenak, NASA's GSFC").
// Its times are TD (Terrestrial Dynamical Time); TD - UTC is about a minute, far below our 1-hour sampling.
// Usage: node scripts/check_d19.mjs   -> PASS or exit 1
import * as V from "../lib/visibility.js";
import { discFractionAbove, discCoveredFraction, angularRadiusDeg, SUN_RADIUS_KM, EARTH_EQ_RADIUS_KM } from "../lib/disc.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// 1. Disc geometry.
ok(near(discFractionAbove(0, 0.27), 0.5) && discFractionAbove(0.27, 0.27) === 1 && discFractionAbove(-0.27, 0.27) === 0, "disc centred on the skyline is half visible; one radius up = all, one radius down = none");
ok(near(discFractionAbove(0.1, 0.27) + discFractionAbove(-0.1, 0.27), 1), "fraction above at +h plus at -h = 1 (symmetry)");
ok(discCoveredFraction(0, 0.27, 0.95) === 1 && discCoveredFraction(2, 0.27, 0.95) === 0 && near(discCoveredFraction(0.95, 0.27, 0.95), discCoveredFraction(0.95, 0.27, 0.95)) &&
   discCoveredFraction(0.95, 0.27, 0.95) > 0.4 && discCoveredFraction(0.95, 0.27, 0.95) < 0.6, "Earth's disc over the Sun's: full when centred, none when far apart, about half at the edge");

await V.loadScene();
for (const s of V.listSites()) await V.loadSite(s.id);
const H = 3600e3, t0 = Date.parse("2026-01-01T00:00:00Z"), t1 = Date.parse("2029-12-31T23:00:00Z");

// 2. Sun distance and sunlight strength.
let iMin = Infinity, iMax = -Infinity;
for (let t = t0; t <= t1; t += 6 * H) { const st = V.getState("apollo11", t); iMin = Math.min(iMin, st.irradianceWm2); iMax = Math.max(iMax, st.irradianceWm2); }
console.log(`     sunlight strength 2026-2029: ${iMin.toFixed(1)} to ${iMax.toFixed(1)} W/m² (1361 at the mean distance)`);
ok(iMin < 1361 && iMax > 1361 && iMax / iMin < 1.09, `sunlight strength follows the Sun distance: ${((iMin / 1361 - 1) * 100).toFixed(1)}% to +${((iMax / 1361 - 1) * 100).toFixed(1)}% around 1361 W/m²`);

// 3. Lunar eclipses from the Moon-fixed geometry (Earth's disc reaching the Sun's disc somewhere on the Moon).
const NASA = [ // date, TD of greatest eclipse, type (NASA GSFC, LEdecade2021)
  ["2026-03-03T11:34:52Z", "Total"], ["2026-08-28T04:14:04Z", "Partial"], ["2027-02-20T23:14:06Z", "Penumbral"],
  ["2027-07-18T16:04:09Z", "Penumbral"], ["2027-08-17T07:14:59Z", "Penumbral"], ["2028-01-12T04:14:13Z", "Partial"],
  ["2028-07-06T18:20:57Z", "Partial"], ["2028-12-31T16:53:15Z", "Total"], ["2029-06-26T03:23:22Z", "Total"], ["2029-12-20T22:43:12Z", "Total"],
];
const events = [];
let cur = null;
for (let t = t0; t <= t1; t += H) {
  const sc = V.getSceneState(t);
  const rs = angularRadiusDeg(SUN_RADIUS_KM, sc.sun.distKm), re = angularRadiusDeg(EARTH_EQ_RADIUS_KM, sc.earth.distKm);
  const limb = angularRadiusDeg(1737.4, sc.earth.distKm); // Earth's direction shifts this much between the Moon's centre and its limb
  const sep = sc.sunEarthAngleDeg;
  if (sep < rs + re + limb) {
    if (!cur) { cur = { min: sep, at: t, rs, re }; events.push(cur); }
    else if (sep < cur.min) Object.assign(cur, { min: sep, at: t, rs, re });
  } else cur = null;
}
console.log(`     eclipse events found from our data: ${events.length}`);
for (const e of events) {
  const n = NASA.find(([d]) => Math.abs(Date.parse(d) - e.at) <= 3 * H);
  console.log(`     ${new Date(e.at).toISOString().slice(0, 16)}Z  closest Sun-Earth ${e.min.toFixed(3)}°  (Earth ${e.re.toFixed(3)}°, Sun ${e.rs.toFixed(3)}°)  ${n ? `NASA: ${n[1]} ${n[0].slice(0, 16)} TD` : "NOT IN NASA LIST"}`);
}
ok(events.every((e) => NASA.some(([d]) => Math.abs(Date.parse(d) - e.at) <= 3 * H)), `every eclipse we find (${events.length}) is on NASA's list, within 3 h of greatest eclipse`);
// NASA's shadow includes Earth's atmosphere; ours is the solid Earth. A grazing penumbral eclipse can therefore
// fall just outside our contact limit: accept it if our closest approach is within 3 h of NASA's time and misses
// the contact limit by under 1% of Earth's angular radius.
const closest = (d) => { let b = null; for (let t = Date.parse(d) - 3 * H; t <= Date.parse(d) + 3 * H; t += H) { const sc = V.getSceneState(Math.round(t / H) * H);
  const rs = angularRadiusDeg(SUN_RADIUS_KM, sc.sun.distKm), re = angularRadiusDeg(EARTH_EQ_RADIUS_KM, sc.earth.distKm), limb = angularRadiusDeg(1737.4, sc.earth.distKm);
  const miss = sc.sunEarthAngleDeg - (rs + re + limb); if (!b || miss < b.miss) b = { miss, re, at: t }; } return b; };
for (const [d, ty] of NASA) {
  const c = closest(d), found = events.some((e) => Math.abs(Date.parse(d) - e.at) <= 3 * H);
  if (!found) console.log(`     NASA ${ty} ${d.slice(0, 16)} TD: grazing, our closest approach misses the solid-Earth contact limit by ${c.miss.toFixed(4)}° (${(100 * c.miss / c.re).toFixed(2)}% of Earth's radius); Earth's atmosphere is not modelled`);
}
ok(NASA.every(([d]) => events.some((e) => Math.abs(Date.parse(d) - e.at) <= 3 * H) || (closest(d).miss < 0.01 * closest(d).re)),
  "every NASA lunar eclipse 2026-2029 is found (one grazing penumbral within 1% of Earth's radius of contact)");
ok(NASA.filter(([, ty]) => ty === "Total").every(([d]) => { const e = events.find((x) => Math.abs(Date.parse(d) - x.at) <= 3 * H); return e && e.min <= e.re - e.rs; }),
  "NASA's total eclipses: Earth fully covers the Sun as seen from the Moon's centre");

// 4. Site-level: eclipse hours only during those events; Earth disc rule.
let strayEclipse = 0, marginal = 0, commsBad = 0;
for (const s of V.listSites()) {
  for (let t = t0; t <= t1; t += H) {
    const st = V.getState(s.id, t);
    if (st.eclipseFraction > 0 && !NASA.some(([d]) => Math.abs(Date.parse(d) - t) <= 6 * H)) strayEclipse++;
    if (st.earthMarginal) marginal++;
    if (st.comms !== (st.earthMarginDeg >= st.earthRadiusDeg)) commsBad++;
  }
}
ok(strayEclipse === 0, "at every site, the Sun is only ever covered by Earth within 6 h of a NASA eclipse");
ok(commsBad === 0, `Earth counts as in view only when its whole disc clears the skyline (${marginal} marginal site-hours reported separately)`);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
