# Release candidate validation

**Verdict: NOT READY.** Required automated evidence is incomplete.

## Environment

Local MacBook Pro with Apple M2, 8 GB memory, macOS 26.3.1, Node.js 22.23.4, pnpm 10.34.9, Vite 6.4.6, and Playwright 1.58.2. The sandbox blocked localhost binding and browser process reuse in single-process mode. Playwright routed requests to production build files and used the available Chrome for Testing headless shell 151.0.7922.34 through `GVE_CHROMIUM_EXECUTABLE`. Each local browser case ran in a fresh process. Registry and browser CDN DNS were unavailable. This checkout has no Git metadata and the Docker socket is inaccessible.

## Release gates

| Gate | Status | Command and evidence |
| --- | --- | --- |
| Frozen lockfile consistency | PASS | `CI=1 pnpm install --offline --frozen-lockfile --lockfile-only` accepted the repaired lockfile. Rollup and esbuild snapshots now reference optional Linux x64 native packages, alongside macOS and other platform variants. |
| Clean Linux installation and GitHub CI | BLOCKED | Local environment could not run Docker or retrieve GitHub workflow results. Run `pnpm install --frozen-lockfile` on the configured Ubuntu runner. |
| Lint, types, unit and integration tests, production build | PASS | `pnpm check` passed 29 Vitest tests and built all six libraries and the playground. |
| React 19 external consumer and artifacts | PASS | `pnpm verify:packages` with the offline npm cache and Chromium override verified six same-version public tarballs, MIT metadata, README and license files, declaration and ESM entries, CSS, and dependency/peer metadata. React 19.2.4 SSR and client mount, stepping, playback, and timer cleanup on unmount passed. |
| React 18 external consumer | BLOCKED | `pnpm verify:packages 18` packed six archives. npm stopped during install because the React 18 dependency graph was unavailable offline, including `scheduler@0.23.2`. Consumer imports, types, SSR, mounting and cleanup were not reached. The peer range is unchanged. |
| Chromium playground | PASS | Five cases passed with `pnpm test:browser --grep "<case>"`, covering initialization, selection, playback, pause/resume, stepping, reset, speed, keyboard, theme switching and error monitoring. |
| Firefox and WebKit | BLOCKED | `pnpm exec playwright install firefox webkit` and a separate WebKit install failed with CDN DNS errors. Neither browser suite executed. |
| Automated accessibility | PASS | Chromium axe scans returned zero violations for the tested light and dark states. Keyboard stepping, reduced motion, non-color highlight labeling and narrow layout checks passed. |
| Manual accessibility | NOT RUN | Desktop and mobile assistive technology matrix is in [Manual accessibility](MANUAL_ACCESSIBILITY.md). Automated scans do not establish WCAG conformance. |
| Trace input hardening | PASS | Regression tests cover early rejection of non-string and sparse trace input, source length, nesting limits, malformed events and prototype-like variable names. Version 1 remains compatible. |
| Registry advisory audit | BLOCKED | `pnpm audit --audit-level high` failed resolving `registry.npmjs.org`. Advisory status is unknown. |
| Performance evidence | PASS | `pnpm bench` measured generation, processing and checkpoint construction, sequential and random access, pure layout and retained heap. Chromium measured 200-cell browser updates. See [Performance](PERFORMANCE.md). |
| Hosted artifact dry run | BLOCKED | Local tarball workflow is covered by the consumer checks. The GitHub workflow dispatch and artifact upload remain unverified. |
| Publication configuration | NOT RUN | Confirm the canonical repository URL, ownership of the `@gve` scope, and the private security reporting channel. The local checkout provides no authoritative values. |

## Failures and fixes

- Cached native tooling hid missing Rollup and esbuild optional dependency entries. Restored the matching platform package records and validated the frozen lockfile. The first clean Linux build remains a mandatory check.
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
