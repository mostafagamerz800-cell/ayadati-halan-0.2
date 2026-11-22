# Pilot dependency exposure and release judgment

22 November 2026. Applies only to the revised static browser pilot build with `VITE_SECURE_PILOT=true`, not a Node server deployment or the legacy demo build.

## Judgment

The nine baseline high-severity audit labels are not nine independent exposed vulnerabilities. They propagate from three vulnerable dependency roots. After the compatible build-entry isolation fix described below, none of the three vulnerable roots is present in the emitted pilot JavaScript or a worker chunk. These audit findings are therefore not a blocker for a synthetic-data-only static pilot publication. They remain real maintenance work for the legacy audio feature and any future Node deployment.

This supports requesting publication approval for the revised fake-data slice. It does not clear live integration checks, staff identity decisions, anti-abuse work or clinical readiness. Actual Google/email sign-in, synthetic booking and rules behavior must still be verified against the approved live destination after permission to deploy. Do not publish a Node/Express server, enable the old audio feature, or enter real patient data under this judgment.

## Findings

| Audit labels | Vulnerable root and precondition | Exposure in this revised pilot | Decision and remediation |
| --- | --- | --- | --- |
| `firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js` | Installed gRPC 1.9.16. The high advisory concerns a Node gRPC server using client certificate auth with `requireClientCertificate=false`, then trusting `getAuthContext` for authentication. | Browser Firestore resolves `dist/index.esm.js` and its common ESM module. The emitted module inventory contains no gRPC, Node Firestore module or protobuf module. Static GitHub Pages does not run a Node gRPC server. | Not exposed in this static pilot. Patch versions include 1.13.6/1.14.5. These are outside Firestore's declared `~1.9.0` dependency range. A same-major override could be investigated for Node use, but it is not a qualified drop-in repair here. No forced override or Firebase downgrade applied. |
| `@xenova/transformers`, `onnxruntime-web`, `onnx-proto`, `protobufjs` | Transformers 2.17.2, ONNX runtime 1.14.0, onnx-proto 4.0.4 and protobufjs 6.11.6. Advisory paths include attacker-influenced descriptors/code generation, prior prototype pollution, and deeply nested protobuf/Any conversion. | Initial inventory found the dormant ambient-audio worker still emitted because the legacy App was statically imported. The revised entry conditionally imports only the selected app. The final enabled-pilot inventory contains no legacy App, ambient component, ASR worker, transformers, ONNX or protobuf module and emits no worker. The pilot has no model/schema upload or audio-processing route. | Containment fix completed locally. Do not ship the earlier archive or mix old assets into a publication. There is no fixed 6.x protobuf version available in the checked registry; patched 7.x/8.x paths would cross onnx-proto's `^6.8.8` range. Replacing ONNX/transformers needs separate compatibility work for the legacy audio feature. |
| `sharp` (also propagates to transformers) | Installed sharp 0.32.6. Native libvips/libheif/librsvg image parsing can be vulnerable when processing untrusted images, including possible RCE under specified Linux conditions. | Transformers maps sharp to false for browser builds. The revised pilot excludes transformers entirely, and emitted module inventory confirms no sharp. No Node image-processing server is published in the proposed static slice. | Not exposed in this static pilot. Current remediation reaches sharp 0.35.5 for the listed issues, outside the declared `^0.32.0` dependency range. A forced native-library upgrade is not necessary for containment and has not been applied. It would require compatibility tests before Node/audio use. |

## Evidence and fix

`src/main.tsx` now uses a direct build-time flag and conditional dynamic imports. The default legacy App remains selected when the flag is false. The enabled pilot imports only PilotApp, preserving the existing ClinicExperience within it. This removes the unused legacy/audio branch from the pilot build without changing dependency versions or the default interface.

`qa/pilot/analyze-build.mjs` inspects actual Vite output module inventories, including worker builds, and fails the pilot analysis if a rendered module includes the legacy App/audio branch, gRPC, protobuf, ONNX, transformers or sharp. Final result: two main JavaScript chunks, zero worker chunks, zero matching vulnerable/legacy modules. Firestore modules use the browser ESM path. A sanitized summary is supplied as `pilot-build-exposure.json`.

After this change:

- TypeScript passed.
- Default build passed.
- Pilot build and emitted-module exclusion assertion passed.
- All 23 browser checks passed again, including failure states, role separation, cross-account cache clearing and no real-cloud traffic during tests.
- All 41 rules assertions passed on the unchanged rules revision.
- Existing-clinic and Dark dashboard pixels were inspected again, with no interface regression found.
- App manifest and lockfile remain unchanged. The root audit count still reports nine high labels because the dependencies remain installed for the legacy/default development tree. An install-tree audit is not the same thing as an emitted-browser exposure report.

## Release boundary

Publish only fresh output of the revised static pilot build. Replace the published asset set cleanly so obsolete worker files are not carried forward. Verify the built output contains no old worker or ONNX assets before uploading. Retain default/legacy code only as source or a separately selected non-pilot build, not as extra assets in this pilot deployment.

No publication or rules change has been made. The live database remains deny-all. Staff role identities are still unselected. These are explicit remaining workflow gates, not decisions to waive security findings.

## Sources inspected

Primary advisory pages were read alongside the installed package manifests, dependency paths, source imports and emitted Vite module inventory. The exposure classification above is based on both the advisory prerequisites and the actual build, not only package names.

- gRPC certificate-auth prerequisite and patches: https://github.com/advisories/GHSA-m9gg-hp2v-232j
- protobuf descriptor-controlled code generation: https://github.com/advisories/GHSA-66ff-xgx4-vchm
- protobuf code generation after prior prototype pollution: https://github.com/advisories/GHSA-75px-5xx7-5xc7
- protobuf Any conversion recursion: https://github.com/advisories/GHSA-wcpc-wj8m-hjx6
- sharp/libvips untrusted image handling: https://github.com/advisories/GHSA-f88m-g3jw-g9cj
- sharp/libheif affected versions and conditions: https://github.com/advisories/GHSA-rgj7-g3m4-5g8c
- sharp/librsvg affected versions and patch: https://github.com/advisories/GHSA-wq5f-xc86-pv6w
