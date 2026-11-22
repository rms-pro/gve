# Release candidate validation

**Verdict: NOT READY.** Local automated gates passed. GitHub CI on the remediation commit, the hosted artifact dry run, and manual release gates are pending.

## Environment

Remediation was verified on macOS ARM64 with Node.js 22.23.4, pnpm 10.34.9, Vitest 4.1.12, Vite 6.4.6, and Playwright 1.58.2. Playwright used its downloaded Chromium, Firefox, and WebKit builds.

## Release gates

| Gate | Status | Command and evidence |
| --- | --- | --- |
| Frozen lockfile consistency | PASS | `pnpm install --frozen-lockfile` passed for all eight workspace projects. |
| Clean Linux installation and GitHub CI | PENDING | The baseline Ubuntu run on `ce67121` passed verification and failed the advisory job. The advisory job installs from the checked-out lockfile with `pnpm install --frozen-lockfile` and gates on `pnpm audit --audit-level high`. The remediation awaits a run on its pushed commit. [Baseline CI run](https://github.com/rms-pro/gve/actions/runs/44977767508) |
| Lint, types, unit and integration tests, production build | PASS | `pnpm check` passed 29 Vitest tests and built all six libraries and the playground. |
| React 19 external consumer and artifacts | PASS | `pnpm verify:packages` installed all six tarballs into an isolated React 19.2.4 consumer and passed metadata, ESM, CSS, declarations, SSR, and Chromium lifecycle checks. |
| React 18 external consumer | PASS | `pnpm verify:packages 18` ran the same six-package verification with React 18.3.1. |
| Cross-browser playground | PASS | `GVE_CROSS_BROWSER=1 pnpm test:browser` passed all 15 cases across Chromium, Firefox, and WebKit. |
| Automated accessibility | PASS | Axe scans passed in both themes across Chromium, Firefox, and WebKit. Keyboard stepping, reduced motion, non-color highlight labeling, and narrow layout checks passed. |
| Manual accessibility | NOT RUN | Desktop and mobile assistive technology matrix is in [Manual accessibility](MANUAL_ACCESSIBILITY.md). Automated scans do not establish WCAG conformance. |
| Trace input hardening | PASS | Regression tests cover early rejection of non-string and sparse trace input, source length, nesting limits, malformed events and prototype-like variable names. Version 1 remains compatible. |
| Registry advisory audit | PASS | `pnpm audit --audit-level high`, `pnpm audit --json`, and `pnpm audit --prod --json` all exited 0 and reported zero findings. The baseline had 20 findings (8 moderate, 10 high, 2 critical). |
| Performance evidence | PRIOR PASS | `pnpm bench` measured generation, processing and checkpoint construction, sequential and random access, pure layout and retained heap. Chromium measured 200-cell browser updates. See [Performance](PERFORMANCE.md). |
| Hosted artifact dry run | PENDING | The isolated consumer checks cover local tarballs. GitHub workflow dispatch and artifact upload are pending. |
| Publication configuration | PENDING | Confirm publication metadata, ownership of the `@gve` scope, and the private security reporting channel. |

## Dependency security audit

The baseline registry audit reported 20 findings (8 moderate, 10 high, 2 critical). Every finding came from the root development graph. Vitest was a direct dependency and every other affected package was transitive. After remediation, the full, high-threshold, and production-only registry audits all reported zero known vulnerabilities.

Vitest 4.1.12 replaces the Vitest 3 worker implementation and removes `tinypool` from the lockfile. TypeScript ESLint 8.73.0 resolves `minimatch` 11.0.9 and `brace-expansion` 5.0.13. The ESLint 9 branch retains `minimatch` 3.1.5 and resolves `brace-expansion` 1.1.22 and `@humanfs/node` 0.16.8. The final lockfile uses the parents' declared ranges without overrides or audit exclusions.

| Advisory | Severity | Root development dependency path | Baseline version | Affected range | Patched range | Remediation |
| --- | --- | --- | --- | --- | --- | --- |
| [GHSA-jxxr-4gwj-5jf2](https://github.com/advisories/GHSA-jxxr-4gwj-5jf2) | moderate | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=5.0.0 <5.0.6` | `>=5.0.6` | Resolve 5.0.13 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.16` | `>=1.1.16` | Resolve 1.1.22 |
| [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | high | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=3.0.0 <5.0.7` | `>=5.0.7` | Resolve 5.0.13 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.17` | `>=1.1.17` | Resolve 1.1.22 |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | high | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=4.0.0 <5.0.8` | `>=5.0.8` | Resolve 5.0.13 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=4.0.0 <5.0.9` | `>=5.0.9` | Resolve 5.0.13 |
| [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | high | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.18` | `>=1.1.18` | Resolve 1.1.22 |
| [GHSA-p498-v437-472g](https://github.com/advisories/GHSA-p498-v437-472g) | moderate | `eslint` → `@humanfs/node` | 0.16.7 | `<0.16.8` | `>=0.16.8` | Resolve 0.16.8 |
| [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | moderate | `vitest` | 3.2.7 | `>=2.1.0 <4.1.11` | `>=4.1.11` | Upgrade to 4.1.12 |
| [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) | moderate | `vitest` → `@vitest/mocker` | 3.2.7 | `>=2.1.0 <4.1.11` | `>=4.1.11` | Upgrade via Vitest 4.1.12 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | moderate | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.21` | `>=1.1.21` | Resolve 1.1.22 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | moderate | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=4.0.0 <5.0.12` | `>=5.0.12` | Resolve 5.0.13 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | high | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.20` | `>=1.1.20` | Resolve 1.1.22 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | high | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=4.0.0 <5.0.11` | `>=5.0.11` | Resolve 5.0.13 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | high | `eslint` → `minimatch` → `brace-expansion` | 1.1.13 | `<1.1.19` | `>=1.1.19` | Resolve 1.1.22 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | high | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` → `brace-expansion` | 5.0.5 | `>=4.0.0 <5.0.10` | `>=5.0.10` | Resolve 5.0.13 |
| [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) | critical | `vitest` → `tinypool` | 1.1.1 | `<=2.1.0` | `>=2.1.1` | Remove via Vitest 4.1.12 |
| [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) | critical | `vitest` → `tinypool` | 1.1.1 | `<2.1.2` | `>=2.1.2` | Remove via Vitest 4.1.12 |
| [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | moderate | `vitest` → `@vitest/mocker` | 3.2.7 | `>=2.1.0-beta.7 <4.1.12` | `>=4.1.12` | Upgrade via Vitest 4.1.12 |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | moderate | `typescript-eslint` → `@typescript-eslint/typescript-estree` → `minimatch` | 10.2.5 | `>=7.0.0 <11.0.1` | `>=11.0.1` | Resolve 11.0.9 via typescript-eslint 8.73.0 |

## Failures and fixes

- Cached native tooling hid missing Rollup and esbuild optional dependency entries. Restored the matching platform package records and validated the frozen lockfile. The baseline Linux verification passed. The remediated lockfile awaits a Linux CI run.
- A timing test sometimes advanced twice because real time continued between virtual clock calls. Paused the clock before timing-sensitive interactions and reran the pause/resume assertion. Tests now monitor console errors and uncaught exceptions in all playground cases.
- The isolated consumer initially navigated to a relative URL without a base. Set the route-backed base URL, then verified mounting and disposal in Chromium.
- Sparse JavaScript arrays could allocate a dense copy during trace validation. Validation now checks own indexed elements in place. Passing a non-string source produces a trace error before coercion.

## Remaining risks and next actions

Run the following in the canonical repository on registry-connected Linux:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm verify:packages
pnpm verify:packages 18
pnpm audit --audit-level high
GVE_CROSS_BROWSER=1 pnpm test:browser
```

Save the CI logs and dispatch the release artifact dry run. Complete the manual accessibility matrix and confirm project metadata before a stable release. Small teaching workloads remain the default recommendation. Large traces can exceed an interactive frame budget during synchronous preparation, and custom algorithm modules must be trusted.

The workflows use read-only repository permissions and contain artifact upload steps only. Package versions remain at 0.1.0. No credentials, tags, release creation, or npm publication were used.
