# Release candidate validation

**Verdict for `@gvejs` 0.1.0** — Local automated gates passed. Ubuntu CI, the hosted artifact dry run, manual accessibility, private reporting setup, and registry publication approval are pending.

## Environment

Validation ran on macOS ARM64 with Node.js 22.23.4, npm 10.9.9, pnpm 10.34.9, Vitest 4.1.12, Vite 6.4.6, and Playwright 1.58.2. Playwright used its downloaded Chromium, Firefox, and WebKit builds.

| Gate | Result | Evidence |
| --- | --- | --- |
| Frozen workspace install | Pass | `pnpm install --frozen-lockfile` installed all eight workspace projects. |
| Lint, TypeScript, tests and production build | Pass | `pnpm check` passed all 29 Vitest tests and built the six libraries and playground. The tests include deterministic playback and version 1 trace compatibility checks. |
| React 18 external consumer | Pass | `pnpm verify:packages 18` installed all six archives outside the monorepo with React 18.3.1. |
| React 19 external consumer | Pass | `pnpm verify:packages` installed all six archives outside the monorepo with React 19.2.4 and exported the six verified tarballs. |
| Package contents and public exports | Pass | Both consumer checks validated metadata, matching MIT files, portable internal dependency ranges, ESM imports, declarations, CSS, SSR, and Chromium lifecycle behavior. The archive allowlist permits package manifests, READMEs, MIT files, compiled JS, declarations, and the exported themes CSS. |
| Browser and automated accessibility | Pass | `GVE_CROSS_BROWSER=1 pnpm test:browser` passed all 15 cases across Chromium, Firefox, and WebKit, including axe in both themes and reduced motion. |
| Registry advisory audit | Pass | `pnpm audit --audit-level high` reported zero known vulnerabilities. |
| Hosted Linux CI and artifact dry run | Pending | Workflow YAML and the publishing shell block were parsed locally. GitHub execution for the migration commit is pending. |
| Manual accessibility and private vulnerability reporting | Pending | Complete the desktop and mobile matrix and verify the canonical repository's private reporting form. |
| npm bootstrap and OIDC | Pending | The organization exists per maintainer confirmation. The approved first publication and per-package Trusted Publisher setup require maintainer action. |

Local attempts inside the sandbox encountered registry DNS, npm cache write, and browser launch restrictions. The corresponding commands passed with authorized access.

See the [release checklist](RELEASE_CHECKLIST.md) for commands, archive retrieval, and first-publication steps.

## Prior dependency security audit

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
