// Rebuilds data/ephem/index.json from whatever chunk files exist (used by fetch_horizons.mjs
// and fetch_scene.mjs).
//   sites[siteId]  hourly site chunks (<YYYY>.json, landing.json)
//   horizons[id]   terrain horizon files (step 7)
//   scene          Moon-fixed Sun/Earth scene chunks in _scene/ (step 8)
import { writeFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "ephem");
const chunk = (rel) => { const d = JSON.parse(readFileSync(join(OUT_DIR, rel), "utf8")); return { file: rel, start: d.start, end: d.end, count: d.count }; };

export function buildIndex() {
  const index = { stepHours: 1, timeScale: "UTC", decimals: 3, sites: {}, horizons: {}, scene: [] };
  for (const id of readdirSync(OUT_DIR).filter((d) => !d.includes(".") && !d.startsWith("_"))) {
    if (existsSync(join(OUT_DIR, id, "horizon.json"))) index.horizons[id] = `${id}/horizon.json`;
    index.sites[id] = readdirSync(join(OUT_DIR, id)).filter((f) => /^(\d{4}|landing)\.json$/.test(f)).sort().map((f) => chunk(`${id}/${f}`));
  }
  if (existsSync(join(OUT_DIR, "_scene"))) {
    index.scene = readdirSync(join(OUT_DIR, "_scene")).filter((f) => f.endsWith(".json")).map((f) => chunk(`_scene/${f}`))
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }
  writeFileSync(join(OUT_DIR, "index.json"), JSON.stringify(index, null, 1));
  return index;
}
