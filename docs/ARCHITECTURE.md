# Architecture

`@gvejs/core` defines typed algorithm, event and state contracts. It validates trace data and reduces events without timers, DOM APIs, or React. `@gvejs/runtime` runs trusted algorithm generators and builds immutable playback snapshots with forward checkpoints. Algorithms depend on the core contract. Renderers depend on core for state and JSON values, with no algorithm knowledge.

`@gvejs/react` subscribes to runtime snapshots and renders layouts using theme types from `@gvejs/themes`. Browser APIs such as fullscreen live in React. The private Vite playground uses public package imports. See the dependency diagram in the [README](../README.md).

A trace stores its input, ordered events, and result. A session loads a trace with `createPlayback`. Seek and rewind start from a checkpoint and reduce the remaining events. Position zero is the initial state. Reducers return new values for changed state. The same source trace can be loaded by multiple independent sessions. UI owners should stop playback when detaching and dispose sessions when they will no longer be used.

Custom algorithms provide input guards and optionally register namespaced event payload guards and reducers. Custom renderers accept the same visual state contract. The [Gnome Sort example](../examples/gnome-sort.ts) exercises the SDK.
