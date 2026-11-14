# Lunar Landing Site Navigator

**NASA Space Apps Challenge 2026 · team of two (Sheldon and Advik)**

**Live site:** https://lunar-landing-hackathon.vercel.app (desktop browsers)

Pick a lunar landing site and a landing date. The tool tells you, for a 7-day stay, whether the **Sun** (sunlight for power) and **Earth** (a direct line of sight for radio) are above the local horizon, for how long, and what changes if the date slips.

It has two reading levels:
- **Plain:** a verdict in words with one sentence of why, for teachers and the public.
- **Numbers:** angles, margins, sources and a CSV download, for mission planners and researchers.

## What you can do
- **Explore in 3D:** a Moon globe (NASA imagery) with 10 sites, each colored *and* labeled by verdict for the chosen landing date: ✓ Clear, ◐ Partial, ✕ Out, ⚠ On the edge (grazing the skyline, so small changes in position matter).
- **Side card:** for one site and date: verdict, Sun and Earth status, the terrain horizon model and its map, sources and coverage, and a CSV of the 168 hourly values.
- **Compare dates:** a grid of sites × landing dates, plus an hour-by-hour strip showing when the Sun and Earth are in view.
- **Stand here:** a 360° horizon panorama with the Sun and Earth paths over the stay. Every site uses a real terrain horizon from NASA's LOLA laser altimeter, so you can see the Sun blocked by a ridge.

The 10 sites: Apollo 11, 12 and 17; Chandrayaan-3; Intuitive Machines IM-1 and IM-2; and four south-pole points from NASA's Artemis III candidate regions (Peak near Cabeus B, Haworth, Malapert Massif, Nobile Rim 2).

**Verdict rule** (signed by both team members, shown on screen):
- *On the edge:* the Sun or Earth is within 2° of the terrain skyline more than half the stay. It is grazing the skyline, so small changes in position matter. (A site without terrain would instead say "terrain decides"; since D12, every site has terrain.)
- Otherwise *clear* if Sun and Earth are both up at least 90% of the stay, *out* if both are up 10% or less, and *partial* in between.

**Power and comms metrics (D16):** for each site and stay, from the terrain-aware hourly data: sunlight share, longest dark stretch, number of dark periods, Earth-in-view share, longest contact gap and number of contact windows.

**Power calculator (D16):**
- **You enter:** panel area, efficiency, panel type (sun-tracking or fixed flat) and the lander's power draw.
- **You get:** average power, energy over the stay, and the battery energy needed to get through the longest stretch with no panel power.
- It uses NASA's solar irradiance at the Moon (1361 W/m², [NASA NSSDCA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)). Every assumption is listed on screen, and the result is labeled an **estimate**.
- Comms is geometry only: a data rate would need antenna details.

**Sun and Earth score (D17, prototype):** one number from 0 to 100 per site and landing date:

> score = 100 × (25·S + 20·E + 15·D + 10·G + 15·C + 15·T) ÷ 100

| Term | What it measures (0 to 1) |
|---|---|
| S | sunlight share of the stay |
| E | Earth-in-view share of the stay |
| D | 1 − longest dark stretch ÷ stay length |
| G | 1 − longest gap without Earth ÷ stay length |
| C | clearance: how far the Sun and Earth sit above the skyline while visible (full credit at 15° or more) |
| T | slip tolerance: how little the score drops if the landing moves up to ±3 days |

- **What 100 means:** the Sun and Earth stay in view, well above the skyline, for the whole stay, and the answer holds if the date slips. **What it doesn't mean:** that the site is safe. Slopes, boulders, temperatures and landing hazards aren't included.
- The **Educator** view shows the score and names the top site in plain words, always with these default weights.
- The **Researcher** view shows the formula and lets you change all six weights, with the ranking updating live.
- Both give the same number at the default weights. A clickable **"Why these weights?"** explains the choice. The weights are this team's judgment, not a NASA standard.

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

**Six check scripts** (run from the repo root; each prints `PASS` or stops with the failure):

