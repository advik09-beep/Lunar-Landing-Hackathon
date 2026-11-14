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

### OzAILabs overview embedding

The approved first Overview is [OzAILabs/SolarSystemSimulator](https://github.com/OzAILabs/SolarSystemSimulator),
**forked under the project owner's GitHub account and separately deployed**.
The upstream README states MIT licensing; it also credits textures from
Solar System Scope (CC BY 4.0), Planet Pixel Emporium, USGS Astrogeology,
and Steve Albers. Verify source-specific attribution when deploying the fork.

1. Fork the upstream GitHub repository under `advik09-beep`.
2. Import the fork as a **separate Vercel project** in USMDO Club; use Vite's
   normal `npm install`, `npm run build`, and `dist` output. The upstream
   repo currently includes `public/textures` and `public/ephemeris` assets.
3. After confirming its public HTTPS link loads, set
   `VITE_SOLAR_OVERVIEW_URL=https://<your-public-simulator-domain>` in the
   **main** lunar-landing-hackathon Vercel project's Production environment,
   then redeploy the main project (Vite injects the value at build time).
4. Verify the Overview iframe is functional, accessible without login, and
   that its interactive controls work inside a frame. The embedded simulator
   shows the **whole solar system**, and its time controls are **not synchronized**
   with the Moon landing date or hour. The "Explore" exit goes to our verified
   Moon-fixed view without changing shared selection.

Until the fork deployment URL is configured, the previous functional
three-body Overview is retained as a fallback. No arbitrary, invented,
or private external URL is embedded.
