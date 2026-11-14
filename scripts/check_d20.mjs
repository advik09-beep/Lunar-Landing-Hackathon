// D18 / D20 / D22 checks: lunar conditions, best/worst months, slope, Researcher texts and sources.
// Usage: node scripts/check_d20.mjs   -> PASS or exit 1
import * as V from "../lib/visibility.js";
import { separationDeg } from "../lib/disc.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
for (const s of V.listSites()) await V.loadSite(s.id);
await V.loadDaily();
const H = 3600e3, D = 864e5;

// 1. Signal delay = distance / speed of light (JPL Horizons header: c = 299792.458 km/s).
const c1 = V.getConditions("apollo11", "2026-11-14T00:00:00Z");
ok(V.LIGHT_SPEED_KM_S === 299792.458 && near(c1.signalDelaySeconds.min, c1.earthDistanceKm.min / 299792.458) && near(c1.signalDelaySeconds.max, c1.earthDistanceKm.max / 299792.458),
  `one-way signal delay ${c1.signalDelaySeconds.min.toFixed(3)}–${c1.signalDelaySeconds.max.toFixed(3)} s = Earth distance ÷ c`);

// 2. Lunar local solar time: at the hour the Sun is highest, local time is noon.
let best = null;
for (let t = Date.parse("2026-11-01T00:00:00Z"); t < Date.parse("2026-12-01T00:00:00Z"); t += H) { const st = V.getState("apollo11", t); if (!best || st.sunEl > best.el) best = { t, el: st.sunEl }; }
const lt = V.getConditions("apollo11", best.t, 1 / 24).lunarDay.localTimeAtStart;
ok(Math.abs(lt - 12) < 0.3, `Apollo 11: at the Sun's highest point (${new Date(best.t).toISOString().slice(0, 13)}Z, ${best.el.toFixed(1)}°) lunar local time is ${lt.toFixed(2)} h ≈ noon`);

// 3. Season = sub-solar latitude from the scene data.
const sc = []; for (let t = Date.parse("2026-11-14T00:00:00Z"), i = 0; i < 168; i++, t += H) sc.push(V.getSceneState(t).sun.lat);
ok(c1.season.subSolarLatDeg.min === Math.min(...sc) && c1.season.subSolarLatDeg.max === Math.max(...sc) && /1\.5°/.test(c1.season.note.text) && /346\.6/.test(c1.season.note.text),
  `season = sub-solar latitude ${c1.season.subSolarLatDeg.min.toFixed(3)}..${c1.season.subSolarLatDeg.max.toFixed(3)}°, NASA SVS 5229 quoted (1.5° tilt, 346.6-day cycle)`);

// 4. Eclipses in a stay: Malapert from 2026-03-01 contains NASA's 2026-03-03 total eclipse.
const c4 = V.getConditions("sp_malapert", "2026-03-01T00:00:00Z");
ok(c4.eclipses.length === 1 && c4.eclipses[0].start.startsWith("2026-03-03") && c4.eclipses[0].maxCoveredPct === 100, `Malapert stay from 2026-03-01: eclipse ${c4.eclipses[0]?.start}..${c4.eclipses[0]?.end}, 100% covered (NASA: total, 2026-03-03 11:35 TD)`);

// 5. Sun-near-Earth-line caution equals a recount of the separations.
let cnt = 0; for (let t = Date.parse("2026-03-01T00:00:00Z"), i = 0; i < 168; i++, t += H) { const st = V.getState("sp_malapert", t); const sep = separationDeg(st.sunEl, st.sunAz, st.earthEl, st.earthAz); if (sep < 5 || sep > 175) cnt++; }
ok(c4.sunNearEarthLine.hours === cnt && cnt > 0, `Sun-near-Earth-line caution: ${cnt} h flagged in the eclipse week (threshold ${V.COMMS_CAUTION_DEG}°, labeled ours)`);

