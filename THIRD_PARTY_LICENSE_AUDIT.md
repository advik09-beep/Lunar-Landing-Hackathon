# LunLux third-party licensing audit — 2026-11-15

## Current summary (2026-11-15)

- **Removed:** six simulator textures with unconfirmed reuse terms (Pluto, Europa, Io, Ganymede, Callisto, Titan), in fork commit [aa00c53](https://github.com/advik09-beep/SolarSystemSimulator/commit/aa00c533d27eef482f589cd63d47d415159af599).
- **Kept:** twelve Solar System Scope textures, under CC BY 4.0 and credited.
- **Stars:** from Bretton Wade's conversion of the Yale Bright Star Catalog (MIT).
- **Asteroid and ephemeris data:** generated from NASA JPL SBDB and Horizons.
- **Music:** CC BY 4.0, credited.
- **Remaining caveat:** the upstream simulator's README says MIT, but it has no separate licence file.

The sections below are the working record that led to this summary.

## Follow-up source and permissions review — 2026-11-15 (latest finding)

**The earlier blanket "unknown stars/asteroids/ephemerides" warning is now narrowed.**
Repository source inspection identified the actual generation scripts, input URLs,
and shipped cache metadata in the separately deployed simulator fork:

| Shipped item | Source found | Evidence and license/terms assessment |
|---|---|---|
| `public/data/stars.json` | Yale Bright Star Catalog (v5), `bsc5-short.json` conversion published at [brettonw/YaleBrightStarCatalog](https://github.com/brettonw/YaleBrightStarCatalog); script `scripts/build-stars.js` | [Repository LICENSE](https://github.com/brettonw/YaleBrightStarCatalog/blob/master/LICENSE) is MIT, Copyright (c) 2016 Bretton Wade. Script converts equatorial coordinates into simulation-frame vectors and synthesizes colors. The original Yale catalog is acknowledged; no assertion of ownership over original observations. |
| `public/data/asteroids.bin`, `asteroids.json` | [NASA/JPL Small-Body Database Query API](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html); `scripts/build-asteroids.js` | Asteroid element cache; source API, numerical transforms and `generatedAt` appear in code/metadata. NASA/JPL data origin verified at source-code level, **not** independently re-downloaded or byte-for-byte reproduced. |
| `public/ephemeris/*.bin`, `index.json` | [NASA/JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html); `scripts/generate-horizons-cache.js` | 28 body/spacecraft vector cache 2020–2035, with `generatedAt` and body-specific sampling metadata. Source and generation method identified, **not** a byte-for-byte regenerated cache check. |
| `public/textures/` (12 remaining) | [Solar System Scope texture pack](https://www.solarsystemscope.com/textures/) | Publisher expressly allows sharing, adapting and commercial use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); link, creator credit and change-context statement already included in the fork's `NOTICE`. **CC BY is not an OSI-approved software license**; 2026 Space Apps rules explicitly mention OSI for third-party solution materials. This is a competition-interpretation question, not a finding of absent copyright permission. |
| Original simulator software | [OzAILabs/SolarSystemSimulator README](https://github.com/OzAILabs/SolarSystemSimulator) | Upstream explicitly states `## License\n\nMIT`, but no complete standalone grant/copyright notice is in the upstream tree. The fork preserves source/author attribution and this statement. **Permission documentation remains incomplete; do not present the fork as independently relicensed or fully verified.** |

**Concrete documentation fixes completed:** fork `NOTICE`/README and LunLux
`NOTICE`/README now credit the star catalog including MIT copyright/license,
JPL SBDB Query API and JPL Horizons. These changes did not alter binaries,
third-party licensing claims, scientific data or application behavior.

**Rules cross-check:** [2026 NASA Space Apps terms](https://www.spaceappschallenge.org/legal/)
require adequate rights and citations for non-NASA materials and refer to OSI
for open source. A [2026 Space Apps Navigator clarification](https://github.com/nasa/spaceapps/discussions/1947)
indicates licensed stock music may be used where the license allows the public
submission; this is consistent with the already credited Scott Buckley
`Borealis` CC BY 4.0 music, but does not conclusively decide the OSI-language
question for all Creative Commons imagery.

**Still requires definitive resolution or explicit risk acceptance:**
1. Obtain the upstream simulator rights-holder's complete MIT license/copyright
   grant or a written reuse confirmation, *or replace/remove the embedded
   simulator rather than claiming its software license is verified*.
2. For NASA's unusually strict third-party OSI language, obtain event guidance
   for CC BY 4.0 textures if required; the publisher's own reuse license is
   explicit and attribution is present, but it is not an OSI software license.
3. Five old upstream showcase screenshots in the simulator fork's
   `docs/screenshots/` and their README display references were removed
   (fork commits `15ea9ac` and `80a1383` through `dc804ff`) to eliminate
   unverified legacy imagery. This is not an audit of every possible
   non-screenshot asset, and no final legal/permission sign-off is claimed.

**Current status:** see "Current summary" at the top of this file.

## D34 texture remediation update — 2026-11-15 (supersedes historical texture findings below)

**Six texture issues resolved in the current fork, NOT overall licensing clearance.** The inventory below documents the original 18 upstream textures; only the 12 Solar System Scope CC BY 4.0 textures remain in `advik09-beep/SolarSystemSimulator` on `master`. Commit [aa00c53](https://github.com/advik09-beep/SolarSystemSimulator/commit/aa00c533d27eef482f589cd63d47d415159af599) deleted `pluto.jpg`, `europa.png`, `io.jpg`, `ganymede.jpg`, `callisto.jpg`, and `titan.jpg` and set the corresponding default scene templates to `texturePath: null`. Follow-up commit [bc1c78f](https://github.com/advik09-beep/SolarSystemSimulator/commit/bc1c78f0a2c5ae9d524f647e18b378b628b956f8) set the six remaining real-time mode templates in `src/data/realTimeOrbits.ts` to `texturePath: null`; the texture downloader no longer includes the six filenames. Pluto, Io, Europa, Ganymede, Callisto and Titan remain orbiting plain-colored spheres, not removed bodies.

**Build and delivery evidence:** the corrected simulator fork Vercel deployment `dpl_8D4GRP7Az5cnvF2CWAKAtmGCUooD` is READY. All six removed `/textures/...` URLs return HTTP 404 on that deployment; `/textures/earth_day.jpg` returns HTTP 200 as a control. The current code's two body template sets no longer reference the six deleted file paths; a live browser network trace has not been run. Older immutable builds may still serve historic assets, and are not claimed purged.

**Still open (no wider audit conducted here):** the upstream simulator's incomplete MIT grant/copyright notice; attribution, permitted use and change notices for 12 retained Solar System Scope CC BY 4.0 maps; separate review of stars, asteroids, ephemerides, screenshots/other shipped content if required; accuracy of the simulator's own credit notices and final submitted media; and final human browser/rights sign-off. PLAN D34 approved Apache-2.0 for *original LunLux team code and text* and root LICENSE/NOTICE exist, but do not relicense the simulator.

**Status of historical release gates below:** 1 team-license gate DONE; 2 upstream permission OPEN; 3 six-texture removal DONE for current fork; 4 retained CC BY terms OPEN; 5 four USGS map *use* resolved by removal, other data provenance OPEN; 6 submission/simulator notices PARTIAL; 7 six live paths checked but full browser/video QA OPEN; 8 final human release sign-off OPEN. Legacy statements below describing Pluto/Europa/USGS textures as *present* or the team's Apache choice as *only proposed* are historical, not current status.


**Status:** see "Current summary" at the top of this file. (Historical inventory below.)

## Scope and evidence

- Audited `OzAILabs/SolarSystemSimulator` and our fork `advik09-beep/SolarSystemSimulator`, both on default branch `master`. Both trees contained the same 18 `public/textures/` filenames, `scripts/download-textures.js`, a `README.md`, 28 binary ephemeris files and two asteroid-data files. Neither tree contained a root `LICENSE` or `COPYING` file; GitHub repository metadata returned `license: null`.
- The upstream README ends with `## License\n\nMIT`. **This is a stated license intention, but no complete MIT grant or copyright notice was found.** The absence of a standalone file is not definitive proof of no license; obtain upstream confirmation or a complete permission grant before treating the code as safely reusable under MIT. Our fork cannot unilaterally relicense upstream code.
- Texture mapping below is directly from upstream `scripts/download-textures.js`; it identifies the intended download source, **not a verified byte-level match or proof of rights in the committed binaries**. The fork's texture files appear by path and size in the Git tree, but no hashes or image provenance were compared.
- Provider pages checked: Solar System Scope texture license, Planet Pixel Emporium copyright terms, Steve Albers' map page. NASA Space Apps requires source citations and acceptable third-party rights.
- All source pages and conditions should be preserved as submission references; the embedded fork is separately deployed and not bundled into this repository, but the displayed tour remains part of the submitted solution.

## Complete committed simulator texture inventory (18)

| Committed path in simulator fork | Upstream script's provider | Licensing assessment | Script's source filename |
|---|---|---|---|
| `public/textures/sun.jpg` | Solar System Scope | CC BY 4.0 | `2k_sun.jpg` |
| `public/textures/mercury.jpg` | Solar System Scope | CC BY 4.0 | `2k_mercury.jpg` |
| `public/textures/venus.jpg` | Solar System Scope | CC BY 4.0 | `2k_venus_surface.jpg` |
| `public/textures/earth_day.jpg` | Solar System Scope | CC BY 4.0 | `2k_earth_daymap.jpg` |
| `public/textures/earth_night.jpg` | Solar System Scope | CC BY 4.0 | `2k_earth_nightmap.jpg` |
| `public/textures/moon.jpg` | Solar System Scope | CC BY 4.0 | `2k_moon.jpg` |
| `public/textures/mars.jpg` | Solar System Scope | CC BY 4.0 | `2k_mars.jpg` |
| `public/textures/jupiter.jpg` | Solar System Scope | CC BY 4.0 | `2k_jupiter.jpg` |
| `public/textures/saturn.jpg` | Solar System Scope | CC BY 4.0 | `2k_saturn.jpg` |
| `public/textures/saturn_rings.png` | Solar System Scope | CC BY 4.0 | `2k_saturn_ring_alpha.png` |
| `public/textures/uranus.jpg` | Solar System Scope | CC BY 4.0 | `2k_uranus.jpg` |
| `public/textures/neptune.jpg` | Solar System Scope | CC BY 4.0 | `2k_neptune.jpg` |
| `public/textures/pluto.jpg` | Planet Pixel Emporium / James Hastings-Trew | RESTRICTED; not open source | `plutomap2k.jpg` |
| `public/textures/io.jpg` | USGS Astrogeology | USGS-derived; verify product rights | `full.jpg (Io mosaic)` |
| `public/textures/europa.png` | Steve Albers; Bjorn Jonsson; NASA mission images | UNVERIFIED; permission needed | `europa_rgb_cyl_juno.png` |
| `public/textures/ganymede.jpg` | USGS Astrogeology | USGS-derived; verify product rights | `ganymede_voyager_galileossi_global_clrmosaic_1024.jpg` |
| `public/textures/callisto.jpg` | USGS Astrogeology | USGS-derived; verify product rights | `callisto_voyager_galileossi_global_mosaic_1024.jpg` |
| `public/textures/titan.jpg` | USGS Astrogeology | USGS-derived; verify product rights | `titan_iss_p19658_mosaic_global_1024.jpg` |

**Solar System Scope (12 files):** Source page https://www.solarsystemscope.com/textures/ explicitly licenses the texture pack under **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/. Reuse and adaptation are permitted with appropriate credit, license link, and change notice. **CC BY 4.0 is not an OSI-approved software license**; NASA's third-party-material wording should be interpreted carefully. Do not claim these textures are MIT-licensed or public domain. Preserve attribution and confirm NASA accepts CC BY content under the stated third-party requirements.

**Planet Pixel Emporium (1 file):** https://planetpixelemporium.com/planets.html says a simulator/game may use its maps for rendering, **but forbids redistribution of the raw maps in freeware/commercial products or on another website without permission**. The upstream fork publicly stores `pluto.jpg` as a downloadable source asset. This is **not open source and is a concrete submission blocker** under the supplied Space Apps third-party-material rules. Remove/replace with an appropriately reusable texture in the fork, or obtain rights that explicitly meet the event's requirements.

**Steve Albers Europa (1 file):** https://stevealbers.net/albers/sos/sos.html describes a composite involving Bjorn Jonsson's processed imagery, USGS data and Juno images, but no general open-source/redistribution license was established for the specific PNG. **Not cleared**. Replace with a properly licensed NASA/USGS product with verified terms, or obtain express sufficient permission.

**USGS Astrogeology (4 files):** The download script links directly to USGS-hosted mission mosaics. USGS hosting and NASA mission origin do **not alone** establish rights in every processed mosaic; inspect each original dataset/product page for license, acknowledgments, and any third-party contributors. **Provisional pending item-level verification**, especially any author citation requirements. Product landing page: https://astrogeology.usgs.gov/.

## Other simulator content requiring a separate provenance pass

- `public/ephemeris/*.bin` (28 files) and `public/ephemeris/index.json`: index claims NASA/JPL Horizons API; verify generation script, Horizons attribution and any data redistribution conditions. This is not a texture.
- `public/data/asteroids.bin` and `public/data/asteroids.json`: metadata claims NASA/JPL Small-Body Database Query API; verify original source and reproduction procedure.
- `public/data/stars.json`: provenance not established in this audit; inspect `scripts/build-stars.js` and its underlying catalogue/license.
- `docs/screenshots/*.jpg` and other media: inspect whether submitted, displayed, or bundled; screenshots may contain third-party textures. Do not treat their appearance in an open repository as proof of permission.
- The simulator also depends on Three.js, Tweakpane, TypeScript, Vite, and other npm dependencies; retain their license notices and check any copied source separately.

## Open-source licensing decision

**Recommended: Apache License 2.0 for the original LunLux team-created code**, because it is OSI-approved and matches NASA's stated default. This is a **proposal, not an agreement on behalf of both contributors**. Both both leads must explicitly approve the grant of rights in their original contributions before adding a project-wide `LICENSE`. The license must exclude third-party data, NASA imagery, font files, the upstream simulator, and independently licensed textures. Record a third-party NOTICE / attribution file when approved.

A blanket Apache 2.0 license **must not** be placed on the simulator fork as though it owns OzAILabs' original code or third-party textures. The upstream README's one-word `MIT` statement is insufficient to establish complete copyright attribution and license terms without further verification.

## Release gates (all must pass)

1. Obtain co-contributor consent for Apache 2.0 and add root `LICENSE` + clear third-party exclusions.
2. Resolve upstream simulator code permission (complete MIT grant or other explicit authorization); preserve original attribution and license.
3. Replace Pluto and Europa textures in the **simulator fork and live deployment** with confirmed permissible assets, or secure sufficient rights.
4. Confirm CC BY 4.0 texture acceptability under NASA Space Apps third-party requirements; preserve credit, license link and change notices.
5. Verify the four USGS texture records and the stars, asteroids, ephemerides, and other shipped/embedded assets.
6. Ensure README, in-app Data and methods, the simulator's own credits, and NASA submission references enumerate all providers.
7. Inspect live deployment and network asset paths after changes; confirm no disallowed textures are still served. Check the final video separately for rights and identifiable minors.
8. Record test results and both humans' approval in STATUS.md; **do not mark compliance PASS until verified**.

## Source links

- Upstream simulator: https://github.com/OzAILabs/SolarSystemSimulator
- Fork: https://github.com/advik09-beep/SolarSystemSimulator
- Upstream download script: https://github.com/OzAILabs/SolarSystemSimulator/blob/master/scripts/download-textures.js
- Solar System Scope license: https://www.solarsystemscope.com/textures/
- Planet Pixel Emporium copyright: https://planetpixelemporium.com/planets.html
- Steve Albers Europa provenance: https://stevealbers.net/albers/sos/sos.html
- NASA Space Apps terms: https://www.spaceappschallenge.org/legal/

## Coordination handoff — pending sign-off (2026-11-15)

This audit is a **proposed remediation plan**, not a license grant or proof of NASA compliance. See the STATUS.md “ACTION REQUIRED” section for the exact sign-off wording. both leads must separately consent to Apache-2.0 for their original contributions; Claude Code should review scientific-data provenance and Lane A impact. **Do not begin texture replacement or the complete rights audit until both humans approve.** The existing Pluto/Europa files remain unresolved, and a source README saying “MIT” is not a substitute for a verified complete grant.
