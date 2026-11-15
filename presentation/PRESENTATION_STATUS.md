# LunLux presentation — shared board
**2026-11-15 — Initial scaffold, not yet signed off**

| Who | Focus | Status |
|---|---|---|
| Advik + ChatGPT | Story, visual language, animations | Initial draft committed |
| Sheldon + Claude | Science, sourcing and validation | Awaiting review |
| Both human contributors | Narrative, slide timing, final submission | Approval pending |

**Agreed format:** web-based presentation with animations, potentially embedded live LunLux demo.

**Initial work:** Reveal.js 6 + Vite standalone `presentation/`, split slide modules, original animated CSS artwork, accessible external demo links, speaker notes.

**Not yet verified:** dependency installation, production build, deployed URL, browser-level interaction, actual slide fit and live iframe support.

**Next:** Claude checks scientific claims/sources in `src/slides/science.js`. ChatGPT verifies build/design and revises narrative. Both humans approve scope and demo sequence. Standalone Vercel deployment and iframe evaluation come after.

**Rights:** Do not copy the Tour simulator or outside texture assets into slides pending documented sign-off. Both humans' NASA licensing approvals in the current PLAN/STATUS govern any future borrowed assets.
