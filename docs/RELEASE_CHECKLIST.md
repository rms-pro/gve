# Release checklist

- [x] Unit and integration tests and production build pass locally.
- [x] Frozen lockfile includes optional Linux native packages.
- [ ] Clean Linux installation and GitHub CI pass on the release commit, including Chromium, Firefox, and WebKit.
- [x] Six tarballs pass isolated React 19 ESM, CSS, declaration, SSR, client mounting, playback, and unmount cleanup checks.
- [x] `GVE_CROSS_BROWSER=1 pnpm test:browser` passes all 15 local Chromium, Firefox, and WebKit cases, including axe and reduced motion.
- [x] Verify all six tarballs in a React 18 isolated consumer with `pnpm verify:packages 18`.
- [x] Run the registry dependency audit. The baseline had 20 findings (8 moderate, 10 high, 2 critical). After the Vitest and TypeScript ESLint upgrades and lockfile refresh, the full and production-only audits found zero vulnerabilities. See the [advisory inventory](RELEASE_VALIDATION_REPORT.md#dependency-security-audit).
- [ ] Run the GitHub release artifact dry run.
- [ ] Complete manual accessibility and browser checks on supported devices.
- [x] API reference, support matrix, contribution, security, and performance instructions are present.
- [x] MIT license and per-package license artifacts confirmed.
- [ ] Confirm canonical repository metadata, private vulnerability reporting, and npm scope ownership.
- [ ] Resolve remaining P0/P1 issues and obtain explicit approval before tagging or publishing.

## Manual accessibility checks

Follow the [desktop and mobile verification matrix](MANUAL_ACCESSIBILITY.md). Record evidence alongside the [release validation report](RELEASE_VALIDATION_REPORT.md). Automated axe findings apply to the tested states only.
