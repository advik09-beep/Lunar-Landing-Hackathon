// Step 7: downloads the LOLA GDR south polar DEMs used for terrain horizons into
// data/raw/ (gitignored). Labels (.lbl) are saved next to each file.
// Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
// Usage: node scripts/fetch_lola.mjs [siteId ...]   (default: sp_malapert)
//   Full files: ldem_80s_80m, ldem_75s_120m, ldem_60s_240m (~115-120 MB each).
//   ldem_80s_20m (1.85 GB) is NOT downloaded whole: only the rows covering +-22 km
//   around each requested site are fetched with an HTTP range request.
import { createWriteStream, existsSync, mkdirSync, writeFileSync, statSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sites from "../data/sites.js";
import { FAR, fineProduct, FINE } from "./lola_maps.mjs";

const BASE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/";
const RAW = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "raw");
mkdirSync(RAW, { recursive: true });
writeFileSync(join(RAW, ".gitignore"), "*\n");

async function get(name, out, range) {
  const res = await fetch(BASE + name, range ? { headers: { Range: `bytes=${range[0]}-${range[1]}` } } : {});
  if (!(res.ok || res.status === 206)) throw new Error(`HTTP ${res.status} for ${name}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(out));
}

for (const f of [...FAR, ...FINE.map((x) => x.product)]) {
  if (!existsSync(join(RAW, `${f}.lbl`))) await get(`${f}.lbl`, join(RAW, `${f}.lbl`));
}

for (const f of FAR) {
  const out = join(RAW, `${f}.img`);
  if (existsSync(out)) { console.log(`skip ${f}`); continue; }
  const t = Date.now();
  await get(`${f}.img`, out);
  console.log(`${f}.img ${statSync(out).size} bytes in ${((Date.now() - t) / 1000).toFixed(0)} s`);
}

// Fine-map windows (+-22 km of rows) around each requested site's current coordinates (data/sites.js).
// The fine product is the finest polar map covering the site (scripts/lola_maps.mjs). Pixel position from
// the PDS polar stereographic definition (catalog/dsmap_polar.cat): r = 2R tan(colat/2), south: lon 0 up, 90E right.
const R = 1737400, HALF_KM = 22;
const lbl = (name) => { const t = readFileSync(join(RAW, `${name}.lbl`), "utf8"); const num = (k) => Number(t.match(new RegExp(`^\\s*${k}\\s*=\\s*(-?[\\d.]+)`, "m"))[1]); return { N: num("LINES"), off: num("LINE_PROJECTION_OFFSET"), scale: num("MAP_SCALE"), record: num("RECORD_BYTES") }; };
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : ["sp_malapert"];
for (const id of wanted) {
  const site = sites.find((s) => s.id === id);
  if (!site) throw new Error("unknown site " + id);
  const product = fineProduct(site.lat);
  const { N, off: OFF, scale: SCALE, record: RECORD } = lbl(product);
  const HALF = Math.ceil((HALF_KM * 1000) / SCALE);
  const r = 2 * R * Math.tan(((90 - Math.abs(site.lat)) * Math.PI) / 360);
  const row = OFF - (r * Math.cos((site.lon * Math.PI) / 180)) / SCALE;
  const col = OFF + (r * Math.sin((site.lon * Math.PI) / 180)) / SCALE;
  const r0 = Math.max(0, Math.floor(row) - HALF), r1 = Math.min(N - 1, Math.floor(row) + HALF);
  const out = join(RAW, `${product}_${id}_rows.img`);
  // The .json describes the rows actually stored in the .img: written only together with a download,
  // never rewritten later (a site may move after its window was fetched, e.g. D10/D12).
  if (existsSync(out)) { console.log(`skip ${id} window (keeping its row record)`); continue; }
  const t = Date.now();
  await get(`${product}.img`, out, [r0 * RECORD, (r1 + 1) * RECORD - 1]);
  writeFileSync(join(RAW, `${product}_${id}_rows.json`), JSON.stringify({ siteId: id, product, centerLat: site.lat, centerLon: site.lon, firstRow: r0, lastRow: r1, siteRow: +row.toFixed(1), siteCol: +col.toFixed(1), lines: N, samples: N, recordBytes: RECORD }));
  console.log(`${id}: ${product} rows ${r0}..${r1} ${statSync(out).size} bytes in ${((Date.now() - t) / 1000).toFixed(0)} s`);
}
