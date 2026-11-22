import {
  GveError,
  isEvent,
  isJson,
  reduceEvent,
  validateTrace,
} from '@gve/core';
import type {
  Algorithm,
  BuiltinEvent,
  CustomEvent,
  Trace,
  VisualState,
} from '@gve/core';

export interface ExecutionLimits {
  maxTimeMs?: number;
  maxEvents?: number;
  maxInputBytes?: number;
  maxTraceBytes?: number;
  signal?: AbortSignal;
}
const bytes = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;
function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${label} must be positive and finite.`);
  return value;
}

export function* streamExecution<I, R, E extends CustomEvent>(
  algorithm: Algorithm<I, R, E>,
  input: unknown,
  options: ExecutionLimits = {},
): Generator<BuiltinEvent | E, R> {
  const start = performance.now();
  const maxTime = positive(options.maxTimeMs ?? 2000, 'Execution time');
  const maxEvents = positive(options.maxEvents ?? 100_000, 'Event count');
  const maxBytes = positive(options.maxTraceBytes ?? 16_000_000, 'Trace bytes');
  const check = () => {
    if (options.signal?.aborted)
      throw new GveError('cancelled', 'Execution cancelled.');
    if (performance.now() - start > maxTime)
      throw new GveError('limit', 'Execution time exceeded.');
  };
  check();
  if (!isJson(input) || !algorithm.input(input))
    throw new GveError('input', 'Input does not match the algorithm schema.');
  let used = bytes({
    version: 1,
    algorithm: algorithm.metadata.id,
    input,
    events: [],
    result: null,
  });
  if (
    bytes(input) > positive(options.maxInputBytes ?? 128_000, 'Input bytes')
  ) {
    throw new GveError('limit', 'Input size exceeded.');
  }
  const iterator = algorithm.execute(structuredClone(input));
  let count = 0;
  try {
    for (;;) {
      check();
      const step = iterator.next();
      check();
      if (step.done) {
        if (!isJson(step.value))
          throw new GveError('trace', 'Result must be JSON.');
        if (used + bytes(step.value) - 4 > maxBytes)
          throw new GveError('limit', 'Trace size exceeded.');
        return structuredClone(step.value);
      }
      if (++count > maxEvents)
        throw new GveError('limit', 'Event count exceeded.');
      if (!isEvent(step.value, algorithm))
        throw new GveError('event', 'Algorithm emitted an invalid event.');
      used += bytes(step.value) + (count > 1 ? 1 : 0);
      if (used > maxBytes) throw new GveError('limit', 'Trace size exceeded.');
      yield structuredClone(step.value);
    }
  } finally {
    iterator.return?.(undefined as R);
  }
}

export function generateTrace<I, R, E extends CustomEvent>(
  algorithm: Algorithm<I, R, E>,
  input: unknown,
  limits?: ExecutionLimits,
): Trace<I, R> {
  const events: (BuiltinEvent | E)[] = [];
  if (!isJson(input) || !algorithm.input(input))
    throw new GveError('input', 'Input does not match the algorithm schema.');
  const snapshot = structuredClone(input);
  const stream = streamExecution(algorithm, snapshot, limits);
  for (;;) {
    const step = stream.next();
    if (step.done)
      return {
        version: 1,
        algorithm: algorithm.metadata.id,
        input: snapshot,
        events,
        result: step.value,
      };
    events.push(step.value);
  }
}

export interface PlaybackSnapshot {
  readonly position: number;
  readonly length: number;
  readonly playing: boolean;
  readonly speed: number;
  readonly state: Readonly<VisualState>;
}
export interface PlaybackOptions {
  checkpointInterval?: number;
  frameMs?: number;
  maxEvents?: number;
}

/** Preserve structural sharing while protecting states and events held by the player. */
const frozen = new WeakSet<object>();
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !frozen.has(value)) {
    frozen.add(value);
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
export class Playback {
  private snapshot: PlaybackSnapshot;
  private readonly checkpoints = new Map<number, VisualState>();
  private readonly reduce: (
    state: VisualState,
    event: BuiltinEvent | CustomEvent,
  ) => VisualState;
  private events: Trace<unknown, unknown>['events'];
  private readonly interval: number;
  private readonly frameMs: number;
  private readonly listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private disposed = false;

  constructor(
    reduce: Playback['reduce'],
    initial: VisualState,
    events: Playback['events'],
    options: PlaybackOptions = {},
  ) {
    this.reduce = reduce;
    this.events = freeze(structuredClone(events));
    this.interval = Math.ceil(
      positive(options.checkpointInterval ?? 64, 'Checkpoint interval'),
    );
    this.frameMs = positive(options.frameMs ?? 420, 'Frame duration');
    let state = freeze(structuredClone(initial));
    this.snapshot = Object.freeze({
      position: 0,
      length: events.length,
      playing: false,
      speed: 1,
      state,
    });
    this.checkpoints.set(0, state);
    for (const [index, event] of this.events.entries()) {
      state = freeze(reduce(state, event));
      if ((index + 1) % this.interval === 0)
        this.checkpoints.set(index + 1, state);
    }
  }

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.assertActive();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(values: Partial<PlaybackSnapshot>) {
    this.snapshot = Object.freeze({ ...this.snapshot, ...values });
    for (const listener of [...this.listeners]) {
      if (this.listeners.has(listener)) listener();
    }
  }
  private assertActive() {
    if (this.disposed)
      throw new GveError('disposed', 'Playback has been disposed.');
  }
  seek(position: number) {
    this.move(position, this.snapshot.playing);
  }
  private move(position: number, playing: boolean) {
    this.assertActive();
    if (!Number.isFinite(position))
      throw new RangeError('Position must be finite.');
    const end = Math.max(0, Math.min(this.events.length, Math.trunc(position)));
    const checkpoint = end - (end % this.interval);
    const useCurrent =
      this.snapshot.position >= checkpoint && this.snapshot.position <= end;
    let cursor = useCurrent ? this.snapshot.position : checkpoint;
    let state = useCurrent
      ? this.snapshot.state
      : this.checkpoints.get(checkpoint)!;
    for (; cursor < end; cursor++)
      state = freeze(this.reduce(state, this.events[cursor]));
    playing = playing && end < this.events.length;
    if (!playing) this.clearTimer();
    if (end !== this.snapshot.position || playing !== this.snapshot.playing) {
      this.update({ position: end, state, playing });
    }
  }
  stepForward() {
    this.seek(this.snapshot.position + 1);
  }
  stepBackward() {
    this.seek(this.snapshot.position - 1);
  }
  private clearTimer() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
  private schedule() {
    this.clearTimer();
    if (!this.snapshot.playing) return;
    const delay = Math.min(
      2_147_483_647,
      Math.max(1, this.frameMs / this.snapshot.speed),
    );
    this.timer = setTimeout(() => {
      this.timer = undefined;
      try {
        this.stepForward();
      } finally {
        if (this.timer === undefined) this.schedule();
      }
    }, delay);
  }
  resume() {
    this.assertActive();
    if (this.snapshot.playing || this.snapshot.position === this.events.length)
      return;
    try {
      this.update({ playing: true });
    } finally {
      this.schedule();
    }
  }
  start() {
    this.restart();
  }
  pause() {
    this.assertActive();
    this.clearTimer();
    if (this.snapshot.playing) this.update({ playing: false });
  }
  reset() {
    this.move(0, false);
  }
  stop() {
    this.reset();
  }
  restart() {
    this.assertActive();
    try {
      this.move(0, true);
    } finally {
      this.schedule();
    }
  }
  setSpeed(speed: number) {
    this.assertActive();
    speed = positive(speed, 'Speed');
    if (speed === this.snapshot.speed) return;
    try {
      this.update({ speed });
    } finally {
      this.schedule();
    }
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTimer();
    this.listeners.clear();
    this.checkpoints.clear();
    this.events = [];
    this.snapshot = Object.freeze({ ...this.snapshot, playing: false });
  }
}

export function createPlayback<I, R, E extends CustomEvent>(
  algorithm: Algorithm<I, R, E>,
  trace: Trace<I, R>,
  options?: PlaybackOptions,
): Playback {
  const checked = validateTrace(
    trace,
    algorithm,
    (value): value is R => isJson(value),
    options?.maxEvents,
  );
  return new Playback(
    (state, event) => reduceEvent(algorithm, state, event as BuiltinEvent | E),
    algorithm.initial(structuredClone(checked.input)),
    checked.events,
    options,
  );
}
