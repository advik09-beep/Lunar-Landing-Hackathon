// Builds data/daily.json: for every site and every UTC date D whose STAY_DAYS-day stay (D 00:00Z, hourly)
// is fully covered, the stay's integer counts. Since D19 the counts come straight from lib/visibility.js
// (_stayCountsFor), so the daily summary and getSummary/getMetrics share one implementation.
// Usage: node scripts/build_daily.mjs [stayDays]   (7 = data/daily.json; 1, 3, 14 = data/ephem/_daily/daily_<n>.json, D33)
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as V from "../lib/visibility.js";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const H = 3600e3, D = 864e5;
const STAY = Number(process.argv[2] ?? V.VERDICT_RULE.STAY_DAYS);
if (!V.STAY_OPTIONS.includes(STAY)) throw new Error(`stayDays must be one of ${V.STAY_OPTIONS}`);
const N = STAY * 24;
const COLS = ["litMilliH", "litH", "commsH", "bothH", "sunEdgeH", "earthEdgeH", "longestDarkH", "darkPeriods", "contactWindows", "longestGapH",
  "sunClrPm", "earthClrPm", "partialSunH", "eclipseH", "earthMarginalH"];
const sites = V.listSites();
for (const s of sites) await V.loadSite(s.id);
const cov = V.getCoverage();
const out = { ...V.VERDICT_RULE, STAY_DAYS: STAY, apiVersion: V.API_VERSION, hoursPerStay: N, columns: COLS,
  horizonModels: Object.fromEntries(cov.sites.map((c) => [c.siteId, c.terrain])), builtUtc: new Date().toISOString(), sites: {} };
let total = 0;
for (const s of sites) {
  out.sites[s.id] = [];
  for (const [a, b] of cov.sites.find((c) => c.siteId === s.id).ranges) {
    const first = Math.ceil(Date.parse(a) / D) * D, last = Date.parse(b);
    const rows = [];
    for (let day = first; day + (N - 1) * H <= last; day += D) {
      const c = V._stayCountsFor(s.id, day, STAY);
      rows.push(COLS.map((k) => c[k]));
    }
    if (rows.length) out.sites[s.id].push({ firstDate: new Date(first).toISOString().slice(0, 10), rows });
    total += rows.length;
  }
}
const file = STAY === V.VERDICT_RULE.STAY_DAYS ? join(DATA, "daily.json") : join(DATA, "ephem", "_daily", `daily_${STAY}.json`);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(out));
console.log(`${file.slice(DATA.length + 1)}: ${total} rows for ${sites.length} sites (${STAY}-day stays)`);
