// Regression check for the step 2 data in data/ephem/.
// Compares the files with the 7 values Sheldon read from the JPL Horizons web app
// (2026-11-14; all 7 matched our first 7-day files to six decimals), then runs the
// PLAN step 2 sanity checks and a coverage check.
// Usage: node scripts/check_ephem.mjs   -> prints PASS or exits 1.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "ephem");
const index = JSON.parse(readFileSync(join(DIR, "index.json"), "utf8"));
const cache = {};
function at(siteId, utc) {
  const t = Date.parse(utc);
  const ch = index.sites[siteId]?.find((c) => t >= Date.parse(c.start) && t <= Date.parse(c.end));
  if (!ch) throw new Error(`no chunk for ${siteId} ${utc}`);
  const d = (cache[ch.file] ??= JSON.parse(readFileSync(join(DIR, ch.file), "utf8")));
  const i = (t - Date.parse(d.start)) / 3600e3;
  if (!Number.isInteger(i)) throw new Error(`${utc} is not on the hourly grid`);
  return { sunAz: d.sunAz[i], sunEl: d.sunEl[i], earthAz: d.earthAz[i], earthEl: d.earthEl[i] };
}

let fails = 0, maxDiff = 0;
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); fails++; } };

// Horizons web app values (Sheldon's hand-checks, 2026-11-14).
const HAND = [
  ["apollo11", "2026-11-14T12:00:00Z", "sun", 91.485723, -7.066737],
  ["apollo11", "2026-11-14T12:00:00Z", "earth", 277.587391, 64.319993],
  ["im1", "2026-11-17T08:00:00Z", "sun", 84.925818, 2.457328],
  ["im1", "2026-11-17T08:00:00Z", "earth", 352.877147, 9.295239],
  ["sp_malapert", "2026-11-20T06:00:00Z", "sun", 50.411431, 4.097569],
  ["sp_malapert", "2026-11-20T06:00:00Z", "earth", 352.405849, 7.454124],
  ["sp_malapert", "2026-11-17T08:00:00Z", "sun", 85.839251, 1.847012],
];
// sp_malapert moved under D10 (2026-11-14), so its hand-checks (made at the original point
// 86.0S, 0.3E) are compared with a full-precision Horizons fixture for that original point.
const fx = JSON.parse(readFileSync(join(DIR, "..", "checks", "handcheck_sp_malapert_original_point.json"), "utf8"));
const atFixture = (utc) => { const i = (Date.parse(utc) - Date.parse(fx.start)) / 3600e3; return { sunAz: fx.sunAz[i], sunEl: fx.sunEl[i], earthAz: fx.earthAz[i], earthEl: fx.earthEl[i] }; };
console.log("Hand-check regression (our data vs Horizons web app):");
for (const [id, utc, body, az, el] of HAND) {
  const fromFixture = id === "sp_malapert";
  const r = fromFixture ? atFixture(utc) : at(id, utc);
  const fa = r[body + "Az"], fe = r[body + "El"];
  const d = Math.max(Math.abs(fa - az), Math.abs(fe - el));
  maxDiff = Math.max(maxDiff, d);
  console.log(`  ${id.padEnd(12)} ${utc} ${body.padEnd(5)} web ${az.toFixed(6)} / ${el.toFixed(6)}  ${fromFixture ? "fixture(original point)" : "file"} ${fa} / ${fe}  diff ${d.toFixed(6)}`);
  ok(d <= (fromFixture ? 0.0000011 : 0.0006), `${id} ${utc} ${body} differs by ${d}`);
}

// PLAN step 2 sanity checks.
const a11 = at("apollo11", "1969-07-20T20:00:00Z");
console.log(`Apollo 11 landing hour 1969-07-20 20:00Z: Sun az ${a11.sunAz} el ${a11.sunEl}`);
ok(a11.sunEl > 0 && a11.sunEl < 20 && a11.sunAz > 45 && a11.sunAz < 135, "Apollo 11 low morning Sun in the east");
for (const id of ["apollo11", "apollo12", "apollo17"]) {
  const r = at(id, "2027-06-01T00:00:00Z");
  ok(r.earthEl > 30, `${id} Earth high (${r.earthEl})`);
}
for (const id of ["sp_cabeus_b_peak", "sp_haworth", "sp_malapert", "sp_nobile_rim2"]) {
  const r = at(id, "2027-06-01T00:00:00Z");
  ok(Math.abs(r.earthEl) < 10, `${id} Earth near horizon (${r.earthEl})`);
}

// Coverage: every site has 2026-2029 with no gaps; each pre-2026 landing has its window.
for (const s of sites) {
  const ch = index.sites[s.id] ?? [];
  const years = ch.filter((c) => !c.file.endsWith("landing.json"));
  ok(years.length === 4 && years[0].start === "2026-01-01T00:00:00Z" && years.at(-1).end === "2029-12-31T23:00:00Z", `${s.id} 2026-2029 coverage`);
  for (let i = 1; i < years.length; i++) ok(Date.parse(years[i].start) - Date.parse(years[i - 1].end) === 3600e3, `${s.id} gap before ${years[i].file}`);
  if (s.landingDate && Date.parse(s.landingDate) < Date.parse("2026-01-01T00:00:00Z")) {
    const L = ch.find((c) => c.file.endsWith("landing.json"));
    ok(L && Date.parse(L.start) <= Date.parse(s.landingDate) && Date.parse(L.end) >= Date.parse(s.landingDate), `${s.id} landing window`);
  }
}

ok(fx.lat === -86.0 && fx.lon === 0.3, "fixture is at the original sp_malapert point");
if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log(`PASS (7/7 hand-check rows, max diff ${maxDiff.toFixed(6)} deg; tolerance 0.1 deg)`);
