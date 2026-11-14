# DESIGN.md: screen design (APPROVED by both humans 2026-11-14)

PLAN.md wins if anything here disagrees with it. Step numbers below are
PLAN.md's (1-9).

## Two views, one clock
- Explore (landing): a 3D Moon with the 10 site markers, from the start
  (PLAN D2; no flat-image first version). Each marker is colored by
  verdict for a stay starting on the selected landing date. A date
  stepper under the Moon changes the date and every marker recolors.
  Clicking a marker zooms to the site and opens a side card: verdict,
  Sun status, Earth status, horizon model, and two exits: "Stand here"
  (horizon view) and "Compare other dates".
- Compare dates (tab): grid with sites as rows and landing dates as
  columns, same colors. Clicking a cell opens the same side card.

## Plain / Numbers (PLAN D3)
A switch on the side card sets the reading level.
- Plain: the verdict in words plus one sentence of why.
- Numbers: Sun and Earth angles, margin above the horizon, hours to
  sunset and to Earthset, source, coverage, and a CSV download.

## Four verdicts, same everywhere, never color alone
clear / partial / out / on the edge. "On the edge" means the Sun or
Earth sits within EDGE_DEG of the horizon for most of the stay. Wording
(both humans, 2026-11-14): at flat-horizon sites "terrain decides"; at
terrain sites (terrain already included) "grazing the skyline: small
changes in position matter". Numbers for now (PLAN D5): STAY_DAYS = 7,
CLEAR_PCT = 90, OUT_PCT = 10, EDGE_DEG = 2. The rule is shown on screen.

## How this maps onto PLAN.md's steps
- Step 1 Live URL: unchanged and first.
- Step 3 Side card = the readout, with the Plain / Numbers switch.
- Step 4 Explore in 3D: Three.js Moon, markers at their real latitude
  and longitude, marker click = smooth zoom. South pole sites sit
  within a few degrees of each other, so zoom or an inset is required
  to tell them apart. Lighting is labeled illustrative until step 8.
- Step 6 Compare dates = the grid tab plus the timeline strip.
- Step 7 Terrain = "Stand here" horizon view.
- Step 8 True lighting: one directional light from the sub-solar
  direction in getSceneState so the day/night line is real for the
  date; Earth drawn in the sub-Earth direction.

## Needed from Lane A (contract v1 in STATUS.md, approved, PLAN D4)
- Edge fields on getState and getSummary, plus a verdict.
- A small precomputed per-day summary for all sites, so markers and
  the grid never load ten hourly files.
- Coverage at least 8 weeks ahead of today for the grid.
