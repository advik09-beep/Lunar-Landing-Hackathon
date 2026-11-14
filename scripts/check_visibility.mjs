// Calls every export of lib/visibility.js and checks the contract v1 shapes and values.
// Usage: node scripts/check_visibility.mjs   -> prints PASS or exits 1 with the failure.
import { readFileSync } from "node:fs";
import * as V from "../lib/visibility.js";

let fails = 0;
const ok = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); fails++; } };
const has = (obj, keys, where) => keys.forEach((k) => ok(k in obj, `${where} missing ${k}`));
const throwsMsg = (fn, re, msg) => { try { fn(); ok(false, msg + " (did not throw)"); } catch (e) { ok(re.test(e.message), `${msg} (got: ${e.message})`); } };
const T = "2026-11-14T12:00:00Z";

ok(typeof V.MOCK === "boolean", "MOCK boolean");
ok(V.API_VERSION === "1.3.0", "API_VERSION 1.3.0");
has(V.READY, ["listSites", "getState", "getSummary", "loadSite", "getCoverage", "getTimeline", "loadDaily", "getDaily", "setDataBase", "loadScene", "getSceneState", "getHorizon"], "READY");
ok(V.READY.getSceneState === true && V.READY.getHorizon === true, "READY.getSceneState and getHorizon true");
ok(V.VERDICT_RULE.STAY_DAYS === 7 && V.VERDICT_RULE.CLEAR_PCT === 90 && V.VERDICT_RULE.OUT_PCT === 10 && V.VERDICT_RULE.EDGE_DEG === 2, "verdict numbers 7/90/10/2");
ok(typeof V.setDataBase === "function", "setDataBase exported");

const sites = V.listSites();
ok(sites.length === 10, "10 sites");
has(sites[0], ["id", "name", "lat", "lon", "kind", "landingDate", "source", "coordsVerified", "note"], "listSites()[0]");

// NOT_LOADED before loading
throwsMsg(() => V.getCoverage(), /NOT_LOADED/, "getCoverage before any load");
throwsMsg(() => V.getTimeline("apollo11", T, 1), /NOT_LOADED/, "getTimeline before loadSite");
throwsMsg(() => V.getDaily("2026-11-14", 3), /NOT_LOADED/, "getDaily before loadDaily");
if (!V.MOCK) {
  throwsMsg(() => V.getState("apollo11", T), /NOT_LOADED/, "getState before loadSite");
  throwsMsg(() => V.getSummary("apollo11", T, 7), /NOT_LOADED/, "getSummary before loadSite");
}

for (const s of sites) await V.loadSite(s.id);

// Sites with a LOLA terrain horizon so far (D12 stages). Every other site must stay flat.
const TERRAIN_SITES = ["apollo11", "apollo12", "apollo17", "chandrayaan3", "im1", "im2", "sp_cabeus_b_peak", "sp_haworth", "sp_malapert", "sp_nobile_rim2"]; // D12 done: all 10
const verdicts = new Set();
for (const s of sites) {
  const st = V.getState(s.id, T);
  has(st, ["sunEl", "sunAz", "earthEl", "earthAz", "lit", "comms", "hoursToSunChange", "hoursToEarthChange", "terrain",
    "sunMarginDeg", "earthMarginDeg", "sunEdge", "earthEdge", "edgeDeg", "horizonModel", "sampleUtc"], `getState(${s.id})`);
  if (TERRAIN_SITES.includes(s.id)) {
    const hz = V.getHorizon(s.id);
    ok(st.horizonModel === "lola" && st.terrain === "real" && hz.model === "lola", `${s.id} uses the LOLA terrain horizon`);
    ok(st.sunMarginDeg === st.sunEl - hz.elevationDeg[Math.round(st.sunAz) % 360] && st.lit === st.sunMarginDeg > 0, `${s.id} Sun margin = elevation - terrain horizon at that azimuth`);
    ok(st.earthMarginDeg === st.earthEl - hz.elevationDeg[Math.round(st.earthAz) % 360] && st.comms === st.earthMarginDeg > 0, `${s.id} Earth margin = elevation - terrain horizon at that azimuth`);
  } else {
    ok(st.horizonModel === "flat" && st.terrain === "flat" && st.sunMarginDeg === st.sunEl && st.earthMarginDeg === st.earthEl, `${s.id} flat margin = elevation`);
    const fh = V.getHorizon(s.id);
    ok(fh.model === "flat" && fh.elevationDeg.length === 360 && fh.elevationDeg.every((x) => x === 0), `${s.id} getHorizon flat = 360 zeros`);
  }
  ok(st.sunAz >= 0 && st.sunAz < 360 && st.earthAz >= 0 && st.earthAz < 360, `${s.id} azimuth in [0,360)`);
  ok(st.hoursToEarthChange === null || st.hoursToEarthChange > 0, `${s.id} countdown null or > 0`);
  const sum = V.getSummary(s.id, T, 7);
  has(sum, ["pctLit", "pctComms", "pctBoth", "longestDarkHours", "pctSunEdge", "pctEarthEdge", "verdict", "verdictRule"], `getSummary(${s.id})`);
  ok(["clear", "partial", "out", "edge"].includes(sum.verdict), `${s.id} verdict value`);
  verdicts.add(sum.verdict);
}

