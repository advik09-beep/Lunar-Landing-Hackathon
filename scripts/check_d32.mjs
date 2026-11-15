// D32 checks: Educator tour captions, best week, Report series and all-sites table, the Learn facts,
// and the brand / NASA image files.
// Usage: node scripts/check_d32.mjs   -> PASS or exit 1
import { readFileSync, statSync } from "node:fs";
import * as V from "../lib/visibility.js";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
for (const s of V.listSites()) await V.loadSite(s.id);
await V.loadDaily();
const H = 3600e3;

// 1. Educator tour captions: same stops, same sources, child words.
const T = V.TOUR_STOPS;
const sentences = (t) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
ok(T.every((x) => x.kidTitle && x.kidTitle.length <= 30 && x.kidText), "every tour stop has an Educator title (≤ 30 characters) and text");
ok(T.every((x) => !/\d|°|degree/i.test(x.kidTitle + " " + x.kidText)), "Educator captions: no digits and no degrees");
ok(T.every((x) => sentences(x.kidText).length <= 2 && sentences(x.kidText).every((s) => s.split(/\s+/).length <= 16)), `Educator captions: at most two sentences, each at most 16 words (longest ${Math.max(...T.flatMap((x) => sentences(x.kidText).map((s) => s.split(/\s+/).length)))})`);
const by = Object.fromEntries(T.map((x) => [x.id, x]));
// Same facts as the Researcher captions (spot checks of the claims that carry numbers there).
await V.loadScene();
let dMin = Infinity, dMax = -Infinity;
for (let t = Date.parse("2026-01-01T00:00:00Z"); t <= Date.parse("2029-12-31T00:00:00Z"); t += 24 * H) { const d = V.getSceneState(t).earth.distKm / V.LIGHT_SPEED_KM_S; dMin = Math.min(dMin, d); dMax = Math.max(dMax, d); }
ok(dMin > 1 && dMax < 1.5 && /a little over one second/.test(by.earth.kidText) && /a little over one second/.test(by.mars.kidText), `Earth/Mars: 'a little over one second' = ${dMin.toFixed(2)}–${dMax.toFixed(2)} s (JPL Horizons distances)`);
ok(V.MARS_LIGHT_TIME_MIN.min > 1 && /minutes/.test(by.mars.kidText) && /half the size/.test(by.mars.text) && /half as big/.test(by.mars.kidText), "Mars: minutes to Mars (JPL Horizons 5–20 min); half the size of Earth, as in the Researcher caption");
ok(/may have water ice/.test(by.mercury.text) && /may have ice/.test(by.mercury.kidText), "Mercury: 'may have ice' (NASA Mercury facts), same hedge as the Researcher caption");
ok(/brightest planet/.test(by.venus.text) && /brightest planet/.test(by.venus.kidText) && /other planets combined/.test(by.jupiter.text) && /all the other planets put together/.test(by.jupiter.kidText), "Venus brightest; Jupiter heavier than the other planets together (same facts, same sources)");
ok(/29\.5 Earth days/.test(by.moon.text) && /about a month/.test(by.moon.kidText) && /1\.5 degrees/.test(by.uranus.text) && /almost straight/.test(by.uranus.kidText), "Moon: 29.5-day lunar day = 'about a month'; Moon tilt 1.5 degrees = 'almost straight'");
ok(/900 times/.test(by.neptune.text) && /noon looks like evening/.test(by.neptune.kidText), "Neptune: NASA's dim-twilight line = 'noon looks like evening'");

// 2. Best week = highest default-weight score among the dates, = getScore from the hourly data.
for (const [id, d0] of [["sp_malapert", "2026-11-07"], ["apollo11", "2027-03-01"], ["sp_haworth", "2028-06-10"]]) {
  const bw = V.getBestWeek(id, d0, 28);
  const scores = Array.from({ length: 28 }, (_, k) => { const d = new Date(Date.parse(d0 + "T00:00:00Z") + k * 864e5).toISOString().slice(0, 10); return { d, s: V.getScore(id, d).score }; });
  const top = Math.max(...scores.map((x) => x.s));
  ok(bw.datesWithData === 28 && Math.abs(bw.best.score - top) < 1e-6 && scores.find((x) => Math.abs(x.s - top) < 1e-6).d <= bw.best.date, `best week ${id} from ${d0}: ${bw.best.date}, score ${bw.best.score.toFixed(1)} = highest getScore of the 28 dates`);
}
ok(V.getBestWeek("apollo11", "2031-01-01", 7).best === null, "best week outside the data: none (never guessed)");

