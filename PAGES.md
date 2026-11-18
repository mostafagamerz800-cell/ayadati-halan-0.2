# GitHub Pages build

Pages serves the repo root of `main`, so the root `index.html` must be the built page.
The original Vite entry is `index.source.html`.

- Publish: `npm install --legacy-peer-deps && npm run build:pages`, then commit `index.html` and `assets/`.
- Dev / AI Studio: `npm run dev` restores the source `index.html` first (predev). `npm run build` does the same (prebuild).
- Edit `index.source.html`, never the built `index.html`.
- Static front end only. `server.ts` (WhatsApp webhook, /api routes) does not run on GitHub Pages.

The approved clinic UI preview uses self-hosted Cairo font files in public/fonts. The Pages script embeds those fonts into the built CSS so the published preview does not depend on an external font host or a second font-copy step.
