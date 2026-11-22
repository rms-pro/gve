import { afterEach, expect, it, vi } from 'vitest';
import { bubbleSort } from '@gve/algorithms';
import { describeEvent, parseTrace, serializeTrace } from '@gve/core';
import { createPlayback, generateTrace } from '@gve/runtime';

const input = [3, 2, 1];
const trace = generateTrace(bubbleSort, input);
const player = () =>
  createPlayback(bubbleSort, trace, { frameMs: 20, checkpointInterval: 2 });
const result = bubbleSort.input;
afterEach(() => vi.useRealTimers());

it('handles zero and one event, with no timers once complete', () => {
  vi.useFakeTimers();
  const empty = createPlayback(bubbleSort, { ...trace, events: [] });
  empty.start();
  empty.stepForward();
  expect(empty.getSnapshot()).toMatchObject({ position: 0, playing: false });
  const single = createPlayback(
    bubbleSort,
    { ...trace, events: trace.events.slice(0, 1) },
    { frameMs: 10 },
  );
  single.start();
  vi.advanceTimersByTime(10);
  expect(single.getSnapshot()).toMatchObject({ position: 1, playing: false });
  expect(vi.getTimerCount()).toBe(0);
});

it('changes a running timer, atomically resets, and replays after completion', () => {
  vi.useFakeTimers();
  const session = player();
  const snapshots: unknown[] = [];
  session.subscribe(() => snapshots.push(session.getSnapshot()));
  session.start();
  vi.advanceTimersByTime(20);
  session.setSpeed(2);
  vi.advanceTimersByTime(10);
  expect(session.getSnapshot().position).toBe(2);
  snapshots.length = 0;
  session.reset();
  expect(snapshots).toEqual([
    expect.objectContaining({ position: 0, playing: false }),
  ]);
  vi.advanceTimersByTime(100);
  expect(session.getSnapshot().position).toBe(0);
  session.restart();
  vi.runAllTimers();
  expect(session.getSnapshot()).toMatchObject({
    position: trace.events.length,
    playing: false,
  });
  session.restart();
  expect(session.getSnapshot()).toMatchObject({ position: 0, playing: true });
  session.dispose();
  session.dispose();
  expect(session.getSnapshot().playing).toBe(false);
  expect(() => session.resume()).toThrow(/disposed/);
  expect(() => session.subscribe(() => {})).toThrow(/disposed/);
  expect(vi.getTimerCount()).toBe(0);
});

it('keeps independent sessions and handles reentrant actions without duplicate timers', () => {
  vi.useFakeTimers();
  const first = player();
  const second = player();
  const unsubscribe = first.subscribe(() => {
    if (first.getSnapshot().position === 1) first.pause();
  });
  first.start();
  second.start();
  vi.advanceTimersByTime(40);
  expect(first.getSnapshot()).toMatchObject({ position: 1, playing: false });
  expect(second.getSnapshot()).toMatchObject({ position: 2, playing: true });
  unsubscribe();
  for (let i = 0; i < 20; i++) {
    first.restart();
    first.pause();
    first.seek(4);
    first.stepBackward();
    first.resume();
  }
  expect(vi.getTimerCount()).toBe(2);
  vi.runAllTimers();
  expect(first.getSnapshot().position).toBe(trace.events.length);
  expect(second.getSnapshot().position).toBe(trace.events.length);
});

it('validates trace envelopes, sparse events, size and nesting limits', () => {
  expect(() =>
    createPlayback(bubbleSort, { ...trace, events: Array(1) }),
  ).toThrow(/invalid event/);
  expect(() =>
    createPlayback(bubbleSort, {
      ...trace,
      events: null,
    } as unknown as typeof trace),
  ).toThrow(/schema/);
  expect(() =>
    parseTrace(serializeTrace(trace), bubbleSort, result, { maxEvents: 1 }),
  ).toThrow(/count/);
  expect(() =>
    parseTrace(serializeTrace(trace), bubbleSort, result, {
      maxSourceLength: 10,
    }),
  ).toThrow(/length/);
  const source = JSON.stringify(trace).replace(
    '"result":[1,2,3]',
    `"result":${'['.repeat(1000)}0${']'.repeat(1000)}`,
  );
  expect(() => parseTrace(source, bubbleSort, result)).toThrow(/schema/);
  expect(
    describeEvent(parseTrace(serializeTrace(trace), bubbleSort, result), 1),
  ).toEqual({
    algorithm: 'bubble-sort',
    sequence: 1,
    id: 'bubble-sort:1',
    event: trace.events[1],
  });
});

it('stores prototype-like variable names as isolated own properties', () => {
  const serialized = JSON.stringify({
    ...trace,
    events: [
      { type: 'variable', name: '__proto__', value: { gvePolluted: true } },
    ],
  });
  const session = createPlayback(
    bubbleSort,
    parseTrace(serialized, bubbleSort, result),
  );
  session.stepForward();
  const variables = session.getSnapshot().state.variables!;
  expect(Object.hasOwn(variables, '__proto__')).toBe(true);
  expect(Object.getPrototypeOf(variables)).toBe(Object.prototype);
  expect(Reflect.has({}, 'gvePolluted')).toBe(false);
  session.dispose();
});

it('rejects non-string trace sources before coercion and oversized sparse values', () => {
  const source = {
    toString() {
      throw new Error('unexpected coercion');
    },
  };
  expect(() =>
    parseTrace(source as unknown as string, bubbleSort, result),
  ).toThrow(/must be a string/);
  const sparse = new Array(1_000_000);
  expect(() =>
    createPlayback(bubbleSort, {
      ...trace,
      events: [{ type: 'values', values: sparse }],
    }),
  ).toThrow(/invalid event/);
});
