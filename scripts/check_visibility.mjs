// Calls every export of lib/visibility.js and checks the contract v1 shapes.
// Usage: node scripts/check_visibility.mjs   -> prints PASS or exits 1 with the failure.
import * as V from "../lib/visibility.js";

let fails = 0;
const ok = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); fails++; } };
const has = (obj, keys, where) => keys.forEach((k) => ok(k in obj, `${where} missing ${k}`));
const throwsMsg = (fn, re, msg) => { try { fn(); ok(false, msg + " (did not throw)"); } catch (e) { ok(re.test(e.message), `${msg} (got: ${e.message})`); } };
const T = "2026-11-14T12:00:00Z";

ok(typeof V.MOCK === "boolean", "MOCK boolean");
ok(V.API_VERSION === "1.0.0", "API_VERSION 1.0.0");
has(V.READY, ["listSites", "getState", "getSummary", "loadSite", "getCoverage", "getTimeline", "loadDaily", "getDaily", "getSceneState", "getHorizon"], "READY");
ok(V.VERDICT_RULE.STAY_DAYS === 7 && V.VERDICT_RULE.CLEAR_PCT === 90 && V.VERDICT_RULE.OUT_PCT === 10 && V.VERDICT_RULE.EDGE_DEG === 2, "verdict numbers 7/90/10/2");

const sites = V.listSites();
ok(sites.length === 10, "10 sites");
has(sites[0], ["id", "name", "lat", "lon", "kind", "landingDate", "source", "coordsVerified", "note"], "listSites()[0]");

const verdicts = new Set();
for (const s of sites) {
  const st = V.getState(s.id, T);
  has(st, ["sunEl", "sunAz", "earthEl", "earthAz", "lit", "comms", "hoursToSunChange", "hoursToEarthChange", "terrain",
    "sunMarginDeg", "earthMarginDeg", "sunEdge", "earthEdge", "edgeDeg", "horizonModel"], `getState(${s.id})`);
  ok(st.horizonModel === "flat" && st.sunMarginDeg === st.sunEl && st.earthMarginDeg === st.earthEl, `${s.id} flat margin = elevation`);
  ok(st.sunAz >= 0 && st.sunAz < 360 && st.earthAz >= 0 && st.earthAz < 360, `${s.id} azimuth in [0,360)`);
  ok(st.hoursToEarthChange === null || st.hoursToEarthChange > 0, `${s.id} countdown null or > 0`);

  const sum = V.getSummary(s.id, T, 7);
  has(sum, ["pctLit", "pctComms", "pctBoth", "longestDarkHours", "pctSunEdge", "pctEarthEdge", "verdict", "verdictRule"], `getSummary(${s.id})`);
  ok(["clear", "partial", "out", "edge"].includes(sum.verdict), `${s.id} verdict value`);
  verdicts.add(sum.verdict);
}

// loadSite / getTimeline
throwsMsg(() => V.getTimeline("apollo11", T, 1), /NOT_LOADED/, "getTimeline before loadSite");
await V.loadSite("apollo11");
const tl = V.getTimeline("apollo11", "2026-11-14T12:34:00Z", 7);
has(tl, ["siteId", "stepHours", "mock", "terrain", "horizonModel", "source", "samples"], "getTimeline");
ok(tl.samples.length === 168, "timeline 7 days = 168 samples");
ok(tl.samples[0].utc === "2026-11-14T12:00:00Z", "timeline floors start to the hour");
has(tl.samples[0], ["utc", "sunEl", "sunAz", "earthEl", "earthAz", "lit", "comms", "sunEdge", "earthEdge", "sunMarginDeg", "earthMarginDeg", "horizonModel"], "timeline sample");
const st0 = V.getState("apollo11", tl.samples[0].utc);
ok(st0.sunEl === tl.samples[0].sunEl, "timeline sample equals getState at same time");
throwsMsg(() => V.getTimeline("apollo11", T, 1, 1.5), /stepHours/, "fractional stepHours rejected");

// coverage
const cov = V.getCoverage();
has(cov, ["mock", "stepHours", "timeScale", "sites"], "getCoverage");
ok(cov.sites.length === 10, "coverage for 10 sites");
throwsMsg(() => V.getState("apollo11", "2035-01-01T00:00:00Z"), /OUT_OF_COVERAGE/, "out of coverage throws");
ok(V.getState("apollo11", "1969-07-20T20:00:00Z").sunEl !== undefined, "Apollo 11 landing window covered");
throwsMsg(() => V.getState("sp_haworth", "1969-07-20T20:00:00Z"), /OUT_OF_COVERAGE/, "non-landing site not covered in 1969");

// loadDaily / getDaily
throwsMsg(() => V.getDaily("2026-11-14", 3), /NOT_LOADED/, "getDaily before loadDaily");
await V.loadDaily();
const t0 = Date.now();
const daily = V.getDaily("2026-11-14", 56);
const ms = Date.now() - t0;
has(daily, ["apiVersion", "mock", "STAY_DAYS", "CLEAR_PCT", "OUT_PCT", "EDGE_DEG", "verdictRule", "sites"], "getDaily");
ok(Object.keys(daily.sites).length === 10 && daily.sites.apollo11.length === 56, "daily 10 sites x 56 days");
const row = daily.sites.im1[3];
const ref = V.getSummary("im1", row.date + "T00:00:00Z", 7);
ok(row.verdict === ref.verdict && row.pctBoth === ref.pctBoth, "daily row equals getSummary of the 7-day stay");
ok(V.getDaily("2029-12-30", 1).sites.apollo11[0] === null, "stay running past coverage end -> null row");

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log(`PASS  (MOCK=${V.MOCK}, API ${V.API_VERSION}; verdicts seen today: ${[...verdicts].join(", ")}; getDaily 10x56 in ${ms} ms)`);