// Values equal the files (step 5 test: on-screen values equal the files).
const f = JSON.parse(readFileSync(new URL("../data/ephem/apollo11/2026.json", import.meta.url), "utf8"));
const i = (Date.parse(T) - Date.parse(f.start)) / 3600e3;
const st = V.getState("apollo11", "2026-11-14T12:59:00Z");
ok(st.sampleUtc === T, "getState reads the start of the hour");
ok(st.sunAz === f.sunAz[i] && st.sunEl === f.sunEl[i] && st.earthAz === f.earthAz[i] && st.earthEl === f.earthEl[i], "getState equals file values");
ok(st.sunAz === 91.486 && st.sunEl === -7.067, "apollo11 hand-check row (Sun) 91.486 / -7.067");

// Step 7 test: an hour where the flat horizon says "Sun up" and the terrain says "blocked".
// sp_malapert (D10 point), 2026-09-19 06:00 UTC: Sun az 85.267, el 1.048; terrain horizon in bin 85
// is 6.032 deg, set by a ridge 1.84 km east (stays 6.0-6.7 deg if the observer moves 200 m).
// Found by scripts/check_horizon.mjs. Earth at that hour is below the flat horizon but above the terrain.
{
  const b = V.getState("sp_malapert", "2026-09-19T06:00:00Z");
  const hz = V.getHorizon("sp_malapert");
  ok(hz.model === "lola" && hz.elevationDeg.length === 360 && hz.verified === true && hz.resolutionDeg === 1, "getHorizon(sp_malapert) shape");
  ok(b.sunEl === 1.048, `blocked case: Sun above the flat horizon (el ${b.sunEl})`);
  ok(b.lit === false && b.sunMarginDeg < -4.9, `blocked case: terrain says dark (margin ${b.sunMarginDeg.toFixed(3)})`);
  ok(hz.blockDistKm[85] > 1, `blocked case: blocker is a ridge ${hz.blockDistKm[85]} km away, not the point's own slope`);
  ok(b.sunEl > 0 && !b.lit, "flat says lit, terrain says dark");
  ok(b.earthEl < 0 && b.comms === true, `same hour: Earth below the flat horizon (${b.earthEl}) but in view over terrain`);
}

// Countdown is consistent with the timeline.
const st2 = V.getState("apollo11", T);
if (st2.hoursToSunChange !== null) {
  ok(V.getState("apollo11", Date.parse(T) + st2.hoursToSunChange * 3600e3).lit !== st2.lit, "sun countdown lands on a change");
  ok(V.getState("apollo11", Date.parse(T) + (st2.hoursToSunChange - 1) * 3600e3).lit === st2.lit, "no earlier change");
}

