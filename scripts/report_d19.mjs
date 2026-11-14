// D19 before/after report: how much each rule changes each site's numbers, every hour 2026-2029.
//   (a) Sun as a disc            sunlight share: centre above skyline -> mean share of the disc above the skyline
//   (b) Earth's shadow           sunlight hours lost to lunar eclipses, eclipse hours at the site
//   (c) Earth's whole disc       Earth in view: centre above skyline -> whole disc clears; marginal hours
//   (d) actual Sun distance      energy of a reference panel (sun-tracking, 1 m², 30%): 1361 W/m² fixed -> distance-scaled
// Usage: node scripts/report_d19.mjs [snapshot.json]   (optional snapshot of verdicts/scores taken before D19)
import { readFileSync, existsSync } from "node:fs";
import * as V from "../lib/visibility.js";

const snapPath = process.argv[2];
const snap = snapPath && existsSync(snapPath) ? JSON.parse(readFileSync(snapPath, "utf8")) : null;
await V.loadScene();
const sites = V.listSites();
for (const s of sites) await V.loadSite(s.id);
const pct = (x) => `${x.toFixed(2)}%`;
console.log("site | sunlight share: point → (a) disc → (a+b) with eclipses | eclipse hours at site | Earth in view: centre → (c) whole disc | marginal Earth hours | panel energy 2026-29: fixed 1361 → (d) distance → all rules");
const out = {};
for (const s of sites) {
  let n = 0, point = 0, disc = 0, discEcl = 0, eclH = 0, eCentre = 0, eWhole = 0, marg = 0, eFix = 0, eDist = 0, eAll = 0;
  for (let y = 2026; y <= 2029; y++) {
    const start = Date.UTC(y, 0, 1), days = (Date.UTC(y + 1, 0, 1) - start) / 864e5;
    for (const x of V.getTimeline(s.id, start, days).samples) {
      n++;
      const pt = x.sunMarginDeg > 0;
      point += pt; disc += x.sunSkylineFraction; discEcl += x.sunFraction;
      if (x.eclipseFraction > 0 && x.sunSkylineFraction > 0) eclH++;
      eCentre += x.earthMarginDeg > 0; eWhole += x.comms; marg += x.earthMarginal;
      eFix += pt ? 1361.0 * 0.3 : 0; eDist += pt ? x.irradianceWm2 * 0.3 : 0; eAll += x.irradianceWm2 * 0.3 * x.sunFraction;
    }
  }
  const r = { point: 100 * point / n, disc: 100 * disc / n, discEcl: 100 * discEcl / n, eclH, eCentre: 100 * eCentre / n, eWhole: 100 * eWhole / n, marg,
    eFixKWh: eFix / 1000, eDistKWh: eDist / 1000, eAllKWh: eAll / 1000 };
  if (snap) {
    let vChanged = 0, dSum = 0, k = 0, before = 0, after = 0;
    for (const [d, verdict, , , , , score] of snap.sites[s.id]) {
      const now = V.getSummary(s.id, `${d}T00:00:00Z`, 7).verdict, sc = V.getScore(s.id, d).score;
      if (now !== verdict) vChanged++;
      dSum += Math.abs(sc - score); before += score; after += sc; k++;
    }
    Object.assign(r, { vChanged, days: k, meanAbsScoreChange: dSum / k, meanScoreBefore: before / k, meanScoreAfter: after / k });
  }
  out[s.id] = r;
  console.log(`${s.id} | ${pct(r.point)} → ${pct(r.disc)} → ${pct(r.discEcl)} | ${eclH} h | ${pct(r.eCentre)} → ${pct(r.eWhole)} | ${marg} h | ${r.eFixKWh.toFixed(0)} → ${r.eDistKWh.toFixed(0)} → ${r.eAllKWh.toFixed(0)} kWh` +
    (snap ? ` | verdict changed on ${r.vChanged}/${r.days} landing dates; score ${r.meanScoreBefore.toFixed(1)} → ${r.meanScoreAfter.toFixed(1)} (mean |change| ${r.meanAbsScoreChange.toFixed(2)})` : ""));
}
console.log(JSON.stringify(out));
