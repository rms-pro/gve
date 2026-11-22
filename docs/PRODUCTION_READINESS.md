# Production readiness audit

The workspace has six ESM libraries, a private Vite playground, and a Markdown developer guide. Core owns schemas and reducers. Runtime adds generation and checkpoint playback. Algorithms and renderer layouts depend on core. React combines core, runtime, layouts, and theme types. The playground imports public exports. Strict NodeNext project references build declarations. Twelve algorithms are implemented. The initial test suite covers examples, trace round-tripping, selected timer behavior, and two Chromium flows.

| Priority | Initial finding | Release impact |
| --- | --- | --- |
| P0 | Root directly depends on a Darwin ARM64 Rollup binary | Frozen Linux CI installation can fail before checks |
| P1 | Playback has no disposal and reset publishes intermediate state | Timer and subscriber behavior is fragile for embedders |
| P1 | Trace ingestion assumes a valid array, with unbounded recursive JSON checks | Malformed or deeply nested input can bypass controlled errors |
| P1 | Browser tests lack automated accessibility and browser error detection | Insufficient evidence for stable release |
| P1 | CI packs libraries without installing them in an external consumer | Export, CSS and dependency regressions can pass |
| P1 | Registry scope ownership and canonical repository URL are unverified | Release destinations need maintainer confirmation |
| P2 | Algorithm edge and invariant coverage is uneven | Regressions can escape example-based coverage |
| P2 | Diagram labels and highlight semantics limit readability | Large and narrow views need verification |
| P2 | Benchmarks omit heap and per-step latency | No evidence for practical workload guidance |
| P3 | Checkpoints and renderer work scale with trace and state size | Measure before introducing virtualization or history truncation |

Implementation order follows audit, lifecycle and validation, tests, rendering and accessibility, package consumer verification, CI and release dry run, then final audit. See the release checklist and implementation status for current gating evidence.

## Release candidate audit

**Verdict: NOT READY.** The [release validation report](RELEASE_VALIDATION_REPORT.md) contains the latest evidence and exact commands.

- **P0 fix verified in the lockfile.** The current audit found missing optional Rollup and esbuild native records despite the earlier removal of a Darwin-only root dependency. The repaired lockfile passes frozen consistency checks. Clean Linux execution remains blocked locally.
- **P1 resolved locally.** Twenty-nine Vitest tests, Chromium including axe, and React 19 isolated package and browser consumption passed. Trace validation rejects sparse arrays without materializing them and rejects non-string serialized inputs before coercion.
- **P1 open.** GitHub CI and artifact dry run, React 18 tarball consumption, Firefox and WebKit, manual accessibility and registry audit remain pending. Registry and browser CDN DNS were unavailable.
- **P1 open.** Confirm the canonical GitHub URL, ownership of the `@gve` registry scope, and private vulnerability reporting before stable release.
- **P2/P3.** Synchronous preparation of large traces remains a practical limit. See [Performance](PERFORMANCE.md).

Package versions remain at 0.1.0. Validation workflows build, test and upload artifacts without publishing.
