// D16 (power and comms metrics, power calculator) and D17 (best-site score, PROTOTYPE) checks.
// Usage: node scripts/check_metrics.mjs   -> prints PASS or exits 1.
import * as V from "../lib/visibility.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const sites = V.listSites();
for (const s of sites) await V.loadSite(s.id);
await V.loadDaily();

// Independent recount of the D16 metrics from getTimeline (hour by hour).
function recount(siteId, start, days = 7) {
  const s = V.getTimeline(siteId, start, days).samples;
  const runs = (flag) => { let n = 0, longest = 0, cur = 0, prev = null; for (const x of s) { const v = flag(x); if (v && prev !== true) n++; cur = v ? cur + 1 : 0; longest = Math.max(longest, cur); prev = v; } return { n, longest }; };
  const dark = runs((x) => !x.lit), contact = runs((x) => x.comms), gap = runs((x) => !x.comms);
  // D19: sunlight share = mean visible fraction of the Sun's disc (rounded to milli-hours like lib/daily)
  return { hours: s.length, pctLit: (100 * Math.round(1000 * s.reduce((a, x) => a + x.sunFraction, 0))) / 1000 / s.length, pctComms: (100 * s.filter((x) => x.comms).length) / s.length,
    longestDarkHours: dark.longest, darkPeriods: dark.n, longestContactGapHours: gap.longest, contactWindows: contact.n };
}

// 1. getMetrics equals the recount (all sites, three dates).
let m1 = 0;
for (const s of sites) for (const d of ["2026-03-01", "2027-07-15", "2029-12-01"]) {
  const a = V.getMetrics(s.id, `${d}T00:00:00Z`), b = recount(s.id, `${d}T00:00:00Z`);
  for (const k of Object.keys(b)) if (!near(a[k], b[k])) { m1++; console.log(`   ${s.id} ${d} ${k}: ${a[k]} vs ${b[k]}`); }
}
ok(m1 === 0, "getMetrics equals an hour-by-hour recount from getTimeline (10 sites x 3 dates)");
ok(V.getMetrics("im2", "2026-11-14T00:00:00Z").horizonModel === "lola", "metrics are terrain-aware (horizonModel lola)");

// 2. Every daily-summary row's D16 fields equal getMetrics for that stay.
let rows = 0, m2 = 0;
for (const s of sites) for (const [a, b] of V.getCoverage().sites.find((c) => c.siteId === s.id).ranges) {
  const startDay = new Date(Math.ceil(Date.parse(a) / 864e5) * 864e5).toISOString().slice(0, 10);
  const n = Math.floor((Date.parse(b) - Date.parse(startDay)) / 864e5) + 1;
  for (const r of V.getDaily(startDay, n).sites[s.id]) {
    if (!r) continue;
    const m = V.getMetrics(s.id, `${r.date}T00:00:00Z`);
    for (const k of ["pctLit", "pctComms", "longestDarkHours", "darkPeriods", "longestContactGapHours", "contactWindows", "sunClearance", "earthClearance", "clearance"]) if (!near(r[k], m[k])) { m2++; break; }
    rows++;
  }
}
ok(m2 === 0 && rows === 14694, `all ${rows} daily rows: D16 fields and clearance equal getMetrics`);

