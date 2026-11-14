# STATUS — Lunar Landing Site Navigator

PLAN.md v2 is the one plan and wins over this file. This header is the live board; anyone may update their own row.

| Who | Step | Doing now |
|-----|------|-----------|
| Advik + ChatGPT (Lane B) | 1 — IN PROGRESS | Vercel repo connected; verifying build/lockfile in a temporary Node build environment, then desktop production page |
| Sheldon (Lane A human) | — | Step 2 PASSED 2026-11-14; GO given for Lane A's half of step 5 |
| Claude Code (Lane A) | 7 (Lane A, sp_malapert) | Stage 1 reported (product + method); waiting for Sheldon's go on stage 2 |

Step 2 Real numbers: **PASSED 2026-11-14**. Signed 2026-11-14: D7 desktop only; D8 data copied at build + fetched per site, setDataBase added.
Waiting on Sheldon: go on step 7 stage 2 (download + compute the sp_malapert horizon).
Waiting on Advik: step 1 live URL showing the 10 sites in a desktop browser; then Lane B's postbuild copy for step 5 (spec in Lane A section).

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

