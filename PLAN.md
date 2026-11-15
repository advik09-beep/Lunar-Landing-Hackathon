# PLAN.md v2 — the one plan (LunLux, NASA Space Apps 2026)

**LunLux** — Sunlight and Earth contact for lunar landing sites

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
  D14 amendment (both humans, 2026-11-14): the overview scene's first
  version is the OzAILabs solar system simulator, forked and embedded as
  its own tab with full credit. It shows all planets and is not yet tied
  to our date control; the screen says both. Trimming it to three bodies
  and syncing the date come later if time allows. Lane B.
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
  D17 amendment (both humans, 2026-11-14): (1) scores bunched at 100,
  which read as "perfect". The scale is NOT compressed or capped; instead
  100 is harder to earn by two terms from existing data: clearance (how
  far above the terrain skyline the Sun and Earth sit while visible) and
  slip tolerance (how well the score holds if the landing date moves up
  to 3 days either way). Renamed "Sun and Earth score", with one line
  saying what 100 does and does not mean (not overall site safety).
  (2) A clickable "Why these weights?" next to the score in both views:
  plain sentences in Educator, one line of reasoning per weight in
  Researcher, stating that the weights are this team's judgment, not a
  NASA standard, and that the Researcher view lets you change them. Both
  views still give the same number at default weights.
- D18 Researcher tab: comprehensive per-site analysis on screen with a
  download, clearly labeled as for researchers. Research what mission
  designers actually need from official NASA sources and cite them.
  Lane A builds the panel; Lane B mounts it.
- The side card switch is renamed Educator / Researcher (was Plain /
  Numbers in D3).

- Planning stop 2026-11-14 (both humans): the six default score weights
  (sunlight 25, Earth 20, short dark 15, short gap 10, clearance 15,
  slip tolerance 15) are confirmed.
- D19 Stricter rules. (a) The Sun is a disc: each hour has a sunlight
  fraction, the share of the disc above the terrain skyline. (b) Earth's
  shadow: lunar eclipses reduce that fraction; the eclipse dates found in
  2026-2029 are cross-checked against NASA's published list as a check.
  (c) Earth counts as in view only when its whole disc clears the skyline;
  partly hidden is reported as marginal. (d) The power calculator uses the
  actual Sun distance each hour. Lane A proposes how fractions feed
  windows, verdicts and the score.
- D20 Lunar conditions per site and stay, from data we hold: lunar season
  (sub-solar latitude; confirm NASA's explanation from the source Lane B
  listed), time of lunar day, eclipses, partial Sun, Earth's position and
  wobble, distance to Earth with one-way signal delay, distance to the
  Sun with sunlight strength, a caution when the Sun is near the
  Earth-Moon line, the Sun's compass sweep, best and worst months. State
  what is NOT modeled.
- D21 No south-pole assumption. The ranking is filterable: all sites,
  candidate sites, historic landings. Historic landings are labeled as
  comparisons for educators.
- D22 Other planets: a short note that their gravity is already included
  in NASA's JPL ephemeris and their light and radio are negligible.
  Verify from JPL documentation before writing it.
- D23 Tour purpose (Lane B): the overview says explicitly that only the
  Sun and Earth decide a lunar lander's power and radio link.
- Order: D19, then D21, then the D18 Researcher tab carrying D20 and D22.
- Noted (Lane B changes made without a planning decision, recorded
  2026-11-14): Earth removed from the Explore scene and replaced by a
  procedural nebula background (95f3d88); the OzAILabs simulator embed
  cleaned up (95f3d88, D14 amendment); a NASA challenge objectives audit
  added to Lane B's docs (34744ea, 395d77b).

- Planning stop 2026-11-14 evening (both humans). From now on, status
  notes are folded into real commits; no status-only pushes.
- D24 Overview opens on a still title card: purpose message, "Start
  tour", "Skip to the Moon". A "Solar system tour" button in the main
  navigation on every tab returns to it. Lane B.
- D25 Every tour stop answers "What does this body do to a lander on the
  Moon?" Lane A writes the ten captions with a source each; Lane B
  displays them.
- D26 "Why the south pole?" appears at the tour's Moon stop, as a
  clickable in the Educator view, and as one line in the Explore header.
  It also says the tool works for any site and historic landings are
  comparisons.
- D27 One clock: the date and hour sliders also drive the solar system
  overview. Lane B.
- D28 Saved A/B scenario comparison and a mission requirements filter.
  Lane A, after D25 and D26.
- D29 (both humans, 2026-11-14): the project is renamed **LunLux**,
  replacing "Lunar Landing Site Navigator" everywhere, with the one-line
  description "Sunlight and Earth contact for lunar landing sites". The repository, folders and web addresses keep
  their names. The starting page shows the solar system dimmed behind
  the title card, and the simulator's sound is off by default with a
  visible toggle (Lane B).

- D30 Presentation pass (both humans, 2026-11-14). Structure (Lane B):
  one home page "Tour" (title, Start tour, the simulator; no sliders or
  legend); four tabs Tour, Explore, Compare, Report; Credits becomes a
  small "Data and methods" link; Explore = 3D Moon + side card with a
  Globe / Horizon switch, the Moon stays in view while the card scrolls,
  site picker instead of long lists; Compare = dates grid, two scenarios,
  requirements; one slim one-row toolbar on Explore, Compare and Report
  (site picker grouped Candidate sites / Historic landings, landing date
  with -7 / +7, hour slider, the inspected-moment note as an info tip);
  legend = one row of four chips on Explore and Compare only; globe
  markers = small pins in the verdict colour with its symbol, a ring on
  the selected site. Theme (both lanes): identical colour roles (gold =
  Sun and sunlight; blue = Earth and contact; Clear green, Partial
  half-green outline, Out slate grey, On the edge violet; symbols and
  words always), one type and spacing scale with tighter card padding,
  plain language on screen (no lane names, API versions, file paths or
  "168 hourly samples"). Lane A: apply the theme in every panel, short
  site names for lists, no TERRAIN tag, "Historic" instead of "PAST",
  and one shell-wide Educator / Researcher switch (panel interface v1.3).
  Details: DESIGN.md, "Presentation pass".

- D31 Second presentation pass (both humans, 2026-11-14): full-screen
  scenes with no boxes, glass panels, a blue accent kept distinct from
  Earth blue. Lane B: the Tour fills the window edge to edge with the
  title bottom-left over a soft gradient; the tour's final stop says
  "Click on the Moon"; Explore puts the Moon directly on the starfield
  (no box, header strip or caption lines), opening on the whole Moon
  turned to the selected site with a faint night-side fill light
  labeled as a visual aid; the selected-site ring is centred on its pin;
  all legend chips share one style and none looks like an active filter,
  with no shell chips on Compare; "MOON-FIXED VIEW", "no terrain mesh"
  and raw timestamps become plain words, details in the info tip.
  Lane A: glass panels (translucent with blur, opaque enough to pass
  contrast, one shell variable, no borders); flatten nested cards;
  Partial becomes a hollow green outline; the dates grid uses the full
  width; one short "Hour by hour" line. Details: DESIGN.md.

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
  partial, out, on the edge ("terrain decides" at flat-horizon sites;
  "grazing the skyline: small changes in position matter" at terrain
  sites; both humans, 2026-11-14).
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