// 3. Power: a worked example a judge can follow.
console.log("\nWorked power example: IM-2, 7-day stay from 2026-11-14 00:00 UTC, sun-tracking panel 1 m², 30% efficient, lander draws 100 W");
const ex = { siteId: "im2", startUtc: "2026-11-14T00:00:00Z", areaM2: 1, efficiency: 0.30, panel: "tracking", loadW: 100 };
const p = V.computePower(ex);
await V.loadScene();
const tl = V.getTimeline("im2", ex.startUtc, 7).samples;
// Independent irradiance from the Horizons Sun distance (scene data) and NASA's 1361 W/m² at 149.598 million km.
const irr = tl.map((x) => 1361.0 * (149.598e6 / V.getSceneState(x.utc).sun.distKm) ** 2);
const meanIrr = irr.reduce((a, b) => a + b, 0) / tl.length;
const fullH = tl.filter((x) => x.sunFraction === 1).length, partial = tl.filter((x) => x.sunFraction > 0 && x.sunFraction < 1);
const sunHours = tl.reduce((a, x) => a + x.sunFraction, 0);
const energy = tl.reduce((a, x, i) => a + irr[i] * 1 * 0.30 * x.sunFraction, 0);
let run = 0, noPow = 0; for (const x of tl) { run = x.sunFraction > 0 ? 0 : run + 1; noPow = Math.max(noPow, run); }
const avg = energy / 168, need = 100 * 168, battery = 100 * noPow;
console.log(`  1. Sunlight strength this week: 1361 W/m² × (149.598 million km ÷ Sun distance)² ≈ ${meanIrr.toFixed(1)} W/m² on average (Sun ${(V.getSceneState(tl[0].utc).sun.distKm / 1e6).toFixed(2)} million km away)`);
console.log(`  2. Visible Sun: full disc for ${fullH} hours, part of the disc for ${partial.length} hours → ${sunHours.toFixed(2)} "full-Sun hours" out of 168`);
console.log(`  3. Energy = Σ (sunlight strength × 1 m² × 0.30 × visible share of the disc) = ${energy.toFixed(1)} Wh (${(energy / 1000).toFixed(1)} kWh); roughly ${meanIrr.toFixed(0)} × 0.30 × ${sunHours.toFixed(1)} h`);
console.log(`  4. Average power = ${energy.toFixed(1)} Wh ÷ 168 h = ${avg.toFixed(1)} W; the lander needs 100 W × 168 h = ${need} Wh`);
console.log(`  5. Longest stretch with no sunlight at all = ${noPow} h, so the battery must hold 100 W × ${noPow} h = ${battery} Wh`);
ok(p.irradianceWm2 === 1361.0 && near(p.meanIrradianceWm2, meanIrr, 1e-9), `mean sunlight strength ${p.meanIrradianceWm2.toFixed(2)} W/m² from the actual Sun distance`);
ok(near(p.energyWh, energy, 1e-9) && near(p.averageW, avg, 1e-9), `energy ${p.energyWh.toFixed(1)} Wh and average ${p.averageW.toFixed(1)} W match the hand calculation`);
ok(p.loadEnergyWh === need && p.batteryWh === battery && p.longestNoPowerHours === noPow, `battery ${p.batteryWh} Wh = 100 W × ${noPow} h`);
ok(p.estimate === true && p.assumptions.length >= 6 && p.assumptions.some((a) => /149\.598/.test(a)) && p.assumptions.some((a) => /disc/.test(a)), "labeled an estimate; assumptions list the Sun-distance scaling and the disc rule");

// Fixed flat panel: output also scales with sin(Sun elevation).
const pf = V.computePower({ ...ex, panel: "fixed-flat" });
const flatEnergy = tl.reduce((a, x, i) => a + irr[i] * 0.30 * x.sunFraction * Math.max(0, Math.sin((x.sunEl * Math.PI) / 180)), 0);
ok(near(pf.energyWh, flatEnergy, 1e-9) && pf.energyWh < p.energyWh, `fixed flat panel: ${pf.energyWh.toFixed(1)} Wh = Σ irradiance × 0.30 × visible share × sin(elevation) (less than tracking)`);
const bad = (o, re, m) => { try { V.computePower({ ...ex, ...o }); ok(false, m); } catch (e) { ok(re.test(e.message), m); } };
bad({ areaM2: 0 }, /areaM2/, "rejects zero area"); bad({ efficiency: 1.5 }, /efficiency/, "rejects efficiency > 100%");
bad({ panel: "tilted" }, /panel/, "rejects unknown panel type"); bad({ loadW: -1 }, /loadW/, "rejects negative load");

// 4. D17 "Sun and Earth score" (PROTOTYPE, with the 2026-11-14 amendment: clearance + slip tolerance).
const date = "2026-11-14";
const r = V.getRanking(date);
ok(r.prototype === true && r.isDefault && JSON.stringify(r.weights) === JSON.stringify(V.SCORE_DEFAULT_WEIGHTS), "ranking is labeled prototype and uses the default weights");
ok(V.SCORE_LABEL === "Sun and Earth score" && /does not mean the site is safe/.test(V.SCORE_MEANING), "label 'Sun and Earth score' with a line on what 100 does and does not mean");
ok(/not a NASA standard/.test(V.WEIGHTS_STATEMENT) && Object.keys(V.WEIGHT_REASONS).length === 6, "a reason for each of the six weights, stated as the team's judgment");
let m4 = 0;
for (const x of r.ranking) { const g = V.getScore(x.siteId, date).score; if (!near(x.score, g) || x.score < 0 || x.score > 100) m4++; }
ok(m4 === 0, "every site: ranking score (daily summary) equals getScore (hourly data), within 0..100");
ok(r.ranking.every((x, i) => i === 0 || r.ranking[i - 1].score >= x.score), "ranking is sorted best first");
const explicit = V.getRanking(date, { ...V.SCORE_DEFAULT_WEIGHTS });
ok(explicit.ranking.every((x, i) => x.siteId === r.ranking[i].siteId && x.score === r.ranking[i].score), "Educator (defaults) and Researcher at default weights give identical numbers");
const sunOnly = V.getRanking(date, { sunlight: 100, earth: 0, shortDark: 0, shortGap: 0, clearance: 0, slip: 0 });
ok(sunOnly.ranking.map((x) => x.siteId).join() !== r.ranking.map((x) => x.siteId).join() && !sunOnly.isDefault, "changing weights re-ranks (sunlight-only weights give a different order)");
ok(V.getRanking(date, { sunlight: 0, earth: 0, shortDark: 0, shortGap: 0, clearance: 0, slip: 0 }).ranking.every((x) => x.score === null), "all-zero weights give no score (not a fake number)");

