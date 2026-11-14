# PLAN.md v2 — the one plan (Lunar Landing Site Navigator, NASA Space Apps 2026)

## Right now
The live board is the header of STATUS.md. Anyone may update their own row there.

Order of work, in full:
1 Live URL -> 2 Real numbers -> 3 Side card -> 4 Explore in 3D ->
5 Real data in the app -> 6 Compare dates -> 7 Terrain -> 8 True
lighting -> 9 Submit. Details in "The steps" below.

## Start here if you know nothing about this project
- This is a two-person hackathon team: Sheldon and Advik. Submission is
  due Sunday Nov 15, 11:59 PM local.
- Two AI tools write the code. Claude Code works with Sheldon on the
  numbers (Lane A). ChatGPT works with Advik on the screen (Lane B).
- THIS FILE WINS. If STATUS.md, DESIGN.md or any older note disagrees
  with it, follow this file and flag the conflict.
- STATUS.md is the live log and the "who is doing what" board.
  DESIGN.md describes the screens. The old "integration blueprint"
  inside STATUS.md is background only.
- Step names changed. Old M0-M7 and B0-B7 labels are shown in brackets
  below so nothing is lost.

## What we are building
Pick a lunar landing site and a landing date. See whether the Sun
(power) and Earth (direct comms) are above the local horizon during the
stay, and what happens when the date slips. One tool, two readers:
educators and the public get plain-language verdicts; mission planners
and researchers get the numbers behind them.

## Decisions signed by both humans (2026-11-14)
- D1 Two views. Explore is the landing page: the Moon, 10 site markers
  colored by verdict, and a landing-date control. Compare dates is a
  tab: sites as rows, landing dates as columns. The current mockup is
  the starting point; it will get friendlier over time.
- D2 Explore is 3D from the start. ChatGPT builds the 3D Moon now.
  There is no flat-image first version.
- D3 Two reading levels. A Plain / Numbers switch on the side card.
  Plain = verdict in words plus one sentence of why. Numbers = angles,
  margin above horizon, hours to sunset and Earthset, source,
  coverage, CSV download.
- D4 Data contract v1 as written by Lane A in STATUS.md, including
  loadSite() and the small daily summary file.
- D5 Verdict numbers for now: STAY_DAYS = 7, CLEAR_PCT = 90,
  OUT_PCT = 10, EDGE_DEG = 2. Shown on screen so users can read the
  rule. May be revisited.
- D6 Cut order if behind, first to go at the top: custom coordinates;
  the 3D Moon (falls back to a flat Moon image); Apollo-era dates in
  3D; terrain for pole sites 2-4 (keep one). Never cut: live URL, real
  numbers, side card, Compare dates, honest labels.
- D7 Desktop only. No phone layout work or phone testing.
- D8 Real data files are copied into the published folder at build time
  and fetched per site; setDataBase(url) is added to contract v1.
- D9 Roles. Lane B keeps the app shell (index.html, main.ts, base
  styles, Vite and Vercel config), the postbuild data copy and the 3D
  Moon (step 4). Lane A now also builds three screen pieces as
  self-contained modules under web/src/panels/, which only Lane A
  edits: the side card with Plain / Numbers (step 3), the Compare dates
  grid (step 6) and the horizon view (step 7). Each exports a mount
  function taking a container element, the selected site and landing
  date, and callbacks for "site selected" and "date selected". Lane B
  mounts them and owns the shared selection. Neither lane edits the
  other's files in /web.
- D10 Malapert point. Move sp_malapert to the highest ground within
  1 km of the current representative point. Re-download its Horizons
  data for the new coordinates, recompute the horizon, rerun every
  check. Keep the old point's numbers in the README as the "200 m
  changes the answer" comparison. No other pole sites for now.
- D11 Visual scope, all owned by Lane B, in this order: (a) Real Moon
  map: replace the illustrative texture with NASA's CGI Moon Kit color
  map (svs.gsfc.nasa.gov/4720), aligned using Lane A's alignment check,
  labeled as NASA imagery for looks, not science. (b) Overview scene:
  an imported open-source Sun, Earth and Moon model, trimmed to those
  three bodies, as a separate opening scene labeled not to scale.
  Clicking the Moon enters the explorer with the same date. Markers and
  verdicts exist only in the Moon-fixed explorer. (c) A seamless zoom
  between the two scenes, only if time allows. A Credits panel lists
  every borrowed piece and its license. No code is copied from a repo
  whose license we cannot show. Cut order: (c) first, then (b). Step 8
  is unchanged: Moon-fixed true lighting.
- D12 Terrain on all 10 sites, prototype. Observer point: candidate
  sites use the highest ground within 1 km; real landings use the
  landed coordinates. State each site's map and resolution honestly.
- D13 One date slider above every tab, with an hour sub-slider choosing
  the hour within the 7-day stay. It drives lighting, side card and
  horizon view together. Lane B owns the control; panels accept the
  hour through the interface.
- D14 Overview scene with Sun, Earth and Moon only (per D11b), and a
  moving star background outside the 3D window only. A more detailed
  Moon. Lane B.
- D15 Marker color stays the verdict. A prominent plain-words legend.
  Pole sites must be distinguishable. Lane B.
- D16 Power and comms metrics in /lib: sunlight share, longest dark
  stretch, Earth-in-view share, longest contact gap, plus a power
  calculator from user-entered panel area and efficiency with every
  assumption shown. Lane A.
