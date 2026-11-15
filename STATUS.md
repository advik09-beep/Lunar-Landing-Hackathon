# STATUS — LunLux

PLAN.md v2 is the one plan and wins over this file. This header is the live board; anyone may update their own row.

| Who | Step | Doing now |
|-----|------|-----------|
| Advik + ChatGPT (Lane B) | D32 COMPLETE — STOPPED | Five D32 shell items committed; final source commit d0ef0f6 verified Vercel READY. Human visual/readability review remains open. |
| Sheldon (Lane A human) | — | Evening planning stop 2026-11-14: D24–D28 signed; status notes folded into real commits from now on |
| Claude Code (Lane A) | D33 items 1–5 done; item 6 (stay length) next | Text cleanup, icon symbols, Learn layout, Why this score?, README |

Acceptance (both humans): steps 1, 2, 3, 6, 8 PASS; step 4 and 7 pending earlier findings. Signed: D7–D23 (see PLAN), **D24–D28** (title card + tour nav, tour captions, why the south pole, one clock, A/B scenarios + requirements filter). Rule: no status-only pushes.
Waiting on Sheldon: read the new Educator screens on web/panels.html (level = Educator) and the Learn tab; confirm the two NASA photos and their captions.
Waiting on Advik: Human review of the deployed D32 Educator/Researcher switch, Tour wordmark and tab icon, Learn/Report tab, child-level Tour captions and simplified shell text; check in-browser rendering, readability and navigation. D27 shared clock and D28 Planner are integrated in Lane B code, but no new human acceptance is claimed. Earlier step 4 and step 7 acceptance findings remain unchanged.

## Continuous two-agent coordination protocol (agreed 2026-11-14)

This is an explicit instruction from Advik for Lane B, and a coordination request to Lane A.

- **Before responding to each new project-related user prompt AND before beginning an implementation task**, Lane B must re-read the current GitHub repo state, at minimum PLAN.md and STATUS.md, and check the latest commits/tree for relevant new or changed files and directions from Sheldon's Claude. Read any new integration notes, changed /lib exports, or new API documentation BEFORE deciding what to do. Do not rely on an earlier in-chat snapshot if the remote repo has advanced.
- **Before writing**, fetch the latest relevant file versions and their blob SHA; preserve all intervening Lane A changes. If a concurrent update occurs, re-fetch and reconcile rather than overwriting another agent's work.
- **After significant milestones, decisions, API agreements, integration fixes, passing/failing tests, or blockers**, Lane B must add a concise dated entry in STATUS.md, then commit it to GitHub. Describe what changed, files/commit references, evidence of tested behavior, anything still unverified, and the next concrete dependency. Do not mark tests passed without execution or deployment evidence.
- Lane A is requested to follow the reciprocal workflow: review the latest STATUS.md and Lane B commits before changing shared APIs, and document implementation decisions and blockers for Lane B. Use this file as the persistent cross-agent handoff.
- Keep detailed changes/final integration contracts in appropriate sections rather than rewriting the status header inaccurately; update the opening status lines when milestones truly change. Label **proposals** versus **approved contracts** clearly.
- Ownership is unchanged: Lane A owns /scripts, /data and /lib; Lane B owns /web; STATUS.md is shared. No unapproved cross-lane source edits. If Claude and Codex disagree on interfaces or validation, record the disagreement and escalate to both humans.
- A new chat or coding session is not a reason to skip the remote check. These checks run on demand for each prompt/task; neither agent is claiming autonomous background monitoring.

## Lane A notes for Lane B (2026-11-14)
- All three exports are SYNCHRONOUS. Extra export: MOCK (true now; false once real Horizons data is in).
- Times in: ISO 8601 UTC with Z (or ms since epoch). Angles out: degrees. Mock azimuth/sign conventions are NOT yet confirmed; real ones go in /data/README.md at M1.
- sites carry extra fields coordsVerified and note; show "unverified" when coordsVerified is false.
- Site catalog is /data/sites.js (JS module, not JSON, so the browser can import it).
- Lane A rules live in CLAUDE.md. Lane B ignore it.
- M1 tests will use only verified sites; unverified sites do not block M1.
- Plan change (2026-11-14): SLIM replaced by IM-2 Athena (Mons Mouton). Site id is now `im2` (`slim` removed). Now sourced (LROC): -84.7906, 29.1957E, ~2025-03-06T17:30Z.

## Technical review — notes for Claude Code (Lane A)

These are engineering concerns for discussion, not unilateral changes to decisions already frozen in PLAN.md. Do not edit Lane B's /web. Flag any proposed contract or scope change to both humans before changing it.

### P0 — Data-interface contract and provenance
- Preserve the three agreed exports and field names in PLAN.md: listSites(), getState(), getSummary(). Explicitly tell Lane B whether calls are synchronous or Promise-based. Lane B currently accepts either for listSites().
- Agree on valid UTC input type (recommend ISO 8601 with Z), angle units (degrees), azimuth reference and sign, site ID stability, valid date coverage, out-of-range/error behavior, and what null means for a missing next visibility change.
- Keep simulated/placeholder values identifiable as MOCK. Never silently mix mock and validated scientific outputs. Do not provide invented timestamps or intervals as real conditions.
- The M2 timeline and M4 horizon panorama require efficient time-series and terrain-profile access. Consider getTimeline(siteId,startUtc,days) and getHorizon(siteId) as *proposals*; coordinate with Lane B and both humans before modifying the frozen seam.
- Keep source, coverage, sampling interval and flat-vs-terrain provenance available for display; do not let the UI mistake flat-horizon estimates for verified terrain-aware results.

### P0 — Astronomical validation
- Document the exact Horizons setup reproducibly in /data/README.md: Moon topocentric observer (body 301), Sun/Earth target identifiers, site height datum, longitude east-positive, latitude convention, azimuth direction (typically clockwise from north), output quantity, UTC/time scale, and apparent-vs-geometric treatment.
- Confirm the correct observer-site syntax and whether any light-time, refraction or correction setting materially affects the chosen outputs. The Moon has no atmospheric refraction.
- Before declaring M1 done, compare at least three independent hand-queried Horizons site/time values to the exports. Test east/west sign and azimuth orientation, not just plausible Sun angles.
- A time series sampled hourly needs an explicit policy for interpolation and visibility-transition times; do not imply minute-level precision from hourly-only samples.

### P1 — Terrain visibility is the main scientific risk
- A horizon generated from LOLA topography must account for observation point elevation, terrain distance, Moon curvature and local slope, projection, and the highest obstruction along each azimuth.
- A 360-bin (1 degree/bin) horizon can miss narrow obstacles. Disclose resolution and consider validation at one south-pole site before scaling to four if time is tight; do not silently change the four-site commitment.
- Clarify treatment of the finite angular disks of the Sun and Earth. The current plan assumes point objects, so label computed results as approximations.
- 'lit' should mean Sun potentially visible, NOT actual solar electrical output. 'comms' should mean potential direct-to-Earth line of sight, NOT a guaranteed working link.
- Verify a terrain-blocked case against the computed profile: geometrically above flat horizon yet below terrain horizon, with consistent azimuth and time.

### P1 — Manage scope and site ranking
- The planned 2026–2029 hourly downloads for ten sites plus historical windows are substantial. Validate a smaller representative time range first; expand coverage only once retrieval, units and tests work. Discuss any lasting scope change with both humans.
- There is no universal 'better' landing site: sunlight and communications trade off. Do not invent a universal suitability score without explicitly chosen mission constraints or weights.
- Supply curated site coordinates and sources, including clear distinction between past landing coordinates and planned candidate locations.

## M0 acceptance checklist
- [x] Lane B added /web/index.html, which dynamically imports listSites() and displays the returned names.
- [x] Lane A committed a working /lib/visibility.js and ten sourced sites. (done: 10/10 sourced)
- [ ] Public static URL verified to show ten actual site names.
- [ ] Both humans confirm M0 pass; then update this STATUS.md.

## Change ownership
Lane A owns /scripts, /data, /lib. Lane B owns /web. STATUS.md is shared for coordination by explicit instruction. Leave PLAN.md unchanged unless both humans agree.

## Lane A source log (2026-11-14)
- IM-1, IM-2 coords from LROC located-lander pages; IM-2 time minute-precision only (NASA).
- Apollo 11/12/17 landing times confirmed on NSSDCA spacecraft pages.
- Chandrayaan-3 landing time is secondary (collectSPACE) and approximate; Chandrayaan-3 kind changed to 'agency'.
- No source here states a reference frame except JAXA (ME); frames to be fixed in /data/README.md at M1.
- South pole sites now from NASA's 2024-10-28 nine-region list: Peak near Cabeus B, Haworth, Malapert Massif, Nobile Rim 2. Each is a 'representative point' = center of the LROC preliminary NAC mosaic for that region, not an official region center. IDs CHANGED: sp_shackleton and sp_connecting removed; added sp_cabeus_b_peak, sp_nobile_rim2; sp_haworth and sp_malapert kept with new coords. Better points would come from USGS region shapefiles (doi:10.5066/P1MEQ6UK), not yet opened. Slater Plain had no citable point.

---

# FINAL INTEGRATION BLUEPRINT — Sun/Earth/Moon visual + lunar mission planner (2026-11-14)

**Audience:** Sheldon/Claude Code (Lane A) and Advik/Codex/ChatGPT (Lane B). Read this after the status header above. This is a joint engineering handoff, NOT a claim that these features already exist.

**Authority/approval:** Advik has explicitly selected the four UX/stack choices below. Because PLAN.md says frozen technical decisions and shared-contract changes require both humans, Sheldon must review the effect on the /lib contract and confirm feasibility before either lane changes the agreed exports. Do not rewrite PLAN.md or silently change the seam. This section is a proposed integration design with implementation gates, and the original M0-M4/M7 criteria remain applicable unless both humans revise them.

## 1. Locked product experience (Advik's decisions)
1. **Opening = interactive Sun–Earth–Moon overview.** Space scene with visible, clickable Sun, Earth and Moon; drag/orbit, zoom, select, focus, pause/play, date input, and explanatory UI. Do NOT build a nine-planet simulator, physics sandbox or arbitrary spacecraft model.
2. **Moon click = zoom WITHIN the same 3D experience.** Cinematic camera approaches the Moon; no hard jump to an unrelated page. At close range, display surface-anchored landing markers. A separate detailed lunar geometry/LOD mesh MAY replace the coarse globe invisibly during zoom as long as the apparent interaction is continuous and coordinate-correct.
3. **Accuracy = date synchronized.** A single chosen UTC timestamp drives both the visual orbital arrangement and the site visibility dashboard. Treat orbital state and lunar orientation as scientific inputs, not independently guessed animations.
4. **Frontend = Vite + TypeScript + Three.js, static deployment.** Only Lane B implements the build/visual layer; Lane A still provides pure JS data modules. Vite is a build tool, not a requirement for an application backend.
5. **Always-present fast route to mission tools.** A landing-site dropdown / "Analyze site" shortcut must work without a camera journey. The 3D experience enriches the mission-planning workflow and must not make comparisons slower.
6. **Scope remains fixed at 10 curated sites** (three Apollo, Chandrayaan-3, IM-1, IM-2, four polar sites), with four south-pole terrain-aware horizons as intended end-state. No custom coordinates until stretch scope.

## 2. Overall system architecture

**Lane A /scripts + /data + /lib (scientific authority):**
- Source and validate all landing coordinates and dates. Store provenance, coverage windows and frame/datum conventions.
- Produce cached **local, lunar-surface apparent Sun/Earth azimuth + elevation** from Horizons; compute terrain-horizon obstruction from LOLA and derive site status and visibility windows.
- ALSO provide **precomputed Sun/Earth/Moon inertial positions and the Moon-fixed-to-inertial attitude**, or a compatible small cache consumed through a Lane A-owned /lib API. This is needed to make the orbital overview date-synchronized. OzAILabs' existing 2020–2035 ephemeris cache is a candidate source, but the exact frame, center, units, time scale and position-vs-attitude consistency must be validated. The 3D global ephemeris is not a substitute for topocentric site calculations.
- Own error handling for outside-coverage queries, mock/validated status, interpolation and time-scale notes.

**Lane B /web (visualization only):**
- Own Vite, TS, Three.js renderer, clickable objects, controls, camera transitions, view-state machine, site markers, responsive UX, charts, timeline, and comparison cards.
- Import ALL astronomy/site/terrain data through Lane A's **/lib/visibility.js** exported functions (or jointly approved /lib re-exports), not direct raw /data reads and not independently calculated Sun/Earth/Moon ephemerides. JS→TS adapters may map units for rendering but MUST NOT generate scientific angles, orbital states or visibility flags.
- A purely graphical scaled vector transform is acceptable; it does not imply that the **rendering** scale is physically true. A marker's conversion from verified lunar coordinates to globe geometry is a display transform and needs explicit frame/texture alignment tests.
- Keep any unvalidated 3D placeholder clearly marked "illustrative / mock". No independent physically-looking orbit animation pretending to be scientific.

**Shared clock:** ISO 8601 UTC with Z (or epoch ms) as input; one selectedInstant shared by clock bar, 3D orbital view, local horizon, timeline cursor, comparison pane. The dashboard date range is distinct from the instantaneous cursor. Avoid drift between continuously animated time and the static site calculation; pause/play changes the same state.

**Architecture:** /lib/visibility.js → /web/src/data/VisibilityAdapter.ts → /web/src/{scene,ui,views}. /web/src/data/OrbitalDataAdapter.ts should consume a jointly approved Lane A /lib export, not reimplement astronomy or independently load and interpret incompatible ephemerides.

## 3. Existing contract (DO NOT BREAK)
- listSites() returns site IDs/names/coordinates/kinds/dates/sources. Current exports: listSites(), getState(siteId, utcTime), getSummary(siteId, startUtc, days), MOCK.
- getState currently returns {sunEl, sunAz, earthEl, earthAz, lit, comms, hoursToSunChange, hoursToEarthChange, terrain}. getSummary returns {pctLit, pctComms, pctBoth, longestDarkHours}.
- Current Lane A implementations are **synchronous**; UTC is ISO string with Z or epoch milliseconds; angles are degrees. If cache loading requires async later, propose a versioned contract and coordinate the migration BEFORE changing synchronous semantics.
- Proposed fixes for Lane A: listSites() currently strips coordsVerified/note, despite /data/sites.js carrying those fields. Forward those metadata fields. Mock getState() currently returns terrain:"real" for polar sites without real terrain; do not display this as validated. Provide explicit status/provenance (e.g. MOCK + terrain status) that cannot be mistaken for real calculations.
- Null lat/lon or coordsVerified:false means no precise globe marker. An unsourced placeholder can appear as an approximate *region* with explicit label, never as a verified landing point.

## 4. Proposed ADDITIVE integration exports — require both humans' approval
No new API function is approved merely by appearing here. Lane A should recommend final signatures and Lane B should confirm the UI can consume them. Preserve current exports and existing caller behavior.

A. **getTimeline(siteId, startUtc, days, stepHours=1)**
  → [{ utc, sunEl, sunAz, earthEl, earthAz, lit, comms }] or equivalent documented structure. Include sampling and accuracy metadata; timeline is generated by Lane A's scientific model, not by invented animation in Lane B. Memory/performance may favor precomputed arrays. Visibility transitions from hourly sampling are approximate; specify interpolation/accuracy.

B. **getHorizon(siteId)**
  → { azimuthDeg: number[], elevationDeg: number[], model:"lola"|"flat", resolutionDeg, source, verified, referenceFrame } or equivalent. Values are local terrain obstruction elevations; if not available, return an explicit flat approximation, NEVER an unmarked fabricated terrain profile. The panorama should draw THIS exact horizon curve.

C. **getSceneState(utcTime)** — new essential output for synchronized 3D.
  Suggested schema:
  {
    utc: "2026-11-14T12:00:00Z",
    center: "solar-system-barycenter",
    frame: "EXPLICIT_FRAME_NAME",
    unit: "km",
    sun: [x,y,z], earth: [x,y,z], moon: [x,y,z],
    moonFixedToInertialQuat: [x,y,z,w],
    source: "...", coverage: ["...", "..."],
    verified: true
  }
  This is an *example*, not a promise of a particular frame. Provide exact axis ordering, handedness, quaternion convention, reference body, timestamp definition and interpolation. Include Moon attitude using authoritative orientation data (SPICE/PCK/appropriate Horizons orientation capability), not merely Moon orbital revolution. If Moon-fixed orientation is not ready, label the lunar globe/date-linked marker arrangement "orientation approximate" and do not claim complete physical synchronization.

D. **getCoverage()/getMetadata()** (or fields on existing exports)
  → what sites/times are actually supported, sampling interval, source URLs/attribution, mock-vs-validated status and per-site terrain reliability. The UI must disable unsupported date ranges and give explanatory unavailable states, not silently extrapolate.

**Data QA / semantic rules:**
- Distinguish **Sun unobstructed** from actual electrical wattage: no "power generation potential in W" without array area, orientation, efficiency, incidence angle and system assumptions. Say "sunlight availability / solar elevation".
- Distinguish **Earth visible** from assured communication: say "potential direct-to-Earth line of sight", not "guaranteed link."
- Terrain may block a body above the geometric horizon. Clearly distinguish flat horizon versus verified local terrain and disclose point-body approximation and angular horizon resolution.
- Do not pick a universally "better" site without mission-specific weights. Comparisons first show pctLit, pctComms, pctBoth, longestDarkHours, countdown and a timeline; optional weighted ranking only with transparent user-selected priorities.

## 5. Reference simulator decision / source licensing
- **Preferred reference:** OzAILabs/SolarSystemSimulator (modular TypeScript Three.js scene/camera/body selection, animated Sun and Earth visuals, existing Horizons vector-cache concepts). SOL/CKret is less suitable for customization because its primary scene is monolithic, though it has an explicit MIT license and can be studied as fallback.
- **Do NOT wholesale copy** the OzAILabs repo into /web or import its N-body engine/planetary catalog. Only Sun, Earth, Moon, camera, selection, render loop and useful effects are needed. Avoid asteroid swarm, spacecraft, gravity engine, chatbot, heavy simulations, extra planets.
- OzAILabs README says MIT but the inspected repository had no standalone LICENSE. Before copying significant source code/assets, confirm permissions and retain license notices/credit. If unclear, implement equivalent scene logic using independently authored Three.js code. External texture licenses are separate; Solar System Scope textures require CC BY 4.0 attribution and NASA datasets need appropriate citation.
- Preserve third-party source citations in an in-app "Data & Credits" panel and final submission.
- Three.js rendering is **NOT** the source of visibility ground truth.

## 6. 3D/UI feature inventory (implementation contract)
**Overview:** Three recognizable bodies only; clear clickable targets (raycasting), hover/focus indication, touch + keyboard reachable selectors, zoom/orbit controls, pause/play, adjustable playback rate, UTC time picker, reset overview, mini legend for educational/non-physical scale. Render Sun with emissive material + light, Earth with textured sphere, Moon with correctly aligned texture. Prefer readable speed over excessive effects.

**Moon focus:** Moon-click smoothly moves camera and OrbitControls target, preserving the same selected UTC. Close Moon mode maintains globe orientation and sites. Add "Back to overview" and "Analyze selected site". Prevent landing markers from disappearing through clipping or becoming enormous; use LOD/adaptive scaling, readable labels and occlusion awareness. High detail southern polar imagery/terrain may load on demand; fall back to a textured sphere. Visual surface relief must NOT be used for scientific horizon decisions.

**Landing markers:** Derive positions from Lane A-verified lat/lon and the Moon-fixed orientation; validate both near-side Apollo and south-pole placement against a trustworthy lunar atlas. Differentiate historical landings, agency/commercial landings and candidate regions. Unverified candidates marked "approximate" or excluded. Selection opens site's analysis without changing time unexpectedly.

**Mission panel:** Prominent exact UTC, site coordinates, Sun/Earth az/el, present visibility, countdown to next Sun/Earth obstruction/sunrise/sunset, terrain model badge/wording, coverage source and limitations. Treat missing values as "unavailable" not zero.

**Timeline:** Default 30 days, four mutually exclusive states: sunlight+Earth, sunlight only, Earth only, neither. Time scrubber updates the SAME shared clock and 3D scene, with tooltips and UTC ticks. Don't substitute sinusoidal UI interpolation for science; use Lane A timeline.

**Comparison:** Two columns: site A vs site B OR same site on date A vs B. Expose durations/percentages and dark intervals from getSummary; show trade-offs rather than invented best-site claims. Both panels update quickly; don't change one another unless "link dates" is explicitly enabled.

**Local-horizon view (terrain milestone):** A compact 2D azimuth-elevation panorama adjacent to Moon globe/mission card, plotting getHorizon plus getState-derived Sun/Earth positions/paths. Verify a test case where flat horizon predicts Sun visible but terrain blocks it. A full immersive 3D terrain scene is optional and must not replace this accurate graph.

**Accessibility and responsiveness:** Mobile + desktop layout, high contrast, non-color-only categorical labels, keyboard operability, reduced-motion option, clear loading/error/unsupported-date states and acceptable frame rates on ordinary laptops. Users can reach mission analysis in <=2 interactions from initial load (site picker + analyze).

## 7. Synchronization / coordinate correctness checklist (non-negotiable)
1. Single UTC timestamp for all outputs; document UTC vs JD_TDB conversion and ephemeris coverage.
2. Agree on **barycentric vs geocentric/selenocentric** origins; geometric vs apparent positions, ICRF vs ecliptic reference planes, right-/left-handed axes and kilometers-to-render-scale transform. Never compare unlike quantities without transforming.
3. Define lunar surface reference: Moon-fixed frame (e.g., ME/PA with definition), planetocentric latitude, east-positive longitude, reference radius/shape and height datum. A texture seam must correspond to the agreed 0° longitude.
4. Moon orientation changes with time; account for rotational attitude/libration. Orbit-only placement with visually arbitrary rotation would make the site markers wrong.
5. Cross-check at least three site/time examples that a ray from a Moon-fixed marker toward displayed Sun/Earth is geometrically consistent (within documented tolerance and apparent/geometric corrections) with local topocentric results. Also compare 3 local Horizons readouts to +/-0.1° as planned.
6. **Historical coverage conflict:** OzAILabs' bundled vector cache covers 2020–2035, while Apollo landings occurred in 1969–1972. Either precompute historical global ephemerides and Moon orientation for those periods OR clearly disable synchronized historical 3D playback while allowing independently validated historical site readouts. Never apply a 2026 scene to an Apollo 1969 landing instant.
7. Do not exceed a cache's bounds. Missing time/site data → explicit unavailable state. Do not silently fallback to approximate Kepler orbit while labeling it JPL synchronized.
8. As long as MOCK is true, show a persistent "DEMO / SIMULATED VALUES — NOT FOR MISSION USE" indicator in *all* scientific readouts.

## 8. Phased delivery / acceptance gates (existing PLAN criteria preserved)
**Gate 0 — M0 / infrastructure (IMMEDIATE):**
- Lane A has already sourced all 10 site coordinates (including four **representative**, not exact landing, south-polar points). Confirm catalog metadata is exposed by listSites(); coordinate-frame/datum alignment still requires M1 validation.
- Lane B migrates the existing simple /web/index.html into a minimal Vite/TS app, importing ../lib/visibility.js; build must include source outside /web correctly. Choose one canonical Vite config/root, verify dev, production build, actual hosted URL, phone viewport, mock banner and all ten names. Static deployment can use GitHub Pages or equivalent, but require correct repository subpath/base URLs. Do not ship a broken static import.
- PASS when deployed ten-name list works, source verification is honest, and both humans sign off. Do not mark done merely because files were committed.

**Gate 1 — Scientific and data validation (Lane A M1; Lane B can work in parallel):**
- Validate topocentric Horizons setup (observer Moon surface, Sun=10, Earth=399, correct lon/az/alt/UTC conventions) and three independent checks.
- Deliver actual, sampled coverage for a small representative window before mass-downloading 2026–2029, then widen toward original scope. Expose real coverage in metadata. No silent reduction of agreed final scope without both humans.
- Agree on proposed additive APIs for scene state, horizon and timeline, as needed.

**Gate 2 — Core mission dashboard (Lane B M2 + Lane A):**
- Date/site selector, Sun/Earth angles, flags, countdowns, four-color 30-day strip, provenance + mock state. PASS: outside user answers potential Earth line-of-sight for selected date within 10 seconds.

**Gate 3 — Minimal synchronized three-body scene (NEW core visual):**
- Render Sun, Earth, Moon only, focus by click, same selected UTC, controls/pause, accurate cached global positions and documented Moon orientation (or clearly mocked until validated). No heavy physics or other planets. PASS: change date → all three-body poses and mission readouts update to the same timestamp; no fake accuracy claims. Hardware/mobile smoke test.

**Gate 4 — Zoom + lunar markers (NEW core visual):**
- Camera zooms continuously into Moon; site markers located with Moon-fixed coordinates; verified historical/near-side + polar sanity checks. Direct site picker stays available. PASS: clicking Moon/site opens valid site analysis and back navigation, without date drift; unverified sites clearly flagged.

**Gate 5 — Comparison (M3):**
- Same-site/different-dates and two-site comparisons, meaningful trade-offs rather than predetermined winner, measurable update responsiveness under ~1 second for cached datasets.

**Gate 6 — Terrain + accurate horizon (M4):**
- Four south-pole terrain horizons target, starting with a well-validated single exemplar to de-risk methods; compare the 360-bin horizon with real terrain sampling and document precision. PASS: one geometric-above-horizon but terrain-blocked case and the panorama agrees.

**Gate 7 — Submission hardening (M7):**
- Preserve three-hour freeze for recorded demo, mobile checks, data/method credits, limitation explanations, project page, and deployed URL. Define an "accurate minimum" fallback: if 3D syncing is not scientifically validated, ship the working site/date comparison with explicitly illustrative 3D rather than false precision.

**Out of initial scope:** chatbot, arbitrary solar-system bodies, N-body engine, custom coordinate live Horizons calls, immersive DEM terrain meshes, opaque AI rankings. Optional only if gates above pass with substantial time remaining.

## 9. Build / collaboration protocol
- Respect folders: Lane A edits /scripts,/data,/lib; Lane B edits /web. STATUS.md is the shared handoff; no one changes the other lane's files without explicit agreement.
- Keep root package.json currently {"type":"module"} as-is unless both approve; place Vite's package.json and tsconfig in /web. Decide deployment strategy and permissions for imports above /web. Include reproducible build commands in Lane B docs.
- Run a lightweight integration smoke test when either side changes /lib exports; record which commit/data version the UI was tested against.
- Before making an interface-breaking change: propose the exact new shape here, get the humans' approval, implement a stub, update the visualization adapter, THEN deploy. Coordinate commit/pull to avoid overwriting shared STATUS.md.
- Each session still begins with PLAN.md + STATUS.md and the required 3-line report. Update pass/fail checklists only after tests actually run.

## 10. Immediate handoff to Sheldon / Claude Code
**Please read this whole section and reply in STATUS.md** (or tell both humans, then document the outcome):
1. Confirm that Vite+TS **within /web** is compatible with the Lane A module contract, and whether current synchronous access can be preserved.
2. Recommend precise, minimal signatures for getSceneState/getTimeline/getHorizon or an equally small combined API. Provide concrete NASA/JPL source, frame, orientation strategy and feasible date coverage, including historic Apollo handling.
3. Identify a credible Moon-attitude source / pipeline that allows surface sites to stay geographically correct during date changes; call out if full consistency cannot be validated in the allotted time.
4. Confirm fixes to listSites() metadata and false "real terrain" label under MOCK.
5. Continue Lane A's current **single next task**: M1 step 1, verify Horizons' lunar surface observer configuration from documentation and fetch/check one verified site (Apollo 11). The 10-site catalog is already fully sourced; do not re-source it as the next task.

**Immediate Lane B next task (unchanged until M0 passes):** Vite migration + verified deployed ten-site catalog, entirely in /web. DO NOT start full OzAILabs import, 3D scene or new ephemeris calculations before that acceptance check.

**Status accounting:** This blueprint is documentation only. No new feature, scientific validation, build, or deployment has passed merely because this section was committed.

## Lane B

### 2026-11-14 — D23 production unblocked and live handoff verified

- Re-read current PLAN.md and STATUS.md; fresh heads were fork master `5a21e3677160297011edab91b38a465c89b00a50` and navigator main `8c290fcacc0947ba2c96b081b4133d3e955741b4` (includes previously blocked `a911612`).
- **Plan/quota:** authenticated Vercel dashboard shows **USMDO Club Pro**. The previous HTTP 402 daily deployment block no longer occurs: both production deployment requests were accepted and reached READY. An exact remaining daily allowance was not exposed; no remaining count is asserted.
- **Deployed in order:** fork `dpl_5cTsE7kHnTcBq8a88LXTwhPnCZxn` READY, then main `dpl_7Ldt7adLJDfkFuiG8h9mnoy6cj2X` READY, with the above exact SHAs and successful production aliases.
- **Public URLs:** https://solar-system-simulator-beta.vercel.app and https://lunar-landing-hackathon.vercel.app . The main site embeds https://solar-system-simulator-usmdo-club.vercel.app with its own parentOrigin.
- **Live desktop browser verification:** chose landing date **2026-11-21**. Advanced the embedded tour to its final Moon stop; the parent switched to **Explore in 3D**, kept that date, and showed all ten landing-site controls. Returned to Overview after exiting the tour, visually located the centered Moon, and physically clicked the visible rendering canvas at the Moon; the parent again switched to Explore with the same date and ten controls. No synthetic postMessage was used for either test.
- In-app browser console scan returned no warnings/errors. Credits still state NASA LOLA terrain for all ten sites; overview retains Lane A-aligned planets wording. This is D23 verification only, not acceptance of other pending plan steps.
- Only Lane B's header row and this Lane B log entry changed. Lane A source, panels, status entries and PLAN.md are preserved. The status-only follow-up commit/build is checked separately after this update.

### 2026-11-14 — M0 frontend migration (ChatGPT/Codex)

- **Implemented /web only:** migrated the catalog entrypoint to Vite + TypeScript, added `web/package.json`, `web/tsconfig.json`, `web/vite.config.ts`, `web/src/main.ts`, `web/src/style.css`, `web/.gitignore`, and `web/README.md`. Changes committed directly to `main`; final frontend commit: `df80ba4`.
- **Integration:** `web/src/main.ts` imports `listSites` and `MOCK` exclusively from `../../lib/visibility.js`; it does not calculate Sun/Earth positions or read `/data` directly. Shows the 10-site catalog and a visible simulated-data warning when `MOCK` is true. `vite.config.ts` allows the repository root for dev-time imports and sets a relative static asset base.
- **Verification:** confirmed these files and imports exist on GitHub. **NOT YET VERIFIED:** `npm install`, TypeScript typecheck, Vite production build, local browser rendering, mobile layout, or public deployment. Do not mark M0 passed.
- **Next single Lane B task:** run the build and local integration smoke test using instructions in `web/README.md`; then configure/verify a publicly deployed URL and confirm the 10 names on desktop/mobile. This is the remaining M0 acceptance blocker.
- **Coordination rule (explicit Advik instruction):** On every new project prompt and before every task, reread current `PLAN.md`, `STATUS.md` and repository changes; read Claude's latest instructions first. Edit application code ONLY under `/web`. For coordination, write ONLY inside this `## Lane B` section of `STATUS.md`. Fetch latest blob SHA and append/reconcile before pushing; never rewrite Lane A sections. Only take the next single task, and after major progress record actual tests, unresolved blockers, and commits here.


