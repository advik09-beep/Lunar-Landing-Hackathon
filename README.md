# Lunar Landing Site Navigator

**NASA Space Apps Challenge 2026 · team of two (Sheldon and Advik)**

**Live site:** https://lunar-landing-hackathon.vercel.app (desktop browsers)

Pick a lunar landing site and a landing date. The tool tells you, for a 7-day stay, whether the **Sun** (sunlight for power) and **Earth** (a direct line of sight for radio) are above the local horizon, for how long, and what changes if the date slips.

It has two reading levels:
- **Plain:** a verdict in words with one sentence of why, for teachers and the public.
- **Numbers:** angles, margins, sources and a CSV download, for mission planners and researchers.

## What you can do
- **Explore in 3D:** a Moon globe (NASA imagery) with 10 sites, each colored *and* labeled by verdict for the chosen landing date: ✓ Clear, ◐ Partial, ✕ Out, ⚠ On the edge (at flat-horizon sites: terrain decides; at terrain sites: grazing the skyline, so small changes in position matter).
- **Side card:** for one site and date: verdict, Sun and Earth status, whether the horizon is flat or real terrain, sources and coverage, and a CSV of the 168 hourly values.
- **Compare dates:** a grid of sites × landing dates, plus an hour-by-hour strip showing when the Sun and Earth are in view.
- **Stand here:** a 360° horizon panorama with the Sun and Earth paths over the stay. For the four south-pole sites it shows real terrain from NASA's LOLA laser altimeter, so you can see the Sun blocked by a ridge (other sites are being added, D12).

The 10 sites: Apollo 11, 12 and 17; Chandrayaan-3; Intuitive Machines IM-1 and IM-2; and four south-pole points from NASA's Artemis III candidate regions (Peak near Cabeus B, Haworth, Malapert Massif, Nobile Rim 2).

**Verdict rule** (signed by both team members, shown on screen):
- *On the edge:* the Sun or Earth is within 2° of the horizon more than half the stay. At flat-horizon sites that means terrain decides; at terrain sites (terrain already included) it means the body is grazing the skyline, so small changes in position matter.
- Otherwise *clear* if Sun and Earth are both up at least 90% of the stay, *out* if both are up 10% or less, and *partial* in between.

There is no single "best site" score: sunlight and Earth contact trade off, and the right choice depends on the mission.

## Run it locally
Needs Node.js 18 or newer.
```bash
cd web
npm install
npm run dev          # app: http://localhost:5173/   panel test page: http://localhost:5173/panels.html
npm run build        # type-check + production build into web/dist (copies the data files and the NASA Moon map)
```
The data are static JSON files in `data/`. There is no backend.

## How the numbers were made and verified
**Where the numbers come from:**
- All Sun and Earth angles come from **NASA JPL Horizons**, downloaded hourly, never calculated in the browser.
- The observer is placed on the lunar surface at each site (`CENTER='coord@301'`, quantity 4: airless apparent azimuth/elevation; Sun = 10, Earth = 399).
- Every Horizons setting was confirmed in the Horizons manual and API documentation and checked against the header of the actual output. The details, with quotes, are in [`data/README.md`](data/README.md).
- **Coverage:** every hour of 2026–2029 for all 10 sites, plus 30 days around each past landing.

**Hand-checks (a human, not a script):** Sheldon queried the Horizons web app by hand at seven site/time/body combinations, and all seven matched our files to six decimals:
- Apollo 11, 2026-11-14 12:00 UTC: Sun and Earth
- IM-1, 2026-11-17 08:00 UTC: Sun and Earth
- Malapert (original point), 2026-11-20 06:00 UTC: Sun and Earth
- Malapert (original point), 2026-11-17 08:00 UTC: Sun

**Four check scripts** (run from the repo root; each prints `PASS` or stops with the failure):

| Script | What it proves |
|---|---|
| `node scripts/check_ephem.mjs` | The seven hand-check values are reproduced (within the 0.0005° storage rounding; the two Malapert rows are compared against a saved Horizons file at the original point). Apollo 11 at landing shows a low morning Sun in the east. Earth is high at the Apollo sites and near the horizon at the pole sites. Coverage has no gaps. |
| `node scripts/check_visibility.mjs` | Every function in `lib/visibility.js` returns the agreed shapes, and screen values equal the files. All 14,694 rows of the daily summary equal a fresh calculation from the hourly data. Out-of-range dates give "unavailable", never a guess. Includes the terrain test: at Malapert on 2026-09-19 06:00 UTC the Sun is 1.05° above a flat horizon but hidden behind a ridge 1.84 km away. |
| `node scripts/check_horizon.mjs [siteId]` | A terrain horizon (default Malapert) is sane: it reads the elevation maps consistently (20/80/120/240 m maps agree to within ~6–11 m), it never falls below what geometry allows, the search isn't cut off by any map edge, and it finds hours where flat says "Sun up" but terrain says "blocked". The elevation-map comparisons need the raw maps: run `node scripts/fetch_lola.mjs` first (~485 MB, not in git). |
| `node scripts/check_scene.mjs` | The Moon-fixed Sun and Earth directions for the 3D view agree with the site data: within 0.0034° of the hand-checked values, and within 0.0065° over 58,440 site-hours. At each of the 49 full moons in 2026–2029, the point with the Sun overhead and the point with Earth overhead are within 5° of each other. |

