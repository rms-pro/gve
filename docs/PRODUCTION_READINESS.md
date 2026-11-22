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

## 0.1.0 release candidate

The public packages are `@gvejs/core`, `@gvejs/runtime`, `@gvejs/renderers`, `@gvejs/react`, `@gvejs/algorithms`, and `@gvejs/themes`. Framework-independent layouts are exported by `@gvejs/renderers`. All six are ESM packages with TypeScript declarations, and themes also exports its CSS. The root and `@gvejs/playground` are marked private. `apps/docs` contains Markdown and has no package manifest.

The `gvejs` organization has been created and `rms-pro/gve` is the canonical repository. See the [validation report](RELEASE_VALIDATION_REPORT.md) for current test evidence and the [release checklist](RELEASE_CHECKLIST.md) for hosted verification, private reporting, manual accessibility, and npm bootstrap steps.
