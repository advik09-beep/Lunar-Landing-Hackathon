// Step 7: downloads the LOLA GDR south polar DEMs used for terrain horizons into
// data/raw/ (gitignored). Labels (.lbl) are saved next to each file.
// Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
// Usage: node scripts/fetch_lola.mjs
//   Full files: ldem_80s_80m, ldem_75s_120m, ldem_60s_240m (~115-120 MB each).
//   ldem_80s_20m (1.85 GB) is NOT downloaded whole: only the rows covering +-22 km
//   around sp_malapert are fetched with an HTTP range request.
import { createWriteStream, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/";
const RAW = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "raw");
mkdirSync(RAW, { recursive: true });
writeFileSync(join(RAW, ".gitignore"), "*\n");

async function get(name, out, range) {
  const res = await fetch(BASE + name, range ? { headers: { Range: `bytes=${range[0]}-${range[1]}` } } : {});
  if (!(res.ok || res.status === 206)) throw new Error(`HTTP ${res.status} for ${name}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(out));
}

for (const f of ["ldem_80s_80m", "ldem_75s_120m", "ldem_60s_240m", "ldem_80s_20m"]) {
  await get(`${f}.lbl`, join(RAW, `${f}.lbl`));
}

for (const f of ["ldem_80s_80m", "ldem_75s_120m", "ldem_60s_240m"]) {
  const out = join(RAW, `${f}.img`);
  if (existsSync(out)) { console.log(`skip ${f}`); continue; }
  const t = Date.now();
  await get(`${f}.img`, out);
  console.log(`${f}.img ${statSync(out).size} bytes in ${((Date.now() - t) / 1000).toFixed(0)} s`);
}

// 20 m window around sp_malapert (86.0S, 0.3E). Pixel position from the PDS polar
// stereographic definition (catalog/dsmap_polar.cat): r = 2R tan(colat/2), south: lon 0 up, 90E right.
const R = 1737400, LAT = -86.0, LON = 0.3, N = 30400, OFF = 15199.5, SCALE = 20, RECORD = 60800;
const r = 2 * R * Math.tan(((90 - Math.abs(LAT)) * Math.PI) / 360);
const row = OFF - (r * Math.cos((LON * Math.PI) / 180)) / SCALE;
const HALF = 1100; // rows = 22 km
const r0 = Math.floor(row) - HALF, r1 = Math.floor(row) + HALF;
const out20 = join(RAW, "ldem_80s_20m_malapert_rows.img");
if (!existsSync(out20)) {
  const t = Date.now();
  await get("ldem_80s_20m.img", out20, [r0 * RECORD, (r1 + 1) * RECORD - 1]);
  console.log(`ldem_80s_20m rows ${r0}..${r1} ${statSync(out20).size} bytes in ${((Date.now() - t) / 1000).toFixed(0)} s`);
}
writeFileSync(join(RAW, "ldem_80s_20m_malapert_rows.json"), JSON.stringify({ firstRow: r0, lastRow: r1, lines: N, samples: N, recordBytes: RECORD }));
console.log(`N=${N} site row ${row.toFixed(1)}`);
