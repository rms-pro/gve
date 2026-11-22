# GVE developer guide

[Installation and quick start](../../README.md#run-the-playground)

## Algorithm definitions

Call `defineAlgorithm` with metadata, an input type guard, an initial visual state, and a generator. Yield execution events from the generator and return the algorithm result. The result can be consumed without attaching any renderer. Metadata includes a stable ID, examples, a description, and pseudocode. Event `line` values are one-based and refer to this pseudocode. Event explanations are plain text. Graph edges are directed in their declared input order. Binary search requires ascending input and may return any matching index for duplicates.

## Trace generation and schema

`generateTrace(algorithm, input, limits)` validates input and events and produces a JSON-compatible object with `version`, `algorithm`, `input`, `events`, and `result`. Use `streamExecution` when the consumer wants to process events individually. Iterating to completion returns the result through the generator's final `next()` value. `serializeTrace` writes JSON, and `parseTrace` validates version 1, algorithm identity, event schemas, and the caller's result schema.

| Event | Required fields |
| --- | --- |
| `compare`, `swap` | `a`, `b` zero-based indices |
| `write` | `index`, JSON `value` |
| `values` | `values` JSON array |
| `highlight` | `targets` of node IDs or cell indices, optional `edge` |
| `pointer` | `name`, `target` node ID or cell index |
| `node` | `node` with string `id`, string `label`, optional nonnegative integer `depth` |
| `edge` | `edge` with string `from` and `to` |
| `variable` | `name`, JSON `value` |
| `call` | `label` |
| `return` | No event-specific fields |
| Namespaced custom event | Registered type and schema-validated JSON `payload` |

`line` and `explanation` are optional on every event. Publish custom event types with a stable namespace such as `example:move`.

## Playback and reducers

Call `createPlayback(algorithm, trace)`. Position zero represents the algorithm's initial state. Position N represents the state after N events. Use `getSnapshot()` for inspection, `subscribe()` for changes, and `seek()` or the step methods for navigation. Playback builds checkpoints in a single forward pass and restores earlier positions by replaying from the nearest checkpoint. Reducers must be deterministic and copy any collection they update. Treat snapshots and event objects as read-only. Shorter checkpoint intervals trade retained state for faster seeking.

## Extend the SDK

The [Gnome Sort example](../../examples/gnome-sort.ts) defines a new input schema, declares and validates a namespaced pointer event, and reduces that event without changing any engine package. Its result, trace round-trip, and custom reducer run under `pnpm test`. To run it from the repository root:

```sh
pnpm build:packages
node --disable-warning=ExperimentalWarning --input-type=module -e '
  import { gnomeSort } from "./examples/gnome-sort.ts";
  import { generateTrace } from "@gve/runtime";
  console.log(generateTrace(gnomeSort, [4, 2, 3, 1]).result);
'
```

To display it, pass `gnomeSort` as the `algorithm` prop in the React quick start. An application can add it to its own catalog by stable metadata ID.

Use `RendererRegistration<T>` to bind a state kind to a render function. The renderer receives `VisualState` and can use `layoutCells` or `layoutDiagram` from `@gve/renderers`. React hosts pass their registrations through the `renderers` prop. A namespaced kind such as `example:board` allows the host to bind an application-specific view. Layout functions support arrays, stacks, queues, matrices, graphs, trees, linked structures, and recursion trees. In a custom reducer, populate the relevant fields such as `matrix`, `nodes`, and `edges`; keep algorithm decisions in the generator. Node IDs should be unique within a state.

## React integration and accessibility

`AlgorithmVisualizer` combines the controls, timeline, canvas, and inspector. Hosts can also use the individual components with a `Playback` instance. Keep algorithm, input, and options references stable to preserve the current player. Import `@gve/themes/style.css` or provide your own component styles. Pass a theme object with colors to apply CSS custom properties while retaining light, dark, or system color mode.

Playback controls are native buttons, the timeline uses a keyboard-operable range input, and the canvas supports Left, Right, and Space when focused. The included CSS follows the operating system's reduced-motion preference and keeps the numeric cell values visible throughout playback.

The [embedding example](../../examples/geekiscool-embed.tsx) takes its input and theme from the host. Migrate existing lessons individually. Keep the app's lesson route and controls as needed and use `Playback` or `AlgorithmVisualizer` for the trace and rendering.

## Execution policy and performance

The playground only accepts JSON inputs to algorithms bundled at build time. Applications can register explicitly trusted TypeScript modules. Code from users requires an isolated execution boundary before support can be added. A future interpreter can accept a declarative program containing bounded loops, comparisons, arithmetic, indexed reads and writes, and event emission. The instruction set should exclude filesystem, network, clock, and dynamic code access. The host should enforce instruction, deadline, and memory quotas outside the execution boundary and validate emitted events against the registered schema.

Current limits check elapsed time and cancellation between generator calls and bound input bytes, event count, and estimated serialized trace bytes. JavaScript running inside a generator call cannot be interrupted by those checks, and serialized bytes do not measure heap usage. Browser hosts can consume streamed events in batches and yield to the event loop between batches. The supplied React component generates its bounded trace synchronously. `pnpm bench` measures generation, checkpoint indexing, and 1,000 seeks. One local Node.js 22 run with checkpoints every 64 events produced these timings.

| Trace | Events | Generate | Index | 1,000 seeks |
| --- | ---: | ---: | ---: | ---: |
| Bubble Sort, 160 values | 18,860 | 42 ms | 35 ms | 25 ms |
| Merge Sort, 1,000 values | 18,055 | 46 ms | 89 ms | 122 ms |
| Fibonacci, n = 10 | 1,061 | 3 ms | 3 ms | 34 ms |

## Testing

`pnpm check` runs lint, strict TypeScript checking, Vitest, and the production build. After building and installing Chromium, run `pnpm test:browser` for Playwright interactions in the playground. The engine tests compare the visual state and independent algorithm result, verify backward reconstruction, and cover trace validation, limits, cancellation, and custom events.

[Contribution workflow](../../README.md#contributing)
