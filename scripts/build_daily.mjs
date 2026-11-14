// Builds data/daily.json from data/ephem/: for every site and every UTC date D whose
// STAY_DAYS-day stay (D 00:00Z, hourly, STAY_DAYS*24 samples) is fully covered, the
// stay's hour counts and verdict. lib/visibility.js turns counts into percentages, so
// getDaily rows equal getSummary(site, D, STAY_DAYS) exactly.
// Usage: node scripts/build_daily.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VERDICT_RULE, verdictOf } from "../lib/verdict.js";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const H = 3600e3, D = 864e5;
const N = VERDICT_RULE.STAY_DAYS * 24;
const EDGE = VERDICT_RULE.EDGE_DEG;
const index = JSON.parse(readFileSync(join(DATA, "ephem", "index.json"), "utf8"));

const out = { ...VERDICT_RULE, horizonModel: "flat", hoursPerStay: N,
  columns: ["litH", "commsH", "bothH", "sunEdgeH", "earthEdgeH", "longestDarkH", "verdict"],
  builtUtc: new Date().toISOString(), sites: {} };

for (const [siteId, chunks] of Object.entries(index.sites)) {
  // Merge chunks into contiguous runs of samples.
  const runs = [];
  for (const c of chunks.slice().sort((a, b) => Date.parse(a.start) - Date.parse(b.start))) {
    const d = JSON.parse(readFileSync(join(DATA, "ephem", c.file), "utf8"));
    const start = Date.parse(d.start);
    const last = runs.at(-1);
    if (last && start === last.start + last.sunEl.length * H) {
      last.sunEl.push(...d.sunEl); last.earthEl.push(...d.earthEl);
    } else runs.push({ start, sunEl: [...d.sunEl], earthEl: [...d.earthEl] });
  }
  out.sites[siteId] = [];
  for (const r of runs) {
    const firstDay = Math.ceil(r.start / D) * D;
    const rows = [];
    for (let day = firstDay; (day - r.start) / H + N <= r.sunEl.length; day += D) {
      const i0 = (day - r.start) / H;
      let lit = 0, comms = 0, both = 0, se = 0, ee = 0, dark = 0, longest = 0;
      for (let i = i0; i < i0 + N; i++) {
        const s = r.sunEl[i], e = r.earthEl[i];
        const L = s > 0, C = e > 0;
        if (L) lit++; if (C) comms++; if (L && C) both++;
        if (Math.abs(s) <= EDGE) se++; if (Math.abs(e) <= EDGE) ee++;
        dark = L ? 0 : dark + 1; longest = Math.max(longest, dark);
      }
      const pct = (k) => (100 * k) / N;
      rows.push([lit, comms, both, se, ee, longest,
        verdictOf({ pctBoth: pct(both), pctSunEdge: pct(se), pctEarthEdge: pct(ee) })]);
    }
    if (rows.length) out.sites[siteId].push({ firstDate: new Date(firstDay).toISOString().slice(0, 10), rows });
  }
}
writeFileSync(join(DATA, "daily.json"), JSON.stringify(out));
const total = Object.values(out.sites).flat().reduce((n, s) => n + s.rows.length, 0);
console.log(`daily.json: ${total} rows for ${Object.keys(out.sites).length} sites`);
