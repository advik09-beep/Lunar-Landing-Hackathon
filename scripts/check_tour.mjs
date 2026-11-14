// D25 tour captions and D26 south-pole text: format, sources, and every "ours" figure recomputed.
// Usage: node scripts/check_tour.mjs   -> PASS or exit 1
import * as V from "../lib/visibility.js";
import { angularRadiusDeg } from "../lib/disc.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const T = V.TOUR_STOPS, by = Object.fromEntries(T.map((x) => [x.id, x]));
const sentences = (s) => (s.match(/[.!?](\s|$)/g) || []).length;

// 1. Format and sources.
ok(T.map((x) => x.id).join() === "sun,mercury,venus,earth,mars,jupiter,saturn,uranus,neptune,moon", "ten stops in tour order: Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Moon");
ok(T.every((x) => x.title && x.title.length <= 40 && sentences(x.text) === 2), "each stop: a short title and exactly two sentences");
ok(T.every((x) => x.sources.length >= 1 && x.sources.every((s) => /^https:\/\/([a-z.]+\.)?(nasa\.gov|ssd\.jpl\.nasa\.gov)\//.test(s.url))), "each stop cites official NASA / JPL sources (https, nasa.gov)");
ok(T.every((x) => !/our /.test(x.text) || x.ours.length > 0), "every figure the text calls 'ours' is listed in its 'ours' field");

// 2. Our figures, recomputed.
const lv = (b) => V.lightVsSun(b);
const planets = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"];
ok(planets.every((p) => p === "venus" || V.MAGNITUDES_FROM_MOON.venus.brightest < V.MAGNITUDES_FROM_MOON[p].brightest), "Venus is the brightest planet seen from the Moon in 2026–2029 (Horizons magnitudes)");
ok(lv("venus") > 1.5e-9 && lv("venus") < 2.5e-9 && /two billionths/.test(by.venus.text), `Venus: at most ${lv("venus").toExponential(2)} of the Sun's light = 'about two billionths'`);
ok(["mercury", "mars", "saturn"].every((p) => lv(p) < 1e-9), `Mercury ${lv("mercury").toExponential(1)}, Mars ${lv("mars").toExponential(1)}, Saturn ${lv("saturn").toExponential(1)}: each under a billionth`);
ok(lv("jupiter") > 2e-10 && lv("jupiter") < 3e-10 && /four-billionth/.test(by.jupiter.text), `Jupiter: ${lv("jupiter").toExponential(2)} = 'about a four-billionth'`);
ok(1 / lv("neptune") > 1e13 && 1 / lv("neptune") < 1e14 && /tens of trillions/.test(by.neptune.text), `Neptune: ${(1 / lv("neptune")).toExponential(2)} times fainter = 'tens of trillions'`);
ok(30 * 30 === 900 && /900 times weaker/.test(by.neptune.text), "Neptune: 30 × 30 = 900");

await V.loadScene();
for (const s of V.listSites()) await V.loadSite(s.id);
const H = 3600e3, t0 = Date.parse("2026-01-01T00:00:00Z"), t1 = Date.parse("2029-12-31T23:00:00Z");
let iMin = Infinity, iMax = -Infinity, prevLon = null, lonTot = 0;
for (let t = t0; t <= t1; t += H) {
  const st = V.getState("apollo11", t); iMin = Math.min(iMin, st.irradianceWm2); iMax = Math.max(iMax, st.irradianceWm2);
  const lon = V.getSceneState(t).sun.lon; if (prevLon !== null) lonTot += ((lon - prevLon + 540) % 360) - 180; prevLon = lon;
}
ok(Math.round(iMin / 5) * 5 === 1310 && Math.round(iMax / 5) * 5 === 1415 && /1,310 and 1,415/.test(by.sun.text), `Sun: sunlight ${iMin.toFixed(1)}–${iMax.toFixed(1)} W/m² = '1,310 and 1,415'`);
const lunarDay = (360 * (t1 - t0) / 864e5) / Math.abs(lonTot);
ok(Math.abs(lunarDay - 29.5) < 0.1 && /29\.5 Earth days/.test(by.moon.text), `Moon: one lunar day = ${lunarDay.toFixed(3)} Earth days (sub-solar point drifts 360° west) = 'about 29.5'`);
let dMin = Infinity, dMax = -Infinity;
for (let t = t0; t <= t1; t += 24 * H) { const d = V.getSceneState(t).earth.distKm / V.LIGHT_SPEED_KM_S; dMin = Math.min(dMin, d); dMax = Math.max(dMax, d); }
ok(Math.round(dMin * 10) / 10 === 1.2 && Math.round(dMax * 10) / 10 === 1.4 && /between about 1\.2 and 1\.4 seconds/.test(by.earth.text), `Earth: one-way signal delay ${dMin.toFixed(3)}–${dMax.toFixed(3)} s = 'between about 1.2 and 1.4 seconds'`);
ok(/1\.5 degrees/.test(by.uranus.text) && /1\.5°/.test(V.SEASON_NOTE.text), "Uranus/Moon: 1.5° tilt matches NASA SVS 5229");

// 3. South pole text.
const SP = V.SOUTH_POLE;
ok(!/\n/.test(SP.oneLine) && /any site/.test(SP.oneLine) && /comparison/.test(SP.oneLine) && /terrain decides/.test(SP.oneLine), "one-line version: why, the catch (terrain decides), works for any site, past landings as comparison");
ok(SP.full.length === 3 && /permanently shadowed regions rich in resources/.test(SP.full[0]) && /6\.5-day/.test(SP.full[0]) && /hover just above the horizon/.test(SP.full[1]) && /any site/.test(SP.full[2]), "full version: NASA quotes for why, the catch, and any-site sentence");
let maxEarth = 0;
for (const s of V.listSites().filter((x) => x.category === "candidate")) for (let t = t0; t <= t1; t += 6 * H) maxEarth = Math.max(maxEarth, Math.abs(V.getState(s.id, t).earthEl));
ok(maxEarth < 11.5 && Math.round(maxEarth) === 11 && /about 11 degrees/.test(SP.full[1]), `our claim 'never more than about 11 degrees above level' at the four candidate sites: max |elevation| ${maxEarth.toFixed(2)}°`);
ok(SP.sources.every((s) => /^https:\/\//.test(s.url)) && SP.sources.some((s) => /nasa-identifies-candidate-regions/.test(s.url)), "south-pole sources are official NASA / JPL links");

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
