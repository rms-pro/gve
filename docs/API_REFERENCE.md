# Public API

## Core and trace contract

`@gvejs/core` exports `defineAlgorithm`, `isJson`, `isEvent`, `reduceEvent`, `serializeTrace`, `parseTrace`, `validateTrace`, `describeEvent`, and `GveError`. The exported types describe JSON, schemas, algorithm metadata and definitions, visual state and renderer registration, built-in and custom events, traces, and read limits.

The version 1 trace envelope contains `version`, `algorithm`, `input`, `events` and `result`. Array order is sequence order. `describeEvent(trace, 0)` returns the event, zero-based sequence, algorithm ID, and an identity such as `bubble-sort:0`. IDs are scoped to the trace. Store your own recording identifier when indexing events across multiple traces.

```json
{ "type": "compare", "a": 0, "b": 1, "line": 1, "explanation": "Compare adjacent cells." }
```

```json
{ "type": "example:move", "payload": { "index": 1 }, "metadata": { "phase": "scan" } }
```

Line references are optional and one-based. Explanation and metadata are optional and JSON-compatible. Custom events require a registered payload guard. The developer guide lists the built-in event discriminants and fields. Version 1 readers preserve optional metadata and reject unknown trace versions and unsupported event types. Changing required fields or event semantics requires a new version and a migration strategy. Pin custom algorithm schemas when retaining traces long term.

Use `parseTrace(text, algorithm, resultGuard, limits?)` on serialized input. The source must be a string. Sparse JavaScript arrays are invalid JSON values. `validateTrace` accepts already-parsed data. The default read limit is 16 million UTF-16 code units and 100,000 events. A result guard validates application-specific output; playback itself only needs a JSON result. `GveError.code` distinguishes input, event, trace, limit, cancellation, and disposed-player errors. Invalid playback options raise `RangeError`.

## Runtime

```ts
import { bubbleSort } from '@gvejs/algorithms';
import { createPlayback, generateTrace } from '@gvejs/runtime';

const trace = generateTrace(bubbleSort, [3, 1, 2]);
const player = createPlayback(bubbleSort, trace);
const unsubscribe = player.subscribe(() => console.log(player.getSnapshot().position));
player.stepForward();
player.seek(trace.events.length);
player.reset();
unsubscribe();
player.dispose();
```

`generateTrace` collects validated events. `streamExecution` yields them and returns the result on generator completion. Both accept `ExecutionLimits`. `createPlayback` loads a trace into a `Playback` session and takes `PlaybackOptions`. Use the factory for validated boundaries. The existing `Playback` constructor is for trusted reducers, initial states, and events.

| Method | Behavior |
| --- | --- |
| `getSnapshot`, `subscribe` | Read a frozen snapshot and listen for changes. Unsubscribe via the returned function. Listeners run synchronously. |
| `start`, `restart` | Begin at step zero. An empty trace stays idle. |
| `resume`, `pause` | Start at the current position or stop scheduling timers. Resume at completion is idle. |
| `stepForward`, `stepBackward`, `seek` | Move within trace bounds. Seeking to the end stops playback. Finite fractional positions are truncated. |
| `reset`, `stop` | Pause and return to step zero in one observable transition. |
| `setSpeed` | Use a positive finite multiplier and reschedule pending playback. |
| `dispose` | Cancel timers, release subscriptions and checkpoints, and retain the final snapshot for inspection. Subsequent mutations throw. Repeat disposal is safe. |

Create a new session to load a different trace. Unsubscribe and dispose the previous session when replacing it.

## Rendering, algorithms and React

`@gvejs/renderers` exports `formatValue`, `layoutCells`, `layoutDiagram` and corresponding cell, node and diagram types. `@gvejs/algorithms` exports the twelve definitions in [Algorithm support](ALGORITHM_SUPPORT.md). `@gvejs/themes` exports `ThemeMode`, `Theme`, and the `@gvejs/themes/style.css` subpath.

`@gvejs/react` exports `AlgorithmVisualizer`, its props type, `usePlayback`, `Visualization`, `PlaybackControls`, `Timeline`, `InputEditor`, `CodePanel`, `VariablesPanel`, and `ExplanationPanel`. Load theme CSS separately. Keep initial input and options references stable while a visualization is active.
