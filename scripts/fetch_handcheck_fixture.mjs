// Saves Horizons values at sp_malapert's ORIGINAL point (86.0S, 0.3E, before D10 moved the site)
// for the window holding Sheldon's two sp_malapert hand-checks, at full Horizons precision.
// scripts/check_ephem.mjs compares the hand-check values against this file, so the
// regression stays exact even though data/ephem/sp_malapert/ now uses the D10 point.
// Usage: node scripts/fetch_handcheck_fixture.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { query, pause, ALT_KM } from "./horizons_api.mjs";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "checks");
mkdirSync(OUT, { recursive: true });
const site = { id: "sp_malapert_original_point", lat: -86.0, lon: 0.3 };
const start = Date.parse("2026-11-17T00:00:00Z"), stop = Date.parse("2026-11-21T00:00:00Z");
const sun = await query(site, "10", start, stop);
await pause(1500);
const earth = await query(site, "399", start, stop);
writeFileSync(join(OUT, "handcheck_sp_malapert_original_point.json"), JSON.stringify({
  note: "sp_malapert original representative point (before D10). Full Horizons precision. Used only by scripts/check_ephem.mjs.",
  lat: site.lat, lon: site.lon, altKm: ALT_KM, start: sun.rows[0].utc, stepHours: 1, count: sun.rows.length,
  horizonsHeader: sun.header, fetchedUtc: new Date().toISOString(),
  sunAz: sun.rows.map((r) => r.az), sunEl: sun.rows.map((r) => r.el),
  earthAz: earth.rows.map((r) => r.az), earthEl: earth.rows.map((r) => r.el),
}));
console.log(`fixture: ${sun.rows.length} rows ${sun.rows[0].utc} .. ${sun.rows.at(-1).utc}`);
