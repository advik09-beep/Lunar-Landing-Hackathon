# DESIGN.md: LunLux screen design (APPROVED by both humans 2026-11-14)

**LunLux** — Sunlight and Earth contact for lunar landing sites

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

## Presentation pass (D30, both humans, 2026-11-14)

Plain-language brief for the app shell (Lane B builds the structure; both lanes share the theme).

### Structure
1. **One home page, "Tour".** The LunLux name and its line "Sunlight and Earth contact for lunar landing sites", a "Start tour" button, and the solar system simulator behind it. This page merges "LunLux overview" and "Solar system tour". No date or hour sliders and no legend here.
2. **Four tabs: Tour, Explore, Compare, Report.** "Credits" becomes a small link named **"Data and methods"**. The LunLux name lives on Tour.
3. **Explore** = the 3D Moon plus the side card. A **Globe / Horizon** switch shows either the globe or the "Stand here" horizon view (the horizon panel). The Moon stays in view while the card scrolls. No long site list and no A–D card: use the site picker.
4. **Compare** = three sections, in this order: the dates grid (Compare grid panel), two scenarios and requirements (planner panel). **Report** = the Researcher panel.
5. **One slim toolbar, one row**, on Explore, Compare and Report only:
   - a site picker grouped as **Candidate sites** and **Historic landings** (use each site's `category`; show `shortName`);
   - the landing date with **−7** and **+7** buttons;
   - the hour slider.

   The note that the hour is the moment being inspected becomes a small info tip (ⓘ).
6. **Legend** = one row of four chips (✓ Clear, ◐ Partial, ✕ Out, ⚠ On the edge), only on Explore and Compare.
7. **Globe markers:** small pins in the verdict colour with the verdict symbol on them, and a ring around the selected site.

### Theme (identical in the shell and the panels)
8. **Colour roles.** Each colour has one meaning, everywhere. Colour is never the only signal: always use the symbol and the word too. Contrast is measured on the card colour `#132138` (page `#091322`):

| Role | Colour | Meaning | Contrast on card |
|---|---|---|---|
| Sun | `#F2C14E` gold | the Sun and sunlight, **only** | 9.6 : 1 |
| Earth | `#5AA9E6` blue | Earth and contact, **only** | 6.3 : 1 |
| Clear | `#4FBF7A` green, solid | verdict ✓ Clear | 7.0 : 1 |
| Partial | `#4FBF7A` green, **half-filled outline** | verdict ◐ Partial (never yellow) | 7.0 : 1 |
| Out | `#94A3B8` slate grey | verdict ✕ Out | 6.3 : 1 |
| On the edge | `#B48CF0` violet, dashed outline | verdict ⚠ On the edge | 6.1 : 1 |
| Text / muted | `#ECF2FF` / `#A8BBD3` | body text / secondary text | 14.4 / 8.2 : 1 |
| Warning | `#F28B82` coral | real warnings only (e.g. "Unavailable") | 6.8 : 1 |
| Link | `#9CC6FF` | links | 9.2 : 1 |
| Card / border / accent | `#132138` / `#344B69` / `#2F5D9A` | surfaces, lines, selected buttons (decorative; text on the accent is 5.9 : 1) | — |

Dark text (`#0B1322`) on the verdict fills is 7.0 : 1 or better. The panels use these as defaults through CSS variables. The shell can set the same variables once on a parent element, and the panels then follow:

```css
:root {
  --llp-sun: #F2C14E; --llp-earth: #5AA9E6;
  --llp-clear: #4FBF7A; --llp-partial: #4FBF7A; --llp-out: #94A3B8; --llp-edge: #B48CF0;
  --llp-text: #ECF2FF; --llp-muted: #A8BBD3; --llp-warn: #F28B82; --llp-link: #9CC6FF;
  --llp-bg: #132138; --llp-border: #344B69; --llp-accent: #2F5D9A; --llp-focus: #9CC6FF;
}
```
The same values are exported as `THEME` from `web/src/panels/shared.ts` for code that draws (e.g. globe pins).

9. **One type and spacing scale.** Sizes 0.75 / 0.84 / 0.95 / 1.1 rem (extra small / small / body / heading), spacing steps of 4 and 8 px, card padding 12 px × 14 px.
10. **Plain language on screen.** No "Lane A", "Lane B", API versions, file paths, function names or "168 hourly samples". Say "7-day stay", "day 2 of the stay", "hourly data".

### What the panels now do (Lane A, done)
- They use the colours above, the scale and the tighter padding. Yellow no longer means Partial; it only means the Sun.
- **Short site names** (`shortName` from `listSites()`, e.g. "Apollo 11", "Malapert") appear in lists and grids; the full name stays in the card.
- No TERRAIN tag on grid rows (every site has terrain). Historic sites are tagged **"Historic"**.
- **One reading-level switch:** panel interface v1.3 adds `level?: "educator" | "researcher"` to the props and `update({ level })`. With a single Educator / Researcher switch in the shell header, pass `level` when mounting and call `update({ level })` on every panel when it changes. The panels then hide their own switches. The Researcher panel (Report tab) and the planner are always the full view.

