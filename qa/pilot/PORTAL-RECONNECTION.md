# Local portal correction, awaiting review

Base: `a8aacb78e1df8b357c3d51e4453bc76bdd108161`.

This candidate has not been pushed or published. No production account, membership, rules, booking or billing changes were made by this correction.

## Implemented

- Patient portal: private follow-up ticket, live status stages, assigned turn, request history and existing synthetic booking form.
- Reception portal: queue workspace, summary counts, search/filter and existing authorized confirmation, arrival, cancellation and no-show transitions.
- Doctor portal: queue, current consultation and existing authorized call/finish transitions.
- Three entry destinations request a route only. Authenticated server membership decides access. Wrong-role requests show a denial with the authorized destination instead of rendering the requested workspace.
- Staff entry has no self-registration or role selector. New accounts remain patients. No new role-grant mechanism exists.
- Membership lookup requires the server. Initial membership/data failures do not render an empty-but-apparently-successful workspace. Logout and account changes clear visible records.
- One existing booking source serves every portal. No independent local queue, fake login, preset clinical data, legacy audio, ambient UI or billing action was re-enabled.
- Clinical files, notes, prescriptions and payments are explicitly unavailable. The disabled optional-note drawer is hidden in the secure pilot.
- Existing visual language, supplied illustrations, IBM Plex Arabic weights and light/dark themes remain. Mobile theme controls sit in the header, clear of operational buttons.

## Verification

On November 22, 2026:

- TypeScript check passed.
- 40 pure membership/destination matrix assertions passed.
- 64 application checks passed with Firebase Auth and Firestore emulators. They include forged URLs, direct unauthorized actions, self-grant denial, patient isolation, cross-session realtime transitions, server role removal on reload, account switching, offline pending writes, exactly-once submission after reconnect, rejected writes without false success, mobile overflow, header control placement, themes and no browser runtime errors.
- All 41 existing backend-rules checks passed. Rules were not changed.
- 31 built-output checks passed: current and retained assets, no emulator/test identities in the production bundle, staff login entry, failed-entry/CSS recovery and retry, previous published HTML compatibility, no external requests and no runtime errors.
- Runtime inventory excluded the old App, audio worker, ONNX, transformers, gRPC, protobuf and sharp from the secure-pilot runtime.
- Actual desktop/mobile and light/dark screenshots were visually inspected. Final settled mobile staff-login screenshot was also inspected.

## Loading comparison

One local, compressed-transfer comparison at 400 kbit/s download, 400 ms latency and 4x CPU throttle:

| Build | Startup visible | Main interface visible | Fonts ready |
| --- | ---: | ---: | ---: |
| Candidate | 0.54 s | 8.49 s | 14.77 s |
| Previously published | 0.56 s | 8.73 s | 13.07 s |

This is a simulated local comparison, not evidence of performance on the owner's phone. Font completion was about 1.7 seconds later in this single candidate run; the visible interface was not later. No general speed guarantee is made.

## Limits and next gate

The work remains a synthetic-data booking pilot, not a clinic-ready medical system. No live staff roles were inspected, created or assigned. Google popup authentication was not exercised in these isolated checks. Existing production auth configuration and database rules are unchanged. Production deployment and live post-publication checks require separate approval. Do not describe these local screens as already available on the live site.

## Repeat locally

Install the project's dependencies and `qa/pilot` dependencies, provide Java 21+, and Chromium at `CHROME_PATH` or `/usr/bin/google-chrome`.

- `npm run lint`
- `npm run test:access --prefix qa/pilot`
- `npm run test:app --prefix qa/pilot`
- `npm run test:rules --prefix qa/pilot`
- `npm run build:pages`
- `npm run test:built --prefix qa/pilot`
- `VITE_SECURE_PILOT=true VITE_PILOT_EMULATOR=false node qa/pilot/analyze-build.mjs`

`build:pages` produces local deployment artifacts. It does not publish. Preserve the current plus retained secure asset groups. Rollback is the base revision above.