// Timeline
const tl = V.getTimeline("apollo11", "2026-11-14T12:34:00Z", 7);
has(tl, ["siteId", "stepHours", "mock", "terrain", "horizonModel", "source", "samples"], "getTimeline");
ok(tl.samples.length === 168, "timeline 7 days = 168 samples");
ok(tl.samples[0].utc === T, "timeline floors start to the hour");
has(tl.samples[0], ["utc", "sunEl", "sunAz", "earthEl", "earthAz", "lit", "comms", "sunEdge", "earthEdge", "sunMarginDeg", "earthMarginDeg", "horizonModel"], "timeline sample");
ok(V.getState("apollo11", tl.samples[50].utc).sunEl === tl.samples[50].sunEl, "timeline sample equals getState at same time");
throwsMsg(() => V.getTimeline("apollo11", T, 1, 1.5), /stepHours/, "fractional stepHours rejected");

// Coverage
const cov = V.getCoverage();
has(cov, ["mock", "stepHours", "timeScale", "sites"], "getCoverage");
ok(cov.sites.length === 10, "coverage for 10 sites");
const a11 = cov.sites.find((s) => s.siteId === "apollo11").ranges;
ok(a11.length === 2 && a11[1][0] === "2026-01-01T00:00:00Z" && a11[1][1] === "2029-12-31T23:00:00Z", "apollo11 ranges: landing + 2026-2029");
ok(cov.sites.find((s) => s.siteId === "sp_haworth").ranges.length === 1, "pole site: one range");
ok(JSON.stringify(cov.sites.filter((s) => s.terrain === "lola").map((s) => s.siteId).sort()) === JSON.stringify(TERRAIN_SITES), `coverage: terrain (lola) exactly for ${TERRAIN_SITES.join(", ")}`);
throwsMsg(() => V.getState("apollo11", "2030-01-01T00:00:00Z"), /OUT_OF_COVERAGE/, "out of coverage throws");
throwsMsg(() => V.getSummary("apollo11", "2029-12-30T00:00:00Z", 7), /OUT_OF_COVERAGE/, "summary past end throws");
const land = V.getState("apollo11", "1969-07-20T20:17:40Z");
ok(land.lit && land.sunAz > 45 && land.sunAz < 135 && land.sunEl < 20, "Apollo 11 landing: low Sun in the east");
throwsMsg(() => V.getState("sp_haworth", "1969-07-20T20:00:00Z"), /OUT_OF_COVERAGE/, "non-landing site not covered in 1969");

// Daily
await V.loadDaily();
const t0 = Date.now();
const daily = V.getDaily("2026-11-14", 56);
const ms = Date.now() - t0;
has(daily, ["apiVersion", "mock", "STAY_DAYS", "CLEAR_PCT", "OUT_PCT", "EDGE_DEG", "verdictRule", "sites"], "getDaily");
ok(Object.keys(daily.sites).length === 10 && daily.sites.apollo11.length === 56, "daily 10 sites x 56 days");
ok(V.getDaily("2029-12-30", 1).sites.apollo11[0] === null, "stay running past coverage end -> null row");
ok(V.getDaily("1969-07-20", 1).sites.apollo11[0] !== null, "Apollo 11 landing-date row exists");
ok(V.getDaily("1969-07-20", 1).sites.sp_haworth[0] === null, "uncovered site row is null");

// Every daily row in the file equals getSummary of its 7-day stay.
let checked = 0;
for (const s of sites) {
  for (const [a] of cov.sites.find((c) => c.siteId === s.id).ranges) {
    const startDay = new Date(Math.ceil(Date.parse(a) / 864e5) * 864e5).toISOString().slice(0, 10);
    const rows = V.getDaily(startDay, 1461).sites[s.id];
    for (const row of rows) {
      if (!row) continue;
      const ref = V.getSummary(s.id, row.date + "T00:00:00Z", 7);
      for (const k of ["pctLit", "pctComms", "pctBoth", "longestDarkHours", "pctSunEdge", "pctEarthEdge", "verdict"]) {
        if (row[k] !== ref[k]) { ok(false, `daily ${s.id} ${row.date} ${k}: ${row[k]} vs ${ref[k]}`); break; }
      }
      checked++;
    }
  }
}
ok(checked > 14000, `daily rows checked: ${checked}`);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log(`PASS  (MOCK=${V.MOCK}, API ${V.API_VERSION}; verdicts seen ${T}: ${[...verdicts].join(", ")}; ${checked} daily rows = getSummary; getDaily 10x56 in ${ms} ms)`);
