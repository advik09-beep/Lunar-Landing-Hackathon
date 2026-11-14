# Lane B — Lunar Landing Site Navigator frontend (M0)

Minimal Vite + TypeScript frontend. All site data comes from the Lane A owned `../lib/visibility.js`; no astronomical or visibility computations exist in this frontend.

## Development

Run from the repository root:

```sh
cd web
npm install
npm run dev
```

Open the URL Vite prints. To check/build:

```sh
npm run typecheck
npm run build
npm run preview
```

The output is `web/dist/`. Configure a static hosting provider with **root directory `web`**, **build command `npm run build`**, and **publish directory `dist`** (relative to that root). `vite.config.ts` uses relative asset paths so the built app can also be served from a repository subpath.

The Vite dev server explicitly allows reading the repository root because `web/src/main.ts` imports `../../lib/visibility.js`, which imports `../data/sites.js`. The production build bundles those dependencies. Do not copy or independently mirror Lane A data into `web`.

## M0 acceptance test (not automatically verified)

- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds.
- [ ] The local browser page loads **10** landing-site names from `listSites()`.
- [ ] The `MOCK` indicator is visible.
- [ ] Public deployed URL works at desktop and mobile widths.

Do not call M0 passed until a live deployment and the checks above are verified. Later 3D features are intentionally **not** included in this M0 task.

## Production deployment and OzAILabs overview (PLAN D14 amendment)

The **main** Vercel project's repository root is `.`, not `web`, because the
frontend imports sibling `/lib` and `/data` files. Current working commands:

- Install: `cd web && npm ci`
- Build: `cd web && npm run build`
- Output directory: `web/dist`

### OzAILabs overview embedding — deployed 2026-11-14

- **Upstream:** [OzAILabs/SolarSystemSimulator](https://github.com/OzAILabs/SolarSystemSimulator)
- **Project fork:** [advik09-beep/SolarSystemSimulator](https://github.com/advik09-beep/SolarSystemSimulator), default branch `master`
- **Separate public Vercel production site:** https://solar-system-simulator-usmdo-club.vercel.app/
- **Vercel project:** `solar-system-simulator` in the USMDO Club team; Vite framework, install `npm install`, build `npm run build`, output `dist`
- **Main app's production build-time env:** `VITE_SOLAR_OVERVIEW_URL=https://solar-system-simulator-usmdo-club.vercel.app/` in `lunar-landing-hackathon`
- **Main app public URL:** https://lunar-landing-hackathon.vercel.app/

The Overview embeds the complete original simulator in a sandboxed HTTPS
iframe. It displays the whole solar system; the simulator's time control is
**not synchronized** with the lunar landing-date/hour controls. The visible
"Explore" button returns to the Moon-fixed scientific explorer without
altering the shared selection. The three-body fallback remains available if
the env value is absent at build time.

Upstream README claims MIT licensing for code. Texture sources include Solar
System Scope (CC BY 4.0), Planet Pixel Emporium, USGS Astrogeology, and Steve
Albers; reuse rights for images are separate from source-code licensing.
The main app credits both the original author/source and our deployed fork.
