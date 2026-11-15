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
8. **Colour roles (D35).** Near-black page, dark grey glass panels, warm off-white text, mid-grey secondary text, thin light dividers. No navy, no indigo. Exactly two hues remain: gold for the Sun and sunlight, blue for Earth and contact. Everything else is grey. Colour is never the only signal: verdicts always carry their word and their Moon-phase shape. Contrast is measured on the panel colour `#1C1C1E` (page `#0A0A0B`) and, for the worst case, on the 0.90 glass over pure white (`#333334`):

| Role | Colour | Meaning | Contrast on panel / worst-case glass |
|---|---|---|---|
| Sun | `#F2C14E` gold | the Sun and sunlight, **only** | 10.1 / 7.5 : 1 |
| Earth | `#5AA9E6` blue | Earth and contact, **only** | 6.7 / 5.0 : 1 |
| Text | `#F2EEE6` warm off-white | body text, links (underlined), warnings | 14.7 / 10.9 : 1 |
| Muted | `#A6A29B` mid grey | secondary text | 6.7 / 5.0 : 1 |
| Accent | `#E8E4DA` moonlight, text `#0A0A0B` | buttons and the selected tab (black text on it) | 15.6 : 1 |
| Clear / Great week | `#E8E4DA` full bright disc | verdict icon | (shape, not text) |
| Partial / Okay week | half-lit disc, `#E8E4DA` on `#2A2A2C` | verdict icon | (shape, not text) |
| Out / Hard week | dark disc `#2A2A2C`, thin outline `#8E8B85` | verdict icon | (shape, not text) |
| On the edge / Tricky week | dashed ring with centre dot, `#B5B1A9` | verdict icon | (shape, not text) |
| Panel / page / border / divider | `rgba(28,28,30,0.90)` glass on `#1C1C1E`; `#0A0A0B`; `#3A3A3C`; `rgba(242,238,230,0.16)` | surfaces and thin dividers | — |

The Educator legend adds "Bright means a better week." The verdict icons are used in every panel, the Compare grid, the legend chips and the globe pins. The panels use these as defaults through CSS variables; the shell sets the same variables once:

```css
:root {
  --llp-sun:#F2C14E; --llp-earth:#5AA9E6;
  --llp-clear:#E8E4DA; --llp-partial:#E8E4DA; --llp-out:#8E8B85; --llp-out-fill:#2A2A2C; --llp-edge:#B5B1A9;
  --llp-text:#F2EEE6; --llp-muted:#A6A29B; --llp-warn:#F2EEE6; --llp-link:#F2EEE6;
  --llp-bg:#1C1C1E; --llp-page:#0A0A0B; --llp-border:#3A3A3C; --llp-accent:#E8E4DA; --llp-on-accent:#0A0A0B; --llp-focus:#F2EEE6;
  --llp-glass:rgba(28, 28, 30, 0.90); --llp-glass-blur:14px; --llp-divider:rgba(242, 238, 230, 0.16);
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

### Second pass (D31, both humans, 2026-11-14): full-screen scenes, glass panels
**Look:** full-screen scenes with no boxes; panels are glass floating over the scene; the blue accent for controls is indigo `#4F46B8`, kept distinct from Earth blue `#5AA9E6`.

**Lane B builds:**
- **Tour** fills the window edge to edge, with no bordered card. The title sits bottom-left over the scene, with a soft dark gradient behind the text so it stays readable.
- **The tour's final stop** shows a clear prompt: **"Click on the Moon"**.
- **Explore:**
  - The Moon sits directly on the starfield, with no box, header strip or caption lines.
  - It opens on the **whole Moon, turned to the selected site**.
  - A faint fill light on the night side means it's never a black disc. Label that light as a visual aid (e.g. in the info tip: "a faint light shows the night side; it is not sunlight").
- **The selected-site ring is centred on its pin.**
- **Legend chips** all share one style, and none looks like an active filter (no highlighted or pressed chip). No shell chips on Compare, because the dates grid has its own legend.
- **Plain words:** replace "MOON-FIXED VIEW", "no terrain mesh" and raw timestamps with plain words, and move the details into the info tip. For example:
  - "The Moon is shown from a fixed viewpoint; the Sun and Earth move around it."
  - "The globe is smooth; mountains and craters are in the Horizon view."
  - "Monday 14 Nov 2026, 06:00 UTC" instead of "2026-11-14T06:00:00Z".

**Glass panels** (Lane A panels already do this; the shell should match):
- Background `rgba(19, 33, 56, 0.90)` with `backdrop-filter: blur(14px)`, rounded corners, **no borders**.
- At 0.90 opacity every text colour still passes 4.5 : 1, even if pure white sits behind the glass (worst case: violet 4.53 : 1, muted text 6.11 : 1). At lower opacity small text can fail over the bright Moon, so keep 0.90 or higher.
- One variable sets it for every panel: `--llp-glass` (plus `--llp-glass-blur`). Set it once on a parent element.

**Flat inside:** no boxes inside panels. Sections are separated by spacing and thin dividers (`--llp-divider`).
- The verdict is a line with a round symbol: Clear solid green, Partial hollow green ring, Out grey, On the edge violet with a dashed ring.
- The score is a section under a divider, not a box.

**Dates grid:** uses the full width of its panel (columns stretch; site names in a fixed first column).

