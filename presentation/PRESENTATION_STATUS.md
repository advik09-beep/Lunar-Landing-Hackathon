# LunLux presentation — shared board
**2026-11-15 — Official working slide deck; changes required before final approval**

**Designated by Advik:** the deck in `presentation/` is the **official LunLux slides (working version)**. Local-only preview: `http://127.0.0.1:5179/`. This is not a public GitHub or Vercel link; it works only where the local dev server is running. **Do not call the slides final or submission-ready:** user requests revisions; scientific review, build verification, and both humans' final sign-off remain pending.

| Who | Focus | Status |
|---|---|---|
| Advik + ChatGPT | Story, visual language, animations | Initial draft committed |
| Sheldon + Claude | Science, sourcing and validation | Awaiting review |
| Both human contributors | Narrative, slide timing, final submission | Approval pending |

**Agreed format:** web-based presentation with animations, potentially embedded live LunLux demo.

**Initial work:** Reveal.js 6 + Vite standalone `presentation/`, split slide modules, original animated CSS artwork, accessible external demo links, speaker notes.

**Build verification: READY.** A standalone Vercel project `lunlux-presentation` deployed commit `e724eb9` as `dpl_81ud6LDKwLiu3jEwYq4B6gPcWxaV`. Homepage, all six shots and team wordmark returned 200. Browser layout/interaction review remains separate; no iframe is embedded. Vercel SSO currently protects the deployment.

**Next for humans (outside this stopped five-item pass):** review the actual slide layout and transitions, the seventh-slide links, and the remaining scientific claims; both humans approve final presentation. No further work automatically started.

**Rights:** Do not copy the Tour simulator or outside texture assets into slides pending documented sign-off. Both humans' NASA licensing approvals in the current PLAN/STATUS govern any future borrowed assets.


### 2026-11-15 — Seven-slide final requested deck rework and PDF verification

**Status: presentation source and PDF export complete; human visual/scientific sign-off still pending.** Deck rework source commit: [798d6cd](https://github.com/advik09-beep/Lunar-Landing-Hackathon/commit/798d6cd8f36f976643559f717a7bb5b4fc242619). Seven-page PDF commit: [64cb167](https://github.com/advik09-beep/Lunar-Landing-Hackathon/commit/64cb167eb1dc748c548ed5db0b6b9249a57054f6). File: [LunLux-demo.pdf](./LunLux-demo.pdf).

- Official deck remains **exactly seven slides**: (1) cover, (2) sunlight problem, (3) Lane A evidence, (4) workflow, (5) two audiences, (6) victory and challenge, (7) live demo.
- Cover uses screenshot 00 as a dimmed and cropped background, actual LunLux wordmark, team name, Sheldon Spence and Advik Chaudhary, NASA Space Apps Challenge 2026, and Solar System Scope CC BY 4.0 image credit. Slide 2 uses 01; 4 uses 04; 5 shows 02 and 03 side by side; 7 uses 05 and links to the deployed site and GitHub source.
- Site-matched dark starfield, translucent glass, indigo action buttons, gold Sun, blue Earth, CMU Serif headings and Source Serif body. Cross-fade transitions are approximately 0.33 seconds. Fragment/reveal animations are disabled so the printed PDF has no extra pages.
- Lane A's three evidence figures and their wording remain unchanged: **7 / 7**, **9 / 10**, **1.84 km**. No internal process notes or middle-dot separators in displayed slide copy. Slide 6 closing line is positioned separately above the footer.
- **Verification:** `npm run build` passed. The printed Reveal.js deck loaded its screenshot/wordmark images with no page errors or failed HTTP responses in the browser. Chromium print-to-PDF produced `presentation/LunLux-demo.pdf`; `pdfinfo` confirmed **7 pages** (16:9 landscape). An independent GitHub Actions export also passed the seven-page check and committed the PDF. The PDF text extraction confirms the cover credit, three numbers, and closing line.
- **Pending outside scope:** human visual approval of every slide, scientific approval from Sheldon/Claude, and public-sharing review of the Vercel presentation deployment. A successful export is not a declaration of final competition submission approval.

### 2026-11-15 — Requested seven-slide screenshot pass
- Exactly seven sections remain: cover, problem, validated evidence, workflow, two audiences, reflection, live demo.
- 00 cover image with dark overlay, actual LunLux wordmark and both credited names; Solar System Scope CC BY 4.0 credit on cover.
- 01 problem; 04 workflow; 02 Educator and 03 Researcher side by side; 05 demo.
- Removed internal process status from displayed demo slide; technical evidence slide remains Claude's verified 7/7, 9/10 and Malapert ridge numbers.
- Slide 6 reflection closing phrase moved above the footer. Speaker-only notes remain outside displayed slide content.
- Awaiting independent presentation build and visual review; screenshots are project-owned app captures, 00 displays CC BY planet imagery with explicit source credit.

### 2026-11-15 — Build and asset verification
- Seven slides counted from the three source modules: 4 narrative, 2 science, 1 live demo.
- Separate Vercel project: `lunlux-presentation`, root directory `presentation/`, Vite build `npm run build`, build output `dist`.
- Git SHA `e724eb9` -> production deploy `dpl_81ud6LDKwLiu3jEwYq4B6gPcWxaV` **READY** with successful Vite build logs.
- On the deployment, HTTP 200 for HTML, `/shots/00-cover-tour.png` through `/shots/05-report-researcher.png`, and `/brand/lunlux-wordmark.png`.
- Production domain: `https://lunlux-presentation-lunlux.vercel.app/` (currently protected by Vercel Authentication; not yet a public presentation submission link).
- No browser visual verification of screenshot fit or slide 6 footer; no claim of full functionality or public shareability yet.
