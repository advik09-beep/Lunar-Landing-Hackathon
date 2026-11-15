# LunLux — animated web presentation

A standalone Reveal.js + Vite presentation. **This is the official LunLux presentation working deck, designated by Advik; it still needs changes and has not received final approval.** It is separate from production LunLux (`web/`).

**Local preview link (on the computer running Vite only):** `http://127.0.0.1:5179/`. This is a loopback address, **not a public URL**; opening it on GitHub or another person's device will not show the slides unless that device is running the presentation server on port 5179. GitHub source: `presentation/index.html`. The separately deployed presentation is `https://lunlux-presentation-lunlux.vercel.app/` (currently protected by Vercel Authentication; access is not yet publicly verified).

**Development:** `cd presentation && npm install && npm run dev`.

**Build:** `cd presentation && npm run build`.

**Deployment:** separate Vercel project `lunlux-presentation` connected to this GitHub repo, Root Directory `presentation/`, Vite build output `dist/`. The deployed build is READY and screenshot/wordmark URLs returned 200; browser visual QA is still pending. Production LunLux app deployment remains a different Vercel project.

## Collaboration contract
- Advik and ChatGPT lead `src/slides/story.js` (narrative) and `src/style.css` (presentation design).
- Sheldon and Claude lead `src/slides/science.js` (methods, verified numbers, citations).
- `src/slides/demo.js` and `PRESENTATION_STATUS.md` are shared. Agree before modifying shared files.
- Each agent must read current `../PLAN.md`, `../STATUS.md`, this README, and presentation status before working. Check latest commits; use small commits and branches when overlapping edits.
- Both humans approve slide claims, narrative, visuals and final delivery. Neither assistant modifies production `web/`, `lib/`, `data/`, `scripts/` from this presentation workflow.

## Demo and licensing
Demo slide uses **two external links**: identical Malapert site/date/hour, Educator then Researcher. Embedding the live application is an optional later improvement. Before adding an iframe or new screenshots, verify frame policy, fallback behavior and permitted media usage. The supplied cover screenshot shows Solar System Scope CC BY 4.0 planet images and is credited on the cover; all six removed disputed textures are absent from the current simulator fork. The remaining third-party rights questions are recorded in `../THIRD_PARTY_LICENSE_AUDIT.md`.

The deck uses the team's LunLux screenshots and wordmark plus the credited Solar System Scope planet imagery visible in the cover screenshot. Reveal.js is MIT licensed; the bundled fonts use their own OFL notices. Future media must be individually documented.

## Initial story (proposed)
1. The question
2. The sunlight/Earth/terrain problem
3. NASA/JPL Horizons and LOLA evidence
4. Select, evaluate, compare
5. Educator vs Researcher
6. Victory and challenge
7. Live demo

Speaker notes are in each slide's `aside.notes`; Reveal.js supports the presentation with keyboard navigation, URL hashes and speaker notes. This sequence and duration need human review.
