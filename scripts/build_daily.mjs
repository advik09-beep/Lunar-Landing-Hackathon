// Builds data/daily.json: for every site and every UTC date D whose STAY_DAYS-day stay (D 00:00Z, hourly)
// is fully covered, the stay's integer counts. Since D19 the counts come straight from lib/visibility.js
// (_stayCountsFor), so the daily summary and getSummary/getMetrics share one implementation.
// Usage: node scripts/build_daily.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as V from "../lib/visibility.js";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const H = 3600e3, D = 864e5;
const N = V.VERDICT_RULE.STAY_DAYS * 24;
const COLS = ["litMilliH", "litH", "commsH", "bothH", "sunEdgeH", "earthEdgeH", "longestDarkH", "darkPeriods", "contactWindows", "longestGapH",
  "sunClrPm", "earthClrPm", "partialSunH", "eclipseH", "earthMarginalH"];
const sites = V.listSites();
for (const s of sites) await V.loadSite(s.id);
const cov = V.getCoverage();
const out = { ...V.VERDICT_RULE, apiVersion: V.API_VERSION, hoursPerStay: N, columns: COLS,
  horizonModels: Object.fromEntries(cov.sites.map((c) => [c.siteId, c.terrain])), builtUtc: new Date().toISOString(), sites: {} };
let total = 0;
for (const s of sites) {
  out.sites[s.id] = [];
  for (const [a, b] of cov.sites.find((c) => c.siteId === s.id).ranges) {
    const first = Math.ceil(Date.parse(a) / D) * D, last = Date.parse(b);
    const rows = [];
    for (let day = first; day + (N - 1) * H <= last; day += D) {
      const c = V._stayCountsFor(s.id, day);
      rows.push(COLS.map((k) => c[k]));
    }
    if (rows.length) out.sites[s.id].push({ firstDate: new Date(first).toISOString().slice(0, 10), rows });
    total += rows.length;
  }
}
writeFileSync(join(DATA, "daily.json"), JSON.stringify(out));
console.log(`daily.json: ${total} rows for ${sites.length} sites`);
