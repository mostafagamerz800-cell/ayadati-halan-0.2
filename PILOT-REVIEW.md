# Ayadati Halan: Firebase pilot review

Prepared 22 November 2026. Review snapshot, not published.

## Entry and appearance

This is a gated integration in the existing app. Without `VITE_SECURE_PILOT=true`, the default app entry and published design remain unchanged. With that flag enabled, sign-in opens the existing `ClinicExperience`, including its Light/Dark theme, artwork and landing motion. Its existing booking component uses the pilot adapter. An explicit `لوحة الحجوزات` button opens the role-scoped booking dashboard; `واجهة العيادة` returns to the existing clinic view.

The dashboard is deliberately smaller than the older full doctor/reception demo. Clinical records, notes, billing, messaging, tenant onboarding, demo role switches and cross-clinic lists are not enabled in the connected pilot. This is a fake-data test, not a clinical service or a production-readiness claim.

## Live project setup completed

- Firebase project: `ayadati-halan`, on Spark, with no card or billing activation.
- Firestore Standard `(default)`, `europe-west3` (Frankfurt), initialized empty.
- The live rules still deny every client read/write. The proposed rules in this package have NOT been deployed.
- Google and Email/Password providers enabled. Email-link, anonymous login and SMS were not enabled.
- Existing GitHub Pages domain authorized. Existing default Firebase domains and localhost remain.
- Web app registered. Its client configuration is included; it is not an administrative credential.
- Existing project `calm-plate-hkm2h` and the published repository have not been changed.
- No real patient data, cloud test users or staff membership documents were created by these tests.

Actual Google OAuth and live authenticated booking have not been exercised. Both remain release-stage checks after review and approval. The current live deny-all rules intentionally prevent booking.

## Data and role controls

One clinic only: `pilot-clinic-1`.

New accounts are patients. Staff permissions come from administration-written membership documents, never from signup fields or a client-editable user profile. No real staff identity or role has been selected. The infrastructure Editor grant does not imply any clinical role.

A patient can create and read their own synthetic booking only. The receptionist can confirm, record arrival, cancel or mark no-show. The doctor can call and finish a visit. Confirmation couples the booking and turn counter atomically. Call/finish couples the booking and room lock atomically. Clinical note text and extra fields are rejected. Phone inputs are restricted to test values `01000000000` through `01000000099`.

Concurrent confirmation never creates duplicate turn numbers. Under contention, the emulator can reject a stale attempt; the UI reports failure and asks for a refresh and state check before retry. An already-confirmed booking does not get another number when retried.

## Test evidence

- TypeScript: passed.
- Pilot build: passed.
- Default build: passed.
- Security assertions: 41 passed, including denied unauthenticated/anonymous writes, self-promotion, cross-patient reads, cross-clinic staff access, malformed data, role-inappropriate updates, duplicate-turn batch attempts and room-lock violations.
- Browser checks: 23 passed, including signup, booking persistence, separate receptionist/doctor sessions, realtime patient status, second-patient isolation, same-browser staff-to-patient switching, sign-out cache clearing, denied demo/deep-link bypass, Light/Dark application and mobile overflow.
- Offline save stays visibly pending, disables repeat submission and creates exactly one booking on reconnect.
- A denied write displays a failure and never a success screen.
- Tests used `demo-ayadati-secure` emulators only. Browser tests blocked external requests and verified no real Firebase API traffic.

Screenshots were inspected at desktop and mobile sizes. Theme transitions are allowed to settle before evidence is captured. The original landing has continuous decorative motion, so only finite entrance/transition animations are awaited.

## Reproduce locally

Start with base commit `45b4bd5d601bbca2f6267dbc66369e9a615f055b` and copy the `source/` directory contents over the same repository paths. `changes.patch` is included for reviewing modifications to tracked baseline files; new files are supplied in `source/`. Do not apply the patch again after copying the source overlay.

Prerequisites: Node 22 and Java 21 for the Firebase emulator. Chrome must be installed, or set `CHROME_PATH` to its executable.

```sh
npm ci --legacy-peer-deps
npm --prefix qa/pilot ci --legacy-peer-deps
npm --prefix qa/pilot run test:rules
npm --prefix qa/pilot run test:app
```

The QA package is isolated from the app dependencies. It has its own manifest and lockfile. Screenshots default to `qa-artifacts/`; set `PILOT_QA_OUTPUT` to change that directory. Tests temporarily use the source index and restore the previous index after completion.

For manual emulator development, use both:

```text
VITE_SECURE_PILOT=true
VITE_PILOT_EMULATOR=true
```

The emulator flag only applies on localhost/127.0.0.1 and uses a `demo-` project ID. To build a reviewed live pilot later, the emulator flag must be false. A build alone does not deploy rules, assign staff or publish the app.

The fake pilot has one continuous queue, not a day-partitioned appointment system. App Check, anti-abuse limits, real staff onboarding and clinical operational policies have not been configured or validated.

## Dependency exposure judgment

The app's `package.json` and lockfile are unchanged from the baseline. Its audit reports nine existing high-severity advisories and no critical advisories. The optional QA tooling has additional advisories in its separate dependency tree. No forced major upgrades or downgrades were applied. The focused follow-up review in `PILOT-SECURITY-REVIEW.md` traced these labels to three roots and fixed the build entry so none is emitted in the enabled static pilot. That review supports fake-data-only static publication after approval, not Node/audio deployment or clinical readiness. Functional tests and an absence of reachable known advisory paths do not prove universal security.

## Release gates still open

1. Review this source, interface and failure behavior.
2. Resolve intended real staff identities and roles before writing membership documents.
3. Obtain explicit publication approval before remote push, live rules deployment or cutover.
4. Revalidate the destination project/account, deploy only `firestore.pilot.rules`, then exercise actual email/Google sign-in and synthetic booking on the approved destination.
5. Verify patient isolation and role operations live, then verify the published Light/Dark interface. Roll back or keep deny-all if any check fails.

Do not deploy the repository's older `firestore.rules` as this pilot's security rules. Do not enter real patient or clinical data.

## Static deployment build

Run `node scripts/build-pilot.mjs` to explicitly select the contained pilot, disable emulators, use the existing Pages base path, inline small artwork and embed the local fonts. Publish only `dist/assets/` after deleting old published assets, then replace the root `index.html` with `dist/index.html`. Source and tests stay in the repository.
