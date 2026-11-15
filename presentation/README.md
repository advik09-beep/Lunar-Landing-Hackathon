# LunLux — animated web presentation

A standalone Reveal.js + Vite presentation. This is a **collaborative draft**, separate from production LunLux (`web/`).

**Development:** `cd presentation && npm install && npm run dev`.

**Build:** `cd presentation && npm run build`.

**Deployment:** create a **separate Vercel project** connected to the same GitHub repository, with Root Directory `presentation/`. Do not alter the existing LunLux Vercel project. No deploy/build/browser verification is claimed for this initial scaffold.

## Collaboration contract
- Advik and ChatGPT lead `src/slides/story.js` (narrative) and `src/style.css` (presentation design).
- Sheldon and Claude lead `src/slides/science.js` (methods, verified numbers, citations).
- `src/slides/demo.js` and `PRESENTATION_STATUS.md` are shared. Agree before modifying shared files.
- Each agent must read current `../PLAN.md`, `../STATUS.md`, this README, and presentation status before working. Check latest commits; use small commits and branches when overlapping edits.
- Both humans approve slide claims, narrative, visuals and final delivery. Neither assistant modifies production `web/`, `lib/`, `data/`, `scripts/` from this presentation workflow.

## Demo and licensing
Demo slide uses **two external links**: identical Malapert site/date/hour, Educator then Researcher. Embedding the live application is an optional later improvement. Before adding an iframe or screenshots, verify frame policy, fallback behavior and permitted media usage. The Tour simulator's third-party textures are subject to `../THIRD_PARTY_LICENSE_AUDIT.md`; do not copy those assets.

The artwork in this draft is original CSS. Reveal.js is MIT licensed; the bundled fonts use their own OFL notices. Future media must be individually documented.

## Initial story (proposed)
1. The question
2. The sunlight/Earth/terrain problem
3. NASA/JPL Horizons and LOLA evidence
4. Select, evaluate, compare
5. Educator vs Researcher
6. Victory and challenge
7. Live demo

Speaker notes are in each slide's `aside.notes`; Reveal.js supports the presentation with keyboard navigation, URL hashes and speaker notes. This sequence and duration need human review.