## Two reading levels (D32, both humans, 2026-11-14)
**The bar:** a seven-year-old understands every Educator screen. Pictures first, one short sentence at a time, everyday words, no degrees, no raw timestamps. Adults get a small **"For the teacher"** fold-out in each Educator section: the fuller explanation plus one question for the class. Researcher keeps every number, adds charts across 2026–2029 and downloads.

**Lane A panels (done):**
- **Side card, Educator:** the short site name and "A lander really landed here." / "A place picked as a possible landing spot."; one verdict sentence with its symbol ("Great week", "Okay week", "Hard week", "Tricky week"); **two rings** (gold = sunshine, blue = Earth in sight) labeled in words ("all week", "most of the week", "about half the week", "a little of the week", "not this week"); a **week strip** (one column per day, gold top = sunshine, blue bottom = Earth in sight, dashed line = now); "Now: day 3 of the week" with one sentence each for the Sun and Earth ("The Sun is up, but a hill is hiding it."); the score as one number with the best candidate place named and a child-level "Why these weights?"; "Why the south pole?" in three short sentences.
- **Compare, Educator:** the dates grid with child words in the legend, and one sentence naming the best week in the four weeks shown (the 7-day stay with the highest default-weight score), with a "Pick that day" button. The hour-by-hour strip, the score box and the two-scenario / requirements tools appear only in Researcher (the planner hides itself in Educator).
- **Horizon view, Educator:** no angle labels; "The bumpy line is the hills."; one sentence each for the Sun and Earth, including how far away a hiding hill is.
- **Fourth tab:** **Learn** in Educator (`mountResearcher` shows it when `level` is "educator"; also exported as `mountLearn`), **Report** in Researcher.
  - Learn: "Your place" rings, then five picture explainers from our data: (1) a hill can hide the Sun (the real Malapert skyline on 2026-09-19 06:00 UTC); (2) near the poles the Sun stays low (Apollo 11 vs Malapert, highest Sun in 30 days); (3) a day lasts about a month (four months of sunshine and night at Apollo 11); (4) Earth stays in one spot (a month of Sun and Earth positions at Apollo 11); (5) two NASA photos with their exact credit line and official page: Apollo 8 Earthrise ("Image Credit: NASA") and Lunar South Pole PIA13523 ("Credits: NASA/GSFC/Arizona State University"), each under 100 KB.
  - Report: two charts across 2026–2029 (monthly sunlight and Earth in view; the daily Sun and Earth score with every lunar eclipse seen at the site marked and the landing date shown), and downloads for this site by month and for **all sites, every landing date**.
- **Tour captions:** `kidTitle` / `kidText` on every stop (no digits, no degrees, at most two sentences of 16 words or fewer), same facts and sources as the Researcher captions.
- **Heading font:** panel headings use `var(--llp-heading-font, inherit)`.

**Lane B builds:** the wordmark (`web/public/brand/lunlux-wordmark.png`) in place of the text title in the header and on the Tour; the icon (`web/public/brand/lunlux-icon.png`) as the browser tab icon; Urbanist for headings, self-hosted from `@fontsource/urbanist` (licence SIL OFL 1.1), set once with `--llp-heading-font`; the fourth tab labeled **Learn** in Educator and **Report** in Researcher; tour captions from `kidTitle` / `kidText` in Educator.

## Final cleanup (D33, both humans, 2026-11-15)
**Fonts, whole site:** headings in **CMU Serif**, all other text and numbers in **Source Serif 4**. Both are self-hosted from npm (`computer-modern`, `@fontsource/source-serif-4`) with their licence files confirmed. No other fonts. Lane B loads them; Lane A panels inherit body text from the page and take headings from `--llp-heading-font`.

**Text:** no PROTOTYPE tags anywhere. One plain sentence in the Researcher score section and in Data and methods: "The Sun and Earth score is this team's own formula, not a NASA standard." No middle dots as separators; use a semicolon or spacing.

**Lane A panels:**
- Verdict and legend symbols are small drawn icons (inline SVG), not text characters, so they look the same on every computer. Each keeps its word label (never colour alone): Clear = filled green circle with a tick; Partial = hollow green ring with a half fill; Out = grey circle with a cross; On the edge = violet circle with a dashed ring and an exclamation mark.
- Learn tab: diagrams no wider than about 560 px, labels that never overlap, one divider between sections, legend labels kept on one line.
- Educator: "Why these weights?" becomes **"Why this score?"**, answered in words a seven-year-old understands. Researcher keeps "Why these weights?" with one line per weight.
- Stay length (Researcher only): 1, 3, 7 or 14 days; Educator always uses one week.

## Pins, grid icons and deck polish (D36, both humans, 2026-11-15)
- **Globe pins only** are coloured: a solid body with a dark outline (`#0A0A0B`) and the grey Moon-phase icon inside a dark disc. Green `#4FBF7A` for Clear / Great week and Partial / Okay week (the phase inside tells them apart), coral `#F28B82` for Out / Hard week, violet `#B48CF0` for On the edge / Tricky week, grey `#A6A29B` for no data. The Explore legend chips use the same colours, so the legend matches the pins.
- Pins that overlap on screen are spread apart around their shared centre, each with a thin leader line back to its true spot.
- Everything else stays black and grey (panels, the Compare grid, the side card). Gold is only the Sun, blue only Earth.
- The Compare grid's phase icons are larger, so Out / Hard (dark disc) and On the edge / Tricky (dashed ring with dot) are easy to tell apart.

