# GitHub Pages build

Pages serves the repo root of `main`, so the root `index.html` must be the built page.
The original Vite entry is `index.source.html`.

- Publish: `npm install --legacy-peer-deps && npm run build:pages`, then commit `index.html` and `assets/`.
- Dev / AI Studio: `npm run dev` restores the source `index.html` first (predev). `npm run build` does the same (prebuild).
- Edit `index.source.html`, never the built `index.html`.
- Static front end only. `server.ts` (WhatsApp webhook, /api routes) does not run on GitHub Pages.

The approved clinic UI preview uses self-hosted Cairo font files in public/fonts. The Pages script embeds those fonts into the built CSS so the published preview does not depend on an external font host or a second font-copy step.


## Approved role UI revision, 22 November 2026

Reception and patient views use QClinic-inspired structure, IBM Plex Sans Arabic and the existing cream/forest/gold identity. IBM fonts are embedded in source CSS and the static bundle; the OFL license is in public/fonts/IBM-Plex-Sans-Arabic-OFL.txt.

The booking/queue preview uses fake data and browser-local storage with same-browser tab synchronization. It is not cross-device booking or a production medical system. Do not enter real patient information. The emulator switch is accepted only on localhost. No Firebase rules, project config, billing, or staff provisioning were deployed with this UI publication.

The prior public version is retained in Git history at e7552672aba9c208faa2df9e6c0a9005b1f1e0dc. A rollback should restore that version's built index.html/assets together.
