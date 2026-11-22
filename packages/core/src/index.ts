export type Json =
  | null
  | boolean
  | number
  | string
  | readonly Json[]
  | { readonly [key: string]: Json };
export type Schema<T> = (value: unknown) => value is T;
export type ViewKind =
  | 'array'
  | 'graph'
  | 'tree'
  | 'matrix'
  | 'stack'
  | 'queue'
  | 'linked'
  | 'recursion'
  | `${string}:${string}`;
export interface VisualNode {
  id: string;
  label: string;
  depth?: number;
}
export interface VisualEdge {
  from: string;
  to: string;
}
export interface VisualState {
  kind: ViewKind;
  values: readonly Json[];
  nodes?: readonly VisualNode[];
  edges?: readonly VisualEdge[];
  matrix?: readonly (readonly Json[])[];
  active?: readonly (string | number)[];
  activeEdge?: VisualEdge;
  pointers?: Readonly<Record<string, string | number>>;
  variables?: Readonly<Record<string, Json>>;
  frames?: readonly string[];
  line?: number;
  explanation?: string;
}
export interface RendererRegistration<T> {
  kind: ViewKind;
  render: (state: VisualState) => T;
}

interface Location {
  line?: number;
  explanation?: string;
  metadata?: Readonly<Record<string, Json>>;
}
type Target = string | number;
export type BuiltinEvent = Location &
  (
    | { type: 'compare'; a: number; b: number }
    | { type: 'swap'; a: number; b: number }
    | { type: 'write'; index: number; value: Json }
    | { type: 'values'; values: readonly Json[] }
    | { type: 'highlight'; targets: readonly Target[]; edge?: VisualEdge }
    | { type: 'pointer'; name: string; target: Target }
    | { type: 'node'; node: VisualNode }
    | { type: 'edge'; edge: VisualEdge }
    | { type: 'variable'; name: string; value: Json }
    | { type: 'call'; label: string }
    | { type: 'return' }
  );
