# LunLux

**Sunlight and Earth contact for lunar landing sites**

**NASA Space Apps Challenge 2026, team of two (Sheldon and Advik)**

**Live site:** https://lunar-landing-hackathon.vercel.app (desktop browsers)

Pick a lunar landing site and a landing date. LunLux tells you, for the stay, whether the **Sun** (sunlight for power) and **Earth** (a direct line of sight for radio) are above the local terrain skyline, for how long, and what changes if the date slips.

One switch in the header sets the reading level for the whole site:
- **Educator:** written so a seven-year-old understands it. Pictures first (sunshine and Earth rings, a week-long day and night strip), one short sentence at a time, everyday words, no degrees. Each section has a small "For the teacher" fold-out with the fuller explanation and one question for the class. The stay is always one week.
- **Researcher:** angles, margins, every metric, the score formula with adjustable weights, charts across 2026–2029 and downloads, for mission planners and researchers.

## What you can do
The site has four tabs plus a "Data and methods" link.

- **Tour:** a solar-system tour (an embedded, separately deployed fork of an open-source simulator) with one caption per stop answering "What does this body do to a lander on the Moon?". Captions come in an Educator and a Researcher version, with the same facts and sources. The last stop says "Click on the Moon" and opens Explore.
- **Explore:** a 3D Moon (NASA imagery) lit from the real Sun direction for the chosen date and hour, with 10 site pins marked by verdict symbol and colour. Next to it, a side card, which can switch to the horizon view ("Stand here"):
  - **Side card, Educator:** a verdict sentence, the rings, the week strip, what the Sun and Earth are doing now, the score with "Why this score?", and "Why the south pole?".
  - **Side card, Researcher:** Sun and Earth elevation, azimuth, skyline height, margin and next change; stay percentages; power and comms metrics; a power calculator; the score formula; sources; an hourly CSV.
  - **Stand here:** a 360° horizon panorama from NASA LOLA terrain, with the Sun and Earth paths over the stay and the chosen hour. You can see the Sun blocked by a ridge.
- **Compare:** a grid of sites × landing dates, each cell a verdict.
  - Educator: the grid plus one sentence naming the best week in the four weeks shown.
  - Researcher: also an hour-by-hour strip, the score ranking with six adjustable weights, a two-scenario (A/B) comparison with the differences in plain words, and a mission requirements filter (PASS or FAIL per site, failing limits named).