**Terrain (the four south-pole sites so far; the other six are being added, prototype):**
- Built from NASA's LOLA elevation maps (PDS Geosciences).
- Method: look along a line every 0.1° of compass direction, include the Moon's curvature exactly, and keep searching until even the highest terrain on the Moon could no longer show above the skyline.
- Each candidate site uses the highest ground within 1 km of its representative point. At Malapert that is "a slope, not a summit"; per-site details are in `data/README.md`.
- Moving the observer about 1 km changed Earth-in-view from 41% to 100% of the time. We report that openly (see `data/README.md`).

## Data sources and credits
- **Sun and Earth angles, Moon-fixed scene data:** NASA JPL Solar System Dynamics, Horizons System. https://ssd.jpl.nasa.gov/horizons/
- **Terrain:** NASA LRO Lunar Orbiter Laser Altimeter (LOLA) GDR polar elevation maps, PDS Geosciences Node. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- **Moon surface image (visual only):** NASA's Scientific Visualization Studio, CGI Moon Kit (2025), https://svs.gsfc.nasa.gov/4720. Credit: NASA's Scientific Visualization Studio. NASA says it is "optimized for aesthetics, not science". Its orientation was checked against LOLA elevation before use.
- **Site coordinates and landing times:**
  - NASA NSSDCA (Apollo)
  - LROC / Arizona State University (IM-1, IM-2, polar mosaic centres)
  - ISRO (Chandrayaan-3)
  - NASA (Artemis III candidate regions, 2024-10-28)

  Each site's source and notes are in `data/sites.js`.
- **Software:** Three.js (MIT License), Vite, TypeScript. All in-app credits are on the site's **Credits** tab.

## Known limits
- **Sun and Earth are treated as points.** The Sun's disc is about 0.5° wide, so near the horizon real sunlight is partial while we show all-or-nothing.
- **"Sunlight" is not power and "Earth in view" is not a guaranteed link.** They mean the body is above the horizon.
- **Cabeus B's view toward Earth is set by ground 0.26–0.7 km away** (76% of Earth hours). That ground slopes downhill around a high point, so it decides how far *below* level Earth can be seen, not a ridge in the way. It's the same situation as Malapert's eastern bins (6°–8°). We kept the point on purpose.
- **Terrain is modelled at the four south-pole sites so far** (prototype). The other six still use a flat horizon and are labeled FLAT. Each terrain horizon is for one point; nearby spots differ. The observer height (2 m mast) is assumed.
- **The four south-pole sites are representative points** of ~15 km candidate regions, not landing spots.
- **Data are hourly.** Sunrise/sunset times are accurate to the hour.
- **Fixed date range:** 2026–2029, plus 30 days around each past landing. Other dates show "unavailable".
- **Site heights are not used** for the Sun/Earth angles: all sites sit on a 1,737.4 km sphere. The effect on the angles is very small, but it isn't measured.
- **Coordinate frames:** most site sources don't state their coordinate frame. The Chandrayaan-3 landing time is from a secondary source and approximate; IM-2's is to the minute only.
- **The LOLA maps are preliminary 2017 products.** Newer adjusted maps exist and were not used.
- **The 3D globe shows no terrain,** and its lighting is illustrative until the Moon-fixed Sun direction (already available from `getSceneState`) is wired into the scene.
- **Desktop browsers only** (a team decision). No phone layout.

## How AI tools were used
This project was built by two people working with two AI coding assistants. We want to be clear about who did what.

- **Claude Code (Anthropic), with Sheldon (Lane A, "numbers"):**
  - The download scripts, data files, `lib/visibility.js`, the terrain horizon method, the check scripts, `data/README.md`, and the three screen panels (side card, Compare dates, Stand here).
  - It also helped write this README.
  - It read the JPL Horizons, PDS and NASA documentation to confirm settings, and quoted them, rather than relying on memory.
- **ChatGPT / Codex (OpenAI), with Advik (Lane B, "screen"):** the web app shell, the Three.js Moon globe, the NASA Moon map integration, the Credits tab and the Vercel deployment.
- **The humans:**
  - Made every decision: scope, the 10 sites, the verdict numbers, which point to use at Malapert.
  - Approved each step before the next one started.
  - Did the seven hand-checks in the Horizons web app themselves.
  - Signed off milestones.
- **Coordination:**
  - Each AI could only edit its own folders.
  - The two worked through a shared log, [`STATUS.md`](STATUS.md), against one plan, [`PLAN.md`](PLAN.md).
  - No result was marked as passing unless a test had actually run.
- **AI can be confidently wrong, so the numbers don't rest on trust.** They rest on the hand-checks and the check scripts above, which anyone can rerun.