- D17 A best-site score per date. This REPLACES "no single best-site
  score". Educator view: one score per date with the top site named in
  plain words, no weights or formula, and a line saying the Researcher
  view explains the calculation. Researcher view: the same score with
  its full formula and every weight visible and adjustable, updating
  the ranking live. The Educator score always uses the default weights
  and says so. Both views give the same number at default weights.
  Lane A proposes the formula; label it prototype.
- D18 Researcher tab: comprehensive per-site analysis on screen with a
  download, clearly labeled as for researchers. Research what mission
  designers actually need from official NASA sources and cite them.
  Lane A builds the panel; Lane B mounts it.
- The side card switch is renamed Educator / Researcher (was Plain /
  Numbers in D3).

## Settled earlier (do not reopen without both humans)
- 10 fixed sites: 3 Apollo, Chandrayaan-3, IM-1, IM-2, 4 south pole
  representative points.
- Sun and Earth angles are downloaded from JPL Horizons and saved as
  files. No astronomy math in /web.
- /web is Vite + TypeScript + Three.js, static hosting, no backend.
- Words on screen: "sunlight" and "Earth in view", never guaranteed
  power or a guaranteed link. Flat-horizon results are labeled flat.
  Mock data always carries a visible banner.
- Four verdicts everywhere, never shown by color alone: clear,
  partial, out, on the edge (terrain decides).
- No chatbot. (The former "no single best-site score" is replaced by
  D17.)

## The steps (one numbering; old names in brackets)
| # | Step | Owner | Passes when |
|---|------|-------|-------------|
| 1 | Live URL [M0, B0] | B | public link shows the 10 sites in a desktop browser. |
| 2 | Real numbers [M1] | A | 3 human hand-checks match within 0.1 deg; data covers 2026-2029 plus each past landing; /data/README.md written |
| 3 | Side card, Plain / Numbers [M2, B1] | A panel, B mounts (D9) | a stranger answers "is Earth in view here on this date?" in 10 seconds |
| 4 | Explore in 3D [B5 moved up] | B | 3D Moon with the 10 markers at their real latitude and longitude, colored by verdict; clicking a marker zooms in and opens the side card; a date control recolors markers; south pole sites can be told apart |
| 5 | Real data in the app [B2] | A then B | MOCK is false, banner gone, on-screen values equal the files |
| 6 | Compare dates grid + timeline strip [M3, B3, B4] | A grid panel, B mounts (D9) | updates in under 1 second, cells equal the daily summary |
| 7 | Terrain, one pole site first [M4, B6] | A data + horizon view panel, B mounts (D9) | one moment where flat says lit and terrain says dark, shown in the horizon view |
| 8 | True lighting in 3D | A data, B scene | the Moon is lit from the real Sun direction for the chosen date and Earth sits in its real direction, from Lane A's scene data |
| 10 | Terrain on all 10 sites (D12) | A data, B nothing new (panels already show it) | every site's horizon is from LOLA, with its observer point, map and resolution stated; all checks pass |
| 11 | Date + hour slider (D13) | B control; A panels accept the hour (interface v1.2) | one control above every tab; moving the hour updates lighting, side card and horizon view together |
| 12 | Overview scene, stars, detailed Moon (D14) | B; A prepares Moon assets | separate not-to-scale Sun-Earth-Moon scene; stars outside the 3D window only; more detailed Moon from NASA CGI Moon Kit |
| 13 | Legend + pole sites distinguishable (D15) | B | plain-words legend always visible; a stranger can pick each of the four pole sites |
| 14 | Power and comms metrics + power calculator (D16) | A | /lib returns the four metrics; calculator shows every assumption; values equal a hand calculation from the hourly data |
| 15 | Best-site score (D17, prototype) | A | Educator and Researcher views give the same score at default weights; changing a weight re-ranks live |
| 16 | Researcher tab (D18) | A panel, B mounts | per-site analysis with download, labeled for researchers, each requested item cited to an official NASA source |
| 9 | Submit [M7, B7] | both | live link works in a desktop browser, demo recorded, project page and slides done (stays last; 10-16 come before it) |

Acceptance run by both humans (2026-11-14): steps 3, 6 and 8 PASS.
Step 4 not yet (globe markers do not recolor when the date changes;
pole sites cannot be told apart). Step 7 not yet (hour slider too hard
to find).

Lane B works 1, 3, 4, 6 on mock data (banner showing) and switches to
real data at step 5. Lane A works 2, then its half of 5, then 7, then
the data for 8. Step 4 needs no astronomy: markers come from site
latitude and longitude only. Until step 8 passes, the 3D lighting is
labeled illustrative. Never start a step before the previous one in
your own lane has passed.

## Working rules for both AIs
- Start every session by reading this file and the STATUS.md header,
  then say in 3 lines: your step, the failing test, your next task.
- Lane A edits /scripts, /data, /lib and web/src/panels/ (plus its
  panel test page web/panels.html). Lane B edits the rest of /web.
  Each writes only in its own section of STATUS.md (D9).
- The STATUS.md header is the live board: one row per person/AI plus
  "Waiting on Sheldon: ..." and "Waiting on Advik: ...". Anyone may
  update their own row there.
- Never mark a test passed without running it. Label proposals as
  proposals. Changes to anything in this file need both humans.

## Presenting
Demo the same site and date twice: once as a teacher (Plain), once as a
mission planner (Numbers). Event slides need a screenshot, a victory
and a challenge.