// 3. Report series: monthly values from the hourly data, daily score = getScore, eclipses on NASA's list.
const S = V.getSiteSeries("sp_malapert");
const feb = V.getTimeline("sp_malapert", "2027-02-01T00:00:00Z", 28).samples;
const m = S.months.find((x) => x.month === "2027-02");
ok(S.months.length === 48 && m.hours === 672 && Math.abs(m.pctLit - (100 * feb.reduce((a, s) => a + s.sunFraction, 0)) / 672) < 1e-9 && Math.abs(m.pctComms - (100 * feb.filter((s) => s.comms).length) / 672) < 1e-9, "series: 48 months; February 2027 sunlight and Earth in view = recount from the hourly data");
ok([0, 200, 900, S.scores.length - 1].every((i) => Math.abs(S.scores[i].score - V.getScore("sp_malapert", S.scores[i].date).score) < 1e-6), `series: daily score = getScore (${S.scores.length} dates)`);
const NASA = ["2026-03-03", "2026-08-28", "2027-02-20", "2027-07-18", "2027-08-17", "2028-01-12", "2028-07-06", "2028-12-31", "2029-06-26", "2029-12-20"]; // NASA GSFC lunar eclipse list (check_d19)
const near = (iso) => NASA.some((d) => Math.abs(Date.parse(iso) - Date.parse(d + "T12:00:00Z")) < 1.5 * 864e5);
ok(S.eclipses.length > 0 && S.eclipses.every((e) => near(e.start)), `series: all ${S.eclipses.length} eclipses seen at Malapert fall on NASA's 2026–2029 lunar eclipse dates`);

// 4. All-sites table = daily summary + score.
const A = V.getAllSitesTable(), col = Object.fromEntries(A.columns.map((c, i) => [c, i]));
const nonNull = V.listSites().reduce((a, s) => a + V.getDaily("2026-01-01", 1461).sites[s.id].filter(Boolean).length, 0);
ok(A.rows.length === nonNull && new Set(A.rows.map((r) => r[0])).size === 10, `all-sites table: ${A.rows.length} rows = every site and landing date with data`);
const r = A.rows.find((x) => x[col.siteId] === "im2" && x[col.landingDate] === "2026-11-14"), mi = V.getMetrics("im2", "2026-11-14T00:00:00Z");
ok(r && Math.abs(r[col.score] - V.getScore("im2", "2026-11-14").score) < 0.051 && Math.abs(r[col.pctLit] - mi.pctLit) < 0.006 && r[col.longestDarkHours] === mi.longestDarkHours && r[col.eclipseHours] === mi.eclipseHours, `all-sites row IM-2 2026-11-14: score ${r[col.score]}, sunlight ${r[col.pctLit]}% = getScore / getMetrics`);

// 5. The Learn facts (web/src/panels/learn.ts reads the same numbers).
const st = V.getState("sp_malapert", "2026-09-19T06:00:00Z"), hz = V.getHorizon("sp_malapert");
ok(st.sunEl > 0 && !st.lit && st.sunMarginDeg < -4 && Math.abs(hz.blockDistKm[Math.round(st.sunAz) % 360] - 1.84) < 0.01, `Learn 1: Malapert 2026-09-19 06:00, Sun +${st.sunEl.toFixed(2)} above level but ${(-st.sunMarginDeg).toFixed(2)} below a ridge 1.84 km away`);
const maxSun = (id) => Math.max(...V.getTimeline(id, "2026-11-14T00:00:00Z", 30).samples.map((s) => s.sunEl));
ok(maxSun("apollo11") > 80 && maxSun("sp_malapert") < 8, `Learn 2: highest Sun in 30 days, Apollo 11 ${maxSun("apollo11").toFixed(1)} vs Malapert ${maxSun("sp_malapert").toFixed(1)}`);
const dn = V.getTimeline("apollo11", "2026-11-14T00:00:00Z", 120).samples, rises = dn.flatMap((s, i) => (i && s.lit && !dn[i - 1].lit ? [Date.parse(s.utc)] : []));
const spans = rises.slice(1).map((t, i) => (t - rises[i]) / 864e5);
ok(spans.length >= 3 && spans.every((d) => Math.abs(d - 29.53) < 0.3), `Learn 3: Apollo 11 sunrise to sunrise ${spans.map((d) => d.toFixed(2)).join(", ")} days ≈ 29.5`);
const ea = V.getTimeline("apollo11", "2026-11-14T00:00:00Z", 30).samples;
const span = (f) => Math.max(...ea.map(f)) - Math.min(...ea.map(f));
ok(span((s) => s.earthEl) < 20 && span((s) => s.earthAz) < 40 && span((s) => s.sunEl) > 150, `Learn 4: Earth stays put at Apollo 11 (height range ${span((s) => s.earthEl).toFixed(1)}, direction range ${span((s) => s.earthAz).toFixed(1)}) while the Sun's height ranges ${span((s) => s.sunEl).toFixed(1)}`);

// 6. Files: brand images (PNG) and the two NASA photos (small JPEGs).
const png = (p) => readFileSync(new URL(p, import.meta.url)).subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
ok(png("../web/public/brand/lunlux-wordmark.png") && png("../web/public/brand/lunlux-icon.png"), "brand: lunlux-wordmark.png and lunlux-icon.png are PNG files");
const jpg = (p) => { const b = readFileSync(new URL(p, import.meta.url)); return b[0] === 0xff && b[1] === 0xd8 && statSync(new URL(p, import.meta.url)).size < 100e3; };
ok(jpg("../web/src/panels/img/nasa_apollo8_earthrise.jpg") && jpg("../web/src/panels/img/nasa_pia13523_south_pole.jpg"), "NASA photos: JPEG, each under 100 KB");

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
