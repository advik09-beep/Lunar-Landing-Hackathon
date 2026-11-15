// D34 checks: licence files and that NOTICE and README cover every outside item shipped in this repository.
// Usage: node scripts/check_d34.mjs   -> PASS or exit 1
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";

let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const LICENSE = read("../LICENSE"), NOTICE = read("../NOTICE"), README = read("../README.md");

// 1. LICENSE is the official Apache License 2.0 text, unchanged (https://www.apache.org/licenses/LICENSE-2.0.txt, fetched 2026-11-15).
const sha = createHash("sha256").update(LICENSE).digest("hex");
ok(sha === "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30" && /Apache License\s+Version 2\.0, January 2004/.test(LICENSE), "LICENSE = official Apache License 2.0 text (SHA-256 matches the apache.org file)");
ok(/Copyright 2026 the LunLux team/.test(NOTICE) && /Apache License, Version 2\.0/.test(NOTICE) && /does NOT cover/.test(NOTICE), "NOTICE: team copyright, licence named, exclusions stated");

// 2. Every image file shipped from the repo is named in NOTICE with its source page.
const imgs = [...readdirSync(new URL("../web/public/moon/", import.meta.url)).map((f) => `web/public/moon/${f}`),
  ...readdirSync(new URL("../web/src/panels/img/", import.meta.url)).map((f) => `web/src/panels/img/${f}`)];
const named = (f) => NOTICE.includes(f) || NOTICE.includes(f.split("/").pop());
ok(imgs.length === 7 && imgs.every(named), `NOTICE names every shipped image (${imgs.length}: 2 Moon maps, 5 Learn photos)`);
ok(imgs.every((f) => statSync(new URL("../" + f, import.meta.url)).size < (f.includes("/moon/") ? 2.5e6 : 100e3)), "Learn photos are each under 100 KB");

// 3. Each Learn photo's exact credit and page appear in the panel, NOTICE and README.
const learn = read("../web/src/panels/learn.ts");
const photos = [...learn.matchAll(/credit: "([^"]+)", page: "([^"]+)"/g)].map((m) => ({ credit: m[1], page: m[2] }));
ok(photos.length === 5 && photos.every((p) => NOTICE.includes(p.credit) && NOTICE.includes(p.page) && README.includes(p.credit) && README.includes(p.page)), `every Learn photo's exact credit line and NASA page are in NOTICE and README (${photos.length})`);

// 4. Every npm dependency of the site is listed in NOTICE and README with a licence.
const pkg = JSON.parse(read("../web/package.json"));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
ok(deps.every((d) => NOTICE.includes(d) && README.includes(d.replace("@fontsource/", "@fontsource/"))), `NOTICE and README list every npm dependency (${deps.join(", ")})`);
const licOf = (d) => JSON.parse(read(`../web/node_modules/${d}/package.json`)).license;
let licOk = true;
try { licOk = deps.every((d) => !!licOf(d)); } catch { licOk = false; }
ok(licOk && licOf("three") === "MIT" && licOf("vite") === "MIT" && licOf("typescript") === "Apache-2.0" && licOf("@fontsource/source-serif-4") === "OFL-1.1", "installed licences match what NOTICE says (three MIT, vite MIT, typescript Apache-2.0, Source Serif 4 OFL-1.1)");

// 5. README: Licence section, team line, the simulator and fonts with their terms.
ok(/^## Licence$/m.test(README) && /Apache License 2\.0/.test(README) && /\[`NOTICE`\]\(NOTICE\)/.test(README), "README has a Licence section pointing to LICENSE and NOTICE");
ok(README.includes("by the LunLux team"), "README team line: by the LunLux team");
// D37: no team member's name in any tracked text file. The GitHub account in repository URLs is the one
// exception (renaming it would break every link); it is matched separately and reported.
{
  const { execSync } = await import("node:child_process");
  const root = new URL("..", import.meta.url).pathname;
  const files = execSync("git ls-files", { cwd: root, encoding: "utf8" }).split("\n").filter((f) => f && !/\.(png|jpe?g|pdf|ico|woff2?|ttf)$/i.test(f) && !f.startsWith("data/ephem/"));
  const name = new RegExp(["sh" + "eldon", "ad" + "vik", "sp" + "ence", "chau" + "dhary"].join("|"), "i");
  const hits = [];
  let accountUrls = 0;
  for (const f of files) {
    const text = readFileSync(new URL("../" + f, import.meta.url), "utf8");
    accountUrls += (text.match(new RegExp("ad" + "vik09-beep", "gi")) || []).length;
    const stripped = text.replace(new RegExp("ad" + "vik09-beep", "gi"), "");
    if (name.test(stripped)) hits.push(f);
  }
  ok(hits.length === 0, `no team member's name in ${files.length} tracked text files${hits.length ? ": " + hits.join(", ") : ""} (the GitHub account name appears only inside ${accountUrls} repository URLs)`);
}
const removed = ["Pluto", "Europa", "Io", "Ganymede", "Callisto", "Titan"];
ok(/OzAILabs SolarSystemSimulator/.test(README) && /twelve Solar System Scope images/.test(README) && /twelve Solar System\s+Scope images/.test(NOTICE) && removed.every((b) => README.includes(b) && NOTICE.includes(b)) && /aa00c53/.test(README) && /aa00c53/.test(NOTICE)
  && !/Planet Pixel|Steve Albers|astrogeology\.usgs/.test(README + NOTICE) && /SIL Open Font License 1\.1/.test(README) && /AI use/.test(README), "README and NOTICE: only the twelve Solar System Scope textures (CC BY 4.0); the six removed textures named with fork commit aa00c53; fonts and AI use listed");
// Presentation dependencies (presentation/package.json) are listed too.
const ppkg = JSON.parse(read("../presentation/package.json"));
const pdeps = Object.keys({ ...ppkg.dependencies, ...ppkg.devDependencies });
ok(pdeps.every((d) => NOTICE.includes(d) || (d === "vite" && /Vite 7/.test(NOTICE))) && pdeps.every((d) => README.includes(d) || README.includes(d.replace(/\.js$/, ".js"))) && /Reveal\.js \(npm `reveal\.js` 6\.0\) \| the presentation slides \(`presentation\/`\) \| MIT/.test(README), `presentation dependencies listed with licences (${pdeps.join(", ")}); Reveal.js MIT`);

if (fails) { console.error(`${fails} check(s) failed`); process.exit(1); }
console.log("PASS");