- **Learn (Educator) / Report (Researcher):**
  - Learn: a picture report from our data (a real ridge hiding the Sun, the low polar Sun, two-week days and nights, Earth staying in one spot) and two NASA photos with their exact credits.
  - Report: a full analysis of one site and stay (NASA's landing-region criteria and how we cover each, lighting and power, communications geometry with signal delay, lunar season and time of day, eclipses, best and worst months, terrain profile, maps and local slope, the score, other planets, what is NOT modelled, sources), charts across 2026–2029 (monthly sunlight and Earth in view; the daily score with lunar eclipses marked), and downloads: the full analysis (JSON), hourly data (CSV), this site by month (CSV) and every site and landing date (CSV).

The 10 sites are either **candidate sites** (possible future landing points from four of NASA's Artemis III candidate regions: Peak near Cabeus B, Haworth, Malapert Massif, Nobile Rim 2) or **historic landings** (Apollo 11, 12 and 17, Chandrayaan-3, Intuitive Machines IM-1 and IM-2), shown as comparisons. The ranking can be filtered to all sites, candidates, or historic landings.

Verdicts are always shown with a word and a drawn symbol, never colour alone: Clear (filled green circle with a tick), Partial (hollow green ring), Out (grey circle with a cross), On the edge (violet circle with a dashed ring).

**Verdict rule** (signed by both team members, shown on screen):
- *On the edge:* the Sun or Earth is within 2° of the terrain skyline more than half the stay. It is grazing the skyline, so small changes in position matter. (A site without terrain would instead say "terrain decides"; since D12, every site has terrain.)
- Otherwise *clear* if Sun and Earth are both up at least 90% of the stay, *out* if both are up 10% or less, and *partial* in between.

**Power and comms metrics (D16):** for each site and stay, from the terrain-aware hourly data: sunlight share, longest dark stretch, number of dark periods, Earth-in-view share, longest contact gap and number of contact windows.

**Power calculator (D16):**
- **You enter:** panel area, efficiency, panel type (sun-tracking or fixed flat) and the lander's power draw.
- **You get:** average power, energy over the stay, and the battery energy needed to get through the longest stretch with no panel power.
- It uses NASA's solar irradiance at the Moon (1361 W/m², [NASA NSSDCA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)). Every assumption is listed on screen, and the result is labeled an **estimate**.
- Comms is geometry only: a data rate would need antenna details.

**Sun and Earth score (D17):** one number from 0 to 100 per site and landing date:

> score = 100 × (25 × S + 20 × E + 15 × D + 10 × G + 15 × C + 15 × T) ÷ 100

| Term | What it measures (0 to 1) |
|---|---|
| S | sunlight share of the stay |
| E | Earth-in-view share of the stay |
| D | 1 − longest dark stretch ÷ stay length |
| G | 1 − longest gap without Earth ÷ stay length |
| C | clearance: how far the Sun and Earth sit above the skyline while visible (full credit at 15° or more) |
| T | slip tolerance: how little the score drops if the landing moves up to ±3 days |

- **What 100 means:** the Sun and Earth stay in view, well above the skyline, for the whole stay, and the answer holds if the date slips. **What it doesn't mean:** that the site is safe. Slopes, boulders, temperatures and landing hazards aren't included.
- The score is **this team's own formula, not a NASA standard.**
- The **Educator** view shows the score and names the best candidate site in plain words, always with these default weights, and explains it in "Why this score?".
- The **Researcher** view shows the formula and lets you change all six weights, with the ranking updating live.
- Both give the same number at the default weights. In the Researcher view, a clickable **"Why these weights?"** gives one line of reasoning per weight.

## Run it locally
Needs Node.js 18 or newer.
```bash
cd web
npm install
npm run dev          # app: http://localhost:5173/   panel test page: http://localhost:5173/panels.html
npm run build        # type-check + production build into web/dist (copies the data files)
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

**Ten check scripts** (run from the repo root; each prints `PASS` or stops with the failure):

| Script | What it proves |
|---|---|
| `node scripts/check_ephem.mjs` | The seven hand-check values are reproduced (within the 0.0005° storage rounding; the two Malapert rows are compared against a saved Horizons file at the original point). Apollo 11 at landing shows a low morning Sun in the east. Earth is high at the Apollo sites and near the horizon at the pole sites. Coverage has no gaps. |
| `node scripts/check_visibility.mjs` | Every function in `lib/visibility.js` returns the agreed shapes, and screen values equal the files. All 14,694 rows of the daily summary equal a fresh calculation from the hourly data. Out-of-range dates give "unavailable", never a guess. Includes the terrain test: at Malapert on 2026-09-19 06:00 UTC the Sun is 1.05° above a flat horizon but hidden behind a ridge 1.84 km away. |
| `node scripts/check_horizon.mjs [siteId]` | A terrain horizon (default Malapert) is sane: it reads the elevation maps consistently (each site's fine map agrees with a coarser map near the site, mean differences ~2–15 m), it never falls below what geometry allows, the search isn't cut off by any map edge, and it finds hours where flat says "Sun up" but terrain says "blocked". The elevation-map comparisons need the raw maps: run `node scripts/fetch_lola.mjs <siteId ...>` first (~2.1 GB for all 10 sites, not in git). |
| `node scripts/check_scene.mjs` | The Moon-fixed Sun and Earth directions for the 3D view agree with the site data: within 0.0034° of the hand-checked values, and within 0.0065° over 58,440 site-hours. At each of the 49 full moons in 2026–2029, the point with the Sun overhead and the point with Earth overhead are within 5° of each other. |
| `node scripts/check_metrics.mjs` | The D16 metrics equal an hour-by-hour recount, and all 14,694 daily rows carry the same values. A worked power example a judge can follow: IM-2, 7 days from 2026-11-14, 1 m² sun-tracking panel at 30%, 100 W load. Sunlight that week averages 1,392 W/m² (1361 × (149.598 ÷ 147.78 million km)²). The full Sun disc is visible 128 h and partly visible 12 h (134.0 full-Sun hours), giving 55.9 kWh, an average of 333 W, and a battery of 100 W × 28 h = 2.8 kWh. The D17 score matches a hand calculation (IM-2: 76.6, all six terms worked out), the Educator and Researcher numbers agree at default weights, changing weights re-ranks, and fewer site-dates reach 95+ than under the old formula. |
| `node scripts/check_d19.mjs` | D19 discs and shadow: the disc formulas give the textbook values. **Every lunar eclipse we find in 2026–2029 is on NASA's published list** (eclipse.gsfc.nasa.gov, Fred Espenak), within 1 h of NASA's time of greatest eclipse. All 10 NASA eclipses are found; one grazing penumbral (2027-07-18) misses our solid-Earth contact limit by 0.9% of Earth's radius, because Earth's atmosphere isn't modelled. NASA's four total eclipses show the Sun fully covered from the Moon's centre. No site ever sees the Sun covered outside an eclipse. Sunlight strength follows the Sun distance (−3.8% to +4.0% around 1361 W/m²). |
| `node scripts/check_d20.mjs` | Researcher view (D18/D20/D22) facts, each against an independent fact:<br>- **Signal delay** = Earth distance ÷ speed of light (1.26–1.35 s).<br>- **Lunar local time** reads noon (12.02 h) at the hour the Sun is highest.<br>- **Season** = the sub-solar latitude from JPL, with NASA SVS 5229 quoted.<br>- The 2026-03-03 **eclipse** appears in the right stay.<br>- The Sun's **compass sweep** in a fully sunlit pole-region stay equals the sub-solar longitude change (84.6°).<br>- **Month averages** equal the averaged scores.<br>- Every site has a **local slope**.<br>- The **NASA criteria, D22 note and sources** are present. |
| `node scripts/check_tour.mjs` | The ten solar-system tour captions (D25) and the "Why the south pole?" text (D26): ten stops in order, two sentences each, NASA/JPL sources. Every figure we call ours is recomputed: Venus is the brightest planet from the Moon at about 2 billionths of the Sun's light (JPL Horizons magnitudes), sunlight 1,310–1,415 W/m², signal delay 1.2–1.4 s, one lunar day 29.53 Earth days, and Earth never more than about 11° above level at the candidate sites. |
| `node scripts/check_d28.mjs` | The mission requirements filter and the A/B scenario comparison (D28): every site's pass/fail and named failing limits match its own numbers. No limits means every site passes, and outside the data the result is "No data", never a guessed pass. The comparison values equal the per-site numbers, the differences point the right way, a scenario compared with itself is "about the same" everywhere, and swapping A and B mirrors every difference. |
| `node scripts/check_d32.mjs` | The two reading levels (D32): every Educator tour caption has no digits or degrees and at most two short sentences, and says the same facts as the Researcher caption ("a little over one second" = 1.19–1.36 s). The best week equals the highest score of the dates shown. The monthly chart values equal a recount from the hourly data, the daily score equals the hourly score, and every eclipse marked at Malapert is on NASA's 2026–2029 list. The all-sites table has every site and landing date (14,550 rows). The Learn facts hold: the Malapert ridge, Apollo 11's Sun at 87.8° vs Malapert's 5.5°, sunrise to sunrise 29.58–29.63 days, and Earth's small wobble. |

**Terrain (all 10 sites):**
- Built from NASA's LOLA elevation maps (PDS Geosciences).
- Method: look along a line every 0.1° of compass direction, include the Moon's curvature exactly, and keep searching until even the highest terrain on the Moon could no longer show above the skyline.
- Each south-pole candidate uses the highest ground within 1 km of its representative point. The six past landings use their landed coordinates (LROC for IM-1, IM-2, Chandrayaan-3; NSSDCA for Apollo).
- Map resolution near the site: 20 m (pole sites, IM-2), 30 m (IM-1; the three Apollo sites, from global 1024 px/deg tiles) or 60 m (Chandrayaan-3). Each site's maps are listed in `data/README.md`. At Malapert that is "a slope, not a summit"; per-site details are in `data/README.md`.
- Moving the observer about 1 km changed Earth-in-view from 41% to 100% of the time. We report that openly (see `data/README.md`).

## Third-party resources
Everything this project uses that it did not make itself.

**Data and imagery**
- **NASA JPL Horizons** (Solar System Dynamics): every Sun and Earth direction, distance and Moon-fixed scene value. https://ssd.jpl.nasa.gov/horizons/ , API documentation https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **NASA LRO LOLA GDR elevation maps** (PDS Geosciences Node), polar and global: every terrain horizon and local slope. https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- **NASA SVS CGI Moon Kit** (2025), colour maps 2K and 4K, for the look of the 3D Moon only. Credit: NASA's Scientific Visualization Studio. https://svs.gsfc.nasa.gov/4720 (NASA: "optimized for aesthetics, not science"; its orientation was checked against LOLA before use.)
- **NASA NSSDCA fact sheets** (Moon, Earth, Sun): solar irradiance 1361 W/m² and its mean distance, Sun and Earth radii. https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- **NASA GSFC lunar eclipse predictions** (Fred Espenak), used to check our eclipses. https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html
- **NASA science pages and releases** quoted in the tour, "Why the south pole?" and the Report: science.nasa.gov planet pages, NASA SVS 5229 (lunar seasons), the Artemis III candidate-region releases (2022, 2024), and Park et al. 2021 (JPL DE440). Each quote carries its link on screen and in `lib/tour.js` / `lib/research.js`.
- **NASA photos** (Learn tab), resized for the web: Apollo 8 Earthrise, "Image Credit: NASA", https://www.nasa.gov/image-article/apollo-8-earthrise/ ; Lunar South Pole (PIA13523), "Credits: NASA/GSFC/Arizona State University", https://science.nasa.gov/photojournal/the-lunar-south-pole
- **Site coordinates and landing times:** NASA NSSDCA (Apollo), LROC / Arizona State University (IM-1, IM-2, Chandrayaan-3, polar mosaic centres), ISRO (Chandrayaan-3 site box), NASA (Artemis III candidate regions, 2024-10-28). Each site's source and notes are in `data/sites.js`.

**Software, fonts and code we build on**
- **Three.js** and its OrbitControls (MIT License): the 3D Moon. https://threejs.org/
- **Vite** (MIT License) and **TypeScript** (Apache License 2.0): build tools. **Node.js** runs the data scripts.
- **OzAILabs SolarSystemSimulator**, forked and embedded as the Tour (its README describes the code as MIT-licensed). Its planet textures come from Solar System Scope (CC BY 4.0), Planet Pixel Emporium, NASA/USGS Astrogeology and Steve Albers, under their own terms. https://github.com/OzAILabs/SolarSystemSimulator , our fork https://github.com/advik09-beep/SolarSystemSimulator
- **Starfield:** written for this project; visually informed by Hue Screen Starfield and etrepat/starfield (MIT License). No code or assets copied.
- **Fonts (D33):** CMU Serif for headings, from the npm package `computer-modern` (the fonts are under the SIL Open Font License 1.1; the package's own code is MIT); Source Serif 4 for all other text and numbers, from `@fontsource/source-serif-4` (SIL Open Font License 1.1). Both are self-hosted. (Until the switch, the build also carries Urbanist, SIL OFL 1.1, from `@fontsource/urbanist`.)
- **Hosting:** Vercel (static files, no backend).
- **Test-only tools** (not shipped): happy-dom and esbuild, used to render the panels in automated tests.

All in-app credits are under **Data and methods** on the site.

## Known limits
- **The Sun and Earth are treated as discs (D19)**, with NASA's radii (Sun 695,700 km, Earth 6,378.137 km equatorial). Each hour has a sunlight fraction: the share of the Sun's disc above the terrain skyline and not covered by Earth during lunar eclipses. An hour counts as "lit" when at least half the disc is visible. Earth counts as in view only when its whole disc clears the skyline; partly hidden is "marginal". Not modelled: light bent or scattered by Earth's atmosphere during eclipses, the Sun's limb darkening, and the skyline curving within the disc's width.
- **"Sunlight" is not power and "Earth in view" is not a guaranteed link.** They mean the body is above the horizon. The power calculator is an estimate with its assumptions listed (no dust, temperature or conversion losses; mean irradiance; Sun treated as a point).
- **The Sun and Earth score is this team's own formula, not a NASA standard.** Its default weights are the team's judgment and can be changed in the Researcher view. It is not a measure of overall site safety.
- **Cabeus B's view toward Earth is set by ground 0.26–0.7 km away** (76% of Earth hours). That ground slopes downhill around a high point, so it decides how far *below* level Earth can be seen, not a ridge in the way. It's the same situation as Malapert's eastern bins (6°–8°). We kept the point on purpose.
- **Terrain is modelled at all 10 sites.** Each horizon is for one point; nearby spots differ. The observer height (2 m mast) is assumed. Near-site maps are 20–60 m per pixel, so features smaller than that aren't resolved (e.g. the ~20 m crater IM-2 rests in).
- **The four south-pole sites are representative points** of ~15 km candidate regions, not landing spots.
- **Data are hourly.** Sunrise/sunset times are accurate to the hour.
- **Fixed date range:** 2026–2029, plus 30 days around each past landing. Other dates show "unavailable".
- **Site heights are not used** for the Sun/Earth angles: all sites sit on a 1,737.4 km sphere. The effect on the angles is very small, but it isn't measured.
- **Coordinate frames:** most site sources don't state their coordinate frame. The Chandrayaan-3 landing time is from a secondary source and approximate; IM-2's is to the minute only.
- **The LOLA maps are preliminary products** (labels say "preliminary LOLA data"): polar maps and the global 1024 px/deg tiles created 2017; the global 128 px/deg map created 2011. Newer adjusted maps exist and were not used.
- **The 3D globe shows no terrain.** It is lit from the real Sun direction (JPL Horizons) for the chosen hour, but ridges and their shadows appear only in the horizon view. A faint fill light on the night side is a visual aid, not sunlight.
- **Desktop browsers only** (a team decision). No phone layout.

## AI use
**The code in this project was written with AI coding assistants, directed by the team.** The two team members decided what to build, checked the results and signed off every step. The assistants wrote the code and most of the documentation.

- **Claude Code (Anthropic), with Sheldon (Lane A, "numbers"):** the data download scripts, the data files, everything in `lib/`, the terrain horizon method, the ten check scripts, `data/README.md`, the screen panels inside the site (side card, Compare grid, Stand here, Report and Learn, Planner) and this README. It read the JPL Horizons, PDS and NASA documentation to confirm settings and quoted them, rather than relying on memory.
- **ChatGPT / Codex (OpenAI), with Advik (Lane B, "screen"):** the web app shell, the tabs and toolbar, the Three.js Moon and its lighting, the embedded Tour, the Data and methods page, and the Vercel deployment.
- **The humans:**
  - Made every decision (scope, the 10 sites, the verdict numbers, the score weights, which point to use at Malapert), recorded as signed decisions in [`PLAN.md`](PLAN.md).
  - Approved each step before the next one started.
  - Did the seven hand-checks in the Horizons web app themselves.
  - Ran the acceptance tests and signed off milestones.
- **Coordination:** each assistant could edit only its own folders. The two worked through a shared log, [`STATUS.md`](STATUS.md), against one plan, [`PLAN.md`](PLAN.md). No result was marked as passing unless a test had actually run.
- **AI can be confidently wrong, so the numbers don't rest on trust.** They rest on the hand-checks and the check scripts above, which anyone can rerun.