// 6. The Sun's compass sweep: for a fully sunlit stay at a high-latitude site it matches the sub-solar longitude change.
let sweepCase = null;
for (let t = Date.parse("2026-01-01T00:00:00Z"); t < Date.parse("2026-12-01T00:00:00Z") && !sweepCase; t += D) {
  const m = V.getMetrics("sp_haworth", t); if (m.longestDarkHours === 0) sweepCase = t;
}
const c6 = V.getConditions("sp_haworth", sweepCase);
const dLon = Math.abs(((V.getSceneState(sweepCase + 167 * H).sun.lon - V.getSceneState(sweepCase).sun.lon + 540) % 360) - 180);
ok(Math.abs(c6.sunSweep.degreesWhileLit - dLon) < 6, `Haworth fully sunlit stay from ${new Date(sweepCase).toISOString().slice(0, 10)}: Sun sweeps ${c6.sunSweep.degreesWhileLit.toFixed(1)}° of azimuth ≈ sub-solar longitude change ${dLon.toFixed(1)}°`);
ok(c6.longestContinuousSunHours === 168 && c6.meetsNasa65DaySunBenchmark, "a fully sunlit stay meets NASA's 6.5-day (156 h) continuous-sunlight benchmark");

// 7. Best and worst months match the scores.
const mo = V.getMonthlyScores("apollo17");
const k = mo.byYearMonth.find((x) => x.key === "2027-03");
const days = []; for (let t = Date.parse("2027-03-01T00:00:00Z"); t < Date.parse("2027-04-01T00:00:00Z"); t += D) days.push(V.getScore("apollo17", new Date(t).toISOString().slice(0, 10)).score);
ok(near(k.meanScore, days.reduce((a, b) => a + b, 0) / days.length, 1e-9) && k.stays === days.length, `month mean (Apollo 17, 2027-03: ${k.meanScore.toFixed(2)}) = average of getScore over its ${days.length} days`);
ok(mo.byCalendarMonth.length === 12 && mo.best[0].meanScore >= mo.worst[0].meanScore, `best month ${mo.best[0].key} (${mo.best[0].meanScore.toFixed(1)}) ≥ worst ${mo.worst[0].key} (${mo.worst[0].meanScore.toFixed(1)}); 12 calendar months`);

// 8. Local slope from the terrain maps (NASA lists terrain slope among landing-region criteria).
const slopes = V.listSites().map((s) => [s.id, V.getHorizon(s.id).localSlope]);
ok(slopes.every(([, x]) => x && x.over100m && x.over100m.slopeDeg >= 0 && x.over100m.slopeDeg < 45 && x.pixel.slopeDeg >= 0), "every site has a local slope (1 pixel and 100 m baselines) between 0° and 45°");
console.log("     slopes over 100 m: " + slopes.map(([id, x]) => `${id} ${x.over100m.slopeDeg.toFixed(1)}°`).join(", "));

// 9. Researcher texts: NASA criteria quoted with URLs, D22 note, not-modelled list, sources.
ok(V.NASA_SITE_CRITERIA.length >= 2 && V.NASA_SITE_CRITERIA.every((q) => q.url.startsWith("https://www.nasa.gov/")) && V.NASA_SITE_CRITERIA.some((q) => /terrain slope/.test(q.text)), "NASA landing-region criteria quoted with nasa.gov links");
ok(/fitting numerically integrated orbits/.test(V.OTHER_PLANETS_NOTE.text) && /−26\.70/.test(V.OTHER_PLANETS_NOTE.text) && /−4\.93/.test(V.OTHER_PLANETS_NOTE.text) && /no numeric claim/.test(V.OTHER_PLANETS_NOTE.text),
  "D22 note: gravity in JPL's integrated ephemeris (DE440 paper quote), light from Horizons magnitudes, radio not claimed");
ok(V.NOT_MODELED.length >= 8 && V.SOURCES.every((x) => x.url.startsWith("https://")), `NOT modelled list (${V.NOT_MODELED.length} items) and ${V.SOURCES.length} sources with https links`);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
