# Release checklist

- [x] Unit and integration tests and production build pass locally.
- [x] Frozen lockfile includes optional Linux native packages.
- [ ] Clean Linux installation and GitHub CI pass on the release commit, including Chromium, Firefox, and WebKit.
- [x] Six tarballs pass isolated React 19 ESM, CSS, declaration, SSR, client mounting, playback, and unmount cleanup checks.
- [x] Local Chromium cases pass, including axe in both themes and reduced motion.
- [ ] Run the GitHub release artifact dry run and registry dependency audit.
- [ ] Verify the React 18 peer range in an isolated consumer.
- [ ] Complete manual accessibility and browser checks on supported devices.
- [x] API reference, support matrix, contribution, security, and performance instructions are present.
- [x] MIT license and per-package license artifacts confirmed.
- [ ] Confirm canonical repository metadata, private vulnerability reporting, and npm scope ownership.
- [ ] Resolve remaining P0/P1 issues and obtain explicit approval before tagging or publishing.

## Manual accessibility checks

Follow the [desktop and mobile verification matrix](MANUAL_ACCESSIBILITY.md). Record evidence alongside the [release validation report](RELEASE_VALIDATION_REPORT.md). Automated axe findings apply to the tested states only.