export type CustomEvent<P extends Json = Json> = Location & {
  type: `${string}:${string}`;
  payload: P;
};
export type ExecutionEvent = BuiltinEvent | CustomEvent;
export interface Metadata<I> {
  id: string;
  title: string;
  category: string;
  description: string;
  code: readonly string[];
  examples: readonly I[];
}
export interface Algorithm<I, R, E extends CustomEvent = never> {
  metadata: Metadata<I>;
  input: Schema<I>;
  initial: (input: I) => VisualState;
  execute: (input: I) => Generator<BuiltinEvent | E, R>;
  customEvents?: {
    [K in E['type']]: Schema<Extract<E, { type: K }>['payload']>;
  };
  reduceCustom?: (state: VisualState, event: E) => VisualState;
}
export interface Trace<I, R> {
  version: 1;
  algorithm: string;
  input: I;
  events: readonly ExecutionEvent[];
  result: R;
}
export class GveError extends Error {
  constructor(
    readonly code:
      | 'input'
      | 'event'
      | 'trace'
      | 'limit'
      | 'cancelled'
      | 'disposed',
    message: string,
  ) {
    super(message);
    this.name = 'GveError';
  }
}
export function defineAlgorithm<I, R>(
  definition: Algorithm<I, R>,
): Algorithm<I, R>;
export function defineAlgorithm<I, R, E extends CustomEvent>(
  definition: Algorithm<I, R, E>,
): Algorithm<I, R, E>;
export function defineAlgorithm<T>(definition: T) {
  return definition;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
function denseEvery(
  values: readonly unknown[],
  predicate: (value: unknown) => boolean,
): boolean {
  for (let i = 0; i < values.length; i++) {
    if (!Object.hasOwn(values, i) || !predicate(values[i])) return false;
  }
  return true;
}
export function isJson(value: unknown): value is Json {
  const visiting = new Set<object>();
  function check(item: unknown, depth = 0): boolean {
    if (depth > 64) return false;
    if (item === null || typeof item === 'boolean' || typeof item === 'string')
      return true;
    if (typeof item === 'number') return Number.isFinite(item);
    if ((!Array.isArray(item) && !record(item)) || visiting.has(item))
      return false;
    visiting.add(item);
    const valid = Array.isArray(item)
      ? denseEvery(item, (child) => check(child, depth + 1))
      : Object.values(item).every((child) => check(child, depth + 1));
    visiting.delete(item);
    return valid;
  }
  return check(value);
}
const index = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;
const target = (value: unknown): value is Target =>
  typeof value === 'string' || index(value);
const edge = (value: unknown): value is VisualEdge =>
  record(value) &&
  typeof value.from === 'string' &&
  typeof value.to === 'string';

export function isEvent<I, R, E extends CustomEvent>(
  value: unknown,
  algorithm: Algorithm<I, R, E>,
): value is BuiltinEvent | E {
  if (!record(value) || typeof value.type !== 'string' || !isJson(value))
    return false;
  if (
    value.line !== undefined &&
    (!index(value.line) ||
      value.line < 1 ||
      value.line > algorithm.metadata.code.length)
  )
    return false;
  if (value.metadata !== undefined && !record(value.metadata)) return false;
  if (value.explanation !== undefined && typeof value.explanation !== 'string')
    return false;
  switch (value.type) {
    case 'compare':
    case 'swap':
      return index(value.a) && index(value.b);
    case 'write':
      return index(value.index) && isJson(value.value);
    case 'values':
      return Array.isArray(value.values);
    case 'highlight':
      return (
        Array.isArray(value.targets) &&
        value.targets.every(target) &&
        (value.edge === undefined || edge(value.edge))
      );
    case 'pointer':
      return typeof value.name === 'string' && target(value.target);
    case 'node':
      return (
        record(value.node) &&
        typeof value.node.id === 'string' &&
        typeof value.node.label === 'string' &&
        (value.node.depth === undefined || index(value.node.depth))
      );
    case 'edge':
      return edge(value.edge);
    case 'variable':
      return typeof value.name === 'string' && isJson(value.value);
    case 'call':
      return typeof value.label === 'string';
    case 'return':
      return true;
    default: {
      const schemas: Readonly<Record<string, Schema<Json>>> | undefined =
        algorithm.customEvents;
      return (
        /^[\w-]+:[\w.-]+$/.test(value.type) &&
        !!schemas &&
        Object.hasOwn(schemas, value.type) &&
        isJson(value.payload) &&
        schemas[value.type](value.payload)
      );
    }
  }
}
export function serializeTrace<I, R>(trace: Trace<I, R>): string {
  if (!isJson(trace))
    throw new GveError('trace', 'Trace must contain JSON values.');
  return JSON.stringify(trace);
}
/** Identity is scoped to a trace. IDs are stable across serialization and replay. */
export function describeEvent(
  trace: Trace<unknown, unknown>,
  sequence: number,
) {
  if (!index(sequence) || !Object.hasOwn(trace.events, sequence)) {
    throw new GveError('event', 'Event sequence is out of bounds.');
  }
  return {
    id: `${trace.algorithm}:${sequence}`,
    sequence,
    algorithm: trace.algorithm,
    event: trace.events[sequence],
  };
}

export interface TraceReadLimits {
  maxSourceLength?: number;
  maxEvents?: number;
}

export function validateTrace<I, R, E extends CustomEvent>(
  value: unknown,
  algorithm: Algorithm<I, R, E>,
  result: Schema<R>,
  maxEvents = 100_000,
): Trace<I, R> {
  if (!Number.isSafeInteger(maxEvents) || maxEvents < 0)
    throw new RangeError('Invalid event limit.');
  if (
    !record(value) ||
    value.version !== 1 ||
    value.algorithm !== algorithm.metadata.id ||
    !Array.isArray(value.events)
  ) {
    throw new GveError(
      'trace',
      'Trace does not match the algorithm or version 1 schema.',
    );
  }
  if (value.events.length > maxEvents)
    throw new GveError('limit', 'Event count exceeded.');
  if (
    !isJson(value.input) ||
    !algorithm.input(value.input) ||
    !isJson(value.result) ||
    !result(value.result)
  ) {
    throw new GveError(
      'trace',
      'Trace input or result does not match its schema.',
    );
  }
  if (!denseEvery(value.events, (event) => isEvent(event, algorithm))) {
    throw new GveError('event', 'Trace contains an invalid event.');
  }
  return {
    version: 1,
    algorithm: value.algorithm,
    input: value.input,
    events: value.events,
    result: value.result,
  };
}

export function parseTrace<I, R, E extends CustomEvent>(
  source: string,
  algorithm: Algorithm<I, R, E>,
  result: Schema<R>,
  limits: TraceReadLimits = {},
): Trace<I, R> {
  const maxSourceLength = limits.maxSourceLength ?? 16_000_000;
  const maxEvents = limits.maxEvents ?? 100_000;
  if (
    !Number.isSafeInteger(maxSourceLength) ||
    maxSourceLength < 1 ||
    !Number.isSafeInteger(maxEvents) ||
    maxEvents < 0
  ) {
    throw new RangeError('Invalid trace read limits.');
  }
  if (typeof source !== 'string')
    throw new GveError('trace', 'Trace source must be a string.');
  if (source.length > maxSourceLength)
    throw new GveError('limit', 'Trace source length exceeded.');
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new GveError('trace', 'Invalid trace JSON.');
  }
  return validateTrace(value, algorithm, result, maxEvents);
}
export function reduceEvent<I, R, E extends CustomEvent>(
  algorithm: Algorithm<I, R, E>,
  state: VisualState,
  event: BuiltinEvent | E,
): VisualState {
  const next = {
    ...state,
    line: event.line ?? state.line,
    explanation: event.explanation ?? state.explanation,
  };
  switch (event.type) {
    case 'compare':
      if (event.a >= state.values.length || event.b >= state.values.length)
        throw new GveError('event', 'Comparison index out of bounds.');
      return { ...next, active: [event.a, event.b] };
    case 'swap': {
      const values = [...state.values];
      if (event.a >= values.length || event.b >= values.length)
        throw new GveError('event', 'Swap index out of bounds.');
      [values[event.a], values[event.b]] = [values[event.b], values[event.a]];
      return { ...next, values, active: [event.a, event.b] };
    }
    case 'write': {
      if (event.index >= state.values.length)
        throw new GveError('event', 'Write index out of bounds.');
      const values = [...state.values];
      values[event.index] = event.value;
      return { ...next, values, active: [event.index] };
    }
    case 'values':
      return { ...next, values: event.values, active: [] };
    case 'highlight':
      return { ...next, active: event.targets, activeEdge: event.edge };
    case 'pointer':
      return {
        ...next,
        pointers: { ...state.pointers, [event.name]: event.target },
      };
    case 'node':
      return { ...next, nodes: [...(state.nodes ?? []), event.node] };
    case 'edge':
      return { ...next, edges: [...(state.edges ?? []), event.edge] };
    case 'variable':
      return {
        ...next,
        variables: { ...state.variables, [event.name]: event.value },
      };
    case 'call':
      return { ...next, frames: [...(state.frames ?? []), event.label] };
    case 'return':
      return { ...next, frames: state.frames?.slice(0, -1) };
    default:
      return algorithm.reduceCustom?.(next, event as E) ?? next;
  }
}
