// D28 checks: mission requirements filter and A/B scenario comparison.
// Usage: node scripts/check_d28.mjs   -> PASS or exit 1
import * as V from "../lib/visibility.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const s of V.listSites()) await V.loadSite(s.id);
await V.loadDaily();
const date = "2026-11-14";

// 1. Slopes in the index equal the terrain files.
ok(V.listSites().every((s) => V.getHorizon(s.id).localSlope.over100m.slopeDeg === V.checkRequirements(date, {}).results.find((x) => x.siteId === s.id).values.slopeDeg), "slope used by the filter = local slope in each site's terrain file");

// 2. Requirements: pass/fail agrees with the values, every failing limit is named.
const limits = { maxDarkHours: 48, maxGapHours: 24, minSunPct: 50, minEarthPct: 80, maxSlopeDeg: 10 };
const r = V.checkRequirements(date, limits);
let bad = 0;
for (const x of r.results) {
  const m = V.getMetrics(x.siteId, `${date}T00:00:00Z`), slope = V.getHorizon(x.siteId).localSlope.over100m.slopeDeg;
  const expect = [m.longestDarkHours > 48 && "maxDarkHours", m.longestContactGapHours > 24 && "maxGapHours", m.pctLit < 50 && "minSunPct", m.pctComms < 80 && "minEarthPct", slope > 10 && "maxSlopeDeg"].filter(Boolean);
  const got = x.failures.map((f) => f.key);
  if (JSON.stringify(expect) !== JSON.stringify(got) || x.pass !== (expect.length === 0) || x.failures.some((f) => !x.words.includes(f.label))) bad++;
}
ok(bad === 0, `all ${r.results.length} sites: pass/fail and the named failing limits match their own numbers (${r.passCount} pass)`);
const im1 = r.results.find((x) => x.siteId === "im1");
ok(im1.failures.some((f) => f.key === "maxSlopeDeg") && /Local slope over 100 m is 11\.7°, over your limit of 10\.0°/.test(im1.words), `named in words: "${im1.failures.find((f) => f.key === "maxSlopeDeg").words}"`);
ok(V.checkRequirements(date, {}).results.every((x) => x.pass), "no limits set: every site passes");
const rc = V.checkRequirements(date, limits, "candidate");
ok(rc.results.every((x) => x.category === "candidate") && rc.results.length === 4, "filter 'candidate' tests only the four candidate sites");
try { V.checkRequirements(date, { maxWind: 3 }); ok(false, "unknown limit rejected"); } catch (e) { ok(/unknown requirement/.test(e.message), "unknown limit rejected"); }
ok(V.checkRequirements("2031-01-01", limits).results.every((x) => !x.available && !x.pass), "outside the data: 'No data', never a guessed pass");

// 3. A/B comparison: values equal the per-site numbers; differences point the right way; symmetry.
const A = { siteId: "apollo11", landingDate: date }, B = { siteId: "sp_nobile_rim2", landingDate: date };
const c = V.compareScenarios(A, B);
const mA = V.getMetrics("apollo11", `${date}T00:00:00Z`), mB = V.getMetrics("sp_nobile_rim2", `${date}T00:00:00Z`);
ok(c.a.pctLit === mA.pctLit && c.b.longestContactGapHours === mB.longestContactGapHours && c.a.score === V.getScore("apollo11", date).score, "A and B values equal getMetrics / getScore");
ok(c.differences.some((d) => /^Sunlight share: B is better/.test(d)) && c.differences.some((d) => /^Longest gap without Earth: A is better/.test(d)), "differences point the right way (B more sunlight, A shorter Earth gap)");
const same = V.compareScenarios(A, A);
ok(same.differences.slice(1).every((d) => /about the same/.test(d)) && /even/.test(same.overall), "comparing a scenario with itself: 'about the same' on every measure, overall even");
const swapped = V.compareScenarios(B, A);
const flip = (s) => s.replace(/\bA is better/, "X").replace(/\bB is better/, "A is better").replace("X", "B is better");
ok(c.differences.slice(1).every((d, i) => /about the same/.test(d) ? /about the same/.test(swapped.differences[i + 1]) : flip(d.split(" (")[0]) === swapped.differences[i + 1].split(" (")[0]), "swapping A and B mirrors every difference");
ok(c.notes.some((n) => /Historic landings are past missions/.test(n)), "a historic landing in the pair is labeled as a comparison");
console.log("     example:\n       " + c.differences.join("\n       ") + "\n       " + c.overall);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