// Worked score example (same stay as the power example), every term from first principles.
const t0 = Date.parse(`${date}T00:00:00Z`);
const tl2 = V.getTimeline("im2", t0, 7).samples;
const K = V.CLEARANCE_FULL_DEG;
const clr = (vis, key) => { const v = tl2.filter((x) => x[vis]); return v.length ? Math.round((1000 * v.reduce((a, x) => a + Math.min(x[key], K) / K, 0)) / v.length) : 0; };
const Csun = clr("lit", "sunMarginDeg"), Cearth = clr("comms", "earthMarginDeg"), C = Math.round((Csun + Cearth) / 2) / 1000;
const mm = V.getMetrics("im2", t0);
const S = mm.pctLit / 100, E = mm.pctComms / 100, D = 1 - mm.longestDarkHours / 168, G = 1 - mm.longestContactGapHours / 168;
const W = V.SCORE_DEFAULT_WEIGHTS;
const base5 = (m) => (100 * (W.sunlight * m.pctLit / 100 + W.earth * m.pctComms / 100 + W.shortDark * (1 - m.longestDarkHours / 168) + W.shortGap * (1 - m.longestContactGapHours / 168) + W.clearance * m.clearance)) / (W.sunlight + W.earth + W.shortDark + W.shortGap + W.clearance);
const bases = [-3, -2, -1, 0, 1, 2, 3].map((k) => base5(V.getMetrics("im2", t0 + k * 864e5)));
const T = 1 - Math.max(0, bases[3] - Math.min(...bases)) / 100;
const hand = (W.sunlight * S + W.earth * E + W.shortDark * D + W.shortGap * G + W.clearance * C + W.slip * T) * 100 / 100;
console.log(`\nWorked score example: IM-2, ${date} (default weights ${Object.values(W).join("/")}):`);
console.log(`  S = ${S.toFixed(3)}, E = ${E.toFixed(3)}, D = 1 − ${mm.longestDarkHours}/168 = ${D.toFixed(3)}, G = 1 − ${mm.longestContactGapHours}/168 = ${G.toFixed(3)}`);
console.log(`  C = (Sun ${(Csun / 1000).toFixed(3)} + Earth ${(Cearth / 1000).toFixed(3)}) ÷ 2 = ${C.toFixed(3)}   (mean of min(height above skyline, ${K}°) ÷ ${K}° while visible)`);
console.log(`  five-term scores for ${date} −3..+3 days: ${bases.map((b) => b.toFixed(1)).join(", ")} → drop ${(bases[3] - Math.min(...bases)).toFixed(1)} → T = ${T.toFixed(3)}`);
console.log(`  score = (25·${S.toFixed(3)} + 20·${E.toFixed(3)} + 15·${D.toFixed(3)} + 10·${G.toFixed(3)} + 15·${C.toFixed(3)} + 15·${T.toFixed(3)}) × 100 ÷ 100 = ${hand.toFixed(1)}`);
ok(near(V.getScore("im2", date).score, hand, 1e-9), `getScore = hand calculation (${hand.toFixed(1)})`);
console.log(`  top site for ${date}: ${r.ranking[0].name} (${r.ranking[0].score.toFixed(1)})`);

// 5. Spread: how many site-dates score 95 or more, old formula vs amended formula (all sites, 2026-01-04 .. 2029-12-22).
const oldScore = (m) => 35 * m.pctLit / 100 + 25 * m.pctComms / 100 + 25 * (1 - m.longestDarkHours / 168) + 15 * (1 - m.longestContactGapHours / 168);
let nOld = 0, nNew = 0, nTot = 0, n100Old = 0, n100New = 0;
const histOld = [0, 0, 0, 0, 0], histNew = [0, 0, 0, 0, 0];
for (let t = Date.parse("2026-01-04T00:00:00Z"); t <= Date.parse("2029-12-22T00:00:00Z"); t += 864e5) {
  const d = new Date(t).toISOString().slice(0, 10);
  const rk = V.getRanking(d);
  for (const x of rk.ranking) {
    if (!x.available) continue;
    const o = oldScore(x.metrics), n = x.score;
    nTot++; if (o >= 95) nOld++; if (n >= 95) nNew++; if (o >= 99.95) n100Old++; if (n >= 99.95) n100New++;
    histOld[Math.min(4, Math.floor(o / 20))]++; histNew[Math.min(4, Math.floor(n / 20))]++;
  }
}
console.log(`\nSpread over ${nTot} site-dates: score >= 95 old ${nOld} (${(100 * nOld / nTot).toFixed(1)}%) -> new ${nNew} (${(100 * nNew / nTot).toFixed(1)}%); score 100 old ${n100Old} -> new ${n100New}`);
console.log(`  bands 0-20/20-40/40-60/60-80/80-100: old ${histOld.join("/")}  new ${histNew.join("/")}`);
ok(nNew < nOld, "fewer site-dates reach 95+ under the amended formula (scale not compressed or capped)");

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