### 2026-11-14 — Lane B next-step execution plan and handoff to Sheldon / Claude

**Status / evidence (read from current main, planning only):** Lane A's Horizons script and ten 169-row /data/ephem/*.json files cover 2026-11-14 through 2026-11-21 UTC. The three independent Horizons hand-checks remain pending; the full 2026-2029 + historical coverage is not yet present. /lib/visibility.js still exports MOCK=true and its three existing synchronous functions; it does **not** consume the new files. /web remains a Vite/TypeScript site-list integration with no proven production build or public URL. The four south-polar coordinates represent approximate region points, not precise landings. No implementation milestone or acceptance test is newly passed by this plan.

**Execution order (one task at a time; don't skip acceptance gates):**

1. **B0 — Finish M0 (next single task, highest priority; target ~45–75 min).** From /web: install dependencies, run `npm run typecheck` and `npm run build`, start the built app locally, verify 10 names from `listSites()` and the persistent MOCK warning, then deploy static `web/dist` with a host configured to build from the repo (including the `/lib` and `/data` imports). Confirm public URL, phone layout and console cleanliness. *Pass only after live link verified and both humans sign off.* Troubleshoot imports/TypeScript or hosting before new features. No changes to Lane A files.
2. **B1 — M2 mission readout (target ~1–2 h, after M0).** Create one shared UTC-selected instant and site ID, responsive layout with direct site picker/date-time field, and explicit Sun elevation/azimuth, Earth elevation/azimuth, `lit`, `comms`, transition countdowns and terrain/provenance labels sourced exclusively from `getState()`. Distinguish potential sunlight and potential Earth line-of-sight from guaranteed electricity/comms. Show loading, unavailable and out-of-coverage states. When MOCK=true, keep a prominent simulated-values banner and do not imply real terrain. **Pass:** a user can answer whether potential Earth direct line-of-sight exists at the chosen site/time in <10 seconds.
3. **B2 — Integrate validated M1 data when Lane A has it (after interface agreement).** Preserve existing synchronous `listSites/getState/getSummary` contracts. Lane B *recommends* the additive async `loadSite(siteId)` pattern proposed by Sheldon for per-site downloads, with `getCoverage()` to bound date inputs; approval by Advik and final function signatures are still required. Use a `VisibilityAdapter` in /web; call `await loadSite(id)` once per selected site then read state synchronously, handle `NOT_LOADED`/`OUT_OF_COVERAGE` without false values, and re-query after switches. **Pass:** UI updates from validated /lib data, proper unsupported-date states, no astronomy in /web. Until M1 passes, continue UI construction against visibly flagged mock data only.
4. **B3 — Visibility strip / time scrub (target ~60–90 min).** Display a four-state strip (Sun+Earth, Sun only, Earth only, neither), shared UTC cursor, hourly sampling provenance, tooltips and 30-day target. Prefer Lane A's proposed `getTimeline`; as an interim measure use `getState` only over *confirmed available coverage* and label the sampled resolution. The current seven-day M1 cache cannot truthfully support a 30-day scientific strip. **Pass:** displayed categories exactly agree with the underlying model and scrubbing updates both cards.
5. **B4 — M3 comparison (target ~60–90 min).** Two-site or same-site/two-date panels using `getSummary`. Show %Sun, %Earth direct line-of-sight, %both, longest darkness and the evaluation window; don't invent a universal weighted winner. **Pass:** updates in <1 s on cached data and values match known /lib outputs.
6. **B5 — 3D Moon-focused overview and smooth Moon zoom (after core readout; scope-controlled).** Use Three.js in /web with accessible controls, click selection, back-to-overview and geographically aligned landing markers. A scene with orbital claims must consume a **validated** Lane A `getSceneState(utc)`; no invented Sun/Earth coordinates or local ephemeris math. Sheldon's current proposed `MOON_ME` Moon-fixed scene yields *Moon-centered relative Sun/Earth directions*, not a heliocentric view of Earth's orbit. Present it honestly as a Moon-centered mission visualization with non-physical display scaling; the Moon itself stays fixed in that frame. If `getSceneState` is delayed, use a clearly labeled static/illustrative scene or defer 3D rather than pretending it is date-synchronized. **Pass:** scene and readouts reference one UTC time; smooth Moon focus and markers do not drift or misrepresent verified sites.
7. **B6 — M4 terrain horizon panorama (Lane A dependency).** Consume approved `getHorizon(siteId)` + `getState`, not visual globe relief, for a local azimuth/elevation plot and Sun/Earth overlays. Mark all flat sites as approximations and polar profiles as terrain-aware only when LOLA validation passes. **Pass:** documented flat-visible/terrain-blocked event agrees with the graph and `lit` flag.
8. **B7 — M7 submission hardening.** Check desktop/mobile performance, date/time edge cases, backend-free static deployment, citations/texture licensing, sample use cases, screenshots and demo readiness. Reserve the final **three hours before the confirmed event deadline** for final demo/project page/testing and no new major features. If behind: trim effects/3D complexity first, never scientific accuracy, the working dashboard or live link.

**Near-term priority:** Saturday: B0, B1, B3 and B4 where feasible; integrate B2 as soon as Lane A's real /lib exports and acceptance tests exist. A simple B5 scene is stretch for the evening, and full B6 follows Lane A's LOLA milestone. Sunday: scientific/3D accuracy, terrain, polish, submission. Timeboxes are estimates, not declarations of passing tests.

**Explicit message to Sheldon and Claude Code (Lane A; PLEASE READ):**
- Our **immediate single Lane B task** is M0 build + actual public deployment. We will edit code only inside /web and touch only this `## Lane B` section for communication. We will not calculate Sun/Earth positions or read source data outside /lib/visibility.js directly. We will tell you our verified build/link and integration results here.
- Please prioritize your existing **three independent manual Horizons comparisons** (including azimuth, elevation, UTC, source/frame conventions), then enable actual science data in `/lib/visibility.js` and document coverage/method in `/data/README.md`. These remain Lane A-owned tasks; do not change our frontend to do them.
- Please reply in your `## Lane A` section with a **final versioned API contract and readiness flags** for `loadSite`, `getCoverage`, `getTimeline`, `getSceneState`, and eventually `getHorizon`, plus whether the proposed async `loadSite` is approved by Advik. Preserve legacy exports and define range/NOT_LOADED behavior; avoid changing sync calls without coordination.
- For `getSceneState`, clarify that the authoritative positions are Moon-centered in `MOON_ME` (including units, axes, time/frame and Moon texture longitude alignment). We can display a Moon-focused scene under that design, but must not label it a physical heliocentric solar system. Prioritize this after M1; not a blocker for the functional dashboard.
- Current sampled data is 7 days only; please indicate when 30-day windows and historical date ranges become usable. The UI will never extrapolate or imply a period is covered when it is not.
- Keep the four south-pole **representative-region** markers identifiable until validated terrain/site position conventions are available. Please signal when one LOLA profile has passed the terrain obstruction check.
- Both agents: re-read current GitHub PLAN.md/STATUS.md before each new prompt/task, commit small increments, do not overwrite the other section of STATUS.md, and record only tests actually run. **This is a plan and a request for acknowledgement—not an instruction to start multiple Lane A tasks simultaneously.**

**Current single next action remains B0:** Verify `npm run typecheck` / `npm run build` and deploy the 10-site frontend. No /web implementation, live URL, or scientific test has been performed by this planning update.

### 2026-11-14 — PLAN v2 read; prototype_01 preflight (NO implementation)

- **Acknowledgment:** I have read PLAN.md v2 **in full**, the current STATUS.md header and latest Lane A entries, and approved DESIGN.md. PLAN.md v2 supersedes ALL earlier M0–M7, B0–B7, integration-blueprint, and flat-first directions. D1–D6 and data contract v1 are approved by both humans; contract entries marked NOT READY are **not implemented**. I will obey the new 1–9 step order and will **not start coding, deployment, or prompt execution until Advik explicitly says GO**.
- **Required 3-line Lane B report:** Step 1 = Live URL; pass test = public link shows ten sites on a phone; next single task = verify Vite/TS production build and deploy the site list **after GO**. Do not mark Step 1 passed without a live mobile check.
- **Design readback for prospective prototype_01 (discussion only):** two views (3D Moon Explore with ten markers + date selector; Compare dates grid); one shared UTC date; site card with Plain/Numbers; visible words plus color for four verdicts; 7-day stays; EDGE_DEG=2, CLEAR_PCT=90, OUT_PCT=10; honest mock banner and flat-terrain provenance; Step 8 true Sun/Earth orientation is deferred. Step 4's 3D Moon is NOT a heliocentric simulation, and visualization is illustrative until validated scene-state data exists.
- **Questions to Sheldon/Claude before a final Codex prompt** (please respond in your own ## Lane A section, no immediate code needed):
  1. For Steps 3–4 on MOCK data, what is the planned *mock-ready* source of per-site/day verdicts? The approved `loadDaily/getDaily` and verdict functions are NOT READY. Should Lane A expose a minimal mock version before Step 4, or do you envision another approach through `/lib/visibility.js` only? Lane B must not invent astronomy or fake a ready API.
  2. In Step 3 Numbers, the approved card needs **margin above local horizon**, source/coverage, and a CSV export. Which exact /lib fields or exports will supply those, and which CSV rows/columns should the download include? Please flag if these are not ready for the mock stage.
  3. For Step 4 marker accuracy, please confirm the Moon latitude/longitude reference (east-positive, MEAN_ME / MOON_ME), sphere vs altitude, and whether Lane B can use the current `listSites()` coordinates for a **Moon-fixed** renderer with clearly labeled south-pole representative points. Scene illumination must remain illustrative until Step 8.
- **Open presentation/implementation decisions for Advik:** Which public static host will we use for Step 1? Should `prototype_01` mean only the Step 1 deployed site list or a multi-step visual prototype that Codex will execute step-by-step when explicitly authorized? D1–D6 are not being reopened.
- **Scope reminder:** Only /web code; only this ## Lane B section of STATUS.md for communication. No application files or other sections changed in this entry. Waiting for Advik's GO.

### 2026-11-14 — Request to Claude: confirm exact Codex prototype_01 prompt (Vercel, Step 1 only)

**To Sheldon and Claude Code:** Advik chose **Vercel** hosting and **prototype_01 = PLAN v2 Step 1 only**. Please review the COMPLETE proposed Codex prompt below for consistency with PLAN.md v2, approved DESIGN.md, data contract v1, and Lane ownership. Please reply in your own `## Lane A` section with **APPROVED** or required corrections, especially build settings or anything that would prevent a public 10-site page. **This is a review request only. Advik has NOT issued GO to run Codex or deploy.**

**Proposed Codex prompt (paste this verbatim or with Claude-approved fixes after Advik says GO):**

> **prototype_01 — PLAN v2 Step 1: public Vercel URL**
>
> You are Codex, collaborating with Advik on Lane B in `advik09-beep/Lunar-Landing-Hackathon` (branch `main`). Your task is **ONLY Step 1 — Live URL**. The pass test is **a public, unauthenticated Vercel link displaying all ten `listSites()` names correctly on a phone**. Do not advance to Step 3 or Step 4.
>
> **Read before any action:** fetch latest `main`, read `PLAN.md` **top to bottom** (v2 overrides old notes), then `STATUS.md` header and both Lane sections, then `DESIGN.md`, `web/README.md`, and existing `/web` source. Check `lib/visibility.js` exports without editing Lane A. Report exactly three lines: your step, pass test, next single task.
>
> **Scope/ownership:** Edit application code **only under `/web`**. Read all scientific/site information only via `../../lib/visibility.js`; do not edit `/lib`, `/data`, `/scripts`, `PLAN.md`, or `DESIGN.md`. Edit only `## Lane B` of `STATUS.md` after work. Do not invent site names, astronomy, coordinates, calculations, verdicts, terrain, or otherwise fake API data. Preserve current app functionality; no Three.js, side card, Compare dates, or new feature implementation in this task. PLAN D2's final 3D requirement applies to Step 4; Step 1 is the minimal verifiable deployment.
>
> **Local verification:** in `/web`, run `npm install`, `npm run typecheck`, `npm run build`, `npm run preview`. Fix root causes of build/import/type errors within `/web`, without disabling type checks. Ensure the rendered app shows exactly 10 `listSites()` entries, the `MOCK === true` disclosure, a helpful error on failed API loading, and a usable phone-width layout. A passing local build does **not** mean Step 1 has passed.
>
> **Vercel (preferred Git integration):** link the **existing repo**, production branch `main`. Use **repository root `.` as Root Directory**, NOT `web`, because `web/src` imports `/lib` and `/data` above `/web`. In Vercel's **Project Settings → Build and Deployment / Framework Settings**, use explicit overrides compatible with current app:
> - **Framework Preset:** `Other` if Vercel does not detect Vite correctly from the repository root; do not force automatic root-level Vite detection.
> - **Root Directory:** `.` (the entire repository).
> - **Install Command:** `cd web && npm install`.
> - **Build Command:** `cd web && npm run build`.
> - **Output Directory:** `web/dist` (relative to the repo root).
> Verify these exact settings and whether Vercel applies the install override. If install override is unavailable, use `cd web && npm install && npm run build` as the build command. Do not change the project root to `web` to resolve build errors. If the dashboard or connected Vercel interface differs, follow its actual fields; document the working configuration. Confirm that the bundled app includes the imported site catalog. Do not create a root-level `vercel.json` or change Lane A files merely for convenience.
>
> **Public verification:** open the real Vercel URL unauthenticated. Confirm all ten site names originate from `listSites()`, the mock-data banner is visible, CSS/JS assets load, no critical console/runtime errors, and usable mobile-width layout. If possible, automated viewport verification; ask Advik for a physical-phone check before final PASS if required.
>
> **GitHub handoff:** commit minimal fixes to `/web` with small descriptive commits. Re-fetch latest `STATUS.md` SHA before writing **only the `## Lane B` section**, preserving concurrent Lane A updates. Report exact deployment URL, commit SHA, Vercel settings, tests run, mobile evidence, and either `Step 1 PASS` (only with evidence) or `BLOCKED` with precise blocker. Do not start another step. If authorization is missing, request it without exposing credentials.
>
> **Stop immediately after completing or explicitly blocking Step 1**.

**Verification from official Vercel documentation (Lane B review, not a deployed configuration):** Vercel names these project settings **Root Directory**, **Install Command**, **Build Command**, and **Output Directory**; output is relative to configured root. Documentation: https://vercel.com/docs/builds/configure-a-build . For this repository, root `.` keeps Vite's parent imports accessible. Vercel also has a "Include source files outside of the Root Directory in the Build Step" option for monorepos, but root `.` is simpler here; see https://vercel.com/docs/monorepos/monorepo-faq . No Vercel project settings or deployment have yet been applied/tested.

**Review questions for Claude:** (1) Does this EXACT prompt respect PLAN v2 Step 1 and approved API? (2) Do you foresee any issue with install/build/output overrides or root-only `package.json`? (3) Is there any source compatibility concern with the current `web/vite.config.ts` or `web/tsconfig.json` that Codex should know to diagnose, not preemptively patch? Please explicitly confirm or amend before Advik says GO.

**Current status:** Waiting for Claude's review and Advik's GO; zero frontend changes, zero build/deploy tests, and no Step 1 pass claimed by this entry.


### 2026-11-14 — prototype_01 execution: Step 1 BLOCKED

- Read current PLAN.md v2 in full, DESIGN.md, STATUS header and both lane updates; inspected current web configuration/main.ts and visibility API. Current frontend imports listSites() and MOCK; API exports MOCK=false and API_VERSION=1.1.0. Static inspection confirms expected banner logic, but browser behavior was not tested.
- Start/status commit: 97f933e599ffdbf325cd21ef052a0aea5af7c52c. Files modified by this execution: STATUS.md only (Lane B row and section). No Lane A source, plan, design, or later-step work changed.
- Local checkout/build blocker: workspace is empty; cloning at workspace root fails with ".git: Operation not permitted". Clone into /tmp then fails with "Could not resolve host: github.com". Read latest main through the authorized GitHub connector instead. Node/npm/gh are absent from PATH, standard Node install locations are absent, and primary runtime environment variables are unset. npm install/typecheck/build/preview were NOT executed; package-lock.json was NOT generated or committed. Claude's prior checks are not claimed as tests run here.
- Vercel connection works: only team returned is USMDO Club (team_xGusENTubcXSpn18WL74ewAz), no lunar project. Attempted Git-linked project lunar-landing-hackathon for advik09-beep/Lunar-Landing-Hackathon. Literal rootDirectory "." was rejected (invalid_root_directory); retried omitting rootDirectory, which represents repository root.
- Blocking Vercel error on corrected request: HTTP 400 bad_request: "Failed to link advik09-beep/Lunar-Landing-Hackathon. You need to add a Login Connection to your GitHub account first." No project/deployment created; project listing afterward remains empty. Vercel deployment URL: none.
- Temporary remote build fallback also unavailable: sandbox creation requires projectId, and the requested Git-linked project cannot be created. No sandbox was created.
- Results: TypeScript NOT RUN; Vite build NOT RUN; desktop public access NOT RUN; ten-site rendering NOT RUN; MOCK browser behavior NOT RUN; JS/CSS/runtime verification NOT RUN. Step 1 BLOCKED, not PASS.
- Required next dependency: account owner adds GitHub Login Connection in Vercel account settings, then retry the Git-linked project and complete normal npm lockfile generation/build and actual desktop public-page verification. Do not start postbuild data copy or any later step.


### 2026-11-14 — prototype_01 Step 1 PASS (Vercel desktop catalog)
- **Frontend commit:** 80dc998f49b66636a342e52d74bdeafa981633c5. Added only web/package-lock.json, generated by npm install and checked against web/package.json. Existing catalog required no source changes. STATUS.md edits are confined to the Lane B row and section; preserved concurrent Lane A updates.
- **Vercel:** USMDO Club / lunar-landing-hackathon (prj_NClen2KSaEUHtCDvo48HcoefqIEr), Git-linked to advik09-beep/Lunar-Landing-Hackathon, production main. Root = repository root (API null), Other framework (null), install = cd web && npm install, build = cd web && npm run build, output = web/dist, Node 22.x. Removed Vercel SSO deployment protection to meet authorized public access requirement. No backend or root configuration file added.
- **Production:** https://lunar-landing-hackathon.vercel.app ; immutable deployment https://lunar-landing-hackathon-rao6f9hst-usmdo-club.vercel.app (dpl_2Mm6CXSYx3vU84MNK8xBAF3W9FdS), READY from frontend commit 80dc998. Build logs confirm install, tsc --noEmit, Vite 5.4.21 and successful deployment.
- **Executed checks:** npm install PASS; npm run typecheck PASS; npm run build PASS. Used temporary Vercel Node sandbox because local Node/npm remain unavailable. Pulled concurrent Lane A main 8597987 (API 1.2.0, MOCK=false) and repeated typecheck/build: PASS. Lockfile dependency declarations equal package.json.
- **Preview:** npm run preview executed. Initial remote sandbox hostname was rejected by Vite's host check; temporary /tmp preview-only config allowed the exact sandbox hostname, without modifying repository config. Desktop browser then displayed 10 sites successfully.
- **Public desktop verification:** opened production URL in browser without a login prompt; 10 .site-name elements, names exactly match listSites() output from shared API. Existing main.ts imports listSites and MOCK only; no hardcoded catalog. Banner hidden=true with MOCK=false. CSS parsed (20 rules), no warning/error console entries, all ten names visibly rendered; screenshot inspected. Independent unauthenticated fetches returned HTTP 200 and correct content types for HTML, bundled JS and CSS. No critical runtime errors observed.
- **Result:** TypeScript PASS; Vite build PASS; public desktop access PASS; ten-site rendering PASS; correct MOCK behavior PASS; **Step 1 PASS**. No Step 1 blockers. npm install reports two dependency audit findings (moderate/high); no dependency upgrades attempted in this deployment-only task.
- **Stop:** no mobile testing, postbuild/data-copy script, dashboard integration, redesign, or later feature work performed. Lane B postbuild copy remains a separate task requiring authorization.

2026-11-14 — D9 ACKNOWLEDGED: Lane B owns the app shell/Vercel configuration, postbuild copy, 3D Moon (Step 4), shared selection and integration mounts; Lane A exclusively owns `web/src/panels/` and `web/panels.html`. I will never edit Lane A panel files.
Step 1 is PASS. On Advik's GO, Lane B's first task is D8's postbuild copy exactly per latest `## Lane A` specification; verify live `/data/ephem/index.json` and `/data/daily.json` both return HTTP 200 with correct JSON before marking it passed.
Second task, only after the copy passes and with Advik's authorization: Step 4 Three.js Moon with ten site markers; wait for Lane A's posted panel interface before mounting panels. D10 Malapert coordinate/horizon changes remain Lane A-owned. No implementation started in this acknowledgment.

### 2026-11-14 — D8 static-data publishing PASS; Step 4 started
- Frontend commits: `1e7c323` adds `web/scripts/copy-data.mjs`; `3ebabb1` adds `postbuild` to `web/package.json`. Vercel production deployment for `3ebabb1`: READY. Node 22-compatible copy includes full `data/ephem` (including Malapert horizon.json) and `data/daily.json`, but not `data/sites.js` or README. Nothing in Lane A ownership touched.
- **Live checks executed from Vercel Sandbox over HTTPS**: `https://lunar-landing-hackathon.vercel.app/data/ephem/index.json` returned **HTTP 200, application/json, 6615 bytes**; `https://lunar-landing-hackathon.vercel.app/data/daily.json` returned **HTTP 200, application/json, 406910 bytes**. D8 static-file publication check PASS; further loader/browser integrations belong to later tests.
- Advik's GO covers the next task, Step 4: interactive 3D Moon and 10 markers in Lane B-owned code. Lane A continues to own all `web/src/panels/` files, and D10 Malapert updates. Step 4 in progress, not yet passed.

### 2026-11-14 — JSON endpoint contract + Moon visualization proposal (Claude review requested)

**Readback / state, no new feature implementation in this entry:** PLAN.md v2 including D9/D10, latest STATUS header/Lane A, DESIGN.md, `lib/visibility.js`, `data/ephem/index.json`, `data/daily.json`, `web/scripts/copy-data.mjs`, and the current `web/src/main.ts`/`moon.ts` were inspected. Step 1 PASS; D8 static publishing PASS (previous Lane B production tests). The current Lane B shell has a Three.js Moon and mounts Lane A's side card; Step 4's **full acceptance test is not yet declared PASS**. No code or endpoint changes made here.

**Canonical source-of-truth for JSON endpoints (existing, not proposed new API):**
- Source files owned by Lane A: `/data/ephem/index.json` and `/data/daily.json`; per-site hourly chunks `/data/ephem/<siteId>/<YYYY>.json` (plus landing.json where present); `/data/ephem/sp_malapert/horizon.json` for LOLA horizon. The index lists `sites[siteId][]` with `file,start,end,count` and `horizons` mapping; it is NOT itself a daily-values endpoint. Daily source has `STAY_DAYS,CLEAR_PCT,OUT_PCT,EDGE_DEG,horizonModels,hoursPerStay,columns,builtUtc,sites`; `sites[siteId][]` contains compact `firstDate,rows` segments, not directly UI-ready per-day objects.
- Build/publish owned by Lane B: `web/package.json` `postbuild` runs `web/scripts/copy-data.mjs`, copying `/data/ephem/**` and `/data/daily.json` to `web/dist/data/`. Vercel serves these **static files, not backend/API routes**. Published production origins: `https://lunar-landing-hackathon.vercel.app/data/ephem/index.json`, `https://lunar-landing-hackathon.vercel.app/data/daily.json`, `https://lunar-landing-hackathon.vercel.app/data/ephem/<siteId>/<YYYY>.json`, and `https://lunar-landing-hackathon.vercel.app/data/ephem/sp_malapert/horizon.json`. Prior production checks returned HTTP 200 JSON for index (6615 bytes) and daily (406910 bytes); those checks predate some later commits, so recheck the latest deployment before claiming latest-data parity.
- Consumer contract: `/lib/visibility.js` API_VERSION 1.2.0, `MOCK=false`. Its `setDataBase(url)` sets the static data base; `loadDaily()` fetches `ephem/index.json` + `daily.json`; `getDaily(startDate,days)` yields per-site, per-day verdict and percentages for a 7-day stay; `loadSite(siteId)` uses the index to fetch per-site hourly chunks and optional horizon; `getState/getSummary/getTimeline/getHorizon` consume loaded data. **The frontend should use these exported methods, not independently decode or reimplement the compact daily format.** `READY.getSceneState=false` so no scientifically positioned Sun/Earth or true illumination yet. In the deployed Vite bundle, default `../data/` from `dist/assets/<bundle>.js` resolves to `dist/data/`; call `setDataBase('/data/')` explicitly only if verified necessary, and do not break dev mode. The existing shell uses `loadDaily/getDaily`.
- **Request to Claude:** Please confirm this exact static JSON path/source/consumer contract and whether any explicit `setDataBase('/data/')` initialization is needed for production or dev. Please flag any schema/version/caching concern before we freeze the integration.

**Next 3D / NASA lunar imagery proposal for consensus (NOT authorized implementation or new PLAN decisions):**
1. Keep the approved Moon-fixed, east-positive latitude/longitude markers and the single shared UTC date/site selection. Do **not** change the scientific contract or D9 ownership: Lane B owns `web/src/moon.ts`, scene shell and mounts; Lane A owns `web/src/panels/` including side card, Compare grid/timeline, and horizon view.
2. Replace `moon.ts`'s current *procedural illustrative crater texture* with a properly sourced, **NASA/LRO lunar global imagery mosaic** only after confirming product URL, projection, east/west longitude convention, texture seam/rotation, resolution, usage/credit and Vercel asset size. A NASA-derived *surface image texture* is distinct from an elevation mesh. If no validated texture is ready, keep the existing clearly labeled illustrative texture rather than placing a geospatially wrong texture under accurate markers.
3. For scientifically meaningful local **terrain** use Lane A's verified LOLA Malapert `horizon.json` through `loadSite/getHorizon` and the Lane A-owned horizon panel (Step 7); do not imply the whole 3D globe is a NASA DEM. Any future localized 3D elevation mesh requires an explicit NASA/PDS DEM choice, coordinate/projection validation, terrain exaggeration label, data licensing/attribution, and a scoped approval. Other pole sites remain flat per D10.
4. A heliocentric *solar-system model* (Earth/Moon/Sun orbital distances/positions) is **not in PLAN v2** and must not be slipped into Step 4. For Step 8, use a **Moon-fixed teaching view** with Sun illumination and Earth direction driven exclusively by Lane A's future `getSceneState(utc)`, once READY and verified. If the humans want a separate not-to-scale orbital explainer, request an explicit scope/cut-order decision first; keep it optional and illustrative, not presented as physical ephemeris.
5. Preserve education-first cues: markers and verdicts explained in words, 7-day stay/UTC labels, flat-vs-LOLA and image-vs-terrain provenance, and no guaranteed power/comms claims. Avoid expensive assets that threaten desktop performance or the Nov 15 deadline.

**Questions for Claude/Sheldon to resolve in Lane A (please answer explicitly before we freeze new visual scope):**
- **JSON:** Confirm source and URLs above, loader base behavior, and whether the `index.json` / `daily.json` files need a cache/versioning strategy for simultaneous deployment.
- **NASA globe:** Recommend one authoritative lunar global mosaic (specific NASA/LRO/USGS product and projection), with map-to-sphere UV orientation and attribution. Is a correctly registered globe texture feasible in time, or should we keep the procedural Moon for the submission?
- **Solar system:** Agree that PLAN Step 8 is Moon-fixed true lighting, **not** a solar-system orbital simulation? If a separate Sun/Earth/Moon explainer is valuable, what would be scientifically honest and feasible without a new `getSceneState` implementation?
- **Terrain:** Agree that the existing LOLA horizon panel is the scientific terrain product for Step 7, and any 3D terrain mesh is a separate, human-approved enhancement?
- **Milestones:** What concrete Step 4 test evidence and current side-card review outcome are still needed before declaring Step 4 PASS? Please do not change PLAN or start an unapproved feature based on this proposal.

**Proposed shared position, pending Claude/Sheldon and Advik agreement:** First verify existing 3D Moon + panels and live JSON parity; then optionally swap to a registered NASA lunar surface mosaic; prioritize Step 6 Compare, Step 7 verified horizon, and Step 8 Moon-fixed true Sun/Earth directions. Do not build a separate orbital solar-system scene unless both humans amend the scope. This is a request for consensus, not a claim of approval.

### 2026-11-14 — Lane B Step 4 deployed; desktop browser verification (review requested)
- **D8 source and deployment:** `web/scripts/copy-data.mjs` (commit `1e7c323`) and `web/package.json` `postbuild` (commit `3ebabb1`) publish all ephemeris JSON chunks, `ephem/index.json`, Malapert `horizon.json`, and `daily.json` under `dist/data/`. Live production HTTPS checks returned **HTTP 200 application/json** for both `/data/ephem/index.json` (6,615 bytes) and `/data/daily.json` (406,910 bytes). D8 data publishing PASS.
- **Step 4 implementation:** `web/src/moon.ts` (commit `92d2aae`, fix `fdfb1d0`) supplies a Three.js lunar sphere, real `listSites()` latitude/longitude markers in Lane A's Moon-fixed east-positive frame, camera orbit/zoom/focus and south-pole view. `web/src/main.ts` (commits `8156263`, `4ea711d`) owns shared site/UTC date selection, `getDaily()` real-data verdict coloring, date navigation and **mounts Lane A's `mountSideCard` via public panel interface**. CSS commit `ada643d`. Three.js deps + lockfile commits `93fa704`, `0cbc7ee`. No files in `web/src/panels/`, `web/panels.html`, `/lib`, `/data`, `/scripts`, PLAN or DESIGN edited by Lane B.
- **Executed build checks:** sandbox `npm ci`, `npm run typecheck`, `npm run build` PASS; Vite 5.4.21, 15 modules, compiled JS 552.87 kB (146.52 kB gzip). `postbuild` PASS and copied 48 ephemeris JSON files; Vite warns JS main chunk >500 kB (non-fatal). Production Vercel deployment of `4ea711d` READY; later documentation-only HEAD `b3e52ed` also READY. Live URL: `https://lunar-landing-hackathon.vercel.app`.
- **Executed desktop Chromium (1440×900) production tests:** visible WebGL2 canvas YES, ten site-selection buttons, mounted Lane A side card, `loadDaily` completed with real-data UTC/7-day status; choosing Haworth changed panel title; +7 days changed the UTC date 2026-11-14 → 2026-11-21 and **7 of 10** verdict labels; south-pole camera command and Nobile Rim 2 panel selection responded. Raycast hit testing found visible markers; synthesized pointer down/up on marker coordinates changed selection among Apollo 17/11/12. No browser exceptions during normal interactions; one desktop screenshot captured and inspected. Synthetic pointer events are not a substitute for a human physical-mouse test.
- **Scientific/presentation limits:** sphere surface texture and lighting are intentionally **illustrative**, not georeferenced NASA imagery or true ephemeris illumination; true Moon-fixed lighting remains Step 8. Site coordinates/verdicts are real scientific data from Lane A. South-pole points are geographically clustered; polar view + site selector distinguish them.
- **Acceptance request to Sheldon/Claude and Advik:** Step 4 is **implemented, deployed and functionally tested**, but final **human sign-off remains pending**; confirm real mouse/camera user experience, south-pole distinguishability, and whether approved PLAN Step 4 criteria are sufficiently met. No new NASA texture, orbital simulator, or terrain mesh was started; see the separate Lane B design-consensus proposal immediately above.

### 2026-11-14 — User GO: D9 panel mounts, D11(a) NASA map, Credits; STOP
- **Read first:** PLAN.md D11, newest Lane A entries answering five questions, panel interface v1.1, Compare grid and Horizon view. Lane B changed only `web/src/main.ts`, `web/src/style.css`, `web/src/moon.ts`, `web/package.json`, and new `web/scripts/copy-moon.mjs`; no Lane A-owned files touched.
- **Task 1 COMPLETE:** mounted `mountCompareGrid` and `mountHorizonView` alongside `mountSideCard`; passed v1.1 `onOpenView` for "Stand here" and "Compare other dates"; shell pushes both siteId and landingDate to all three mounted panels on each selection change. Live Chromium: all three panels mounted, 280 grid cells, grid site/date click updated shared selection and horizon view, side-card "Stand here" exit opened horizon, no page exceptions. Commits `75a7a82`, `a53f03d`.
- **Task 2 COMPLETE:** D11(a) NASA SVS CGI Moon Kit `lroc_color_2k.jpg` 2048×1024 (457,942 bytes), downloaded and validated at build time by `web/scripts/copy-moon.mjs` into `dist/moon/`, production URL `/moon/lroc_color_2k.jpg` HTTP 200. Texture applied to default `SphereGeometry` UVs with no rotation, east-positive frame per Lane A alignment audit. Production Chromium confirmed texture HTTP 200, Apollo 12 and Apollo 17 selectable and side card updated, NASA credit displayed, no page exceptions. NASA color imagery for looks; lighting still illustrative, terrain scientific only in horizon panel. Commits `405a16d`, `bb3367d`, `6e9ec77`, `26854e8`.
- **Task 3 STARTED / functional:** new Credits navigation/panel lists NASA SVS image and NASA media guidelines, JPL Horizons, LOLA/LRO, Three.js/OrbitControls MIT license, source-versus-illustration limitations. Live Chromium verified Credits tab opens and content renders without page exceptions. Commits `843bdf7`, `759f713`.
- **Verification:** `npm run typecheck` PASS, `npm run build` PASS, postbuild both data and NASA JPEG PASS; live Vercel URL `https://lunar-landing-hackathon.vercel.app`. Main JS chunk warning >500 kB remains non-fatal. Step 4 physical mouse sign-off remains pending. Lane A's new `getSceneState` Step 8 work acknowledged but not implemented by Lane B because Advik instructed STOP after Credits. D11(b) overview scene and D11(c) zoom not started. Layout polish deferred.

### 2026-11-14 — Lane B: vendor NASA Moon image offline + Step 8 real Sun/Earth scene PASS; STOP
- **Order followed (user GO):** First eliminated build-time download, then implemented Step 8; no D11(b) Sun–Earth–Moon overview or D11(c) transition, no layout polish, no changes to Lane A modules.
- **Dependency risk eliminated:** NASA SVS `lroc_color_2k.jpg` is now a genuine tracked binary at `web/public/moon/lroc_color_2k.jpg` (2048×1024, **457,942 bytes**, SHA-256 `f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170`; image commit `3d83fd5`). The one-time GitHub Actions download-and-commit job succeeded, and the temporary workflow was subsequently deleted. `web/package.json` now runs only `node scripts/copy-data.mjs` postbuild (commit `ad23c1f`); obsolete `web/scripts/copy-moon.mjs` deleted (`2f63d44`). Vite serves the repo's JPEG unchanged from `/moon/lroc_color_2k.jpg`; every future build no longer depends on NASA server availability. Vite build succeeded with an intentionally invalid `HTTPS_PROXY` and `HTTP_PROXY`, and the built JPEG's SHA-256 matched. One-time workflow removed (commit `cec852d`), leaving only Lane B-owned production files.
- **Step 8 code:** `web/src/moon.ts` now accepts Lane A `getSceneState` Moon-fixed vectors, converts `(x,y,z)\to(x,z,-y)`, moves a **single** directional Sun light accordingly (intensity 3.2), and keeps ambient light low (0.065). Removed former illustrative key/rim lights; Moon mesh remains fixed and the already verified UV orientation is unchanged. Draws an Earth sphere lit by that same Sun and a visible `EARTH · NOT TO SCALE` sprite, positioned in true **direction** with intentionally non-physical distance/size. Unavailable scene state clears prior directional light and Earth instead of showing stale positions. `web/src/main.ts` calls `loadScene()` once at startup and `getSceneState(selectedDate + 'T00:00:00Z')` for changes, using `sampleUtc` (hourly, never interpolated), and shows the real Earth range and a clear `Lighting unavailable` state outside data coverage. Commits `14958d5`, `001626b`, `6a965a9`, `30db2fa`, `a04275c`.
- **Required two tests executed against actual Lane A data:** Apollo 11, **2026-11-14 12:00Z**, geometric Sun elevation from scene vectors **−7.0663°** vs site-file **−7.067°**, dot product −0.12301746 → **night side** PASS. Malapert, **2026-09-19 06:00Z**, scene geometry **+1.0486°** vs site-file **+1.048°**, dot +0.01830048 → **geometric day side** PASS; `getState().lit=false` because verified LOLA terrain ridge blocks the Sun (margin −4.984°), and the UI states globe does not model local terrain. Tests ran before removing the obsolete illustrative-lighting label.
- **Verification:** `node scripts/check_scene.mjs` PASS (58,440 site-hours within 0.05°, seven key science checks); `npm run typecheck` PASS; `npm run build` PASS (only nonfatal Vite 500 kB chunk warning); Vercel production deployment for `a04275c` READY. Headless Chromium at 1440×900 verified 10 site controls, WebGL Moon, three panels, NASA image HTTP 200, **zero external NASA requests**, real `2026-11-14T00:00:00Z` Sun/Earth status and 405,616 km Earth range; date changed to `2026-09-19T00:00:00Z` (404,250 km) and outside-coverage `2032-01-01` correctly reported `Lighting unavailable`; Credits reflects verified Horizons lighting; no console/page exceptions or failed requests. Production: `https://lunar-landing-hackathon.vercel.app`.
- **Honest limits / coordination:** D11 color map remains NASA imagery for looks, **not a DEM**. The tiny ambient visibility on Moon night is for legibility only; no false local ridge shadow is rendered. Earth display distance/radius not to scale; the physical range is displayed from Lane A. **Step 4 human physical-mouse signoff remains pending.** Latest Lane A entry says root `README.md` still calls lighting illustrative; Lane A owns that shared doc, please update it to mention real Sun/Earth directions and the missing terrain shadows when ready. Lane B stops here.

### 2026-11-14 — Lane B D13 implemented, deployed; D14 started
- D13 commits `def53c8` (remove white globe marker halo overlay; enlarge opaque verdict-colored marker), `b411801` (single date range slider, date input, step controls and 0–167 hour slider above all four tabs; push `{siteId, landingDate, hour}` to all panels via v1.2, handle horizon `onHourSelected` and use same hour in `getSceneState`), `31ae816` (minimal shared-clock styling). No files in Lane A `web/src/panels/` edited.
- `npm ci`, `npm run typecheck`, `npm run build` PASS. Vercel deployment `31ae816` READY. Chromium 1440×900: global clock visible in Compare and Credits; date-slider moved to 2026-12-22 and **5 of 10** site-list verdicts changed; hour=6 produced lighting sample 2026-12-22T06:00Z; no browser exceptions. Panel internal Shadow DOM hour verification remains to be checked; no human Step 4 signoff claimed. D13 functional implementation complete, next D14 per user order.

### 2026-11-14 — Lane B D14 implementation complete, begins D15
- **D14 overview**: `web/src/overview.ts` (`0bdf553`) implements a separate illustrative Three.js Sun/Earth/Moon scene without markers or verdicts; Moon click or accessible Explore button opens the Moon-fixed explorer without changing shared date/hour. `web/src/main.ts` and `web/src/style.css` mounts this as the default overview tab (`342ff09`, `a834dad`). Visual sizes/distances/motions are explicitly *not to scale*.
- **Outside-only starfield**: `web/src/starfield.ts` (`42b065f`) is an original current-code implementation inspired by `etrepat/starfield` (Estanislau Trepat, MIT license), with exact repository link and license credited in the Credits tab; no legacy Three.js API or source code copied. Star canvas is a separate body background, not inside either 3D window; reduced motion freezes movement. Production Chromium confirmed starfield pixel data changes normally but remains byte-identical in reduced-motion mode, overview displayed, Explore navigation worked, no page errors.
- **Detailed NASA Moon**: temporary GitHub Action converted NASA's 2025 CGI Moon Kit official 4096×2048 sRGB TIFF once to a 4096×2048 JPEG tracked at `web/public/moon/lroc_color_4k.jpg` (1,909,434 bytes, SHA-256 `9d183969aa29267a41a6ec3ffddfd53a17b0a90c0dfc2d28b6b9e0a2de0e6d11`; image commit `fd1c486`), then removed the one-time workflow (`a660e70`). Main explorer uses the 4K color texture (`7785282`), overview retains the 2K to save memory, NASA attribution updated (`d4db537`). No NASA fetch at deploy. `npm ci`, typecheck and build PASS. Production Chromium confirmed 2K and 4K image URLs HTTP 200, Explore view works, no page errors. D14 implemented; human visual acceptance pending.
- **Next:** D15 prominent always-visible verdict descriptions and four polar-site callouts + explicit site picker. No other features started.

### 2026-11-14 — Lane B D15 functional completion, D13–D15 integrated verification; STOP
- **D15 legend:** `web/src/main.ts` commit `248ca89`, `web/src/style.css` commit `1f28496`: persistent across **all tabs** and above the views, prominent four verdict meanings (Clear ≥90% simultaneous Sun+Earth, Partial mixed overlap, Out ≤10%, On the edge near local horizon within 2°) plus a no-data and no-guaranteed-power/comms warning. Details use PLAN D5 thresholds; verdict colors remain authoritative labels, not score rankings.
- **Four distinguishable pole sites:** actual 3D markers remain at Lane A's `listSites()` coordinates, with A–D offset, leader-linked sprites shown in polar view and polar site focus (commit `cec8720`). Dedicated accessible A–D selection tiles display the true candidate names and dynamic date verdicts; site clicks focus the marker and synchronize the side card. Opaque verdict markers keep neutral **outline rings** so dark Out states remain visible and never get covered by the previous large white halos. `setVerdicts` now writes a descriptive canvas aria-label for assistive technology (commit `334cdf9`).
- **Final build and live browser QA:** production Vercel deployment of `334cdf9` READY, `npm run typecheck` and `npm run build` PASS (nonfatal 500 KB chunk warning). Headless Chromium (1440×900) observed 4 persistent legend explanations, successfully clicked all four A–D pole selectors (Cabeus B, Haworth, Malapert, Nobile Rim 2) with **four distinct side-card titles**, legend remained visible in Compare, zero browser page errors.
- **D13 v1.2 regression:** production Chromium explicitly verified marker aria text changed **Apollo 11: partial → clear** when date changed from Nov 14 to Dec 22, matching the independently changing site-list verdict. With Malapert selected, 2026-09-19 shared hour=6 produced **06:00 UTC** in both side-card and horizon panel; clicking the horizon's one-hour button updated the global shared clock to **07:00 UTC**. Thus shared date and hour are synchronized in all three Lane A panels and the scene; no Lane A panel files edited. 4K NASA color image and original MIT-attributed external starfield reimplementation remain deployed from D14.
- **Limits:** humans still need visual acceptance of starfield aesthetics, A–D label readability on actual desktop display, correct marker recoloring at zoom, and Sun/Earth/Moon illustration; do not mark human signoff. D11(b)'s wording about an *imported* solar model was met instead by original Three.js three-body geometry and an MIT-attributed original starfield inspired by the selected repo (no third-party 2011 code copied). NASA 4K photo is aesthetic, not a scientific terrain mesh. Further D12 terrain work and D16–D18 are Lane A responsibilities. **STOP after D15; no extra scope or layout polish started.**

### 2026-11-14 — D14: moving starfield PASS; OzAILabs forked iframe prepared, pending fork deployment
- **PLAN D14 amendment reread:** both humans require a separate **fork** of `OzAILabs/SolarSystemSimulator` hosted as its own Vercel project, embedded in the Overview tab with full original-author and texture-source credit, and an explicit warning that the full solar system is not tied to our landing date. Latest GitHub head, PLAN, STATUS and upstream README inspected; Lane A's D16/D17 concurrent work preserved.
- **Starfield options researched:** Hue Screen's depth-parallax ambient stars chosen as visual direction over Kirupa's fast cockpit warp, MOTION/LAB's subscriber-only code, and GovinduSasanka/opus-motion-library's MIT-licensed but heavier React/Remotion warp. **No third-party starfield code copied.** `web/src/starfield.ts` commit `16a1777` replaces near-static 0.7–4 px/s stars with three perceptible moving depth layers, gentle short near-star trails, optional pointer-based parallax, tab-visibility pause, and `prefers-reduced-motion` freeze. Dedicated canvas stays behind the app and **outside** the scientific/illustrative 3D windows; CSS change `5abb134`. Credits link Hue Screen as visual reference and retain MIT `etrepat/starfield` attribution.
- **Live production verification:** `npm ci`, `npm run typecheck`, `npm run build` PASS. Vercel production READY. Headless Chromium (1440×900) captured an actual page/header-region screenshot that **changed** over 1.1 seconds as stars visibly moved, and checked the canvas pixels changed too. Under emulated reduced-motion the canvas image stayed byte-identical over 850 ms. `data-effect=depth-parallax`, fixed background z-index 0, zero browser errors, zero failed network requests, all three Lane A panels still mounted.
- **OzAILabs integration ready but NOT active:** `web/src/main.ts` commit `5416673` supports a full-size sandboxed HTTPS iframe when build-time `VITE_SOLAR_OVERVIEW_URL` is set. The iframe carries upstream attribution, shows **all planets**, clearly states its date is independent of our mission clock, and provides the existing Explore-tab exit. Local Vite preview using a **temporary non-project URL** verified frame presence, full-size layout, disclaimer and Explore button; **this was not an OzAILabs simulator deployment test**. Without a verified fork URL, the previous functioning 3-body overview remains as fallback. The connected GitHub account lacks `advik09-beep/SolarSystemSimulator` and Vercel USMDO Club has no second simulator project. Do not invent or substitute a URL.
- **Missing user-side prerequisite:** Advik should fork `https://github.com/OzAILabs/SolarSystemSimulator` to his GitHub account, deploy the fork in USMDO Club through Vercel, verify its public link and provide that URL or set `VITE_SOLAR_OVERVIEW_URL` on the main Vercel project before redeploy. `web/README.md` commit `1ca02f1` documents the exact steps and existing main-project build settings. Upstream README says **MIT**; actual planetary texture credits include Solar System Scope **CC BY 4.0** plus other named sources, all disclosed in Credits. No dedicated upstream root `LICENSE` file was found, so the interface attributes MIT **as stated in README**, without overstating separate image rights.
- **Scope:** No modifications to `web/src/panels/`, `/lib`, `/data`, `/scripts`, or PLAN/DESIGN. No D16–D18 implementation or unrelated layout changes. **Starfield completed; actual forked Overview embedding blocked on user fork/deployment URL.**

### 2026-11-14 — D14 OzAILabs fork deployed and embedded: live production PASS
- **Fork verified:** [advik09-beep/SolarSystemSimulator](https://github.com/advik09-beep/SolarSystemSimulator) is a public GitHub fork of [OzAILabs/SolarSystemSimulator](https://github.com/OzAILabs/SolarSystemSimulator), default `master`, fork commit `6fc2e0b`. Upstream README identifies source code as MIT; separately credits Solar System Scope textures CC BY 4.0, plus Planet Pixel Emporium, NASA/USGS Astrogeology and Steve Albers. No root LICENSE file was found in upstream; licensing is attributed to README, without extending code rights to textures.
- **Separate Vercel deployment LIVE:** Created `solar-system-simulator` in USMDO Club (`prj_V7jfIPgmeSAWdg4dAyrCe1Pkfr2l`) with GitHub integration to the fork, Vite preset, `npm install`, `npm run build`, `dist` output. Production deployment `dpl_5mKEw2ZGPytKdBYtMJ7RuHdhZnqx` READY, public canonical domain **https://solar-system-simulator-usmdo-club.vercel.app/**. Disabled Vercel SSO protection for the public simulator project; anonymous HTTPS GET returns HTTP 200 original simulator HTML. Production build 55 modules, TypeScript/Vite success; nonblocking chunk-size warning and upstream `npm audit` reported 8 dependency vulnerabilities (4 moderate/4 high), not changed under this narrow integration task.
- **Main production iframe LIVE:** Set Production `VITE_SOLAR_OVERVIEW_URL=https://solar-system-simulator-usmdo-club.vercel.app/` on the existing lunar navigator Vercel project (`prj_NClen2KSaEUHtCDvo48HcoefqIEr`), then created a production Git-linked deployment `dpl_HVPy8N9xG83jaydF5KGKHD1Q2JkJ` READY. Later GitHub code/doc commits auto-deployed as READY. `web/src/main.ts` Credits updated to link upstream OzAILabs, user fork, deployed site and texture sources (commit `9ac0675`). `web/README.md` now records actual project IDs, public domain and configuration (commit `85eee1d`). Existing secure iframe integration from `5416673` displays the full interactive solar system and notes its date is independent from the Moon's mission clock; Explore exit preserves date selection. No third-party code merged into main frontend.
- **Browser evidence (1440×900 Chromium):** Public standalone simulator returned original `Solar System Simulator` title and **2 rendering canvases**; no page exceptions. On the current main URL **https://lunar-landing-hackathon.vercel.app/**, Overview's iframe source was exactly the canonical public simulator domain and its inner frame contained **2 canvases**. OzAILabs attribution and independent-time disclaimer displayed; Explore button navigated to Moon-fixed view, kept explicitly selected date **2026-12-22**, kept **all 10 landing-site controls**, and Credits contained both upstream/fork links. Browser: zero page exceptions and zero HTTP error responses. Main and separate Vercel production deployments READY.
- **Scope:** Lane B only touched `web/src/main.ts`, `web/README.md` and its own `STATUS.md` header/section in this follow-up. No edits to Lane A `web/src/panels/`, `lib/`, `data/`, `scripts/`, PLAN or DESIGN. D14 fork embedding blocker RESOLVED; stop, awaiting any further authorized work.



### 2026-11-14 — Requested visual cleanup + NASA objectives audit
- User requested removing irrelevant simulator menus and its timeline, removing the Earth sphere from Explore, adding a nebula, and a detailed challenge-gap assessment.
- Lunar frontend commit **95f3d88c5394845489be511e76c0496e0a85ae64**: web/src/main.ts, moon.ts, new nebula.ts. Explorer now has an original procedural dark nebula texture (decorative, no external assets); Earth sphere/label removed while real Sun-direction lighting remains. Earth stays in the scientific Stand here diagram and metrics. Credits/status text distinguish imagery from scientific geometry.
- Fork commit **0c8a973eaa6720cebb409b78c989179c167f1164** in advik09-beep/SolarSystemSimulator master: index.html adds opt-in lunarEmbed=1 presentation mode. Embedded menus, date overlay, event panels, transport dock/slider and other simulator overlays hidden; canvas and body labels retained. Main app adds this parameter to configured iframe URL. Standalone unparameterized simulator retains its controls. No synchronization claimed: global clock now labeled for Explore, Compare and Stand here.
- Build checks: lunar npm ci, typecheck, build/postbuild PASS. Fork npm ci rejected pre-existing stale lockfile; npm install then tsc + Vite build PASS (generated fork lockfile not committed in this visual-only change). Both Git-linked Vercel production deployments READY: lunar dpl_Bv1ym5HGeNmS3pV6vMrfYiWDPTaD; fork dpl_2oW59M8ah48C3NVBxTKKePVLtTM1.
- Desktop verification: local built preview showed textured Moon on nebula with no Earth sphere; production iframe URL has lunarEmbed=1 and transport-dock/ui-root both invisible. Production shared-hour keyboard change 0→1 updated clock, JPL lighting timestamp and side-card instant to 01:00 UTC; 7-day summary remained a midnight-start summary as intended by existing API. No browser console errors observed in that smoke check. NASA/LOLA science and Lane A panel files unchanged.
- Audit, findings/proposals only: already present are ten curated sites, all-ten LOLA horizons, Sun/Earth az/el/margins and next changes, 7-day power/comms metrics + calculator, 28-date grid and hourly strip, Educator/Researcher views and CSV. Missing or limited: custom coordinate entry; arbitrary landing-hour-based summaries (hour slider inspects within a midnight-start stay), adjustable mission duration, saved side-by-side scenario details, full lunar-day horizon playback (~29.5 Earth days), explicit seasonal explanation/comparison, mission-specific constraints/filtering; D18 researcher tab is not mounted in current shell. These are audit recommendations, not authorization to implement Lane A work.
- Verified example from getMetrics at current high-ground sp_malapert, seven-day stays: 2026-11-14 sunlight 23.2%, longest dark 129 h, Earth 100%; 2026-11-21 sunlight 100%, dark 0 h, Earth 100%. Illustrates schedule sensitivity, not proof that November 21 is universally best. Monthly/seasonal comparisons must distinguish changing local lunar time from season.
- Scientific references for explanation: official challenge https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ ; NASA lunar seasons https://svs.gsfc.nasa.gov/5229/ (small axial tilt, 346.6-Earth-day seasonal cycle); LPI seasonal calculator https://www.lpi.usra.edu/lunar/tools/lunarseasoncalc/ (subsolar latitude, dates drift); NASA polar shadows https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/ and NASA lunar comms https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/ .

### 2026-11-14 — NASA objectives review: operational interpretation and ranked next work (user-supplied audit)
- **Scope and provenance:** Documentation-only supplement to the preceding visual-cleanup/mission-objectives audit, based on the review provided by Advik. No new browser verification, scientific recomputation, UI or API implementation is claimed in this entry. Existing live-cleanup evidence and the exact Malapert worked example are in the preceding Lane B entry. All suggestions below are **proposals**, not authorization to edit Lane A files or expand PLAN.md.
- **Operational “conditions” NASA is asking viewers to compare:** (1) **Sun elevation** — angle above local horizontal; matters for illumination and output of a *fixed horizontal* panel; (2) **Sun azimuth** — direction relative to local terrain, deciding which ridge may obstruct the Sun; (3) **terrain clearance** — Sun elevation minus skyline elevation along its azimuth (geometric Sun-up can still be terrain-shadowed); (4) **sunlight windows** — starts/stops and interruption duration, affecting operating opportunities and storage; (5) **Earth elevation/azimuth** — line-of-sight geometry changes under lunar libration and terrain obstruction; (6) **Earth visibility/contact windows** — possible contact periods and gaps, not guaranteed link performance; (7) **simultaneous Sun + Earth visibility** — overlap useful for a solar-powered, directly communicating lander. Illumination influences *thermal* conditions, but this app does **not** calculate terrain/surface temperatures, equipment heat loads, or thermal stress; do not imply it does.
- **Across lunar days:** One local solar day (noon to next noon) is about **29.5 Earth days**, not 24 hours; the Moon's **~27.3-Earth-day orbital period is different**. At ordinary latitudes, daylight and darkness each last many Earth days; at the south pole the low Sun sweeps around ridges/craters, causing repeated obstructions. Equal sunlight percentages can disguise crucial differences between one prolonged blackout and multiple short interruptions; the **longest-darkness** metric is thus mission-relevant. The current 7-day stay, selected-hour view, and 28-date comparison strip are **not** a complete lunar-day playback.
- **Across lunar seasons:** Lunar axial tilt relative to the Sun is only **~1.5°**, but small subsolar-latitude shifts alter whether a low south-polar Sun clears a ridge. The complete lunar seasonal cycle is about **346.6 Earth days**; lunar seasons do not correspond to fixed terrestrial calendar dates. Southern summer corresponds to more southerly (negative) **subsolar latitude**; southern winter to northerly (positive) subsolar latitude. Horizons already captures date-dependent Sun and Earth geometry; **do not fabricate a separate seasonal correction**. Earth contact varies with libration and does not automatically improve with sunlight. Comparing two arbitrary dates months apart changes *both season and local lunar time*, so future seasonal comparisons should use complete lunar-day spans or explicitly disclose this confound.
- **Implemented versus still limited:** Ten curated sites, site selection and all-site date grid, A–D pole choice, terrain-aware local horizon and Sun/Earth paths, 2026–2029 date selection and hourly inspection, next visibility transitions in Researcher, sunlight/blackout/contact-window metrics, simplified panel power estimate, ranking, 28-day comparison strip and CSV are present. Missing/limited: arbitrary coordinates (optional, and dependent on new Lane A terrain/ephemeris calculations), saved detailed two-scenario comparison, arbitrary **mission start hour** and adjustable duration, a full ~29.5-day inspection/playback workflow, accessible operational countdowns in Educator, explicit seasonal guidance, contact schedule table and mission-defined maximum gaps, and no full battery charge/discharge model. The 3D globe's NASA texture is aesthetic: no 3D local terrain mesh or shadows; terrain-dependent visibility comes from the scientific panels. A Researcher view is present in the card/grid; a separate comprehensive D18 Researcher tab requires explicit Lane A development and Lane B mounting.
- **Important clock distinction:** The global **hour slider changes the instant inspected** (position, lighting and card/horizon readouts), not the start of the seven-day mission. A landing date of **2026-11-14** with inspection at **15:00 UTC** still evaluates a stay beginning **2026-11-14 00:00 UTC**. A proposed landing-*time* control must shift the **whole evaluation window** and recalculate all 168 hourly samples/metrics, not just relabel the slider.
- **Clear two-scenario value proposition (proposed):** Save **Scenario A = site + landing date** and **Scenario B = same site + another landing date**; show sunlight share, longest darkness, Earth visibility, longest contact gap, and a stated-assumption power estimate side by side, with absolute changes and a plain-language explanation. For *sp_malapert high ground*, two existing 7-day model results: **2026-11-14 → sunlight 23.2%, longest darkness 129 hours, Earth visibility 100%**; **2026-11-21 → sunlight 100%, longest darkness 0 hours, Earth visibility 100%**. One-week slip drastically changes modeled illumination opportunity, **not** a finding that Nov 21 is universally safe, ideal or launch-ready.
- **Constraints rather than score-only:** A future researcher-facing filter could test **maximum tolerated blackout**, **maximum Earth-contact gap**, **minimum usable energy** and **minimum terrain clearance**. A site can rank highly under the **prototype, team-chosen Sun and Earth score** and still violate a mission's hard requirements. NASA does not prescribe these score weights.
- **Battery estimate limitation:** Current quick estimate of required storage = **load × longest consecutive time with zero panel power**. This is a simplified **blackout-energy estimate**, *not complete battery sizing*: it omits periods where generation is nonzero but below load, charge/discharge dynamics, starting state of charge, usable capacity and conversion/storage losses. Ensure the UI avoids implying an engineering-certified battery requirement.
- **Recommended next order (review proposal; needs human approval):** **1.** Make *Stand here* horizon, Sun/Earth changes, sunset/Earthset and contact/blackout countdowns immediately discoverable in Educator and Researcher. **2.** Add saved A/B date comparisons with numerical differences and one compelling launch-slip demonstration. **3.** Clarify inspected hour versus actual landing time (and only later implement recalculation of arbitrary start hour/duration through Lane A). **4.** Add complete lunar-day (~29.5 days) and seasonal interpretation/playback with honest limits. These priorities answer NASA's local site/date trade-off question more directly than adding more solar-system Overview detail. Do not start implementation without GO and a new PLAN check.

### 2026-11-14 — D19–D23 Lane B requested tour implementation; production quota BLOCKER
- **Order and ownership:** Reread PLAN.md D19–D23, STATUS.md header and newest Lane A notes before coding; updated only Lane B row/section, `web/src/main.ts`, `web/src/style.css`, and the separate user-owned **fork** `advik09-beep/SolarSystemSimulator`. Never edited Lane A `/lib`, `/data`, `/scripts`, `web/src/panels/`, PLAN or DESIGN. Status row recorded 1/4, 2/4, 3/4 and 4/4 as each task started.
- **Step 1 — PASS in production:** Fixed the Lane B live-board row, then corrected Credits from old Malapert-only wording to **all 10 sites' terrain horizons use NASA LRO LOLA GDR elevation maps**, polar and global, from PDS Geosciences, with per-site map and resolution in `data/README.md`. Main commit `4656271`. Vercel production deployment `dpl_9ix6KKwkBgHyu2av3jZacvCXThSh` reached **READY**.
- **Step 2 — PASS for original wording, revised copy pending deployment:** Added a prominent opening message above Overview: for the power and direct Earth radio-visibility quantities this app evaluates, the Sun provides sunlight and Earth establishes potential direct line of sight; gravitational perturbations from the other planets are already represented in JPL Horizons ephemerides. Original main commits `b27a41f`, `9ca68bb` both reached Vercel **READY**. Lane A subsequently posted verified D22 wording; the most recent `web/src/main.ts` at `a911612` updates this statement to say planetary **light is negligible compared with the Sun** and **radio from other planets is not modeled**, avoiding unsupported numeric radio claims. Latest wording passes local TypeScript and Vite but cannot yet go live due to the quota below.
- **Step 3 — PASS in production:** In user fork `SolarSystemSimulator`, added `lunarEmbed`-only tour stops exactly **Sun → Mercury → Venus → Earth → Mars → Jupiter → Saturn → Uranus → Neptune → Moon**, excluding Pluto/comets/other moons/spacecraft without removing their visuals. Removed fact text and numbered captions from embedded mode; exposed simple Prev/Next/Exit tour controls while menus and links stay hidden. Gated body raycasts, selection and CSS2D label callbacks so only these ten bodies are interactive; unchanged standalone mode. New code commits `d575d96` (`TourController`), `15fd3a1` (embed styling), `8af5141` (BodySelector), `8bcd15d` (auto-start + label gating), and `b0698fa` (disable hidden Tweakpane card updates that had caused runtime errors during the first browser smoke test). **Latest deployed fork commit `b0698fa` is Vercel READY.** Final production Chromium test read all ten names in exact order, with hidden fact text and UI, no page errors.
- **Step 4 — CODE COMPLETE, local builds and E2E PASS, PRODUCTION BLOCKED:** Fork commit **`5a21e36`** sends `{ type: 'lunar-navigator:open-explore', body: 'moon' }` by `postMessage` when a user selects the Moon directly or the tour reaches Moon as final stop. Destination is exact `parentOrigin` query parameter, validated before signaling, and never broadcasts to '*'. Main commit **`a911612`** passes its own origin to the iframe and accepts ONLY matching `event.origin` and `event.source===frame.contentWindow` plus exact event type/body before switching the parent to Explore. Both codebases passed TypeScript/Vite builds in a Vercel Sandbox; main `postbuild` copied 10-site scientific JSON. In an HTTPS-local fork + HTTP-local parent Playwright test (Chromium, 1440×1100), manually advancing all ten stops triggered the actual cross-origin signal, the parent opened Explore, **10 site buttons remained**, and a forged wrong-origin message did not switch views. No browser page exceptions. A separate synthetic direct-click test timed out trying to locate a visible Moon label, so **direct physical Moon clicking is implemented but not yet independently browser-verified**; do not mark that acceptance check as complete.
- **Vercel production blocker:** After `5a21e36`, attempting to create the fork production deployment returned **HTTP 402 `payment_required`, `api-deployments-free-per-day` (more than 100 deployments in 24 h; retryAfter 86400)** for team USMDO Club. Automatic Git deployments then stopped advancing. At this status update, the fork's latest READY deployment is older **`b0698fa`**, main latest READY is older **`54c8645`**; new parent/fork postMessage commits **are not live**. Vercel Sandbox local builds are **not** public deployments, so the live URL must not be claimed as Step-4-passed. A new Vercel deploy cannot be verified until the quota resets or the team owner resolves plan/billing limits. No paid-plan/team setting was changed.
- **Next permitted action after quota is resolved (not started):** Deploy user fork `master` at **`5a21e36`** first, then main `main` at **`a911612`** (or later documentation-only HEAD); verify both public Vercel URLs, the tour final-stop signal and a **real Moon-model click** in the public iframe, selected date preservation, and no regressions to the Moon explorer, Compare and Horizon panels. Re-read PLAN/STATUS before resuming. **STOP** per Advik's instruction; no D19/D21/D18 Lane A implementation was undertaken.

### 2026-11-14 — D18/D24–D27 implementation and live verification
- **D18 Researcher:** Mounted Lane A's `mountResearcher` with shared site/date updates, scrolling container and a top-level Researcher tab. Production Chromium confirmed the Researcher shadow-DOM panel renders NASA criteria, site details and the analysis; no Lane A edits.
- **UTC clock:** Global hour slider explicitly selects the **moment inspected**, not landing time; the seven-day stay starts at **00:00 UTC** on the chosen landing date.
- **D24:** Still opening title card with purpose statement, Start tour and Skip to the Moon; Solar system tour button appears in main navigation on every tab; Restart beside Prev/Next in the fork. Embedded simulator pauses until the tour is requested. Main and fork Vercel builds READY. Chromium verified title card, return to title card, Sun→Mercury and Restart→Sun.
- **D27:** The parent sends the chosen UTC inspection timestamp to the fork via origin-checked `postMessage` on iframe load and every date/hour change. Fork accepts it, sets its simulator date and freezes its physics; **it does not calculate validated planetary positions for arbitrary dates**. This scientific limitation is explicitly displayed on the Overview. Chromium verified the on-screen clock changed to 2026-12-22 00:00 UTC. No claim of accurate JPL planetary ephemeris in the fork.
- **D25/D26:** Fork sends tour-stop IDs only; main app reads the ten caption texts and NASA/JPL source links directly from Lane A's `TOUR_STOPS` in `/lib`, without copying captions into the fork. The Moon stop displays Lane A's full `SOUTH_POLE` text and sources in a clickable disclosure; the Explore header uses `SOUTH_POLE.oneLine`. Fork holds Moon stop for 12 seconds before D23 automatic Explore handoff to allow reading. The source link credits were expanded. Chromium confirmed the Sun caption and no browser page errors. **Production Chromium PASS:** the Moon stop displayed the sourced south-pole disclosure and, after the 12-second dwell, switched to Explore with no page errors.
- **Verification:** Main Vercel READY at `f54bce9`; fork Vercel READY at `96495cdd` (final Moon dwell). Main and fork builds READY. D27 is only **clock synchronization**, not validated orbit reconstruction. All changes confined to Lane B app shell, base styles, fork tour code and Lane B STATUS section. STOP per request.


### 2026-11-14 — D29 LunLux + Planner + dimmed overview + embedded audio; PASS
- **PLAN and ownership:** Re-read `PLAN.md`, `STATUS.md` and Lane A's D28 mount notes. D29 is signed by both humans, with the repository, folders and web URLs deliberately unchanged. Changes limited to Lane B shell/CSS/index, the user-owned OzAILabs simulator fork, and Lane B's own STATUS row/section. Lane A `/lib`, `/data`, `/scripts` and `web/src/panels/` were not edited.
- **1. Planner — PASS:** Added a top-level **Planner** tab and scrollable `#planner-view` (overflow auto, max 82vh/1000px). Imported Lane A's `mountPlanner` through `./panels`, mounted once with shared `siteId`, `landingDate` and callbacks, updated selection via `plannerView.update({siteId,landingDate})`, and disposed on unload. Main commit `8dd70d2` deployed Vercel READY. Production Chromium found the D28 A/B scenario panel; its scroll box measured **861 px visible vs 1892 px scroll content**.
- **2. LunLux — PASS:** Updated HTML document title/description/loading fallback, visible shell header and subtitle, primary navigation labeling (LunLux overview), title card and Credits. Subtitle exactly **"Sunlight and Earth contact for lunar landing sites"**. Main commit `0441215`, Vercel READY. Production Chromium verified title, header, subtitle, title card, navigation and Credits.
- **3. Starting card — PASS:** Replaced opaque nearly-black title-card cover with **translucent rgba(5,12,25,.54)** plus dimming/backdrop so the embedded solar system remains visible, yet subdued, behind the card. The fork's embedded simulation is paused until a tour command arrives (existing D24 behavior). Main commit `61d2b0c`, Vercel READY. Production Chromium confirmed the card's computed background and title.
- **4. Embedded sound — PASS:** In separate simulator fork `advik09-beep/SolarSystemSimulator`, audio starts **muted on every `lunarEmbed=1` visit**, regardless of the separate standalone audio preference. A visible top-right **🔇 Sound off / 🔊 Sound on** button controls mute, with dynamic `aria-label` and `aria-pressed`. Standalone simulator's saved preference is not overwritten by embedded toggling. Fork commit `184cd089`, Vercel production `dpl_64sXcaayQqzC2mQxD54m9RvvAu1x` READY. Parent title card gives clear audio-toggle guidance, styled in this commit.
- **Browser acceptance:** Live desktop Chromium (1640×1050), parent `https://lunar-landing-hackathon.vercel.app/`, embedded fork `https://solar-system-simulator-usmdo-club.vercel.app/`: initial speaker **Sound off / aria-pressed=false** despite simulated saved standalone unmuted preference; user click **Sound on / true**; second click **Sound off / false**; standalone saved preference remained unchanged. Planner rendered actual A/B panel, scrolled; title/card/name/subtitle/nav/Credits verified. **Zero page JavaScript errors**. Main intermediate commits and the final fork build were Vercel READY. The CSS+STATUS release commit only adds styling for on-card sound guidance.
- **Stop:** D29 1–4 complete within the requested scope; no D28 Lane A edits or unrelated feature work.



### 2026-11-14 — D30 presentation pass, structure 1
- Merged Tour home; simulator backdrop and title card; no timeline or legend on home.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 2
- Four main tabs and Data and methods link; shared Educator/Researcher switch via panel v1.3. Structure 1 Vercel READY.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 3
- Explore Globe/Horizon switch, fixed visual with scrolling card, site picker replaces lists; hidden Moon rendering suspended. Structure 2 Vercel READY.
- Files: web/src/main.ts, web/src/style.css, web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 4
- Compare groups grid, scenarios and requirements; Report scrolls internally; panels load/update only when visible. Structure 3 Vercel READY.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 5
- Slim one-row site/date/hour toolbar; grouped short-name picker; inspection explanation in info tip. Structure 4 Vercel READY.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 6
- Compact four-chip verdict legend only on Explore and Compare. Structure 5 Vercel READY.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure 7
- Small symbol-bearing verdict pins with selected-site ring; exact shared THEME colors. Structure 6 Vercel READY.
- Files: web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure theme
- Exact D30 theme, compact scale, plain-language shell, LunLux title; inactive simulator detached. Structure 7 Vercel READY.
- Files: web/src/main.ts, web/src/style.css, web/index.html. TypeScript and Vite/postbuild executed: PASS. Production deployment verification follows this commit. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D30 presentation pass, structure verification
- Desktop verification complete; remove residual Explore/Compare page overflow and clarify Reset view camera action. Presentation pass complete; stop here.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production at https://lunar-landing-hackathon.vercel.app verified in a desktop browser: Tour title and moving simulator, four-tab navigation, all 10 API-backed site options, shared date/hour and Educator/Researcher controls, Globe/Horizon, Compare grid plus planner, Report and methods; no browser console warnings/errors. All eight preceding Vercel builds READY. Final overflow/camera-label refinement built successfully; deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 1
- Edge-to-edge Tour scene without card; bottom-left title over a soft dark gradient.
- Files: web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 2
- Final stop prompts Click on the Moon; embedded fork 883ae43f18fdac39fa7d5d8afab583683e07fc05 waits for Moon click and moves sound below header (fork TypeScript/Vite PASS).
- Files: web/src/main.ts. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 3
- Unboxed transparent Moon on shared moving stars; whole-Moon site-facing framing and a faint camera fill labeled as a visual aid in the info tip.
- Files: web/src/main.ts, web/src/moon.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 4
- Selected ring shares its pin billboard, anchor and scale, keeping it concentric at every camera angle. Final-tour click correction in fork 7e3f3db7d81a1f9ecdb4f75d2d609044c135f195 built PASS.
- Files: web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 5
- Shell toolbar, reading switch, captions and methods use shared 0.90 glass with 14px blur and no surface borders; controls use indigo #4F46B8, distinct from Earth blue.
- Files: web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 6
- Uniform neutral legend chips with colored symbols, no selected-filter appearance; shell legend removed from Compare; Partial pins hollow to match panels.
- Files: web/src/main.ts, web/src/style.css, web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item 7
- Readable UTC dates; scene explanations and labeled fill-light details in info tips instead of caption strips. Removed technical header/caption jargon and obsolete nebula credit.
- Files: web/src/main.ts, web/src/style.css. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item verification
- D31 items 1–7 complete. Desktop checks: edge-to-edge Tour; final Moon prompt and click into Explore; whole lit/faint-night Moon; centered ring; glass rgba(19,33,56,0.90) / blur(14px); indigo #4F46B8; uniform chips, none on Compare; plain UTC info tips. All seven Vercel builds READY. Reset view now preserves the selected site and restores its whole-Moon framing. Simulator final code 3adb74c5ee088a2668b1d3517fe0c1d5c54e0223 retains original selection path, removes timed handoff, and clears header sound control; TypeScript/Vite PASS. Final deployment verification follows; no new features or scientific/panel edits. STOP.
- Files: web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.


### 2026-11-14 — D31 second presentation pass, item final-check
- Final desktop check: candidate-site view settles on the whole Moon and selected pin ring, no console errors. Keep camera distance during site turns to avoid clipping the globe mid-transition. Reset retains selection. D31 complete; all previous builds READY; final Vercel build checked next. Simulator head 3adb74c5ee088a2668b1d3517fe0c1d5c54e0223. STOP.
- Files: web/src/moon.ts. TypeScript and Vite/postbuild executed: PASS. Production: https://lunar-landing-hackathon.vercel.app . Each prior item's Vercel deployment checked READY before continuing; this commit's deployment check follows. Scientific APIs and Lane A panels unchanged.

## Lane A

### 2026-11-14 — Reply to the integration blueprint (approved by Sheldon 2026-11-14)

**Done (commit 5debb55):** `listSites()` now forwards `coordsVerified` and `note`. Mock `getState()` returns `terrain: "flat"` for every site; it never claims `"real"` until M4 terrain data exists.

**Q1 — Vite inside /web:** compatible as far as Lane A can tell. `/lib/visibility.js` is plain ES-module JS with no Node APIs, and all exports stay synchronous. Not proven until Lane B's production build runs. One honest risk is below under "Sync loading".

**Proposed additive exports (all sync, no change to existing exports):**

- `getTimeline(siteId, startUtc, days, stepHours = 1)` →
  `{ siteId, stepHours, mock, terrain: "real"|"flat", source, samples: [{ utc, sunEl, sunAz, earthEl, earthAz, lit, comms }] }`
  Read straight from the M1 hourly files (`/data/ephem/<siteId>.js`). `stepHours` must be a whole number ≥ 1. No interpolation; transitions are accurate to the hour only.
- `getHorizon(siteId)` →
  `{ siteId, model: "lola"|"flat", resolutionDeg: 1, elevationDeg: number[360], source, verified }`
  Index i = terrain elevation at azimuth i°, measured clockwise from north (same convention as Horizons quantity 4). Read from the M4 horizon files. Flat sites return 360 zeros with `model: "flat"`; never a made-up profile.
- `getCoverage()` →
  `{ mock, stepHours: 1, timeScale: "UTC", sites: [{ siteId, ranges: [[startUtc, endUtc], ...], terrain: "lola"|"flat" }] }`
  Built from whatever M1/M4 files actually exist.
- **Out-of-coverage rule (all functions):** throw `RangeError("OUT_OF_COVERAGE ...")`. The UI shows "unavailable"; no extrapolation.

**Sync loading (Sheldon: YES to loadSite; needs Advik's OK):** 10 sites × 2026–2029 hourly is about 350,000 rows. Loading all of it at import time will make the page slow, especially on phones. Lane A proposes ONE extra async function, `await loadSite(siteId)`, which fetches that site's file. After it resolves, every existing call for that site stays synchronous. Calling before loading throws `Error("NOT_LOADED")`. While MOCK is true, `loadSite` resolves immediately.

**getSceneState — proposal only. No Lane A work on it until M1 PASSES.**
- **Frame:** Moon-fixed, Horizons' `MOON_ME` (DE421 mean-Earth frame). +Z = mean lunar north rotation axis; +X = 0° longitude (mean Earth direction); +Y = 90° E. Right-handed; km. The Moon does NOT rotate in the scene; Sun and Earth move around it.
- **Shape:** `getSceneState(utc)` → `{ utc, frame: "MOON_ME", unit: "km", sun: { lon, lat, distKm, xyz }, earth: { lon, lat, distKm, xyz }, source, mock }`. `xyz` is computed from lon/lat/distance by Lane A, so Lane B does no astronomy.
- **Horizons inputs (confirmed in JPL docs, 2026-11-14):**
  - Sub-Earth point: target 301, observer `500@399`, quantity 14 (ObsSub-LON/LAT) + quantity 20 (range, `RANGE_UNITS=KM`).
  - Sub-solar point: quantity 15 (SunSub-LON/LAT) + quantity 19 (Sun range relative to the Moon).
  - Moon longitudes are east-positive in `MOON_ME` (manual: "Target pole/equ : MOON_ME {East-longitude positive}").
  - Caveat from the manual: these are the centre of the Moon's disc as seen from the Sun or Earth. They are "NOT exactly the same as the 'sub-solar' (nearest) point for a non-spherical target shape". The difference is fine for a picture, not for science readouts.
- **Dates:**
  - Sun, Earth and Moon ephemerides are available 9999 BC – AD 9999 (DE441).
  - The high-precision lunar rotation model covers AD 1550–2650. Both 1969–1972 (Apollo) and 2026–2029 are inside it.
  - So historical 3D for the Apollo landings IS feasible with the same pipeline. No separate 2020–2035 cache is needed.
- **Sources:** https://ssd.jpl.nasa.gov/horizons/manual.html , https://ssd-api.jpl.nasa.gov/doc/horizons.html , https://ssd.jpl.nasa.gov/horizons/time_spans.html

**Lane A next single task:** M1 step 1. One Horizons query for Apollo 11 at its landing time; check the output header (observer site, frame, time scale) and the Sun direction.

### 2026-11-14 — M1 step 1 done (setup confirmed on one live query; M1 NOT passed)
- Query: Horizons API, `EPHEM_TYPE=OBSERVER`, `CENTER='coord@301'`, `COORD_TYPE=GEODETIC`, `SITE_COORD='23.47297,0.67408,0'` (E-lon, lat, km above reference sphere), targets Sun `10` and Earth `399`, `QUANTITIES='4'`, `APPARENT` left at default AIRLESS.
- Output header confirms the setup: "Center pole/equ : MEAN_ME (high precision) {East-longitude positive}"; "Center radii : 1737.4, 1737.4, 1737.4 km"; "Atmos refraction: NO (AIRLESS)"; time column "Date__(UT)"; footer says times after 1962 are UTC; "Azimuth is measured clockwise from north".
- Apollo 11 at 1969-07-20 20:17 UTC: Sun az 88.81°, el 10.70° (low morning Sun in the east — PLAN M1 check passes for this one case). Earth az 272.19°, el 59.22°.
- Site altitude was set to 0 km. No sourced elevation for Apollo 11 yet; it barely affects Sun/Earth angles.
- Next: the M1 download script for verified sites, small window first. Then /data/README.md recording these settings.

### 2026-11-14 — M1 download script, 7-day test window (M1 NOT passed)
- `scripts/fetch_horizons.mjs` (Node 18+, no deps). Usage: `node scripts/fetch_horizons.mjs [START] [STOP] [siteId ...]`. Default window 2026-11-14 00:00 .. 2026-11-21 00:00 UTC, 1 h step.
- Output: `data/ephem/<siteId>.json`, 169 rows per site, columns as arrays `sunAz, sunEl, earthAz, earthEl` starting at `start`, `stepHours: 1`. Each file keeps the Horizons header lines it was made from.
- The script fails loudly if the header lacks MEAN_ME / East-longitude positive / AIRLESS / UT time column, if a row is missing, or if Sun and Earth times differ.
- Settings confirmed in the docs (API doc + manual): endpoint `https://ssd.jpl.nasa.gov/api/horizons.api`; `SITE_COORD` = E-lon deg, lat deg, alt km; Moon is east-longitude positive; quantity 4 is degrees, azimuth clockwise from north; CSV data between `$$SOE`/`$$EOE`. No API rate limit is documented; the script sends one request at a time with a 1 s pause.
- Sanity checks (not the formal M1 tests): Earth el 45-74 deg at Apollo 11/12/17 and -2..+8.6 deg at the south-pole sites. Earth azimuth flips with longitude sign: west at Apollo 11 (23.5E), east at Apollo 12 (23.4W), ~62 deg at Cabeus B (68.8W), ~297 deg at Nobile Rim 2 (58.7E). This is what east-positive longitude predicts.
- UNVERIFIED: all site altitudes set to 0 km above the 1737.4 km sphere. The Horizons EOP file predicts UT1 only to 2027-02-08; check how that affects UTC output beyond that date before widening.
- `lib/visibility.js` still MOCK; it does not read these files yet.
- Hand-check rows for a human (Horizons web app, observer = these coords @301, quantity 4, airless):
  - apollo11 23.47297E 0.67408, 2026-11-14 12:00 UTC: Sun az 91.4857 el -7.0667; Earth az 277.5874 el 64.3200
  - im1 1.44E -80.13, 2026-11-17 08:00 UTC: Sun az 84.9258 el 2.4573; Earth az 352.8771 el 9.2952
  - sp_malapert 0.3E -86.0, 2026-11-20 06:00 UTC: Sun az 50.4114 el 4.0976; Earth az 352.4058 el 7.4541


### 2026-11-14 — Plan approval, DESIGN.md proposal, and API contract v1 (reply to Lane B)
- **Sheldon approves Lane B's execution plan B0-B7 as written** (Lane B entry "next-step execution plan", commit c45ea78). B0 stays first.
- **DESIGN.md (repo root) is a PROPOSAL by Sheldon, awaiting Advik's OK.** It adds B1b (Explore view on a flat Moon image) and asks Lane A for edge fields, a verdict and a per-day summary file. Lane B: do not build from it until Advik agrees.
- **No new data work in this entry.** M1 is still blocked on Sheldon's three hand-checks. Nothing below is built unless marked READY.

**Visibility API contract v1 — PROPOSAL (Lane A will finalize signatures; changes need both humans).**
Lane A will add `export const API_VERSION = "1.0.0"` and `export const READY = { ... }`, one boolean per item below. Lane B should check `READY` instead of assuming. Breaking changes bump the major version and get announced here first.

| Item | Shape (summary) | Readiness |
|---|---|---|
| `listSites()` sync | as today, incl. `coordsVerified`, `note` | READY (mock-free catalog) |
| `getState(siteId, utc)` sync | existing fields | READY on MOCK data only; real data NOT READY (needs M1) |
| `getSummary(siteId, startUtc, days)` sync | existing fields | READY on MOCK data only; real data NOT READY |
| `MOCK` | `true` until M1 passes | READY |
| `API_VERSION`, `READY` | as above | NOT READY |
| `await loadSite(siteId)` | fetches one hourly file; afterwards sync calls work for that site; sync call before load throws `Error("NOT_LOADED")` | NOT READY. Sheldon: yes. **Advik: not yet approved.** |
| `getCoverage()` sync | `{ mock, stepHours: 1, timeScale: "UTC", sites: [{ siteId, ranges: [[startUtc, endUtc]], terrain }] }` | NOT READY |
| `getTimeline(siteId, startUtc, days, stepHours=1)` sync after loadSite | `{ siteId, stepHours, mock, terrain, source, samples: [{ utc, sunEl, sunAz, earthEl, earthAz, lit, comms, sunEdge, earthEdge }] }` | NOT READY |
| Edge fields on `getState` | adds `sunEdge`, `earthEdge`: true when that body's elevation is within `EDGE_DEG` of the horizon in use (flat: 0°; real: terrain angle at that azimuth); adds `edgeDeg` (the value used) | NOT READY |
| Edge fields + verdict on `getSummary` | adds `pctSunEdge`, `pctEarthEdge`, `verdict: "clear"|"partial"|"out"|"edge"`, `verdictRule` (text of the rule, for display) | NOT READY |
| `await loadDaily()` + `getDaily(startDate, days)` sync | per-day summary for ALL sites from one small file `data/daily.json`: `{ apiVersion, mock, edgeDeg, sites: { <siteId>: [{ date, pctLit, pctComms, pctBoth, pctSunEdge, pctEarthEdge, longestDarkHours, verdict }] } }`. Markers and the grid use only this; no hourly files. | NOT READY |
| `getSceneState(utc)` | Moon-centred `MOON_ME` sub-solar / sub-Earth directions (see earlier Lane A entry). Not a heliocentric view. Work starts only after M1 passes. | NOT READY |
| `getHorizon(siteId)` | as proposed earlier; `model: "flat"` returns 360 zeros | NOT READY (M4) |

**Rules for all functions:** times in are ISO 8601 UTC with `Z` (or epoch ms); dates for `getDaily` are `"YYYY-MM-DD"` (UTC days). Angles are degrees, azimuth clockwise from north. Queries outside coverage throw `RangeError("OUT_OF_COVERAGE ...")`; there is no extrapolation. A missing next change (none inside coverage) is `null`, never 0.

**Verdict rule — proposal; thresholds are named constants that BOTH humans must confirm:**
- `EDGE_DEG = 2` (DESIGN.md starting value, flat-horizon sites).
- `edge` if `pctSunEdge > 50` or `pctEarthEdge > 50` over the stay ("most of the stay"). It is checked first because the flat answer can't be trusted there.
- Otherwise `clear` if `pctBoth >= CLEAR_PCT`, `out` if `pctBoth <= OUT_PCT`, else `partial`. **Open:** CLEAR_PCT, OUT_PCT, and the stay length `STAY_DAYS` are not chosen. DESIGN.md does not define them, and Lane A will not pick them alone. This is a rule the user can read, not a universal "best site" score.

**Coverage:** DESIGN.md asks for at least 8 weeks ahead of today (so to at least 2027-01-09). The approved M1 range (2026-2029) includes this. Today there are only 7 days (2026-11-14..21), and widening waits for the hand-check. Open point carried over: Horizons' EOP (Earth-rotation) file predicts only to 2027-02-08, and I still have to check its effect on UTC timestamps past that date.

**Lane A next single task (unchanged):** after Sheldon's hand-check passes, widen the M1 download, then write `/data/README.md`.

### 2026-11-14 — PLAN v2 adopted
- PLAN.md replaced with PLAN v2. Step numbers 1-9 replace M0-M7 and B0-B7.
- D1-D6 are signed by both humans (per Sheldon, 2026-11-14).
- Contract v1 (the entry above) is APPROVED, including `await loadSite(siteId)` and the daily summary file (PLAN D4). Readiness flags are unchanged: everything marked NOT READY there is still not built.
- Verdict numbers: STAY_DAYS = 7, CLEAR_PCT = 90, OUT_PCT = 10, EDGE_DEG = 2 (PLAN D5). These replace the "Open" note in the contract entry.
- DESIGN.md marked approved: Explore is 3D from the start, the flat-first step is gone, the Plain / Numbers section is added, and it uses PLAN step numbers.
- Lane A is on step 2, blocked on Sheldon's hand-checks. No step work started in this entry.

### 2026-11-14 — Contract v1 exported on MOCK data; answers to Lane B; hand-check 1 (Sun) passed
**Hand-check 1, Sun: PASSED.** Apollo 11, 2026-11-14 12:00 UTC. The Horizons web app (Sheldon) gives az 91.485723 / el -7.066737; our file gives 91.4857 / -7.0667. Difference < 0.0001°. **Pending:** check 1 Earth (277.5874 / 64.3200), check 2 (im1), check 3 (sp_malapert). Step 2 has not passed.

**Answer 1 — mock-ready source for verdicts: contract v1 is now exported from `/lib/visibility.js` on MOCK data.** `MOCK` stays `true`, so keep the banner. Existing exports keep their names and fields; they only gained new fields.
- New exports: `API_VERSION = "1.0.0"`, `READY` (true = callable with the documented shape; `getSceneState` and `getHorizon` are false), `VERDICT_RULE = { STAY_DAYS: 7, CLEAR_PCT: 90, OUT_PCT: 10, EDGE_DEG: 2 }`, `await loadSite(id)`, `getCoverage()`, `getTimeline(id, startUtc, days, stepHours=1)`, `await loadDaily()`, `getDaily("YYYY-MM-DD", days)`.
- `getState` adds `sunMarginDeg`, `earthMarginDeg` (elevation minus horizon elevation at that azimuth; flat horizon ⇒ equals elevation), `sunEdge`, `earthEdge` (|margin| ≤ EDGE_DEG), `edgeDeg`, `horizonModel: "flat"|"lola"`. Legacy `terrain` is kept and means the same as `horizonModel`.
- `getSummary` adds `pctSunEdge`, `pctEarthEdge`, `verdict: "clear"|"partial"|"out"|"edge"`, `verdictRule` (display text). Rule order: edge first (either >50%), then clear (pctBoth ≥ 90), out (pctBoth ≤ 10), else partial.
- **Markers and grid:** `await loadDaily()` once, then `getDaily(startDate, days)` → `{ apiVersion, mock, STAY_DAYS, CLEAR_PCT, OUT_PCT, EDGE_DEG, verdictRule, sites: { <id>: [row|null, ...] } }`. Every field in a row describes the **7-day stay starting 00:00Z on `row.date`**, so a row equals `getSummary(id, date, 7)`. `null` = that stay is outside the site's coverage; show "unavailable". 10 sites × 56 days computes in ~12 ms on mock.
- **Behaviour changes to know about:** `getState` and `getSummary` now throw `RangeError("OUT_OF_COVERAGE ...")` outside coverage. Mock coverage mirrors the planned real coverage: 2026-01-01..2030-01-01 for all sites, plus ±15 days around each pre-2026 landing. `hoursToSunChange` / `hoursToEarthChange` are now whole hours found by an hourly scan, `null` if there's no change within coverage or within 60 days (e.g. Earth never sets at the Apollo sites).
- `getTimeline` throws `NOT_LOADED` until `loadSite(id)` has run (mock too). Its start is rounded down to the hour; there is no interpolation. On mock, `getState` and `getSummary` do **not** require `loadSite`, but the real version will, so always `await loadSite(id)` before the first call for a site.
- Test: `node scripts/check_visibility.mjs` calls every export, checks the shapes, and prints `PASS` (ran 2026-11-14: PASS).

**Answer 2 — Numbers view fields and CSV.**
- From `getState(id, t)`: `sunEl`, `sunAz`, `sunMarginDeg`, `earthEl`, `earthAz`, `earthMarginDeg`, `lit`, `comms`, `hoursToSunChange` (label "to sunset" if `lit`, else "to sunrise"), `hoursToEarthChange` ("to Earthset" / "to Earthrise"), `horizonModel`, `sunEdge`, `earthEdge`, `edgeDeg`. Show `null` countdowns as "none in coverage".
- From `getSummary(id, landingUtc, VERDICT_RULE.STAY_DAYS)`: `pctLit`, `pctComms`, `pctBoth`, `longestDarkHours`, `pctSunEdge`, `pctEarthEdge`, `verdict`, `verdictRule`.
- Source: `getTimeline(...).source` (ephemeris) and `listSites()[i].source` / `.note` (site coordinates). Coverage: `getCoverage().sites[i].ranges`. Mock flag: `MOCK`.
- **CSV:** build from `getTimeline(id, landingUtc, VERDICT_RULE.STAY_DAYS)`, one row per hourly sample over the stay (168 rows). Header lines first, each starting `#`:
  ```
  # site_id,apollo11
  # site_name,Apollo 11 (Tranquility Base)
  # lat_deg,0.67408
  # lon_east_deg,23.47297
  # horizon_model,flat
  # ephemeris_source,<getTimeline().source>
  # site_source,<listSites()[i].source>
  # mock,true
  # api_version,1.0.0
  # stay,<first utc>..<last utc> (7 days, hourly; azimuth clockwise from north; UTC)
  utc,sun_el_deg,sun_az_deg,sun_margin_deg,earth_el_deg,earth_az_deg,earth_margin_deg,sun_up,earth_in_view,sun_edge,earth_edge
  2026-11-14T00:00:00Z,...
  ```
  Numbers are printed as returned (no rounding in the file); booleans as `true` / `false`.

**Answer 3 — frame and marker placement.**
- Our Horizons output header (live query, 2026-11-14) says: `Center pole/equ : MEAN_ME (high precision) {East-longitude positive}` and `Center radii : 1737.4, 1737.4, 1737.4 km`. So our angles use a Moon-fixed mean-Earth/polar-axis frame, east-positive longitude, planetocentric latitude, on a 1737.4 km sphere. **Correction:** earlier Lane A entries wrote `MOON_ME`; the label Horizons actually prints is `MEAN_ME`, so use that.
- `listSites()` lat/lon are east-positive degrees, -180..180. **Caveat:** most site sources don't state their frame (see Lane A source log), so I haven't verified that they're in exactly MEAN_ME. The difference between lunar frame conventions is expected to be small at globe scale, but that's also unverified. The 4 south-pole sites are representative points of ~15 km regions and should be labeled that way.
- **Yes:** Lane B may place markers from `listSites()` on a Moon-fixed sphere (radius R, ignore altitude; our data uses 0 km). The Moon mesh does not rotate with time in this frame. Formula, Moon-fixed axes (+Z = north pole, +X = 0° lat / 0° lon, +Y = 0° lat / 90°E):
  `x = R·cos(lat)·cos(lon)`, `y = R·cos(lat)·sin(lon)`, `z = R·sin(lat)` (lat, lon in radians).
  In Three.js (Y up), use `three = (x, z, -y)`. That's a proper rotation (no mirror): north is +Y, and 90°E is −Z, so a camera on +X looking at the Moon sees east on its right.
- **Texture alignment check:**
  - Use an equirectangular Moon map whose own documentation says 0° longitude is the centre column and longitude increases eastward.
  - Draw thin debug lines at lon 0°, ±90° and lat ±60°.
  - The 0° meridian must pass through the map's 0° column. A marker at (lat 0, lon 90) must sit on the map's 90°E column, on the right as seen from +X.
  - Then zoom on the three Apollo markers: each must sit on its landing area in the texture (Apollo 11 in Mare Tranquillitatis, Apollo 12 in Oceanus Procellarum, Apollo 17 in the Taurus-Littrow valley).
  - If the meridian is off, rotate the Moon mesh about Three.js Y until it lines up. Never move the markers.
- Lighting stays illustrative until step 8 (`getSceneState`, `READY.getSceneState === false`).

**Lane A next single task (unchanged):** finish step 2 after the remaining hand-checks: widen the download, then `/data/README.md`.

### 2026-11-14 — Step 2 Real numbers PASSED
- **Hand-checks: 7 of 7 match the Horizons web app to six decimals (Sheldon).** These are the six planned rows (apollo11 2026-11-14 12:00, im1 2026-11-17 08:00, sp_malapert 2026-11-20 06:00; Sun and Earth each) plus sp_malapert Sun 2026-11-17 08:00 (web app 85.839251 / 1.847012).
- **EOP question resolved (manual):** EOP only sets UT1/polar motion/nutation for Earth's frame, and reaches a Moon site only through the UTC time labels. After the prediction end (2027-02-08), Horizons holds the last predicted values constant and uses the last known leap second. Our estimate: at most ~1 s of timing error (an unknown future leap second), i.e. ~0.0002° of Sun motion. Negligible. Full quotes in `/data/README.md`.
- **Download widened:** `scripts/fetch_horizons.mjs` now writes `data/ephem/<siteId>/<YYYY>.json` for 2026-2029, plus `landing.json` (landing day ±15 days) for apollo11, apollo12, apollo17, chandrayaan3, im1, im2, and `data/ephem/index.json`. That's 46 chunks: one request per site × target × chunk (≤ 8784 rows), one at a time with a 1.5 s pause, retries on network errors, and the run can be resumed. Values are stored at 3 decimals: ~260 KB per site-year, 9.7 MB total. The old 7-day files were removed (the 2026 files cover the same hours). Every chunk header was checked for MEAN_ME (high precision), east-longitude positive, AIRLESS and UT; the script also checks for gaps and row counts.
- **Regression:** `node scripts/check_ephem.mjs` → PASS. 7/7 rows within 0.0005° of the web app (max 0.000431°, the storage rounding). Apollo 11 landing hour 1969-07-20 20:00Z: Sun az 88.804° el 10.553° (low, east). Earth > 30° at the Apollo sites and within 10° of the horizon at the four pole sites (2027-06-01). Coverage complete for all 10 sites, with no gaps. `node scripts/check_visibility.mjs` still PASS (mock unchanged).
- **`/data/README.md` written:** every query setting with its doc source; longitude sign, azimuth direction and UTC, each with the Horizons header line or doc quote that proves it; frame, sphere, corrections, sampling, EOP, checks and known limits.
- **Still true:** `MOCK = true`; `/lib/visibility.js` does not read these files yet. That is step 5, which **has not started**; it waits for Sheldon's go. Site altitudes are UNVERIFIED (0 km).
- **Note for both humans:** PLAN.md's "Right now" block still shows Lane A on step 2. PLAN changes need both humans, so I left it alone; the STATUS header above is current.


### 2026-11-14 — Review of Lane B's prototype_01 (Step 1, Vercel) Codex prompt: APPROVED
**APPROVED as written.** Evidence, run by Claude Code on Sheldon's machine against main at 13bbc30. Nothing under /web was changed or committed.
- `cd web && npm install` OK; `npm run typecheck` OK (no errors); `npm run build` OK. Vite 5.4.21, 6 modules: `dist/index.html` 0.72 kB, CSS 1.70 kB, JS 7.25 kB (2.62 kB gzip).
- The built JS bundle contains all 10 `listSites()` names (checked by matching each name from `data/sites.js` against `web/dist/assets/*.js`: 10/10) and the MOCK notice text.
- Not tested by Lane A: `npm run preview` in a browser, Vercel settings, the public URL, phone layout. Those remain the Step 1 pass test.

**Q1:** Yes. It matches PLAN v2 step 1 and contract v1. It only uses `listSites()` and `MOCK`, keeps the banner, and changes nothing outside /web.

**Q2:** No issue seen with Root Directory `.` plus `cd web && npm install` / `cd web && npm run build` / output `web/dist`. The root `package.json` only sets `"type": "module"` and has no dependencies or build script, so it shouldn't interfere. **Please commit `web/package-lock.json`** (created by `npm install`; currently untracked) so Vercel installs the same versions we tested.

**Q3:** Nothing to patch in `web/vite.config.ts` or `web/tsconfig.json`. Note for diagnosis: `npm run build` runs `tsc --noEmit` before `vite build`, so a type error fails the deploy. `tsconfig.json` includes `../lib/**/*.js` with `checkJs: false`, so a *syntax* error in a future /lib change, or a removed export that `main.ts` imports, would also fail the build. Lane A runs `npm run build` in /web before pushing any /lib change.

**Heads-up for step 5 only (proposal, not needed for step 1):** the real data (`data/ephem/<siteId>/<YYYY>.json`, `landing.json`, `index.json`, ~9.7 MB total, ~260 KB per site-year; later `data/daily.json`) is outside `web/dist`. Vite will not copy it, because `/lib` will fetch these files at run time rather than import them. Proposal:
1. **Lane B** adds a copy step inside /web: e.g. a `postbuild` script in `web/package.json` that copies `../data/ephem` and `../data/daily.json` into `web/dist/data/`. The Vercel build command stays `cd web && npm run build` (npm runs `postbuild` automatically).
2. **Lane A** makes `/lib/visibility.js` fetch from a data base URL. By default that's `data/` next to the page (`dist/data/` in production). In `vite dev`, the same files come from the repo through the existing `server.fs.allow`. Lane A adds one additive export, `setDataBase(url)`, as an override. That's a small v1 addition and needs both humans' OK.
3. `loadSite(id)` fetches only that site's chunks, not all 46 files. Before step 5 starts, Lane A will run `npm run build && npm run preview` and confirm a fetch of one chunk from `dist/data/` succeeds.

Alternative: Lane A bundles the data into JS modules that Vite code-splits. This means no copy step, but it adds ~10 MB of JS chunks to the build. Lane A recommends the copy step. Decide before step 5; step 1 is unaffected.

### 2026-11-14 — D7, D8 and the live board signed; Lane A half of step 5 DONE
**Signed by both humans (2026-11-14), now in PLAN.md:**
- **D7:** Desktop only. No phone layout work or phone testing. Step 1 pass test is now "public link shows the 10 sites in a desktop browser"; step 9 is "live link works in a desktop browser".
- **D8:** Real data files are copied into the published folder at build time and fetched per site; `setDataBase(url)` is added to contract v1.
- **Board change:** PLAN.md's "Right now" table is replaced by one line pointing to the STATUS.md header, which is now the live board. Anyone may update their own row there. The working rule was updated to match.

**Step 5, Lane A half: DONE.** `/lib/visibility.js` now serves real Horizons data behind the same contract. `MOCK = false`, `API_VERSION = "1.1.0"`.
- **What changed for callers:**
  - Every sync call for a site (`getState`, `getSummary`, `getTimeline`) now throws `NOT_LOADED` until `await loadSite(id)` resolves. `getDaily` needs `await loadDaily()`. `getCoverage` works after either load.
  - Times are read at the start of their hour (`12:59` → the `12:00` sample). `getState` has a new field `sampleUtc` that says which sample was used.
  - Coverage ranges are now inclusive of the last sample (e.g. `2029-12-31T23:00:00Z`).
  - All other names, fields and errors are unchanged from mock v1.
- **New:**
  - `setDataBase(url)` points the library at the data folder.
  - `lib/verdict.js` holds the D5 rule (7 / 90 / 10 / 2). `visibility.js` and `scripts/build_daily.mjs` both use it.
  - `data/daily.json` is the per-day summary (~410 KB, 14,694 rows), built by `node scripts/build_daily.mjs`.
- **Where data is fetched from:**
  - The default base is `../data/` relative to the library's own URL. In the built site the library is inside `dist/assets/<bundle>.js`, so this resolves to `dist/data/`.
  - Under `vite dev` the library is served at `/@fs/<repo>/lib/visibility.js`, so it resolves to `/@fs/<repo>/data/`, which the existing `server.fs.allow` already permits. **No `setDataBase` call is needed in either case**; it's only an override.
  - `loadSite(id)` fetches `ephem/index.json` once, then only that site's chunks (~1 MB per site uncompressed).
- **Evidence (run 2026-11-14):**
  - `node scripts/check_visibility.mjs` → PASS with `MOCK=false`: all exports and shapes; values equal the files (apollo11 2026-11-14 12:00 Sun 91.486 / -7.067); countdowns land on a real change; Apollo 11 landing shows a low eastern Sun; out-of-coverage and not-loaded errors. Every one of the 14,694 daily rows equals `getSummary` of its 7-day stay. All four verdicts occur on 2026-11-14.
  - `node scripts/check_ephem.mjs` → PASS (7/7 hand-check rows, max diff 0.000431°).
  - `cd web && npm run typecheck && npm run build` → OK (JS 7.30 kB; /web untouched).
  - **HTTP test:** a scratch copy of `web/dist` with the data copied in exactly as specified below, served by `vite preview`; `loadSite("im1")` + `loadDaily()` over HTTP returned the same values as the files. The same test against `vite dev` at `/@fs/<repo>/data/` also passed.
  - Not tested: a real browser running a page that calls `loadSite` (the current /web page only calls `listSites`), and Vercel.
- **Visible effect on the current page:** `MOCK` is now `false`, so the existing mock-data banner in /web will no longer show after Lane B's next build. That's correct (real data), but the page should keep the "flat horizon" label wherever `horizonModel === "flat"`.

**What Lane B's postbuild copy must do (exact spec, D8):**
1. Run after `vite build`, from `/web`. Recommended: a `postbuild` script in `web/package.json`; npm runs it automatically after `npm run build`, so the Vercel build command stays `cd web && npm run build`.
2. Copy the folder `../data/ephem/` (all of it: `index.json` plus one subfolder per site with `2026.json` … `2029.json` and, for six sites, `landing.json`) to `dist/data/ephem/`, keeping the same paths.
3. Copy the file `../data/daily.json` to `dist/data/daily.json`.
4. Do **not** copy `data/sites.js` or `data/README.md` (sites.js is already bundled through the import).
5. Result: `web/dist/data/ephem/index.json`, `web/dist/data/ephem/<siteId>/<YYYY>.json`, `web/dist/data/daily.json`. About 10 MB, served as static JSON. Files are fetched only when a site is loaded.
6. It must work on Vercel's Linux build. A cross-platform option is a small Node script: `node -e "const fs=require('fs');fs.rmSync('dist/data',{recursive:true,force:true});fs.cpSync('../data/ephem','dist/data/ephem',{recursive:true});fs.copyFileSync('../data/daily.json','dist/data/daily.json')"` (`fs.cpSync` needs Node ≥ 16.7). Fail the build if either source is missing.
7. **Check after deploy:** `<live URL>/data/ephem/index.json` and `<live URL>/data/daily.json` return JSON (HTTP 200), and the page's `loadSite` / `loadDaily` calls resolve without `LOAD_FAILED`.
- Lane A will re-run `node scripts/build_daily.mjs` whenever `data/ephem` changes and commit both; Lane B's copy step needs no change for that.

**Lane A stops here.** Step 7 has not started; it waits for Sheldon's go.

### 2026-11-14 — Step 7 (terrain), Lane A, stage 1: product and method for sp_malapert (PROPOSAL, awaiting Sheldon's go)
- **Site:** sp_malapert only (Sheldon's choice). It sits at 86.0°S, 0.3°E (representative point = LROC mosaic centre, not a landing point), about 121 km from the pole. Other sites stay `flat`.
- **Product (official PDS):** LOLA GDR polar DEMs, https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
  - `ldem_80s_80m.img` (115,520,000 bytes): 80 m/px, 7600 × 7600, 80°S–90°S. Used for the far field.
  - `ldem_80s_20m.img` (1,848,320,000 bytes): 20 m/px, 30400 × 30400, 80°S–90°S. Only the rows within ±20 km of the site are fetched (HTTP range request; the server sends `accept-ranges: bytes`): ~2,000 rows × 60,800 bytes ≈ 122 MB.
  - Label facts (`.lbl`): polar stereographic, centre −90°/0°, spherical R = 1737.4 km, "MEAN EARTH/POLAR AXIS OF DE421", east-positive; LSB 16-bit integers, `HEIGHT = DN × 0.5` m; "Map values are relative to a radius of 1737.4 km" (so radius = 1737400 + height). Same sphere as our Horizons data. Preliminary LOLA data; product created 2017-06-15 from data 2009-07-13..2017-02-02.
  - Orientation (`catalog/dsmap_polar.cat`): "In the south, Longitude 0 extends straight up from the center, and Longitude 90 East extends to the right"; `X = (I − N/2 − 0.5)·MAP_SCALE`, `Y = (J − N/2 − 0.5)·MAP_SCALE·NS` with NS = −1 in the south, `LON = ATAN2(X,Y)`, `LAT = −90 + 2·ATAN(0.5·R/1737400)` (degrees).
  - Rejected: the 5 m products (87.5°S / 87°S limits don't reach 86°S); the 85°S products (don't cover the far side of the search disk); PGDA's newer 2023 adjusted 20 m GeoTIFF (2.6 GB, needs a GeoTIFF reader; possible later upgrade).
- **Method in plain words:**
  1. Put the observer on the DEM surface at the site, plus an assumed **2 m** mast height (ASSUMPTION; the elevation used is interpolated from the 20 m DEM).
  2. For each azimuth ray (every 0.1°, clockwise from north, the same convention as our Horizons data), step outward across the terrain: 20 m steps on the 20 m DEM out to 20 km, then 80 m steps on the 80 m DEM, out to **300 km** or the DEM edge if closer (the edge is ~183 km away straight away from the pole).
  3. At each step, turn the terrain point into a 3D Moon-fixed position (radius = 1737.4 km + height) and compute its true elevation angle as seen from the observer. Using full 3D positions handles the **Moon's curvature** exactly; the surface falls away by ~6.5 km at 150 km, so far terrain must stand very high to show.
  4. The horizon angle for each 1° bin is the highest angle found on any of its ten 0.1° rays, so narrow peaks aren't missed between whole degrees. Result: 360 values, degrees, can be negative (an elevated observer sees below the flat 0° line).
  5. Record, per bin, the distance of the blocking point and whether the ray hit the DEM edge before 300 km, so we can show where the search distance was limiting.
- **Then:** margin = elevation − horizon(azimuth); lit / comms use the margin (Sun and Earth still treated as points).
- **Cost:** ~237 MB download (115.5 MB + ~122 MB). Measured 3.7 MB/s from PDS on Sheldon's connection, so about 1–2 minutes; computing takes seconds. Raw DEM files stay out of git (scratch/gitignored); only the 360-value profile and its provenance get committed.
- **Known limits to state on screen:** representative point, not a landing spot (the horizon changes over a few hundred metres); preliminary 2017 LOLA DEM; 2 m observer height assumed; Sun and Earth as points (the Sun's disc is ~0.5° wide, so partial sunlight near the edge is shown as all-or-nothing); 1° azimuth bins.

### 2026-11-14 — Step 7 (terrain), Lane A half, stages 2-4 DONE for sp_malapert
**Change from stage 1 (Sheldon):** extend beyond the 80°S map edge, because Earth sits to the north for this site.
- Done with two coarser products from the same PDS folder: `ldem_75s_120m` (116,250,752 bytes) and `ldem_60s_240m` (120,435,200 bytes). Rays use 20 m → 80 m → 120 m → 240 m, each beyond the previous map's edge.
- **Worst case for the north: zero.** A ray stops only when even the highest point in the DEMs (7027 m) could no longer rise above the best angle already found. For every one of the 360 bins that happened before any data edge, so no terrain beyond our maps can change the profile.
- In the north the local slope gives a ~5.6° horizon. That already rules out anything beyond ~22 km.
- **Observer altitude:** 4830.5 m above the 1737.4 km sphere (20 m DEM; the 80 m DEM gives 4824.5 m) + 2 m assumed mast. **Smooth-sphere horizon dip:** 4.268° at 129.6 km.

**Stage 2 — profile:** `data/ephem/sp_malapert/horizon.json`.
- Contents: 360 values, −4.63° to +6.48°; bin i = azimuth [i−0.5, i+0.5) clockwise from north, as in our Horizons data. Also stored: blocking distance per bin, observer, method, source.
- Scripts: `scripts/fetch_lola.mjs` (485 MB into `data/raw/`, gitignored, 34 s); `scripts/compute_horizon.mjs` (2.5 s).
- The raw DEMs are not in git. Method and sources are in `/data/README.md`.

**Stage 3 — checks** (`node scripts/check_horizon.mjs` → PASS), in judge-friendly terms:
1. **Same terrain from different maps:** the 20 m and 80 m maps agree at the site (4831.5 vs 4824.5 m) and within 5.9 m on average at 200 nearby points. The 80/120/240 m maps agree within 5.6–10.5 m at 200 points from 81–84°S, all longitudes. So every file is read the same way.
2. **Geometry:**
   - Toward the pole the horizon is −3.6°, close to the 4.27° drop a perfectly smooth Moon would give a viewer 4.8 km up.
   - Nothing is below the lowest possible angle (−7.26°, the tangent to the deepest terrain).
   - Doubling the ray density changes nothing.
3. **Search complete:** no bin was cut off by a data edge.
4. **Flat says lit, terrain says blocked:**
   - Over 2026–2029 the Sun is above the flat horizon but behind terrain for 15,738 h, and visible over terrain while below the flat line for 8,263 h. That happens because the observer is high and looks over terrain to the south.
   - Overall, Sun visible 50.4% (flat) → 29.1% (terrain); Earth visible 69.1% → 41.2%.
   - **Robust example for the demo:** **2026-09-19 06:00 UTC**, Sun az 85.6°, el +1.02° (flat: lit). Terrain horizon at az 86° is 5.54°, set by a ridge 3.24 km east (terrain: dark, margin −4.52°). In every sensitivity run that direction stays between 5.2° and 8.4°, so this case doesn't depend on the exact point.

**IMPORTANT caveat for both humans:**
- The representative point sits on a slope rising ~6° to the north (+21 m over 200 m).
- Earth's direction (az 352–358) is blocked at ~5.6° by ground only 140–180 m away. Many of the blocked hours come from that near slope, not from distant ridges.
- Moving the observer 200 m changes the northern horizon from 1.6° (north) to 8–8.6° (south) or ~4° / ~11.8° (east / west); a 10 m mast gives 3.4°.
- So the far-terrain results (south, east) are solid; the north-facing (Earth) result depends on exactly where you stand.
- Suggested on-screen wording: "Terrain horizon for one representative point; nearby spots differ, especially toward Earth."

**Stage 4 — in /lib (API_VERSION 1.2.0):**
- `getHorizon(siteId)` → `{ siteId, model, resolutionDeg: 1, elevationDeg[360], source, verified }`.
  - For sp_malapert it also returns `verifiedMeaning`, `azimuth`, `blockDistKm[360]`, `observer`, `smoothSphereDipDeg`, `method`.
  - Flat sites return 360 zeros, `model: "flat"`, `verified: false`.
  - Needs `loadSite` first, like the other sync calls.
- For sp_malapert, `getState`, timeline samples and `getSummary` use margin = elevation − terrain horizon at that azimuth. `lit` and `comms` are margin > 0, and the edge test is |margin| ≤ 2°. `horizonModel: "lola"`, legacy `terrain: "real"` (PLAN's original values), and `getCoverage` lists `terrain: "lola"` for this site only.
- `data/daily.json` was rebuilt with the terrain margins for sp_malapert. `ephem/index.json` now has a `horizons` map.
- `READY.getHorizon = true`.
- **Lane B:** no change to the postbuild copy. `horizon.json` is inside `data/ephem/`, which is already copied.
- **Evidence:**
  - `check_visibility` PASS, including the new blocked-Sun test and checks that only sp_malapert is lola.
  - Every daily row equals `getSummary` (17,190 checks).
  - `check_ephem` PASS; `check_horizon` PASS.
  - `cd web && npm run build` (typecheck + build) OK.
- **Not done:** pole sites 2–4 (sp_cabeus_b_peak, sp_haworth, sp_nobile_rim2) stay flat. The same scripts would work for them, but each needs its own 20 m window. **Lane A stops here.**

### 2026-11-14 — D9 and D10 signed by both humans
- **D9 Roles:**
  - Lane B keeps the app shell (index.html, main.ts, base styles, Vite and Vercel config), the postbuild data copy and the 3D Moon (step 4).
  - Lane A now also builds three self-contained panels under `web/src/panels/`, which only Lane A edits: the side card with Plain / Numbers (step 3), the Compare dates grid (step 6) and the horizon view (step 7).
  - Each panel exports a mount function taking a container element, the selected site and landing date, and callbacks for "site selected" and "date selected". Lane B mounts them and owns the shared selection.
  - Neither lane edits the other's files in /web. Lane A's panel test page is `web/panels.html` (Sheldon's instruction).
  - PLAN.md steps table updated: step 3 "A panel, B mounts"; step 6 "A grid panel, B mounts"; step 7 "A data + horizon view panel, B mounts".
  - **Open question for both humans:** D9 names the Compare *grid*; step 6 also lists a *timeline strip*, and D9 doesn't say who builds that. Lane A assumes it belongs inside the grid panel unless told otherwise.
- **D10 Malapert point:** move sp_malapert to the highest ground within 1 km of the current representative point, re-download its Horizons data, recompute the horizon, rerun every check, and keep the old point's numbers in the README for comparison. If the Earth-facing horizon is still set by ground closer than 500 m, Lane A reports to Sheldon before committing. No other pole sites for now.
- **Note:** CLAUDE.md (Lane A rules) still says "Never edit /web". It needs a one-line update to match D9 before Lane A writes panels. Sheldon to confirm.

### 2026-11-14 — D10 DONE: sp_malapert moved; answers recorded
- **New point:** 85.97972°S, 0.67183°E, the highest ground within 1 km of the representative point; a slope, not a summit (highest LOLA 20 m pixel within 1 km of 86.0°S, 0.3°E; 4885.5 m above the 1737.4 km sphere; it sits on the 1 km circle and the ground keeps rising beyond). `data/sites.js`: coordinates and note updated; name is now "Malapert Massif (high ground near representative point)"; id unchanged.
- **Re-done for the new coordinates:** Horizons 2026–2029 (`data/ephem/sp_malapert/`), terrain horizon, `data/daily.json`. Sheldon's two old-point hand-checks are now compared with a full-precision Horizons fixture at the original point (`data/checks/handcheck_sp_malapert_original_point.json`, `scripts/fetch_handcheck_fixture.mjs`): exact match, diff 0.000000. Query code moved to `scripts/horizons_api.mjs` (shared, no behaviour change).
- **Earth-facing horizon (the D10 reporting rule):** bins 351°–5° are set by terrain 120–160 km away. Bins 6°–8° are set by ground 40 m away that slopes downhill (−3.1° to −3.2°). Reported to Sheldon before committing; ignoring ground closer than 500 m changes no Earth answer in 2026–2029 (smallest margin 0.05°). Sheldon: GO.
- **Comparison, each with its own distance** (full table in `/data/README.md`):
  - Original point vs D10 point, **1.000 km apart:** Earth in view over terrain 41.2% → 100%; Sun 29.1% → 45.8% (flat: Sun 50.4%, Earth ~69%).
  - The **200 m** figures are the earlier sensitivity runs. Old point: northern horizon 1.6° to 11.8°. D10 point: 200 m south puts it back on the slope (+5° to +5.8°).
- **Demo case updated:** 2026-09-19 06:00 UTC at sp_malapert, Sun +1.05° above the flat horizon but behind a ridge 1.84 km east (terrain horizon 6.03°). In the same hour Earth is −2.05° on flat but above the −3.16° terrain horizon (in view). `check_visibility` tests both.
- **Checks:** `check_ephem` PASS (7/7), `check_horizon` PASS (Sun blocked-by-terrain 3,820 h; 49 robust far-ridge hours), `check_visibility` PASS (all 14,694 daily rows = getSummary). `/web` build OK.
- **D9 follow-ups (Sheldon):** CLAUDE.md updated (Lane A may edit `web/src/panels/` and `web/panels.html`, nothing else under /web). The timeline strip lives inside the Compare dates grid panel.

### 2026-11-14 — Panel interface v1 (for Lane B) + side card built (step 3, Lane A part)
**Panel interface v1 (D9). Files:** `web/src/panels/` (Lane A only). Import from `web/src/panels/index.ts`.
```ts
// web/src/panels/types.ts
export interface PanelProps {
  siteId: string;                                  // id from listSites()
  landingDate: string;                             // "YYYY-MM-DD", UTC day; stay = 00:00 UTC that day + VERDICT_RULE.STAY_DAYS (7)
  onSiteSelected: (siteId: string) => void;        // panel ASKS the shell to select a site
  onDateSelected: (landingDate: string) => void;   // panel ASKS the shell to select a date
}
export interface PanelHandle {
  update(next: Partial<Pick<PanelProps, "siteId" | "landingDate">>): void; // shell pushes the new selection
  destroy(): void;                                                          // removes the panel; container stays
}
export type MountPanel = (container: HTMLElement, props: PanelProps) => PanelHandle;

// web/src/panels/index.ts
export { mountSideCard } from "./sideCard";          // step 3 — READY
// mountCompareGrid (step 6, includes the timeline strip) — NOT READY
// mountHorizonView (step 7)                          — NOT READY
```
- **Selection flow (Lane B owns it):**
  - Lane B calls `const h = mountSideCard(el, { siteId, landingDate, onSiteSelected, onDateSelected })` once.
  - When the shared selection changes (marker click, date control, another panel's request), Lane B calls `h.update({ siteId, landingDate })`.
  - Panels never change the selection themselves. They only call the callbacks, and Lane B decides, then calls `update()` on every mounted panel. So all panels stay on one selection.
- **Data:** each panel loads what it needs through `/lib/visibility.js` (`loadSite` / `loadDaily`) and shows its own loading, error and "unavailable" (out-of-coverage) states. Lane B does not need to preload anything; preloading `loadSite(id)` is harmless.
- **Style scoping:**
  - Each panel appends ONE child element (`<div class="llp-panel llp-<kind>" data-lane-panel="<kind>">`) to the container it's given, and attaches an **open Shadow DOM** to that child.
  - All panel CSS lives inside the shadow root, so it can't leak into the shell, and shell CSS can't reach panel internals.
  - It inherits only `color`, `font-family` and other inherited properties, plus optional theme variables Lane B may set on the container or any ancestor: `--llp-text --llp-muted --llp-warn --llp-bg --llp-border --llp-accent --llp-link --llp-focus --llp-clear --llp-partial --llp-out --llp-edge`.
  - Panels add no global `<style>`, no `document` listeners and no globals. Sizing: the panel is `display:block` and fills the container's width; the container controls width, height and scrolling.
- **Not in the interface:** DESIGN.md's side-card exits ("Stand here", "Compare other dates") are not among D9's two callbacks, so the card does not show them. If both humans want them, a proposed optional third callback is `onOpenView?: (view: "horizon" | "compare") => void`. NOT approved.

**Side card (`web/src/panels/sideCard.ts`), real data only:**
- **Header:** site name, coordinates, stay window. For pole sites, the point description from `sites.js` (sp_malapert: "Highest ground within 1 km of the representative point; a slope, not a summit.").
- **Plain / Numbers switch** (`aria-pressed` buttons).
- **Verdict:** in words + symbol (✓ Clear, ◐ Partial, ✕ Out, ⚠ On the edge). Color is extra, never the only signal; the edge verdict also uses a dashed border.
- **Horizon label:** FLAT ("terrain is not modelled at this site") or TERRAIN ("Terrain horizon from LOLA elevation data (one point; nearby spots differ, especially toward Earth)").
- **Plain:** one "why" sentence plus Sun and Earth status at the start of the stay. It says when terrain flips the flat answer ("the Sun is +0.8° above level but hidden behind terrain"), and states that "Sunlight" isn't a promise of power and "Earth in view" isn't a guaranteed link.
- **Numbers:**
  - Sun/Earth elevation, azimuth, horizon there, margin, and next change (sunset/sunrise, Earthset/Earthrise, or "no change within the data").
  - Stay percentages, longest dark stretch, and near-horizon percentages.
  - The verdict rule text; sources (Horizons, LOLA with observer and "verified" meaning, site source link); coverage.
  - **Download CSV:** 168 hourly rows in the layout agreed earlier; file `<siteId>_<date>_7day.csv`.
- **"◀ Day before / Day after ▶"** call `onDateSelected` (date ±1 day).
- **Test page:** `web/panels.html` + `web/src/panels/demo.ts` play the shell: site picker + landing-date input; selection kept in the URL (`?site=…&date=…`). Vite serves it in dev automatically. It is NOT part of the production build (no config changed), so it doesn't appear on the Vercel site.
- **Not edited:** `main.ts`, `index.html`, `style.css`, any config.
- **Evidence (2026-11-14):**
  - `npm run typecheck` + `npm run build` OK (the panels are type-checked).
  - Dev server serves `/panels.html` and `/src/panels/demo.ts` (HTTP 200).
  - The panel was rendered in a DOM emulator (happy-dom, scratch only; there is no Chrome on this machine) with real data from `/data`: Plain, Numbers, CSV filename, day buttons → callback, site switch via `update()`, out-of-coverage message, no global styles, `destroy()` leaves the container empty.
  - **Not yet seen in a real browser:** Sheldon to open it.
  - `check_visibility`, `check_ephem`, `check_horizon` all PASS.

### 2026-11-14 — D11 signed; answers to Lane B's five questions (each verified by Lane A)
**D11 (both humans, 2026-11-14), now in PLAN.md:** visual scope, all owned by Lane B, in this order:
- (a) NASA CGI Moon Kit color map, aligned with Lane A's check, labeled as NASA imagery for looks, not science.
- (b) A not-to-scale Sun–Earth–Moon opening scene from an open-source model trimmed to those three bodies. Clicking the Moon enters the explorer on the same date. Markers and verdicts live only in the Moon-fixed explorer.
- (c) Seamless zoom between the two, only if time allows.
- A Credits panel lists every borrowed piece and its license. No code from a repo whose license we can't show. Cut order: (c) first, then (b). Step 8 unchanged (Moon-fixed true lighting).

**1. JSON: your description is CONFIRMED.** Paths and fields match the files. The UI should use the /lib exports (`loadDaily`/`getDaily`, `loadSite`/`getState`/…), not decode `daily.json` itself.
- **`setDataBase` is NOT needed** in production or dev.
  - The library's default base is `../data/` relative to its own module URL. The live page loads `assets/index-CC8KaGqB.js`, so that resolves to `/data/`. Your Chromium test showed `loadDaily` completing on production.
  - In `vite dev` the library is served at `/@fs/<repo>/lib/visibility.js`, so it resolves to `/@fs/<repo>/data/` (tested earlier).
- **Caching, checked live 2026-11-14:** `index.json`, `daily.json`, `sp_malapert/horizon.json`, `sp_malapert/2026.json` and `/` all return `HTTP 200`, `cache-control: public, max-age=0, must-revalidate` plus an `etag`. Browsers revalidate on every load, so stale data isn't possible after a deploy. **No version stamp added.**
- **Live parity:** the live `horizon.json` has the D10 observer (−85.97972, 0.67183), and the `builtUtc` of `horizon.json` and `daily.json` equals the repo's.

**2. Globe: NASA SVS "CGI Moon Kit", https://svs.gsfc.nasa.gov/4720.**
- **What the page says** (read in full 2026-11-14):
  - 2025 colour set: `lroc_color_2k.jpg` (2048×1024, 447.2 KB), `lroc_color_16bit_srgb_4k.tif` (4096×2048, 59.0 MB), 8k / 16k TIFs, and a full-size EXR. Older 2019 set: `lroc_color_poles_1k.jpg` (1024×512, 135.8 KB), `lroc_color_poles_2k/4k/8k.tif`, …
  - Base URL: `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/<file>`.
  - "The map is centered on 0° longitude." Built from the LROC "Hapke Normalized WAC Mosaic"; latitudes beyond 70° filled from LOLA albedo (LDAM).
  - "These image is optimized for aesthetics, not science."
  - Credit: "Please give credit for this item to: NASA's Scientific Visualization Studio". Usage: the page links NASA's media Reproduction Guidelines and states no other license. Put that credit + link in Credits.
- **What the page does NOT state:** the projection name, east/west direction, or north-up.
- **So Lane A tested it against official data** (`lroc_color_2k.jpg` vs the PDS LOLA global map `ldem_4.img`, whose label says SIMPLE CYLINDRICAL, 4 px/deg, east-positive, 0–360°E). Over ±60° latitude, image brightness vs height correlate:

  | Orientation tested | r |
  |---|---|
  | **Equirectangular, 0° at the centre, −180° at the left edge, east to the right, north up** | **0.511** |
  | mirrored east–west | 0.332 |
  | 0° at the left edge | −0.448 |
  | north down | 0.108 |

  The best extra longitude shift is 0° (searched ±3° in 0.25° steps). The correct reading is clear.
- **How it maps onto your sphere (checked in Three.js source, `node_modules/three/src/geometries/SphereGeometry.js`):** a default `SphereGeometry` puts `u = 0.5` at +X and `u = 0.25` at +Z, and `uv.y = 1 − v` with `Texture.flipY = true` puts the image's top row at the north pole (+Y).
  - Your `spherePoint` puts lon 0° at +X and lon −90° at +Z, the same mapping as Lane A's `(x, z, −y)`.
  - **So: use the image as `map` on the default `SphereGeometry` with no rotation and no offset.** Keep `colorSpace = SRGBColorSpace`.
- **Check after swapping:** debug lines at lon 0° / ±90° (the 0° line passes through the image's centre column), and the three Apollo markers sitting in their maria. If anything is off, rotate the mesh about Y, never the markers.
- **Size:** `lroc_color_2k.jpg` (447 KB) is enough for a desktop globe. Lane A can **prepare a 4096×2048 JPEG** from `lroc_color_16bit_srgb_4k.tif` (≈1–2 MB) if your sandbox can't convert TIFFs. Say the word; Lane A will put it in its scratch area and post its checksum, and Lane B commits it under /web.

**3. Solar system:** agreed. Step 8 stays Moon-fixed true lighting from Lane A's future `getSceneState` (READY.getSceneState = false). D11(b) is the humans' scope change: a separate, illustrative, "not to scale" opening scene with no scientific claims, no markers and no verdicts. Lane A supplies no data for it.

**4. Terrain:** agreed. The LOLA horizon (`getHorizon`, and the Lane A horizon-view panel at step 7) is the scientific terrain product. A 3D terrain mesh would be a separate enhancement that needs both humans.

**5. Step 4:** your build, deploy and Chromium evidence covers the functional part. What remains is a **human mouse test on the live site** (https://lunar-landing-hackathon.vercel.app): drag to rotate and scroll to zoom; click a marker and see the side card change; change the date and see the markers recolour; tell the four south-pole sites apart (polar view / zoom). Then both humans sign off.

**Panel interface v1.1 (approved by both humans 2026-11-14):** one additive, optional callback on `PanelProps`:
```ts
onOpenView?: (view: "horizon" | "compare") => void;   // side card exits: "Stand here" -> "horizon", "Compare other dates" -> "compare"
```
- The side card shows the two exit buttons only when `onOpenView` is passed. Lane B decides what opening a view means (e.g. show the horizon panel or the Compare grid for the current selection).
- v1 callers keep working unchanged. `PANEL_INTERFACE_VERSION = "1.1"` is exported from `web/src/panels/index.ts`.

### 2026-11-14 — Compare dates grid panel + timeline strip (step 6, Lane A part) READY to mount
**API:** `mountCompareGrid(container, props)` from `web/src/panels/index.ts`, same `PanelProps` / `PanelHandle` as the side card (interface v1.1). It uses `onSiteSelected` and `onDateSelected`; `onOpenView` is not used.
- **Grid:** 10 site rows × 28 landing-date columns.
  - When first mounted, and whenever the selected date moves outside the window, the window is placed so the selected date is the 8th column. A date inside the window doesn't move it. "◀ 14 days earlier / 14 days later ▶" move the window without changing the selection.
  - Each cell = verdict for a 7-day stay from 00:00 UTC that date, straight from `getDaily()`, shown as **symbol + color** (✓ ◐ ✕ ⚠, edge also dashed). Every cell has a tooltip/aria-label in words: verdict, sunlight %, Earth %, both %, longest dark stretch.
  - No-data stays show a dashed "–" (never guessed). Rows carry a FLAT / TERRAIN tag.
  - Clicking a cell calls `onSiteSelected(site)` then `onDateSelected(date)`; a row name calls `onSiteSelected`; a column date calls `onDateSelected`. The selected cell is outlined, the selected row bold, the selected date underlined.
- **Timeline strip (inside the panel, per Sheldon):** hourly for the selected site over the same 28 days, from `getTimeline()`.
  - Encoded by position, not only color: top half filled = sunlight, bottom half filled = Earth in view, both = full bar, neither = empty, hatched = no data.
  - The selected 7-day stay is outlined, and a sentence under it gives the stay's percentages (`getSummary`).
- **Lane B:** mount it wherever the Compare dates tab lives, and call `update({siteId, landingDate})` on it with the same shared selection as the side card. With interface v1.1, `onOpenView("compare")` from the side card is your cue to show this tab. Lane B can theme the strip colors with `--llp-sun` / `--llp-earth`.
- **Test page:** `web/panels.html` now mounts the side card (with `onOpenView`) and the grid on one shared selection.
- **Evidence (2026-11-14), DOM emulator (happy-dom, scratch only) with real /data:**
  - 280 cells, all equal to `getDaily` (PLAN step 6: "cells equal the daily summary").
  - Strip bars equal hourly `lit` / `comms` (410 / 672 for sp_malapert, 2026-09-12..10-09).
  - Cell/row/column clicks → callbacks.
  - New site + date via `update()` rendered in **57 ms** (step 6: under 1 second).
  - The window stays put for dates inside it, re-centres outside, and the buttons move it 14 days.
  - Past the end of coverage: no-data cells + hatched strip.
  - Side card exits → `onOpenView("horizon")` / `("compare")`; a v1 caller without `onOpenView` gets no exit buttons.
  - No global styles; `destroy()` leaves the container empty.
  - `check_visibility`, `check_ephem`, `check_horizon` PASS; `cd web && npm run build` OK.
  - **Not yet seen in a real browser:** Sheldon to open `panels.html`.

### 2026-11-14 — Horizon view panel ("Stand here", step 7, Lane A part) READY to mount
**API:** `mountHorizonView(container, props)` from `web/src/panels/index.ts`. Same `PanelProps` / `PanelHandle` as the other panels (interface v1.1, Shadow DOM scoping, `--llp-*` theming). It reads `siteId` + `landingDate` and uses no callbacks (pass them anyway; they're required by `PanelProps`).

**What it shows** (all values from `/lib`: `getHorizon`, `getTimeline`; nothing calculated except drawing positions):
- **Panorama:** a 360° view, compass N → E → S → W → N left to right (3 px per degree), elevation up/down. The vertical range fits the horizon and both paths: at least −5° to +10°, rounded to 5°. A dashed "level 0°" line.
- **Horizon line** drawn from the 360 `getHorizon` bins (bin i = [i−0.5, i+0.5)), with the **ground hatched** below it.
  - Labeled **TERRAIN** (LOLA, one point, observer height + assumed mast, "nearby spots differ, especially toward Earth") or **FLAT** ("terrain is not modelled at this site; the horizon is the level line").
- **Paths:** the Sun path (solid) and Earth path (dotted) over the whole 7-day stay. The line breaks where a path crosses north (azimuth wrap).
- **Current hour:** the Sun (disc with rays) and Earth (disc with cross) markers, each with a **text label** ("Sun", or "Sun (hidden)"). A hidden body is drawn faded with a dashed outline. A dashed tick shows its margin to the horizon.
- **Hour slider** over the stay (168 hours) + ◀ ▶ one-hour buttons, showing "YYYY-MM-DD HH:MM UTC · hour n of 168". It resets to hour 1 when site or date changes.
- **Readout in words**, per body, with the margin, for example:
  - "Sun: hidden behind terrain — it is +1.05° above level, but the terrain horizon there is +6.03°, so it sits 4.98° below the skyline (the skyline there is 1.8 km away)".
  - "Earth: in view over lower terrain — it is −2.05° (below level), but the terrain horizon there is −3.16°, so it clears it by 1.11°".
  - Flat sites: "in view / not in view — x° above/below the flat horizon".
- Out of coverage → "Unavailable" plus the covered ranges (no guessing).
- Never color alone: line styles (solid / dotted / dashed), hatching, marker shapes and text labels carry the meaning.

**What Lane B needs to mount it:**
1. `import { mountHorizonView } from "./panels/index";` (path relative to `web/src/`).
2. `const hv = mountHorizonView(el, { siteId, landingDate, onSiteSelected, onDateSelected });` in the element where "Stand here" should appear. It fills the container's width; height follows from the width (≈ 0.28 × width for the panorama, plus controls).
3. On every shared selection change, `hv.update({ siteId, landingDate })`, the same as the side card and grid.
4. Wire the side card's v1.1 exit: `onOpenView: (v) => { if (v === "horizon") /* show the element holding hv */ ; if (v === "compare") /* show the Compare tab */ }`.
5. Optional theme variables (on the container or an ancestor): `--llp-sun --llp-earth --llp-horizon --llp-ground --llp-ground-line --llp-sky`.

**Test page:** `web/panels.html` now mounts the side card, horizon view and Compare grid on one selection. The side card's "Stand here" / "Compare other dates" buttons scroll to those panels.

**Evidence (2026-11-14), DOM emulator (happy-dom, scratch only) with real /data:**
- **Required case:** sp_malapert, 2026-09-19, slider at 06:00 UTC shows the Sun above level but hidden behind terrain.
  - The readout margin 4.98° equals `getState` (−4.984).
  - The skyline distance 1.8 km matches the LOLA ridge (1.84 km).
  - The Sun marker sits at azimuth 85.267° and is drawn below the skyline.
  - Earth is "in view over lower terrain".
- The horizon line has 361 steps from the 360 bins. Apollo 11 shows FLAT with a flat readout; an out-of-coverage date shows "Unavailable"; no global styles; `destroy()` empties the container.
- `check_visibility`, `check_ephem`, `check_horizon` PASS. `cd web && npm run typecheck && npm run build` OK.
- **Not yet seen in a real browser:** Sheldon to open `panels.html`.

### 2026-11-14 — Step 8, Lane A half: getSceneState DONE, READY.getSceneState = true
**Data:** `data/ephem/_scene/` holds hourly sub-solar and sub-Earth points on the Moon, Sun and Earth distances, and the Sun–Moon–Earth angle. Coverage matches the site data: 2026–2029 + the six landing windows. ~2.3 MB, listed in `ephem/index.json` under `scene`.
- Lane B's existing postbuild already copies it (it's inside `data/ephem/`); verified in `web/dist/data/ephem/_scene/`.
- Built by `scripts/fetch_scene.mjs`. The index builder moved to `scripts/build_index.mjs`, shared, with no change to existing entries.

**Horizons settings (manual + API doc + output header, details in `/data/README.md`):** `COMMAND='301'`, `CENTER='500@399'`, `QUANTITIES='14,15,19,20,24'`, `RANGE_UNITS=KM`. 14 = sub-Earth point ("center of the target disc seen by the OBSERVER"), 15 = sub-solar point, 19 = Sun range from the Moon's centre, 20 = Earth–Moon range, 24 = S-T-O. Header: `Target pole/equ : MOON_ME {East-longitude positive}`, `Target radii : 1737.4, 1737.4, 1737.4 km`.

**/lib (API_VERSION 1.3.0):** new `await loadScene()` (all scene chunks, ~2.3 MB) and sync `getSceneState(utc)`. Same rules as the rest: the time is read at the start of its hour (`sampleUtc`), `OUT_OF_COVERAGE` RangeError outside coverage, `NOT_LOADED` before `loadScene()`. `getCoverage().scene` gives the ranges. Returns:
```
{ utc, sampleUtc, frame: "MOON_ME", frameNote, unit: "km",
  sun:   { lon, lat, distKm, dir: [x,y,z], xyz: [x,y,z] },   // sub-solar point (-180..180 E) + Sun distance; dir = unit vector
  earth: { lon, lat, distKm, dir: [x,y,z], xyz: [x,y,z] },   // sub-Earth point + Earth distance
  sunEarthAngleDeg,                                          // Sun–Moon–Earth angle (Horizons S-T-O): ~0 full moon, ~180 new moon
  source, mock: false }
```
Frame: Moon-fixed, east-positive; +X = 0°N 0°E, +Y = 0°N 90°E, +Z = north pole; origin = Moon centre; km. The Moon does not rotate in this frame; the Sun and Earth move.

**Checks (`node scripts/check_scene.mjs` → PASS):**
- **Hand-checked site/hours** (apollo11 2026-11-14 12:00, im1 2026-11-17 08:00, sp_malapert original point 2026-11-20 06:00): the Sun and Earth elevation implied by `getSceneState` at the site (vector from the site on the 1737.4 km sphere to the body) match Sheldon's Horizons web-app values within **0.0034°** (azimuth within 0.003°).
- **All 10 sites, every 6th hour 2026–2029 (58,440 site-hours) vs our site files:** max elevation difference Sun 0.0007°, Earth 0.0065°.
- The angle between the Sun and Earth directions equals Horizons' independent S-T-O within 0.006° (every hour 2026–2029). So `MOON_ME` (scene queries) and `MEAN_ME (high precision)` (site queries) agree in practice.
- **Judge check:** 49 full moons found in 2026–2029 (minimum Sun–Moon–Earth angle about every 29.5 days). At every one the sub-solar and sub-Earth points are within 5.0° of each other (first: 2026-02-01 23:00Z, 2.3° apart; 2026-03-03 12:00Z, 0.4° apart).
  - *Plain words: at full moon the Sun is behind Earth as seen from the Moon, so the spot with the Sun overhead and the spot with Earth overhead nearly coincide.*
- **Tolerance 0.05°, why:**
  - The two numbers being compared differ only in small effects: the site data are apparent directions seen from the site; the scene data are apparent sub-points seen from Earth's centre and from the Sun. Their light-time and aberration corrections differ slightly. (This is my explanation of the residual, not a doc statement.)
  - Also storage rounding: 0.001° site files, 0.0001° scene.
  - Observed worst case: 0.0065° over 58,440 site-hours. 0.05° leaves ~8× margin, is half PLAN's 0.1° acceptance tolerance, and is a tenth of the Sun's disc (~0.5°), so it can't change any lighting a viewer could see.
- Also PASS: `check_visibility` (API 1.3.0, READY flags), `check_ephem`, `check_horizon`; `cd web && npm run build` OK.

**What Lane B needs to light the Moon from the real Sun direction (step 8):**
1. Once, at start-up: `await loadScene()` (from `lib/visibility.js`, next to `loadDaily()`).
2. For the shared selected time (the same UTC the side card uses, e.g. landing date 00:00Z or the horizon view's hour): `const sc = getSceneState(utc)`.
3. Convert Moon-fixed vectors to your Three.js axes with the same mapping as `spherePoint`: `toThree([x, y, z]) = new THREE.Vector3(x, z, -y)`.
4. **Sunlight:** a `DirectionalLight` at `toThree(sc.sun.dir).multiplyScalar(10)` (any distance; the Sun is far enough that its light is parallel), with `target` at the Moon's centre (0,0,0). Keep at most a very low ambient light so the night side reads as night. Don't rotate the Moon mesh: in this frame the Moon is fixed and the light moves.
5. **Earth:** draw it in the direction `toThree(sc.earth.dir)` at any display distance (label "not to scale"). The real distance is `sc.earth.distKm` if you want to show it in text. It is lit by the same light.
6. **Remove the "illustrative lighting" label** only after your own check:
   - At 2026-11-14 12:00 UTC, Apollo 11 should sit just past the terminator on the night side (its Sun elevation is −7.07°).
   - sp_malapert at 2026-09-19 06:00 UTC should be on the day side (Sun +1.05° above level). The globe shows no terrain, so ridge-blocking appears only in the side card and horizon view. Say so on screen.
7. Hourly samples: snap to `sc.sampleUtc`; don't interpolate in /web. `getSceneState` throws `OUT_OF_COVERAGE` outside 2026–2029 / the landing windows, which the shell should show as "lighting unavailable".

### 2026-11-14 — Root README.md written (for the submission)
- `README.md` at the repo root covers: what the project is, the live link, how to run it, how the numbers were verified (the seven hand-checks and the four check scripts: `check_ephem`, `check_visibility`, `check_horizon`, `check_scene`), data sources and credits, known limits, and how AI tools were used.
- Shared file at the repo root (Sheldon's request). Lane B: please flag anything in the "Lane B" or "Credits" lines that's inaccurate, and Lane A will fix it.
- It describes 3D lighting as illustrative (true as of `a0f5eb5`). Update that line once Lane B wires in `getSceneState`.

### 2026-11-14 — Planning stop: D12–D18 signed; acceptance results
- **Acceptance (both humans):** steps 3, 6 and 8 PASS. Step 4 not yet: markers don't recolor when the date changes, and the pole sites can't be told apart. Step 7 not yet: the hour slider is too hard to find. D13's shared hour control should fix step 7's finding.
- **D12–D18 recorded in PLAN.md.** New steps 10–16 added to the table (step 9 Submit stays last). Pass tests for 10–16 were written by Lane A from the decision text; both humans may amend them.
- "No single best-site score" (Settled earlier) is replaced by D17. The side card switch is renamed Educator / Researcher.
- **Lane A order:** (1) panel interface v1.2 (shared hour); (2) D12 terrain in stages (other three pole candidates → IM-2, IM-1, Chandrayaan-3 → Apollo sites), pushing after each; (3) detailed Moon assets from the NASA CGI Moon Kit for Lane B; (4) D16 + D17; (5) D18.
- **Lane B order:** D13, D14, D15, then mounts.

### 2026-11-14 — Panel interface v1.2 (shared hour, for D13) READY
Additive and optional. v1.1 callers keep working unchanged. `PANEL_INTERFACE_VERSION = "1.2"`.
```ts
interface PanelProps {
  // ... v1.1 fields unchanged (siteId, landingDate, onSiteSelected, onDateSelected, onOpenView?)
  hour?: number;                          // hour within the 7-day stay, 0..167 (0 = landing date 00:00 UTC); default 0; clamped
  onHourSelected?: (hour: number) => void; // panel ASKS the shell to change the shared hour
}
interface PanelHandle { update(next: Partial<Pick<PanelProps, "siteId" | "landingDate" | "hour">>): void; destroy(): void; }
```
**How Lane B wires D13:**
- Your date slider sets `landingDate`, and your hour sub-slider sets `hour`. On any change, call `update({ siteId, landingDate, hour })` on every mounted panel, and use the same instant for lighting: `getSceneState(Date.parse(landingDate + "T00:00:00Z") + hour * 3_600_000)`.
- Pass `onHourSelected` so the horizon view's own slider and ◀ ▶ buttons *ask* you. You then set the shared hour and call `update({ hour })` everywhere, so all panels and the lighting stay on one hour.
- If you don't pass `onHourSelected`, the horizon view keeps a local hour (v1.1 behaviour).

**What each panel does with the hour:**
- **Side card:** Sun/Earth status, margins and next change are shown "At hour N of the stay (YYYY-MM-DD HH:MM UTC)". The verdict and stay percentages are for the whole stay and don't change with the hour.
- **Horizon view:** markers and readout are at that hour, and its slider follows it.
- **Compare grid:** the strip draws a dashed cursor at that hour inside the outlined stay.

**Also:** the side card switch now reads **Educator / Researcher** (PLAN, D12–D18 block). `web/panels.html` has a shared hour slider standing in for your D13 control.

**Evidence (DOM emulator, real /data):**
- Side card at hour 7 shows "2026-09-19 06:00 UTC" with the Sun hidden behind terrain, and its status equals `getState` at that hour.
- With `onHourSelected`, the slider asks (and doesn't move by itself); ▶ asks for hour+1. `update({hour: 30})` moves the side card, horizon view and strip cursor together; hour 999 is clamped to 167.
- A v1.1 caller's local slider still works.
- Earlier panel tests rerun: PASS. `check_visibility` PASS; `cd web && npm run build` OK.

### 2026-11-14 — D12 terrain, stage 1 DONE: the other three pole candidates
- **Moved (D12: highest ground within 1 km of the representative point), described honestly in `data/sites.js`:**
  - sp_cabeus_b_peak → 83.61274°S, 68.61071°W (747 m away; *a local high point*, within 3 km at most 5 m higher).
  - sp_haworth → 86.70752°S, 23.14284°W (998 m; *a slope, not a summit*).
  - sp_nobile_rim2 → 83.91491°S, 58.92558°E (855 m; *inside the circle, not a summit*).
  - Names now end "(high ground near representative point)"; ids unchanged.
- **Re-done for the new coordinates:** Horizons 2026–2029, terrain horizon (`data/ephem/<id>/horizon.json`), `ephem/index.json`, `daily.json`.
- **Maps and resolution (all four pole sites):** 20 m/px within 20 km, then 80 / 120 / 240 m/px (PDS LOLA GDR polar, preliminary 2017). Mast 2 m assumed. No map edge limits any direction. Per-site table: `/data/README.md`.
- **Results (2026–2029):**

  | Site | Sun visible, flat → terrain | Earth in view, flat → terrain |
  |---|---|---|
  | Cabeus B | 50.6% → 68.5% | 60.0% → 72.5% |
  | Haworth | 50.5% → 30.9% | 63.7% → 31.5% |
  | Nobile Rim 2 | 50.0% → 47.2% | 64.9% → 65.1% |

  - **Cabeus B** is a high point (4,596 m), so its terrain horizon never rises above +0.15° and the Sun is never blocked. You see *below* level instead.
  - **Haworth** sits low (1,624 m) with ridges 4–8 km away, so the Sun is blocked for 10,626 h and Earth for 11,271 h.
- **Earth-facing skyline (D10 reporting rule):**
  - Haworth: ridges 4.4–7.7 km away. Nobile Rim 2: 10.8–16.1 km away.
  - **Cabeus B: set by ground 0.26–0.7 km away** (76% of Earth hours). It's downhill ground (horizon −2.1° to −2.6°) around a high point, so it marks how far below level Earth can be and still be seen. Flagged for Sheldon.
- **Two bugs caught and fixed before committing anything:**
  1. `fetch_lola.mjs` rewrote an existing window's row record using a site's *current* coordinates. That would have misaligned Malapert's DEM rows, since Malapert moved after its window was fetched. Now the record is written only with a download; Malapert's record was restored, and its horizon is byte-identical to the committed one apart from the build time.
  2. The index was rebuilt before the new horizon files existed, so `daily.json` briefly treated these sites as flat. `compute_horizon.mjs` now rebuilds the index; daily rebuilt and verified (`horizonModels` shows `lola` for all four pole sites).
- **Checks:**
  - `check_horizon` PASS for each of the three. Step 7's blocked-Sun requirement still applies to Malapert only; other sites report their counts.
  - `check_visibility` PASS: it now expects exactly these four terrain sites and checks Sun and Earth margins against each horizon.
  - `check_ephem`, `check_scene` PASS. `cd web && npm run build` OK.
- **Next (stage 2, on Sheldon's go):** IM-2, IM-1, Chandrayaan-3 at their landed coordinates. IM-1 (80.13°S) is at the edge of the 20 m polar map and Chandrayaan-3 (69.4°S) is outside it, so they need other maps (e.g. `ldem_75s_30m`, `ldem_60s_60m`). Lane A will check those products in the PDS folder before using them.

### 2026-11-14 — "On the edge" wording by horizon model; Cabeus B point kept
- **Sheldon:** at terrain sites, "on the edge" must not say "terrain decides", because terrain is already included.
  - Lane A panels now use **"grazing the skyline: small changes in position matter"** for terrain (LOLA) sites, and keep **"the Sun or Earth hugs the horizon, so terrain decides"** for flat-horizon sites.
  - Applied to the side card (verdict line and "why" sentence), the Compare grid (cell tooltips + a legend line explaining both), and the root README. Shared helper: `EDGE_WORDS` / `verdictShort(verdict, model)` in `web/src/panels/shared.ts`.
  - DOM test: Malapert 2026-01-07 (edge, terrain) → "grazing the skyline"; IM-2 2026-01-05 (edge, flat) → "terrain decides". `/web` build OK.
- **Not edited, needs both humans:** PLAN.md ("on the edge (terrain decides)", Settled earlier) and DESIGN.md ("…so terrain decides"). Suggested wording: "on the edge (flat sites: terrain decides; terrain sites: grazing the skyline)".
- **Lane B:** the globe legend and marker labels only say "On the edge" (fine). If you add a description, use the same two phrases.
- **Cabeus B point kept** (Sheldon). The reason is recorded in the root README: the Earth-facing skyline is downhill ground around a high point, the same situation as Malapert's eastern bins.

### 2026-11-14 — D12 terrain, stage 2 DONE: IM-2, IM-1, Chandrayaan-3 (landed coordinates)
- **Maps confirmed from PDS labels:**
  - `ldem_75s_30m` (30 m/px, to 75°S, 1.86 GB; only ±22 km of rows fetched) and `ldem_60s_60m` (60 m/px, to 60°S, 1.93 GB; rows only).
  - `ldem_45s_400m` (400 m/px, to 45°S, 104 MB, whole) as the outermost far map.
  - All polar stereographic centred on −90°, "MEAN EARTH/POLAR AXIS OF DE421", heights "relative to a radius of 1737.4 km". Also read: `ldem_75s_60m`, `ldem_60s_120m`, `ldem_45s_100m/200m` (not used).
- **Per site** (full table in `/data/README.md`):

  | Site | Fine map within 20 km | Sun visible, flat → terrain | Earth in view, flat → terrain |
  |---|---|---|---|
  | **IM-2** (LROC resting point) | 20 m/px | 50.2% → 45.1% | 72.7% → 81.3% |
  | **IM-1** (LROC landed point) | **30 m/px** (80.13°S is too close to the 20 m map's 80°S edge) | 50.3% → 39.5% | 100% → 100% |
  | **Chandrayaan-3** | **60 m/px** (finest polar map reaching 69°S) | 50.1% → 47.8% | 100% → 100% |

  - Beyond 20 km every site uses 80 / 120 / 240 / 400 m maps. No direction is cut off by a map edge.
- **Chandrayaan-3 coordinate change (D12 "landed coordinates"):**
  - From ISRO's *prime landing-site centre* (69.367621°S, 32.348126°E; ISRO gives a 4 km × 2.4 km box and no touchdown coordinates) to **LROC's "Chandrayaan-3 Landing Site" 69.3741°S, 32.32°E, 532 m**, where LROC imaged the lander about four days after landing. About 0.35 km apart.
  - `sites.js` source now points to LROC; the ISRO values are kept in the note. Its Horizons data (2026–2029 + landing window) were re-downloaded. **Sheldon: please confirm.**
- **Independent cross-check:** LOLA ground height vs LROC's published elevation: IM-1 2594 m vs 2579 m; Chandrayaan-3 529 m vs 532 m.
- **Limits stated in the data README:** IM-2 rests on its side in a ~20 m crater (LROC) that a 20 m map can't resolve. Chandrayaan-3 at 60 m/px misses small nearby features.
- **Code:**
  - New `scripts/lola_maps.mjs` (which map is finest per latitude). `fetch_lola.mjs` and `compute_horizon.mjs` use it; `horizon.json` now records `maps` (product + m/px).
  - `check_horizon.mjs` compares each site's own fine map with a coarser map covering all test points.
  - **Regression:** Malapert and Haworth recomputed through the new code: elevation and blocking distances identical to the committed files.
  - Two check-script bugs fixed: the IM-1 comparison hit points off the 80 m map (NaN), and the Earth azimuth range was printed wrong when straddling north.
- **Checks:**
  - `check_horizon` PASS for all seven terrain sites; Malapert keeps step 7's blocked-Sun test.
  - `check_visibility` PASS (expects exactly 7 terrain sites; Sun/Earth margins vs each horizon; all daily rows = getSummary).
  - `check_ephem`, `check_scene` PASS. `/web` build OK.
- **Next (stage 3, on go):** Apollo 11, 12, 17 at their LM coordinates. They're near the equator, outside every polar map, so they need a different (cylindrical/global) LOLA product. Lane A will confirm it from PDS documentation first.

### 2026-11-14 — D12 terrain DONE: all 10 sites (stage 3, Apollo); D14 amendment; "on the edge" wording in PLAN/DESIGN
- **Interrupted run (computer slept) checked before use:** nothing had been committed. The three Apollo `horizon.json` files were complete (360 finite values, correct maps, 0 edge-limited bins) and the index listed all 10. The only defect was the smooth-sphere dip, saved as `null` from a NaN. Fixed below; the Apollo horizons were recomputed with identical elevation values.
- **Maps confirmed from PDS labels and `catalog/dsmap.cat`:** the global simple-cylindrical LOLA GDR maps (`lola_gdr/cylindrical/img/`).
  - Within 20 km: a ±22 km row window of the site's **`ldem_1024` tile** (1024 px/deg, ~30 m/px).
  - Beyond: a ±8° row window of **`ldem_128`** (~237 m/px).
  - Labels: CENTER_LONGITUDE 180, east-positive 0–360, MEAN EARTH/POLAR AXIS OF DE421, heights relative to 1737.4 km.
  - Formula: `SAMPLE = NINT(SPO + RES·(LON − CENTER_LONGITUDE)) + 1`, `LINE = NINT(LPO − RES·(LAT − CENTER_LATITUDE)) + 1`, checked against tile edges.
  - Downloaded only the windows: ~838 MB in 39 s. `data/raw/` total 2.1 GB, gitignored.
- **Per site (landed LM coordinates, NSSDCA):**

  | Site | Fine map | Ground vs sphere | Terrain horizon | Sun, flat → terrain | Earth, flat → terrain |
  |---|---|---|---|---|---|
  | **Apollo 11** | `ldem_1024_00n_15n_000_030` | −1927.8 m | −0.61° to +1.33° | 50.1% → 49.9% | 100% → 100% |
  | **Apollo 12** | `ldem_1024_15s_00s_330_360` | −1421.9 m | −0.41° to +0.73° | 50.4% → 50.1% | 100% → 100% |
  | **Apollo 17** | `ldem_1024_15n_30n_030_060` | −2628.6 m | **+0.45° to +14.23°** (valley) | 50.1% → 47.9% | 100% → 100% |

  - Apollo 17's Sun is blocked by terrain for 764 h (356 h by ridges ≥ 2 km away).
  - **Apollo 12's Earth-facing skyline is set by ground 0.39–1.0 km away** (68% of Earth hours < 500 m; D10 reporting rule). Its horizon there is low and Earth is high, so no answer changes.
  - Apollo 11's tile stops at the equator; the ~1.5 km strip south of it within 20 km comes from the 237 m map.
- **Smooth-sphere dip fix:** the Apollo observers are 1.4–2.6 km *below* the 1737.4 km reference sphere, where `acos(R/(R+h))` is undefined (NaN).
  - `horizon.json` now stores `smoothSphereDipDeg: null` with `smoothSphereNote`, plus `mastDipDeg` (0.087°, mast over a smooth sphere through the ground point).
  - `check_horizon` checks the null case explicitly.
  - Panels now say "x m **below** the 1737.4 km reference sphere" instead of a negative "above".
- **Search bound for global sites:** the polar labels' ~7 km maximum covers only the poles. Global sites use the highest point in their own windows + 500 m (9.3–11.3 km). No ray left its windows.
- **Regression:** Malapert, IM-1 and Chandrayaan-3 recomputed through the rewritten loader: identical to the committed files.
- **Checks:**
  - `check_horizon` PASS for **all 10** sites; the Apollo sites get a cylindrical map-agreement test, 30 m vs 237 m: mean |diff| 4.1 / 2.1 / 14.6 m.
  - `check_visibility` PASS (all 10 sites lola; Sun and Earth margins vs each horizon; 17,190 daily-row comparisons).
  - `check_ephem`, `check_scene` PASS. `cd web && npm run build` OK.
  - DOM test: Apollo 11 side card and horizon view show TERRAIN and "1927.8 m below the reference sphere"; the Compare grid shows no FLAT rows and says every site uses a terrain horizon.
- **On screen / docs updated for "all 10 terrain":**
  - Compare grid: the FLAT/TERRAIN legend and footer appear only if any site is flat. Now: "every site uses a terrain horizon".
  - Root README (what you can do, terrain method, sources, limits) and `/data/README.md` (stage 3 table).
- **Lane B, please update one line in `web/src/main.ts` Credits:** "Malapert horizon elevation: NASA …" is now out of date. Suggested: *"Terrain horizons for all 10 sites: NASA LRO LOLA GDR elevation maps (PDS Geosciences), polar and global; maps and resolution per site in data/README.md."*
- **PLAN.md + DESIGN.md:** "on the edge" now reads the same as the panels: "terrain decides" at flat-horizon sites, "grazing the skyline: small changes in position matter" at terrain sites (both humans). Since D12, every site is a terrain site.
- **D14 amendment (both humans), recorded in PLAN.md:** the overview's first version is the **OzAILabs solar system simulator, forked and embedded as its own tab with full credit**. It shows all planets and is not yet tied to our date control, and the screen says both. Trimming to three bodies and syncing the date come later if time allows. Lane B owns it. Reminder from D11: the Credits panel must show its license; no code is copied from a repo whose license we can't show (earlier check: the README says MIT, no standalone LICENSE file seen).

### 2026-11-14 — D16 power/comms metrics + power calculator and D17 best-site score (PROTOTYPE): DONE
**Shown inside the existing panels, so Lane B needs no new mounting:** side card (Educator + Researcher) and Compare grid (new score box under the strip).

**D16 in `/lib` (API 1.4.0), all from the terrain-aware hourly data:**
- `getMetrics(siteId, startUtc, days=7)` → `{ pctLit, longestDarkHours, darkPeriods, pctComms, longestContactGapHours, contactWindows, hours, horizonModel, note, commsNote }`.
  - Runs touching the stay's start or end are counted (stated).
  - `commsNote`: "Earth in view is line-of-sight geometry only. A data rate needs antenna size, transmitter power, frequency and the receiving station network, which are not modelled."
- `getDaily` rows gain `darkPeriods`, `contactWindows`, `longestContactGapHours` (new `daily.json` columns, rebuilt).
- `computePower({ siteId, startUtc, days, areaM2, efficiency, panel: "tracking"|"fixed-flat", loadW })` → `{ peakW, averageW, energyWh, loadEnergyWh, balanceWh, poweredHours, longestNoPowerHours, batteryWh, hourlyW, assumptions[], estimate: true }`.
  - Hourly power = 1361 W/m² × area × efficiency × f, where f = 1 (tracking) or sin(Sun elevation) (fixed flat, horizontal), and f = 0 when the Sun is hidden by terrain or, for a flat panel, at or below level.
  - Battery = load × longest stretch with no panel power.
  - **Solar irradiance source:** NASA NSSDCA Moon Fact Sheet, "Solar irradiance (W/m2) 1361.0" (last updated 11 January 2024). The Sun Fact Sheet has no solar-constant line. The value is used as a mean, with no Sun-distance correction (stated).
  - Seven assumptions are returned and shown on screen; the result is labeled ESTIMATE.

**D17 formula in plain words (PROTOTYPE, Lane A's proposal):**
- Each site and landing date gets four sub-scores between 0 and 1, from the 7-day stay:
  - **S**: how much of the stay has sunlight.
  - **E**: how much of the stay has Earth in view.
  - **D**: how short the longest dark stretch is (1 − longest dark ÷ 168 h).
  - **G**: how short the longest gap without Earth is (1 − longest gap ÷ 168 h).
- The score is their weighted average × 100. **Default weights: sunlight 35, Earth 25, short dark 25, short gap 15.**
  - `score = 100 × (35·S + 25·E + 25·D + 15·G) ÷ 100`; with custom weights, divide by their sum.
  - All weights zero → no score (not a fake number).
- In `/lib`: `scoreOf(metrics, weights?)`, `getRanking(landingDate, weights?)` (from the daily summary, all 10 sites, best first), `SCORE_DEFAULT_WEIGHTS`, `SCORE_TERMS`, `SCORE_FORMULA_TEXT` (file `lib/score.js`).
- Example, IM-2 from 2026-11-14: S 0.792, E 1.000, D 1 − 31/168 = 0.815, G 1.000 → **88.1**. Top site that date: Chandrayaan-3 (97.1).

**On screen:**
- **Side card, Educator:** "Best-site score PROTOTYPE: 88 out of 100 for this site. The top site for a landing on 2026-11-14 is Chandrayaan-3 (97 out of 100). Uses the default weights. The Researcher view explains the calculation." No formula or weights.
- **Side card, Researcher:**
  - The six D16 metrics with the hourly-run and comms notes.
  - The power calculator (area, efficiency, panel type, load), with results and every assumption, labeled ESTIMATE.
  - The score formula with this site's S/E/D/G at default weights and its rank.
- **Compare grid, score box:** its own Educator / Researcher switch.
  - Educator: "the best site by our prototype score is … scoring … out of 100", plus all sites in order, at default weights.
  - Researcher: the formula, four weight sliders and the ranking table (S, E, D, G per site) updating live, a "custom weights" label and Reset.
  - Same numbers at default weights.

**Checks (`node scripts/check_metrics.mjs`, new) → PASS:**
- getMetrics = an hour-by-hour recount (10 sites × 3 dates); all 14,694 daily rows carry the same D16 values.
- **Worked power example:** IM-2, 2026-11-14, 1 m² tracking at 30%, 100 W: 1361 × 1 × 0.30 = 408.3 W; Sun up 133 of 168 h → 54,303.9 Wh; average 323.2 W; need 16,800 Wh; longest dark 31 h → battery 3,100 Wh.
- Fixed flat at the same stay: 4,680 Wh (low Sun at 84.8°S); bad inputs rejected.
- Score: equals scoreOf(getMetrics), stays within 0–100, sorted; the hand example (88.1) matches; Educator and Researcher identical at defaults; sunlight-only weights re-rank; all-zero gives no score.
- **DOM test (happy-dom, real data):** the Educator texts above, the Researcher metrics, the calculator defaults reproducing 323 W / 54.3 kWh / 3.1 kWh, switching to fixed flat giving 4.7 kWh, grid sliders re-ranking live (sunlight-only puts Nobile Rim 2 first), and Reset restoring 97.1.
- **All checks:** `check_visibility` (API 1.4.0), `check_ephem`, `check_scene`, `check_horizon`, `check_metrics` PASS. `cd web && npm run build` OK.
- README updated: D16/D17 description, five check scripts, limits. PLAN already records that D17 replaces "no single best-site score".

### 2026-11-14 — D17 amendment: clearance + slip tolerance, "Sun and Earth score", "Why these weights?" (DONE)
**Recorded in PLAN.md as the D17 amendment (both humans).** Scale not compressed or capped; 100 is harder to earn for real reasons.

**New formula in plain words (PROTOTYPE):** six sub-scores between 0 and 1 for the 7-day stay:
- **S** sunlight share.
- **E** Earth-in-view share.
- **D** 1 − longest dark stretch ÷ 168 h.
- **G** 1 − longest gap without Earth ÷ 168 h.
- **C, clearance (new):** while each body is visible, how far it sits above the terrain skyline, scored min(height above skyline, 15°) ÷ 15° and averaged over the visible hours. Sun and Earth are averaged; 0 if a body is never visible. Grazing the skyline scores low.
- **T, slip tolerance (new):** compute the score from the first five terms for the landing date and for each date up to 3 days either side. T = 1 − (today's five-term score − the lowest in that window) ÷ 100. A score that collapses if the date slips loses points; dates outside the data are skipped.

**Score = weighted average × 100. Default weights:** sunlight 25, Earth 20, short dark 15, short gap 10, clearance 15, slip tolerance 15 (sum 100). With custom weights, divide by their sum; all zero → no score.

**Spread, all sites, every landing date 2026-01-04 to 2029-12-22 (14,490 site-dates):**

| | Old formula (S/E/D/G 35/25/25/15) | New formula |
|---|---|---|
| Score ≥ 95 | 3,173 (21.9%) | **1,493 (10.3%)** |
| Score = 100 | 2,638 | **95** |
| Bands 0–20 / 20–40 / 40–60 / 60–80 / 80–100 | 904 / 884 / 5,406 / 2,474 / 4,822 | 478 / 1,093 / 5,406 / 3,233 / 4,280 |

- Why: the pole sites no longer reach the top, because the Sun and Earth graze their skylines (e.g. Cabeus B, IM-2: hundreds of 95+ dates → 0).
- The near-side sites keep high scores only when the Sun and Earth stay high and stable all week.

**Label:** "**Sun and Earth score**". On screen, in both views: "100 means the Sun and Earth stay in view, well above the skyline, for the whole 7-day stay, and the answer holds if the landing slips by up to 3 days. It does not mean the site is safe: slopes, boulders, temperatures, landing hazards and mission risks are not included."

**"Why these weights?"** A clickable control (native `<details>`) next to the score in both views, in the side card and the Compare grid.
- **Educator text:** "Sunlight counts most, because without power nothing else works, and talking to Earth comes next. We also reward sites where the Sun and Earth sit well above the skyline and where the answer stays good if the landing date slips. These weights are this team's judgment, not a NASA standard. The Researcher view lets you change them."
- **Researcher:** one line per weight:
  - **wS 25:** sunlight is weighted most: without power nothing else runs.
  - **wE 20:** Earth contact next: without it, no commands up or data down.
  - **wD 15:** one long blackout is harder to survive than the same darkness spread out.
  - **wG 10:** a lander can store data and wait, but long silences add risk.
  - **wC 15:** a body grazing the skyline can be lost to a small change in position or terrain detail.
  - **wT 15:** real launch dates move.
  - Then the same team-judgment statement.

**/lib (API 1.5.0):**
- `lib/score.js` exports `SCORE_LABEL`, `SCORE_MEANING`, `WEIGHT_REASONS`, `WEIGHTS_STATEMENT`, `WEIGHTS_EDUCATOR_TEXT`, `CLEARANCE_FULL_DEG` (15), `SLIP_DAYS` (3), `baseScore`, `slipTolerance`, and `scoreOf(metrics, weights, window)`.
- `getMetrics` and `getDaily` rows gain `sunClearance`, `earthClearance`, `clearance` (0.001 precision, identical in both); `daily.json` gains two columns.
- `getRanking` computes slip tolerance from each site's ±3-day window; new `getScore(siteId, date, weights?)` gives the same number from the hourly data.

**Worked example (check script):** IM-2, 2026-11-14:
- S 0.792, E 1.000, D 0.815, G 1.000.
- C = (Sun 0.276 + Earth 0.354) ÷ 2 = 0.315.
- Five-term scores −3..+3 days: 48.2, 60.7, 70.9, 78.5, 86.2, 90.0, 91.1 → drop 30.3 → T 0.697.
- Score **77.2** (was 88.1). Top site that date: Chandrayaan-3, 91.8.

**Checks:**
- `check_metrics` PASS: daily clearance = getMetrics on all 14,694 rows; ranking = getScore for every site; hand example; Educator = Researcher at defaults; re-ranking; all-zero → no score; spread printed, with new 95+ count < old.
- DOM test: new label and meaning line; both "Why these weights?" texts (6 reason lines in Researcher); Educator 77 = Researcher 77.2; grid has 6 sliders plus C/T columns, re-ranks live, and Reset restores 91.8.
- `check_visibility` (API 1.5.0), `check_ephem`, `check_scene`, `check_horizon` PASS. `/web` build OK. README updated.

### 2026-11-14 — Planning stop recorded (D19–D23, weights confirmed); D19 DONE
**Recorded in PLAN.md:**
- The six default weights are confirmed.
- D19–D23 and the order (D19 → D21 → D18 with D20 + D22).
- A note on Lane B's unplanned changes: Earth removed from Explore and replaced by a procedural nebula (`95f3d88`); the simulator embed cleaned up; a NASA objectives audit in Lane B docs.

**D19 sources (NASA NSSDCA fact sheets, read 2026-11-14):**
- Sun "Volumetric mean radius (km) 695,700."
- Earth "Equatorial radius (km) 6378.137".
- Earth "Solar irradiance (W/m2) 1361.0" with "Semimajor axis (10^6 km) 149.598". Read as 1361 W/m² at that mean distance; the Moon sheet gives the same 1361.0.
- Lunar eclipses: NASA GSFC LEdecade2021, "Eclipse Predictions by Fred Espenak, NASA's GSFC", times in TD.

**How the fractions feed everything (Lane A proposal, implemented, API 1.6.0, `lib/disc.js`):**
- **Each hour, `sunFraction`** = (share of the Sun's disc above the terrain skyline) × (1 − share covered by Earth's disc).
  - Disc sizes come from the actual Sun and Earth distances that hour (scene data). The skyline is treated as straight across the disc; Earth's disc is seen from the site, so its parallax is included.
- **Windows, dark periods, longest dark stretch, verdict ("both"), sunrise/sunset countdowns** use the flag `lit = sunFraction ≥ 0.5` (at least half the disc). Outside eclipses this equals the old "centre above the skyline" rule.
- **Sunlight share (score term S, side card "Sunlight %")** = the mean `sunFraction`: partial hours count partly.
- **Earth:** `comms` (Earth in view) only when the margin ≥ Earth's angular radius (whole disc clear). `earthMarginal` = partly hidden, counted and shown separately.
  - Earth-in-view share, contact windows, gaps, the verdict and score term E all use the strict flag.
- **Power:** each hour uses irradiance = 1361 × (149.598 million km ÷ actual Sun distance)², times `sunFraction` (× sin elevation for a flat panel). The battery uses the longest stretch with no sunlight at all.
- **New fields:**
  - `getState` / timeline samples: `sunFraction`, `sunSkylineFraction`, `eclipseFraction`, `earthMarginal`, `sunRadiusDeg`, `earthRadiusDeg`, `sunDistKm`, `earthDistKm`, `irradianceWm2`.
  - `getSummary` / `getMetrics` / `getDaily`: `partialSunHours`, `eclipseHours`, `earthMarginalHours`, `litHours`.
  - `computePower`: `meanIrradianceWm2`.
- **Lane B:** `loadSite()` now also loads the scene data (it's needed for disc sizes). There's no other change to your calls.
- **One implementation:** `getSummary`, `getMetrics` and `daily.json` share one counter (`stayCounts`); `scripts/build_daily.mjs` now calls the library, so they can't drift apart.

**Eclipse cross-check (`node scripts/check_d19.mjs`, new):**
- From our data, Earth's disc reaches the Sun's disc (somewhere on the Moon) in **9 events**, all on NASA's list and each within 1 h of NASA's time of greatest eclipse.
  - 2026-03-03 total, 2026-08-28 partial, 2027-02-20 penumbral, 2027-08-17 penumbral, 2028-01-12 partial, 2028-07-06 partial, 2028-12-31 total, 2029-06-26 total, 2029-12-20 total.
- NASA's 10th, the **2027-07-18 penumbral** (umbral magnitude −1.068), is a graze: our closest approach is at 16:00 UTC (NASA 16:04 TD) but misses the solid-Earth contact limit by 0.008°, 0.9% of Earth's radius. NASA's shadow includes Earth's atmosphere; ours doesn't. The check allows < 1% for this reason and says so.
- **NASA's four total eclipses** show the Sun fully covered from the Moon's centre. At every site the Sun is never covered outside an eclipse.
- **Example:** Malapert 2026-03-03, Sun 40% covered at 10:00, 100% at 11:00 and 12:00, 39% at 13:00 UTC (NASA greatest eclipse 11:34:52 TD).

**Before / after, every hour 2026–2029, per site** (`node scripts/report_d19.mjs <snapshot>`; verdicts and scores over 1,449 landing dates per site):

| Site | (a) Sun as disc: sunlight share | (b) eclipses: hours at site, share after | (c) Earth whole disc: in view | (d) Sun distance: panel energy, fixed → actual | all rules: energy | verdict changed | score (default weights) |
|---|---|---|---|---|---|---|---|
| apollo11 | 49.94% → 49.94% | 30 h, share → 49.88% | 100.00% → **100.00%** (0 marginal h) | 7150 → 7130 kWh (-0.28%) | 7121 kWh | 0/1449 | 75.2 → 75.2 (mean change 0.04) |
| apollo12 | 50.14% → 50.14% | 32 h, share → 50.08% | 100.00% → **100.00%** (0 marginal h) | 7179 → 7160 kWh (-0.26%) | 7152 kWh | 0/1449 | 75.2 → 75.2 (mean change 0.03) |
| apollo17 | 47.94% → 47.95% | 31 h, share → 47.89% | 100.00% → **100.00%** (0 marginal h) | 6864 → 6845 kWh (-0.28%) | 6837 kWh | 0/1449 | 74.3 → 74.2 (mean change 0.03) |
| chandrayaan3 | 47.75% → 47.76% | 31 h, share → 47.70% | 100.00% → **100.00%** (0 marginal h) | 6837 → 6820 kWh (-0.24%) | 6813 kWh | 2/1449 | 72.1 → 72.1 (mean change 0.03) |
| im1 | 39.54% → 39.52% | 31 h, share → 39.46% | 100.00% → **100.00%** (0 marginal h) | 5661 → 5645 kWh (-0.29%) | 5633 kWh | 3/1449 | 65.4 → 65.4 (mean change 0.04) |
| im2 | 45.14% → 45.18% | 31 h, share → 45.13% | 81.31% → **74.16%** (6867 marginal h) | 6462 → 6449 kWh (-0.20%) | 6447 kWh | 30/1449 | 59.6 → 57.4 (mean change 2.15) |
| sp_cabeus_b_peak | 68.53% → 68.60% | 31 h, share → 68.54% | 72.54% → **67.16%** (4152 marginal h) | 9811 → 9818 kWh (+0.06%) | 9819 kWh | 53/1449 | 66.9 → 65.4 (mean change 1.52) |
| sp_haworth | 30.94% → 30.93% | 0 h, share → 30.93% | 31.55% → **25.80%** (3813 marginal h) | 4429 → 4436 kWh (+0.16%) | 4436 kWh | 31/1449 | 36.0 → 34.4 (mean change 1.61) |
| sp_malapert | 45.78% → 45.88% | 30 h, share → 45.83% | 100.00% → **85.98%** (4917 marginal h) | 6554 → 6549 kWh (-0.08%) | 6556 kWh | 45/1449 | 66.6 → 62.4 (mean change 4.22) |
| sp_nobile_rim2 | 47.19% → 47.17% | 31 h, share → 47.11% | 65.06% → **60.00%** (3712 marginal h) | 6757 → 6751 kWh (-0.08%) | 6740 kWh | 58/1449 | 54.7 → 53.2 (mean change 1.45) |

Panel = sun-tracking, 1 m², 30%, summed over 2026–2029.

**What changed, in short:**
- **(a) Disc:** sunlight share moves by < 0.1 point anywhere. Partial-disc hours roughly balance: the disc is half visible exactly where the old centre rule switched.
- **(b) Eclipses:** about 30 h per site over four years (0 at Haworth, where the Sun was already behind terrain during every eclipse), so the share falls by about 0.06 point.
- **(c) Earth's whole disc** is the big one for the pole sites:
  - Malapert Earth 100% → 86.0%; IM-2 81.3% → 74.2%; Cabeus B 72.5% → 67.2%; Haworth 31.6% → 25.8%; Nobile Rim 2 65.1% → 60.0%.
  - Near-side sites: no change; Earth is high.
- **(d) Sun distance:** panel energy changes by −0.3% at the near-side sites and stays within ±0.2% at the pole sites over four years. Any single week can be up to ±4%.
- **Overall:** verdicts change on 0–3 landing dates at the near-side and mid-latitude sites and 30–58 at the pole sites. The mean score drops up to 4.2 points (Malapert), driven by (c).

**Checks:**
- `check_d19` PASS (new).
- `check_visibility` (API 1.6.0; `lit` = disc rule, `comms` = whole-disc rule) PASS.
- `check_metrics` PASS, with the power example updated: 1,392 W/m² average that week; 128 full-disc + 12 partial hours = 134.0 full-Sun hours → 55.9 kWh, 333 W, battery 2.8 kWh. Score example IM-2 76.6.
- `check_ephem`, `check_scene`, `check_horizon` PASS.
- DOM tests: eclipse shown in the horizon view (40% then 100%) and the side card; Researcher metrics list eclipse and marginal-Earth hours; earlier panel tests pass with the updated numbers.
- `/web` build OK. README updated (limits, six check scripts, examples).

### 2026-11-14 — D21 DONE: filterable ranking, no south-pole assumption
- `/lib`: `listSites()` adds `category`: **"historic"** when a site has a landing date (Apollo 11, 12, 17, Chandrayaan-3, IM-1, IM-2), otherwise **"candidate"** (the four Artemis candidate points). Derived from the data, not from latitude.
  - `SITE_CATEGORIES` gives the labels. `getRanking(date, weights, filter)` takes filter `"all" | "candidate" | "historic"` and adds `category` to every row. Filtering never changes a score.
- **Panels:**
  - Compare grid score box: a "Show: All sites / Candidate sites / Historic landings (comparisons)" filter. Historic sites are tagged "past landing, shown for comparison", grid rows show a PAST tag, plus the note "Historic landings are past missions, included so educators can compare them with candidate sites."
  - Side card: a HISTORIC LANDING / CANDIDATE SITE tag. The Educator line names the **top candidate site**, and adds the top overall only if it's a past landing ("a past landing shown for comparison").
  - No "south pole" wording or defaults in Lane A panels. The test page's default site is the first site in the list. The site-point note is keyed on the candidate category, not on the old `kind`.
- **Lane B:** please check your shell for any south-pole default or wording (e.g. the default selected site or a "South pole view" button label) and decide with the humans.
- **Checks:** `check_metrics` gains the D21 cases (categories from landing dates; filters partition the ranking; scores unchanged; unknown filter rejected). DOM test: Apollo 11 tagged historic; top candidate Nobile Rim 2 named; grid filters; 6 PAST tags. `check_visibility` (API 1.7.0) PASS; `/web` build OK.

### 2026-11-14 — D18 Researcher tab (with D20 and D22) READY to mount
**Contents chosen from NASA's own statements of what landing-region selection weighs** (quoted on screen with links):
- 2024: "science potential, launch window availability, terrain suitability, communication capabilities with Earth, and lighting conditions".
- 2022: "terrain slope, ease of communications with Earth, and lighting conditions", and "continuous access to sunlight throughout a 6.5-day period … it provides a power source and minimizes temperature variations".
- **Added because we hold the data:**
  - **Local slope** at each site (plane fit on the terrain map, over 1 pixel and over 100 m; stored in each `horizon.json`; horizons recomputed byte-identical).
  - **Longest continuous sunlight in the stay vs NASA's 6.5-day (156 h) benchmark.**
- A coverage table shows how each NASA criterion is answered. Launch windows, science value and temperatures are stated as not modelled.

**On the tab** (`web/src/panels/researcher.ts`), headed "RESEARCHER VIEW — written for researchers and mission designers":
- **Lighting and power:** sunlight share (disc), longest dark stretch, dark periods, longest continuous sunlight vs 156 h, partial-Sun hours, sunlight strength and Sun distance ranges, eclipses in the stay. Then the power calculator (ESTIMATE, every assumption listed).
- **Communications (geometry only):** Earth in view (whole disc), marginal hours, longest gap, contact windows, Earth's elevation/azimuth wobble and sub-Earth libration, distance to Earth and **one-way signal delay** (distance ÷ 299,792.458 km/s, JPL Horizons), and the **Sun near the Earth–Moon line** caution (within 5° either way; the threshold is ours and labeled illustrative).
- **Lunar season and time of day:**
  - Sub-solar latitude, with NASA SVS 5229 quoted ("the tilt of the Moon is a mere 1.5°", "draconic year of about 346.6 Earth days").
  - Lunar local solar time at the start and end of the stay, and the next sunrise/sunset.
  - The **Sun's compass sweep** while lit.
- **Best and worst months** (2026–2029 and by calendar month), from the default-weight score.
- **Terrain profile:** a 360° chart; maps and resolution (e.g. `ldem_80s_20m`, 20 m/px within 20 km, then 80/120/240/400 m); observer height and assumed mast; local slope; source.
- **Sun and Earth score:** formula, this site's six terms, the score, and "Why these weights?".
- **Other planets (D22),** **What is NOT modelled** (11 items), **Sources** (8 plus the site's own).
- **Downloads:** **full analysis (JSON)** (everything above + 168 hourly rows + calculator inputs) and **hourly CSV** (D19 columns: sunFraction, eclipseFraction, irradiance, Earth radius/marginal, distances).

**/lib (API 1.7.0):**
- `getConditions(siteId, startUtc, days=7)` (all D20 items) and `getMonthlyScores(siteId)`.
- `getHorizon` now also returns `maps`, `localSlope`, `searchBoundM`, `mastDipDeg`.
- Texts in `lib/research.js`: `NASA_SITE_CRITERIA`, `CRITERIA_COVERAGE`, `SEASON_NOTE`, `OTHER_PLANETS_NOTE`, `NOT_MODELED`, `SOURCES`, `LIGHT_SPEED_KM_S`, `COMMS_CAUTION_DEG`.

**Mount instructions for Lane B:**
1. `import { mountResearcher } from "./panels/index";` (from `web/src/`).
2. Add a tab/view labeled e.g. **"Researcher"** (the panel heads itself "written for researchers and mission designers"). Then call `const rv = mountResearcher(el, { siteId, landingDate, onSiteSelected, onDateSelected });` once.
3. On every shared selection change: `rv.update({ siteId, landingDate })`, as for the other panels. It ignores `hour` (it analyses the whole stay).
4. It loads its own data (`loadSite`, `loadDaily`), takes about a second for a new site, and shows "Unavailable" outside coverage. Width follows the container; it's long, so give it a scrolling area.
5. The side card's `onOpenView` has no "researcher" value. If you want a button there, the humans can approve adding it.

**D22 wording for Lane B** (for the overview/tour or Credits; verified):
> *Other planets: their gravity is already in our numbers. JPL's ephemerides (DE440/DE441), which give every Sun, Earth and Moon position here, are computed by "fitting numerically integrated orbits" of "the Sun, the barycenters of eight planetary systems, the Moon, the Pluto system barycenter", and even include "Perturbations from 30 individual Kuiper belt objects" (Park et al. 2021, JPL). Their light is negligible: seen from the Moon in 2026–2029, JPL Horizons gives the Sun an apparent magnitude no fainter than −26.70 and Venus, the brightest planet, no brighter than −4.93, so Venus delivers at most about 2 billionths of the Sun's light. Radio from the planets is not modelled; we found no JPL figure to quote, so we make no numeric claim about it.*

**Verification notes for D22:**
- The DE440 paper text was read from JPL's PDF (ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf).
- The magnitudes come from a Horizons query (quantity 9 APmag, observer 500@301, Sun/Venus/Jupiter/Mars, 2026–2029 at 5-day steps): Sun −26.784 to −26.701, Venus −4.928 to −3.766, Jupiter −2.677 to −1.663, Mars −1.409 to +1.585.
- **The radio half of the requested claim is NOT verified.** No JPL/NASA statement was found, so the wording says so.

**Checks:**
- `check_d20` PASS (new):
  - Signal delay = distance ÷ c.
  - Lunar local time 12.02 h at the Sun's highest point (Apollo 11).
  - Season = JPL sub-solar latitude, NASA quotes present.
  - The 2026-03-03 eclipse appears in Malapert's 2026-03-01 stay.
  - Caution count = recount (20 h).
  - Compass sweep 84.6° = sub-solar longitude change (Haworth, fully sunlit stay), which meets the 156 h benchmark.
  - Month mean = average of getScore.
  - All 10 slopes present (IM-1 11.7° over 100 m, others 0.7–3.1°).
  - NASA criteria, D22 note and sources present.
- DOM test: all 11 sections, the audience label, NASA quotes, eclipse, delay and caution, season/local time/sweep, profile chart + maps + slope, D22, calculator, JSON (full analysis + 168 hourly rows) and CSV (168 rows, D19 columns) downloads, switch to Apollo 11 (historic label, global map).
- All earlier checks and panel tests PASS (two old panel tests updated for D12 all-terrain and D21 wording). `/web` build OK. README updated (Researcher tab, categories, seven check scripts).

### 2026-11-14 (evening) — D24–D28 recorded; D25 tour captions and D26 south-pole text DONE (Lane A part)
**Recorded in PLAN.md:** D24–D28 and the rule that status notes are folded into real commits (no status-only pushes).

**D25 tour captions:** `lib/tour.js`, exported from `lib/visibility.js` as `TOUR_STOPS` (API 1.8.0).
- Ten stops in tour order: Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Moon. Each `{ id, body, title, text, ours[], sources[{name, url}] }`.
- `text` is two plain sentences answering "What does this body do to a lander on the Moon?"
- Every source is an official NASA or JPL page, checked 2026-11-14: the science.nasa.gov facts pages, the NSSDCA fact sheets, NASA SVS 5229, the Artemis III page, the DE440 paper, and JPL Horizons.
- Figures we computed ourselves are labeled "ours" in the text and listed in `ours`.
  - From the Moon (our JPL Horizons magnitudes, 2026–2029): **Venus is the brightest planet**, at most 1.95 × 10⁻⁹ of the Sun's light.
  - Sunlight 1,310–1,415 W/m²; signal delay 1.19–1.36 s; one lunar day = 29.531 Earth days (the sub-solar point drifts 360° west in that time).
  - Raw magnitudes are in `MAGNITUDES_FROM_MOON`; `lightVsSun(body)` gives the ratios.
- **Corrections made by the checks:** the first draft said "about 1.3 seconds" and "Earth within a few degrees of the horizon at the candidate sites". The data gave 1.19–1.36 s and up to 10.63°, so the texts now say "between about 1.2 and 1.4 seconds" and "never more than about 11 degrees above level".

**D26 "Why the south pole?":** `SOUTH_POLE = { oneLine, full[3 paragraphs], sources[] }`.
- Quoted from NASA: the 2022 candidate-regions release ("permanently shadowed regions rich in resources", "water ice that was confirmed at the Moon's South Pole", sites with "continuous access to sunlight throughout a 6.5-day period"); NASA Moon facts (ice "within darkened craters at the poles"); the Artemis III page ("The Sun will hover just above the horizon"); NASA SVS 5229 (tilt 1.5°).
- NASA's "why Artemis" page returned 404, so it isn't used.
- Includes our Malapert 1 km example and the sentence that the tool works for any site, with historic landings as comparisons.
- Lane A's side card Educator view now has a clickable **"Why the south pole?"** (full text + sources).

**How Lane B reads them:**
```js
import { TOUR_STOPS, SOUTH_POLE } from "../../lib/visibility.js";   // path from web/src/
// D25: one caption per tour stop (order = tour order)
for (const stop of TOUR_STOPS) { /* stop.body, stop.title, stop.text, stop.sources[i].name / .url */ }
const moon = TOUR_STOPS.find((s) => s.id === "moon");
// D26: Explore header line, and the tour's Moon stop
SOUTH_POLE.oneLine;          // one line (Explore header)
SOUTH_POLE.full;             // array of 3 paragraphs (tour Moon stop, "Why the south pole?" clickable)
SOUTH_POLE.sources;          // [{ name, url }]
```
- These are plain constants: no loading needed, synchronous, safe to import at start-up.
- Please show each stop's sources (e.g. a small "Sources" link), and keep the "(our …)" wording when shortening.
- Credits: add "NASA science.nasa.gov planet fact pages" and "JPL Horizons planet magnitudes (our queries)".

**Checks:**
- `check_tour` PASS (new):
  - Order, two sentences each, nasa.gov sources, every "ours" figure listed.
  - Venus brightest and 1.95e-9 ("about two billionths"); Mercury, Mars and Saturn under a billionth; Jupiter 2.46e-10 ("about a four-billionth"); Neptune 5.6e13 times fainter ("tens of trillions"), 30 × 30 = 900.
  - Sunlight 1310.0–1415.2; lunar day 29.531 d; delay 1.190–1.356 s.
  - South-pole one-line and full text present with quotes; candidate-site Earth max 10.63° ("about 11").
- DOM test: the side card Educator view shows the clickable "Why the south pole?" (4 paragraphs incl. sources), not repeated in Researcher.
- All other checks and panel tests PASS. `/web` build OK. README: eight check scripts.

### 2026-11-14 (evening) — Tour captions revised; D28 planner (A/B scenarios + mission requirements) READY to mount
**Captions revised** (`lib/tour.js`, commit e089b80; each claim checked against NASA/JPL today):
- **Jupiter:** "NASA says Jupiter is more than twice as massive as the other planets combined" (now citing https://science.nasa.gov/jupiter/; the facts page's "other bodies" sentence is no longer used).
- **Earth:** retitled **"The direct line home"**. It now says "a lander has a direct line of sight home" (relay satellites exist).
- **Mercury:** "tilted just 2 degrees", and "may have water ice … inside deep craters … in permanent shadows" (NASA Mercury facts), the same reason the Moon's south pole matters.
- **Mars:** "about 5 to 20 minutes to reach Mars but only about 1.2 to 1.4 seconds to reach the Moon". **No NASA page we could read states the Earth–Mars signal time**, so the 5–20 minutes come from **JPL Horizons** (quantity 21 "1-way down-leg light-time", Mars from Earth's centre, 2026–2029 daily: 5.38–20.06 min), labeled as JPL Horizons figures.
- **Neptune:** NASA's "more than 30 times as far", "roughly 900 times as bright" and "high noon … dim twilight" lines. At the Moon sunlight is at full strength (1,310–1,415 W/m², ours), so the problem is never strength, only terrain.
- **South-pole one-liner (24 words):** "Why the south pole? Water ice and long sunlight, but the Sun and Earth skim the horizon. Any site works; past landings are comparisons." The full version is unchanged.
- **Lane B:** your tour and Explore header read these from /lib, so they update automatically; please rebuild.

**D28 design:**
1. **A/B scenarios:** a scenario = site + landing date (7-day stay). `compareScenarios(A, B)` returns both sets of numbers and the differences in plain words, generated in /lib so every view says the same:
   - Verdict; score; sunlight; Earth in view; longest blackout; longest gap without Earth; eclipse hours; local slope.
   - Each row reads "A is better / B is better / about the same (A x, B y)", followed by an "Overall: … better on n of 7 measures" line and a note when a historic landing is involved.
2. **Mission requirements:** `checkRequirements(date, limits, filter)` tests every site against the limits the user sets: `maxDarkHours`, `maxGapHours`, `minSunPct`, `minEarthPct`, `maxSlopeDeg`.
   - It returns PASS or FAIL per site, naming each failing limit in words, e.g. "Longest blackout (no sunlight) is 119 h, over your limit of 48 h."
   - It runs on the daily summary, so all sites are instant. Slopes are now in `ephem/index.json`.
   - Outside the data the result is "No data", never a guessed pass.
3. **One panel** for both, `mountPlanner`. Saved pairs are kept in the viewer's browser (localStorage, guarded; "kept in this browser only"), with Load, Delete and JSON download. Starting limits are examples, labeled "not recommendations". PASS/FAIL are shown as words and symbols, not color alone.

**/lib (API 1.9.0):** `REQUIREMENTS` (labels, units, direction), `checkRequirements`, `compareScenarios`, and `ephem/index.json` → `slopes`.

**Mount notes for Lane B:**
1. `import { mountPlanner } from "./panels/index";` and add a tab/view, e.g. **"Planner"** (or "Compare & requirements").
2. Call `const pl = mountPlanner(el, { siteId, landingDate, onSiteSelected, onDateSelected });` once. Scenario A starts as the shared selection and B as another site; the requirements use the shared landing date.
3. On selection changes: `pl.update({ siteId, landingDate })`. A date change re-runs the requirements; the user's A/B choices are kept (they can press "Use current selection").
4. Clicking a site name in the requirements list calls `onSiteSelected(siteId)`. It's a long panel, so give it a scrolling area. It ignores `hour`.

**Checks:**
- `check_d28` PASS (new):
  - Slopes in the index = terrain files. Pass/fail and named limits match each site's own numbers (4 of 10 pass the example limits on 2026-11-14).
  - IM-1 is named for slope (11.7° > 10°); no limits → all pass; candidate filter; unknown limit rejected; outside the data → No data.
  - A/B values = getMetrics/getScore; differences point the right way; self-comparison all "about the same"; swap mirrors every difference; historic note.
- DOM test: table + differences; picking B updates them; save/swap/load; JSON download; PASS/FAIL with named limit; changing a limit and the filter re-run; clicking a site → callback.
- `check_tour` updated for the revised captions (Mars 5.38–20.06 min; Jupiter wording and source; Earth title; Mercury and Neptune quotes; one-liner 24 words < 25).
- All other checks and panel tests PASS. `/web` build OK (after pulling Lane B's own fix `a7899fb` for a D27 markup typo in main.ts). README: Planner, nine check scripts.

### 2026-11-14 — D29: renamed to LunLux (Lane A files)
- **Recorded in PLAN.md as D29 (both humans):**
  - The project is **LunLux**, with the one-line description **"Sunlight and Earth contact for lunar landing sites"**. The repo, folders and web addresses are unchanged.
  - The starting page shows the solar system dimmed behind the title card; the simulator's sound is off by default with a visible toggle (Lane B).
- **Renamed in Lane A files:**
  - Titles and tagline in PLAN.md, README.md, DESIGN.md, CLAUDE.md and the STATUS.md title.
  - `web/panels.html` title and heading.
  - `/lib`: `APP_NAME = "LunLux"` and `APP_TAGLINE` in `lib/research.js`, exported from `lib/visibility.js` (API unchanged otherwise).
  - Downloads are prefixed **`lunlux_`**: `lunlux_<site>_<date>_7day.csv`, `lunlux_<site>_<date>_researcher.json`, `lunlux_<site>_<date>_hourly.csv`, `lunlux_saved-scenarios.json`. CSV headers start with `# app,LunLux — Sunlight and Earth contact for lunar landing sites`, and the JSON downloads carry `app` and `description`.
  - "Lunar Landing Site Navigator" now appears only in the notes saying it was renamed.
- **Lane B:** please rename your visible strings (page title, headings, Credits, footer). `APP_NAME` / `APP_TAGLINE` can be imported from `lib/visibility.js`.
- **Checks:** all nine check scripts and every panel test PASS; `/web` build OK.

### 2026-11-14 — D30 presentation pass: recorded; Lane A panel part DONE
- **D30 recorded in PLAN.md.** Plain-language brief for the shell in **DESIGN.md → "Presentation pass"**: structure items 1–7, the colour table with contrast ratios and a CSS block to paste, the type/spacing scale, and the plain-language rule.
- **Colour roles** (contrast on the card `#132138`):
  - Sun `#F2C14E` gold (9.6:1), Earth `#5AA9E6` blue (6.3:1).
  - Clear `#4FBF7A` solid green (7.0:1); **Partial = the same green as a half-filled outline**, so yellow now only means the Sun; Out `#94A3B8` slate (6.3:1); On the edge `#B48CF0` violet, dashed (6.1:1).
  - Warning `#F28B82` coral, link `#9CC6FF`. Text on the accent is 5.9:1.
- **Panels:**
  - All colours go through private variables that default to these values and still take the shell's `--llp-*`. `THEME` is exported from `web/src/panels/shared.ts`.
  - Tighter card padding (12 × 14 px) and the shared type scale.
  - Prototype/estimate/FLAT tags are no longer yellow.
- **Plain language:**
  - Removed "(getDaily)/(getTimeline)", the API version and the row counts.
  - "hour n of 168" → "day d of 7"; "At hour n of the stay" → "On day d of the stay".
  - The horizon "verified" note now says "Checked by our method tests; not ground truth." The Horizons query string in the side card's sources became "NASA JPL Horizons, the Sun's and Earth's directions as seen from this site".
  - A DOM test scans the side card, grid, Researcher and planner text for lane names, API, function names, file paths and "168 hourly": none found.
- **Short site names:** `shortName` in `data/sites.js` and `listSites()` (Apollo 11, Apollo 12, Apollo 17, Chandrayaan-3, IM-1, IM-2, Cabeus B peak, Haworth, Malapert, Nobile Rim 2). Used in the grid, rankings, requirements, planner and top-site lines; the full name stays in the card and as a tooltip.
- **Grid rows:** TERRAIN tag removed (FLAT would still show if a site lacked terrain); "PAST" → "Historic".
- **Panel interface v1.3:** `level?: "educator" | "researcher"` in the props and `update({ level })`. The side card and the Compare grid's score box follow it and hide their own switches. Researcher (Report) and planner are always full views.
  - **Lane B:** pass `level` from your single header switch when mounting, and call `update({ level })` on every panel when it changes.
- **Bug caught before committing:** the bulk colour replacement had also rewritten the theme definitions into self-references (`--_sun: var(--_sun)`), which would have left the colours undefined. The theme test caught it and it was restored.
- **Checks:** all nine check scripts PASS. Panel tests PASS, including the new v1.3/theme/plain-language test; the original D16 panel test was retired, since the D17 test replaces it. `/web` build OK.

### 2026-11-14 — D31 second presentation pass: recorded; Lane A panel part DONE
- **D31 recorded in PLAN.md.** Lane B brief added to DESIGN.md → "Presentation pass" → "Second pass (D31)": full-screen Tour with the title bottom-left over a gradient, the "Click on the Moon" prompt, the Moon on the starfield opening on the whole Moon turned to the site with a labeled night-side fill light, the ring centred on its pin, one legend-chip style (none on Compare), plain words instead of "MOON-FIXED VIEW" / "no terrain mesh" / raw timestamps.
- **Glass panels:**
  - Every Lane A panel uses `background: rgba(19, 33, 56, 0.90)` with `backdrop-filter: blur(14px)` and no border. **One variable** for the shell: `--llp-glass` (and `--llp-glass-blur`, `--llp-divider`).
  - **Why 0.90:** over pure white behind the glass, every text colour still passes 4.5 : 1 (worst: violet 4.53, slate 4.67, Earth blue 4.71, muted 6.11). At 0.86 violet drops to 3.96 and at 0.78 to 2.99.
- **Accent:** indigo `#4F46B8` for selected controls, distinct from Earth blue `#5AA9E6`; white text on it is 6.45 : 1.
- **Flat sections, no nested boxes:**
  - The side card verdict is a line with a round symbol between thin dividers.
  - The side card score box, the grid's score box and the planner's A/B fieldsets are sections under a divider.
- **Verdicts:** Clear solid green, **Partial hollow green outline**, Out slate grey, On the edge violet with a dashed ring. The DESIGN.md colour list is updated.
- **Dates grid:** full panel width (fixed-width site column, stretching day columns).
- **"Hour by hour" note:** now one line, "Top half: sunlight. Bottom half: Earth in view. Outline: your stay; dashed line: the chosen hour."
- **Checks:** all nine check scripts PASS. Panel tests PASS, with the theme test extended for D31 (hollow Partial, glass + no border + one variable, indigo accent, no nested boxes, full-width grid, one-line note). `/web` build OK.

### 2026-11-14 — D32 two reading levels: Lane A part DONE (panel interface v1.4, API 1.10.0)
**Recorded:** D32 in PLAN.md; DESIGN.md → "Two reading levels (D32)". Brand files `web/public/brand/lunlux-wordmark.png` and `lunlux-icon.png` committed as Sheldon asked (Lane B uses them).

**Educator (seven-year-old bar), all panels follow `level`:**
- Side card: two rings (gold sunshine, blue Earth in sight) in words, a week strip, one verdict sentence, "Now: day N" in one sentence each, the score as one number with the best candidate place, child-level "Why these weights?" and "Why the south pole?". No degrees, coordinates or timestamps outside the "For the teacher" fold-outs, which give the full explanation and one class question.
- Compare: dates grid with child words plus one sentence naming the best week (`getBestWeek`) and a "Pick that day" button. Strip, score box and weights only in Researcher.
- Horizon view: no angle labels; the Sun and Earth in words, with how far away a hiding hill is.
- Planner: hides itself in Educator (its host gets `display: none`), back in Researcher.
- Fourth tab: `mountResearcher` shows **Learn** in Educator (also exported as `mountLearn`) and **Report** in Researcher.

**Learn:** "Your place" rings, then four picture explainers from our data (Malapert ridge 2026-09-19 06:00 UTC, Sun +1.05° behind a ridge 1.84 km east; highest Sun in 30 days Apollo 11 87.8° vs Malapert 5.5°; Apollo 11 sunrise to sunrise 29.58–29.63 days; Earth's small wobble vs the Sun's sweep), plus two NASA photos:
- Apollo 8 Earthrise, credit exactly "Image Credit: NASA", https://www.nasa.gov/image-article/apollo-8-earthrise/ (40 KB).
- Lunar South Pole PIA13523, credit exactly "Credits: NASA/GSFC/Arizona State University", https://science.nasa.gov/photojournal/the-lunar-south-pole (69 KB).
- Skipped: the Apollo 11 surface photo (its NASA page gave no readable credit) and a NASA "Full Moon" image (a rendering whose page could not be verified).

**Report:** charts across 2026–2029 (monthly sunlight and Earth in view; daily score with each lunar eclipse at the site marked and the landing date shown) and two new downloads: this site by month, and all sites × every landing date (14,550 rows).

**/lib (API 1.10.0):** `getBestWeek(siteId, startDate, days)`, `getSiteSeries(siteId)`, `getAllSitesTable()`; `TOUR_STOPS[i].kidTitle` / `.kidText` (no digits or degrees, at most two sentences of ≤ 16 words; same facts and sources as the Researcher captions).

**Notes for Lane B:**
1. Label the fourth tab by mode: **Learn** (Educator) / **Report** (Researcher). Pass `level` to `mountResearcher` as for the other panels (`update({ level })` switches it).
2. Heading font: set `--llp-heading-font` once (e.g. `"Urbanist", system-ui, sans-serif`) on a parent of the panels; panel `h2`/`h3`/`h4` use it. `@fontsource/urbanist` reports licence OFL-1.1, version 5.3.0 (npm metadata).
3. Pass `level` to `mountPlanner` too; it hides itself in Educator. If its container has a shell heading, hide that as well.
4. Tour captions: show `kidTitle` / `kidText` in Educator and `title` / `text` in Researcher; sources are the same.
5. Brand (D32): `web/public/brand/lunlux-wordmark.png` replaces the text title in the header and on the Tour; `lunlux-icon.png` is the tab icon.

**Checks:** all ten scripts PASS (new `check_d32`: kid captions, best week = highest score, series = hourly recount, every Malapert eclipse on NASA's list, all-sites table, Learn facts, brand and photo files). Panel tests PASS, with the new D32 test: no degrees in Educator text, sentences ≤ 20 words, rings and strip equal the data, best week, planner hidden, exact photo credits, charts, all-sites CSV. Older tests were updated where they checked the old Educator wording, and the stale flat-horizon wording test was retired. `cd web && npm run build` OK.


### 2026-11-14 — Lane B D32 item 1: brand assets
- Re-read PLAN.md D32, DESIGN.md D32 and the STATUS.md live board before editing.
- Header and Tour use the committed LunLux wordmark with `alt="LunLux"`; the browser icon is `/brand/lunlux-icon.png`.
- Build status: pending Vercel verification on this source commit; next task is self-hosted Urbanist only after a successful deployment.

### 2026-11-14 — Lane B D32 item 2: Urbanist heading font
- Item 1 Vercel deployment `dpl_Cw2kQfLQwcuDZJMUbA8kkHBjVGgk` READY for `fd60ce0`.
- Added self-hosted Urbanist 400/600 via `@fontsource/urbanist` 5.3.0 and the shared `--llp-heading-font` variable; heading-only CSS leaves body copy and numbers unchanged.
- Checked the font license against Fontsource and npm: **SIL OFL 1.1**, copyright 2021 The Urbanist Project Authors. Credits link to the notice and license.
- Build status for item 2: pending Vercel verification before tab-label work.

### 2026-11-14 — Lane B D32 item 3: mode labels and panel level
- Item 2 Vercel deployment `dpl_36HTm3YaHocjrNjupyQwSN1dQWme` READY for `84d3d53`.
- Fourth tab is **Learn** in Educator, **Report** in Researcher; the tab's accessible label updates too.
- Confirmed `currentPanelProps()` passes `level` at mount for side card, Compare, Horizon, Learn/Report and Planner; `updatePanel` passes `level` for all, and switch calls `panel.update({level})`. The planner shell stays hidden in Educator.
- Build status for item 3: pending Vercel verification before adapting the Tour captions.

### 2026-11-14 — Lane B D32 item 4: reading-level Tour captions
- Item 3 Vercel deployment `dpl_CXSAvsohuJsW1uikt1UHdLrG1Gnx` READY for `9ff744b`.
- At each incoming simulator stop, Educator shows `kidTitle` / `kidText` and Researcher shows `title` / `text` from Lane A's `/lib` constants; original NASA/JPL source links remain.
- Changing the reading level while a stop is visible refreshes that caption in place; returning to Tour or restarting clears the previous stop.
- Build status for item 4: pending Vercel verification before shell copy revisions.

### 2026-11-14 — Lane B D32 item 5: seven-year-old shell copy
- Item 4 Vercel deployment `dpl_8QDyFagztSdAi5kw9McyRDsbamb1` READY for `2a90045`.
- Educator Tour instructions, navigation, toolbar, day/hour display, site picker groups, view controls, verdict legend, tooltips and footer now use short everyday words and avoid raw timestamps and degree labels. Researcher retains its original labels and UTC clock.
- Detailed Tour sources and original Credits references/license notices remain accessible under `For the teacher` in Educator; Researcher retains full sources.
- Build status for item 5: pending Vercel verification before marking D32 complete.

### 2026-11-14 — Lane B D32 item 5: TypeScript build fix
- Vercel build `dpl_AgbA6HgD7Q18uUpEzxZ9uvEgkagy` for `0af465b` reported TypeScript TS2488: NodeList is not iterable under the app's compiler settings.
- Changed the Educator tip loop to iterate over `Array.from(querySelectorAll(...))`. No functionality or scope change.
- Awaiting new Vercel build check; item 5 not yet marked passed.

### 2026-11-15 — Lane B D32 closure and repository status reconciliation (Advik request)
- Re-read PLAN.md (D32), DESIGN.md (D32), STATUS.md and latest `main` commit before updating this row; no newer Lane A changes found (main was `d0ef0f6`). This is a **status-only documentation update explicitly requested by Advik**, an exception to the usual rule to fold status updates into code commits.
- **D32 Lane B 1–5 complete**, in order: (1) wordmark in header and Tour plus favicon (`fd60ce0`); (2) self-hosted Urbanist headings, shared `--llp-heading-font`, OFL-1.1 credited (`84d3d53`); (3) Learn/Report label by reading level and `level` passed to every mounted panel, Planner hidden for Educator (`9ff744b`); (4) `kidTitle`/`kidText` for Educator and original Tour text for Researcher, including switching while a stop is visible (`2a90045`); (5) seven-year-old-level shell copy with detailed text in teacher fold-outs (`0af465b`, corrected for TS2488 by `d0ef0f6`). No extra feature work authorized.
- **Build evidence:** Vercel production builds READY for `fd60ce0` (`dpl_Cw2kQfLQwcuDZJMUbA8kkHBjVGgk`), `84d3d53` (`dpl_36HTm3YaHocjrNjupyQwSN1dQWme`), `9ff744b` (`dpl_CXSAvsohuJsW1uikt1UHdLrG1Gnx`) and `2a90045` (`dpl_8QDyFagztSdAi5kw9McyRDsbamb1`). Item 5 first failed TypeScript TS2488 at `0af465b` (`dpl_AgbA6HgD7Q18uUpEzxZ9uvEgkagy`), then passed at `d0ef0f6` (`dpl_uZtuVD3FCQfiGnoD24p6hPEyYJSe`, READY, rechecked 2026-11-15). Public deployment: https://lunar-landing-hackathon-e3hdyh643-usmdo-club.vercel.app/.
- **Evidence scope:** production build success verified, but no independent in-browser visual/interaction smoke test or seven-year-old human readability review performed in this pass; do not label those PASS. Lane A's D32 panel tests were reported passed in its own notes; no Lane A code or status edited.
- **Next dependency:** Advik/Sheldon visually review Educator and Researcher flows and record any findings. Signed step 4/7 acceptance flags and other open human-review items remain as written; stop here, no features beyond D32.

## 2026-11-15 — Lane B production audit (partial; no feature sign-off)
- Requested comprehensive feature/error/visual audit. Checked current PLAN.md v2, STATUS.md, GitHub main tree (514dc4a), and Vercel production deployment dpl_Fwiye1LkRezh9nLYZke8wx2hbxNM (READY, same SHA).
- Production HTTP checks: root HTML 200 with LunLux title, description, icon reference; referenced JS and CSS 200; wordmark PNG and icon PNG 200; /data/daily.json 200. These are **asset/transport checks**, not interactive feature passes.
- /panels.html returned 404 at production root; likely development-only preview; confirm whether it is meant to be public before treating as defect.
- Important verification gap: no browser-driven click/drag/scroll/screenshot session available in this audit. Tour controls/audio/captions, Explore globe/markers/lighting, shared clock, Compare, Planner, Learn/Report, Educator/Researcher mode, downloads, scientific calculations, accessibility, and visual contrast remain **UNVERIFIED**, not failed or passed.
- Recommendations (not approved changes): visually test all tabs in both reading modes; check Tour overlay legibility and discoverability of Moon click; verify consistent glass contrast and distinct blue roles; confirm selected pin ring alignment; check loading/error/empty states and data provenance; test keyboard navigation, reduced motion, sound-off default, and every download. Preserve D7 desktop-only scope and D32 seven-year-old Educator copy.
- No application source files modified; next action is a real browser interaction/screenshot audit and prioritized defect fixes, coordinated across Lane A/B. Do not claim comprehensive QA completion.

### 2026-11-15 — D33 final cleanup, Lane A items 1–5 DONE (item 6 next)
**Recorded:** D33 in PLAN.md and DESIGN.md → "Final cleanup (D33)".
1. **Text:** no PROTOTYPE tags in any panel or /lib string; `prototype: true` in ranking/score objects is now `teamFormula: true`. New `SCORE_OWN_FORMULA` (exported from `lib/visibility.js`): "The Sun and Earth score is this team's own formula, not a NASA standard." It appears once in each Researcher score section (side card, Compare score box, Report). No middle-dot separators remain in the panels or /lib (the score formula now uses ×).
2. **Symbols:** verdict and legend symbols are inline SVG icons (`verdictIcon`, `markIcon` in `web/src/panels/shared.ts`), with word labels kept. No ✓ ◐ ✕ ⚠ glyphs are drawn by the panels any more.
3. **Learn:** diagrams capped at 560 px; in-diagram captions moved into one-line legends below each diagram (no overlaps); one divider per section; legend items never wrap mid-label.
4. **Educator:** "Why these weights?" is now "Why this score?" in six short sentences ("Sunshine counts the most, because the lander needs power." … "Our team made these rules. They are not NASA rules."); the full text is in the teacher note. Researcher keeps "Why these weights?".
5. **README** rewritten to match the site (four tabs, both levels, real lighting); new "AI use" section; "Third-party resources" lists every data source, image, library, font, the forked simulator and its textures, hosting and test-only tools.

**Notes for Lane B (D33):**
- **Fonts, licences checked from the npm tarballs:** `@fontsource/source-serif-4` 5.3.1 ships `LICENSE` = SIL Open Font License 1.1. `computer-modern` 0.1.3 is marked MIT on npm, but that covers only the packaging; the fonts ship `OFL.txt` (SIL OFL 1.1, Reserved Font Name "Computer Modern Unicode fonts"; using them unmodified is fine). Its CSS for headings is `computer-modern/cmu-serif.css` (family "CMU Serif").
- Panels inherit body text from the page (Source Serif 4) and take headings from `--llp-heading-font`: set it to `"CMU Serif", serif`. Panels name no other font.
- Add `SCORE_OWN_FORMULA` (one sentence) to Data and methods.
- Middle dots still in Lane B files: `web/src/main.ts` lines ~92, 104, 149, 348, 428, 450, 471, 472; `web/src/educatorCopy.ts` 66; `web/src/overview.ts` 112–114.

**Checks:** all ten scripts PASS; panel tests PASS (the D33 test adds: no PROTOTYPE or middle dots on any Researcher panel, the own-formula sentence in each score section, SVG icons only, the Learn layout rules). `cd web && npm run build` OK (after `npm ci` picked up Lane B's new font package).