| Script | What it proves |
|---|---|
| `node scripts/check_ephem.mjs` | The seven hand-check values are reproduced (within the 0.0005° storage rounding; the two Malapert rows are compared against a saved Horizons file at the original point). Apollo 11 at landing shows a low morning Sun in the east. Earth is high at the Apollo sites and near the horizon at the pole sites. Coverage has no gaps. |
| `node scripts/check_visibility.mjs` | Every function in `lib/visibility.js` returns the agreed shapes, and screen values equal the files. All 14,694 rows of the daily summary equal a fresh calculation from the hourly data. Out-of-range dates give "unavailable", never a guess. Includes the terrain test: at Malapert on 2026-09-19 06:00 UTC the Sun is 1.05° above a flat horizon but hidden behind a ridge 1.84 km away. |
| `node scripts/check_horizon.mjs [siteId]` | A terrain horizon (default Malapert) is sane: it reads the elevation maps consistently (each site's fine map agrees with a coarser map near the site, mean differences ~2–15 m), it never falls below what geometry allows, the search isn't cut off by any map edge, and it finds hours where flat says "Sun up" but terrain says "blocked". The elevation-map comparisons need the raw maps: run `node scripts/fetch_lola.mjs <siteId ...>` first (~2.1 GB for all 10 sites, not in git). |
| `node scripts/check_scene.mjs` | The Moon-fixed Sun and Earth directions for the 3D view agree with the site data: within 0.0034° of the hand-checked values, and within 0.0065° over 58,440 site-hours. At each of the 49 full moons in 2026–2029, the point with the Sun overhead and the point with Earth overhead are within 5° of each other. |
| `node scripts/check_metrics.mjs` | The D16 metrics equal an hour-by-hour recount, and all 14,694 daily rows carry the same values. A worked power example a judge can follow: IM-2, 7 days from 2026-11-14, 1 m² sun-tracking panel at 30%, 100 W load. Sunlight that week averages 1,392 W/m² (1361 × (149.598 ÷ 147.78 million km)²). The full Sun disc is visible 128 h and partly visible 12 h (134.0 full-Sun hours), giving 55.9 kWh, an average of 333 W, and a battery of 100 W × 28 h = 2.8 kWh. The D17 score matches a hand calculation (IM-2: 76.6, all six terms worked out), the Educator and Researcher numbers agree at default weights, changing weights re-ranks, and fewer site-dates reach 95+ than under the old formula. |
| `node scripts/check_d19.mjs` | D19 discs and shadow: the disc formulas give the textbook values. **Every lunar eclipse we find in 2026–2029 is on NASA's published list** (eclipse.gsfc.nasa.gov, Fred Espenak), within 1 h of NASA's time of greatest eclipse. All 10 NASA eclipses are found; one grazing penumbral (2027-07-18) misses our solid-Earth contact limit by 0.9% of Earth's radius, because Earth's atmosphere isn't modelled. NASA's four total eclipses show the Sun fully covered from the Moon's centre. No site ever sees the Sun covered outside an eclipse. Sunlight strength follows the Sun distance (−3.8% to +4.0% around 1361 W/m²). |

**Terrain (all 10 sites, prototype):**
- Built from NASA's LOLA elevation maps (PDS Geosciences).
- Method: look along a line every 0.1° of compass direction, include the Moon's curvature exactly, and keep searching until even the highest terrain on the Moon could no longer show above the skyline.
- Each south-pole candidate uses the highest ground within 1 km of its representative point. The six past landings use their landed coordinates (LROC for IM-1, IM-2, Chandrayaan-3; NSSDCA for Apollo).
- Map resolution near the site: 20 m (pole sites, IM-2), 30 m (IM-1; the three Apollo sites, from global 1024 px/deg tiles) or 60 m (Chandrayaan-3). Each site's maps are listed in `data/README.md`. At Malapert that is "a slope, not a summit"; per-site details are in `data/README.md`.
- Moving the observer about 1 km changed Earth-in-view from 41% to 100% of the time. We report that openly (see `data/README.md`).

## Data sources and credits
- **Sun and Earth angles, Moon-fixed scene data:** NASA JPL Solar System Dynamics, Horizons System. https://ssd.jpl.nasa.gov/horizons/
- **Terrain:** NASA LRO Lunar Orbiter Laser Altimeter (LOLA) GDR elevation maps, polar and global (cylindrical), PDS Geosciences Node. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- **Moon surface image (visual only):** NASA's Scientific Visualization Studio, CGI Moon Kit (2025), https://svs.gsfc.nasa.gov/4720. Credit: NASA's Scientific Visualization Studio. NASA says it is "optimized for aesthetics, not science". Its orientation was checked against LOLA elevation before use.
- **Site coordinates and landing times:**
  - NASA NSSDCA (Apollo)
  - LROC / Arizona State University (IM-1, IM-2, polar mosaic centres)
  - ISRO (Chandrayaan-3)
  - NASA (Artemis III candidate regions, 2024-10-28)

  Each site's source and notes are in `data/sites.js`.
- **Software:** Three.js (MIT License), Vite, TypeScript. All in-app credits are on the site's **Credits** tab.

## Known limits
- **The Sun and Earth are treated as discs (D19)**, with NASA's radii (Sun 695,700 km, Earth 6,378.137 km equatorial). Each hour has a sunlight fraction: the share of the Sun's disc above the terrain skyline and not covered by Earth during lunar eclipses. An hour counts as "lit" when at least half the disc is visible. Earth counts as in view only when its whole disc clears the skyline; partly hidden is "marginal". Not modelled: light bent or scattered by Earth's atmosphere during eclipses, the Sun's limb darkening, and the skyline curving within the disc's width.
- **"Sunlight" is not power and "Earth in view" is not a guaranteed link.** They mean the body is above the horizon. The power calculator is an estimate with its assumptions listed (no dust, temperature or conversion losses; mean irradiance; Sun treated as a point).
- **The Sun and Earth score is a prototype.** Its formula and default weights were proposed by Lane A (the team's judgment, not a NASA standard) and can be changed in the Researcher view. It is not a measure of overall site safety.
- **Cabeus B's view toward Earth is set by ground 0.26–0.7 km away** (76% of Earth hours). That ground slopes downhill around a high point, so it decides how far *below* level Earth can be seen, not a ridge in the way. It's the same situation as Malapert's eastern bins (6°–8°). We kept the point on purpose.
- **Terrain is modelled at all 10 sites, as a prototype.** Each horizon is for one point; nearby spots differ. The observer height (2 m mast) is assumed. Near-site maps are 20–60 m per pixel, so features smaller than that aren't resolved (e.g. the ~20 m crater IM-2 rests in).
- **The four south-pole sites are representative points** of ~15 km candidate regions, not landing spots.
- **Data are hourly.** Sunrise/sunset times are accurate to the hour.
- **Fixed date range:** 2026–2029, plus 30 days around each past landing. Other dates show "unavailable".
- **Site heights are not used** for the Sun/Earth angles: all sites sit on a 1,737.4 km sphere. The effect on the angles is very small, but it isn't measured.
- **Coordinate frames:** most site sources don't state their coordinate frame. The Chandrayaan-3 landing time is from a secondary source and approximate; IM-2's is to the minute only.
- **The LOLA maps are preliminary products** (labels say "preliminary LOLA data"): polar maps and the global 1024 px/deg tiles created 2017; the global 128 px/deg map created 2011. Newer adjusted maps exist and were not used.
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
