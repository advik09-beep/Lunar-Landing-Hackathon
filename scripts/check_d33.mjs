// D33 checks: Researcher stay length (1, 3, 7 or 14 days) and the text cleanup in /lib.
// Every stay length must give the same numbers from its daily table as from the hourly data.
// Usage: node scripts/check_d33.mjs   -> PASS or exit 1
import * as V from "../lib/visibility.js";
import * as SCORE from "../lib/score.js";
import * as RESEARCH from "../lib/research.js";
import * as TOUR from "../lib/tour.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const sites = V.listSites();
for (const s of sites) await V.loadSite(s.id);
for (const n of V.STAY_OPTIONS) await V.loadDaily(n);
const D = 864e5, close = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

ok(JSON.stringify(V.STAY_OPTIONS) === "[1,3,7,14]", "stay options: 1, 3, 7, 14 days");
try { await V.loadDaily(5); ok(false, "a 5-day stay is rejected"); } catch (e) { ok(e instanceof RangeError, "a 5-day stay is rejected (RangeError)"); }

// 1. Each daily table = getSummary / getMetrics of that stay length (every 10th row, all sites).
for (const n of V.STAY_OPTIONS) {
  let checked = 0, bad = 0;
  const daily = V.getDaily("2026-01-01", 1461, n);
  ok(daily.STAY_DAYS === n, `${n}-day table reports STAY_DAYS ${n}`);
  for (const s of sites) daily.sites[s.id].forEach((r, i) => {
    if (!r || i % 10) return;
    checked++;
    const t = `${r.date}T00:00:00Z`, sm = V.getSummary(s.id, t, n), m = V.getMetrics(s.id, t, n);
    if (r.hours !== n * 24 || r.verdict !== sm.verdict || !close(r.pctLit, sm.pctLit) || !close(r.pctBoth, sm.pctBoth) || r.longestDarkHours !== m.longestDarkHours
      || r.longestContactGapHours !== m.longestContactGapHours || r.clearance !== m.clearance || r.eclipseHours !== m.eclipseHours) bad++;
  });
  ok(bad === 0 && checked > 1400, `${n}-day stays: ${checked} daily rows = getSummary / getMetrics from the hourly data`);
}

// 2. Score, ranking, best stay, requirements, comparison and tables follow the stay length.
const date = "2026-11-14";
for (const n of [1, 3, 14]) {
  const r = V.getRanking(date, undefined, "all", n);
  ok(r.stayDays === n && r.ranking.filter((x) => x.available).every((x) => close(x.score, V.getScore(x.siteId, date, undefined, n).score, 1e-6)), `${n}-day ranking: every score = getScore from the hourly data (top ${r.ranking[0].shortName} ${r.ranking[0].score.toFixed(1)})`);
  const bw = V.getBestWeek("sp_malapert", "2026-11-07", 28, n);
  const top = Math.max(...Array.from({ length: 28 }, (_, k) => V.getScore("sp_malapert", new Date(Date.parse("2026-11-07T00:00:00Z") + k * D).toISOString().slice(0, 10), undefined, n).score));
  ok(bw.stayDays === n && close(bw.best.score, top, 1e-6), `${n}-day best stay at Malapert: ${bw.best.date} (score ${bw.best.score.toFixed(1)} = highest getScore)`);
  const q = V.checkRequirements(date, { maxDarkHours: 24 }, "all", n);
  ok(q.stayDays === n && q.results.every((x) => !x.available || x.pass === (V.getMetrics(x.siteId, `${date}T00:00:00Z`, n).longestDarkHours <= 24)), `${n}-day requirements: pass/fail = the stay's own longest blackout (${q.passCount} pass)`);
  const c = V.compareScenarios({ siteId: "apollo11", landingDate: date, stayDays: n }, { siteId: "sp_haworth", landingDate: date, stayDays: n });
  ok(c.a.stayDays === n && close(c.a.pctLit, V.getMetrics("apollo11", `${date}T00:00:00Z`, n).pctLit) && close(c.b.score, V.getScore("sp_haworth", date, undefined, n).score, 1e-6), `${n}-day A/B comparison uses ${n}-day stays`);
  const T = V.getAllSitesTable(n);
  ok(T.stayDays === n && T.rows.length === sites.reduce((a, s) => a + V.getDaily("2026-01-01", 1461, n).sites[s.id].filter(Boolean).length, 0) && new RegExp(`${n}-day stay`).test(T.note), `${n}-day all-sites table: ${T.rows.length} rows`);
  const S = V.getSiteSeries("apollo11", n);
  ok(S.stayDays === n && close(S.scores[100].score, V.getScore("apollo11", S.scores[100].date, undefined, n).score, 1e-6), `${n}-day series: daily score = getScore`);
  ok(V.getMonthlyScores("apollo11", n).stayDays === n, `${n}-day best and worst months`);
}
// 7 days is unchanged by the new parameter.
ok(JSON.stringify(V.getRanking(date)) === JSON.stringify(V.getRanking(date, undefined, "all", 7)) && V.getBestWeek("sp_malapert", "2026-11-07", 28).best.date === "2026-11-22", "default 7-day results unchanged (ranking; Malapert best week 2026-11-22)");
// Sanity: shorter stays swing more (more Clear and Out, fewer Partial), as expected for a 29.5-day lunar day.
const share = (n) => { const all = sites.flatMap((s) => V.getDaily("2026-01-01", 1461, n).sites[s.id].filter(Boolean)); return { clearOut: all.filter((r) => r.verdict === "clear" || r.verdict === "out").length / all.length }; };
ok(share(1).clearOut > share(7).clearOut && share(7).clearOut > share(14).clearOut, `Clear-or-Out share falls as the stay grows: 1 day ${(100 * share(1).clearOut).toFixed(0)}%, 7 days ${(100 * share(7).clearOut).toFixed(0)}%, 14 days ${(100 * share(14).clearOut).toFixed(0)}%`);

// 3. Text cleanup in /lib: no PROTOTYPE tags, no middle-dot separators; the own-formula sentence.
const strings = [];
const walk = (v) => { if (typeof v === "string") strings.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); };
[V, SCORE, RESEARCH, TOUR].forEach((m) => Object.values(m).forEach(walk));
walk(V.getRanking(date)); walk(V.getAllSitesTable().note); walk(V.getSiteSeries("apollo11").notes);
ok(!strings.some((x) => /prototype/i.test(x)) && !strings.some((x) => x.includes("·")), `/lib strings: no PROTOTYPE and no middle dots (${strings.length} strings)`);
ok(V.SCORE_OWN_FORMULA === "The Sun and Earth score is this team's own formula, not a NASA standard." && V.getRanking(date).teamFormula === true, "own-formula sentence exported; ranking marked teamFormula");

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
