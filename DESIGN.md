# DESIGN.md: screen design (PROPOSAL by Sheldon 2026-11-14, needs Advik's OK)

## Two views, one clock
- Explore (landing): the Moon with the 10 site markers. Each marker is
  colored by verdict for a stay starting on the selected landing date.
  A date stepper under the Moon changes the date and every marker
  recolors. Clicking a marker zooms to the site and opens a side card:
  verdict, Sun status, Earth status, horizon model, and two exits:
  "Stand here" (horizon view) and "Compare other dates".
- Compare dates (tab): grid with sites as rows and landing dates as
  columns, same colors. Clicking a cell opens the same side card.

## Four verdicts, same everywhere, never color alone
clear / partial / out / on the edge. "On the edge" means the Sun or
Earth sits within EDGE_DEG of the horizon for most of the stay, so
terrain decides. EDGE_DEG is a named constant; starting value 2
degrees on flat-horizon sites, to be confirmed by both humans.

## How this maps onto Lane B's plan (order unchanged)
- B0 unchanged and still first.
- B1 readout = the side card.
- B1b (new, small): Explore with a FLAT Moon image, markers and date
  stepper, so the product works end to end before any 3D.
- B4 comparison = the grid tab.
- B5: swap the flat image for the Three.js Moon. One directional light
  from the sub-solar direction in getSceneState so the day/night line
  is real for the date; Earth drawn in the sub-Earth direction; marker
  click = smooth zoom. South pole sites sit within a few degrees of
  each other, so zoom or an inset is required to tell them apart.
- B6 horizon view = "Stand here".

## Needed from Lane A (proposal, Lane A finalizes signatures)
- Edge fields on getState and getSummary, plus a verdict.
- A small precomputed per-day summary for all sites, so markers and
  the grid never load ten hourly files.
- Coverage at least 8 weeks ahead of today for the grid.
