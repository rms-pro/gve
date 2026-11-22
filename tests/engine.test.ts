import { describe, expect, it, vi } from 'vitest';
import * as algorithms from '@gve/algorithms';
import { isEvent, parseTrace, serializeTrace } from '@gve/core';
import { layoutCells, layoutDiagram } from '@gve/renderers';
import { createPlayback, generateTrace, streamExecution } from '@gve/runtime';
import { gnomeSort } from '../examples/gnome-sort.js';

const sorts = [
  algorithms.bubbleSort,
  algorithms.selectionSort,
  algorithms.insertionSort,
  algorithms.mergeSort,
  algorithms.quickSort,
];
describe('algorithm results', () => {
  it.each(
    sorts.map((algorithm) => [algorithm.metadata.title, algorithm] as const),
  )('%s', (_, algorithm) => {
    for (const input of [
      [],
      [0],
      [8, -3, 5, 1, 5],
      Array.from({ length: 200 }, (_, i) => (i * 19) % 101),
    ]) {
      const expected = [...input].sort((a, b) => a - b);
      const trace = generateTrace(algorithm, input);
      const player = createPlayback(algorithm, trace);
      player.seek(trace.events.length);
      expect(trace.result).toEqual(expected);
      expect(player.getSnapshot().state.values).toEqual(expected);
    }
  });

  it('finds targets, handles empty searches and validates sorted input', () => {
    for (const algorithm of [
      algorithms.linearSearch,
      algorithms.binarySearch,
    ]) {
      expect(
        generateTrace(algorithm, { values: [1, 3, 4], target: 3 }).result,
      ).toBe(1);
      expect(generateTrace(algorithm, { values: [], target: 3 }).result).toBe(
        -1,
      );
    }
    expect(() =>
      generateTrace(algorithms.binarySearch, { values: [3, 1], target: 3 }),
    ).toThrow(/schema/);
  });

  it('traverses directed graphs in declared order', () => {
    expect(
      generateTrace(algorithms.bfs, algorithms.bfs.metadata.examples[0]).result,
    ).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(
      generateTrace(algorithms.dfs, algorithms.dfs.metadata.examples[0]).result,
    ).toEqual(['A', 'B', 'D', 'C', 'E']);
  });

  it('inserts duplicate BST values on the right, evaluates recursion and pops stacks', () => {
    expect(generateTrace(algorithms.bstInsertion, [4, 2, 4]).result).toEqual({
      nodes: [
        { id: '0', label: '4', depth: 0 },
        { id: '1', label: '2', depth: 1 },
        { id: '2', label: '4', depth: 1 },
      ],
      edges: [
        { from: '0', to: '1' },
        { from: '0', to: '2' },
      ],
    });
    expect(generateTrace(algorithms.fibonacci, 10).result).toBe(55);
    expect(
      generateTrace(algorithms.stackOperations, [
        { op: 'pop' },
        { op: 'push', value: 2 },
        { op: 'push', value: 8 },
        { op: 'pop' },
      ]).result,
    ).toEqual([2]);
  });
});

describe('execution and playback', () => {
  const algorithm = algorithms.bubbleSort;
  it('steps across checkpoints in both directions and replays deterministically', () => {
    const trace = generateTrace(algorithm, [3, 1, 2]);
    expect(trace.events.map((event) => event.type)).toEqual([
      'compare',
      'swap',
      'compare',
      'swap',
      'compare',
      'highlight',
    ]);
    const playback = createPlayback(algorithm, trace, {
      checkpointInterval: 2,
    });
    const states = [playback.getSnapshot().state];
    for (const event of trace.events) {
      expect(isEvent(event, algorithm)).toBe(true);
      playback.stepForward();
      states.push(playback.getSnapshot().state);
    }
    expect(states[2].values).toEqual([1, 3, 2]);
    expect(Object.isFrozen(states[2].values)).toBe(true);
    expect(states.at(-1)?.values).toEqual([1, 2, 3]);
    for (let i = trace.events.length - 1; i >= 0; i--) {
      playback.stepBackward();
      expect(playback.getSnapshot().state).toEqual(states[i]);
    }
    expect(generateTrace(algorithm, [3, 1, 2])).toEqual(trace);
    playback.seek(5);
    expect(playback.getSnapshot().state).toEqual(states[5]);
  });
  it('plays with adjustable speed and supports pause, resume, stop, and restart', () => {
    vi.useFakeTimers();
    try {
      const playback = createPlayback(
        algorithm,
        generateTrace(algorithm, [2, 1]),
        { frameMs: 40 },
      );
      playback.start();
      vi.advanceTimersByTime(40);
      expect(playback.getSnapshot().position).toBe(1);
      playback.pause();
      vi.advanceTimersByTime(40);
      expect(playback.getSnapshot().position).toBe(1);
      playback.setSpeed(2);
      playback.resume();
      vi.advanceTimersByTime(40);
      expect(playback.getSnapshot()).toMatchObject({
        position: 3,
        playing: false,
      });
      playback.restart();
      expect(playback.getSnapshot()).toMatchObject({
        position: 0,
        playing: true,
      });
      playback.stop();
      expect(playback.getSnapshot()).toMatchObject({
        position: 0,
        playing: false,
      });
    } finally {
      vi.useRealTimers();
    }
  });
  it('enforces limits and allows cancellation between streamed events', () => {
    const controller = new AbortController();
    const iterator = streamExecution(algorithm, [3, 2, 1], {
      signal: controller.signal,
    });
    expect(iterator.next().done).toBe(false);
    controller.abort();
    expect(() => iterator.next()).toThrow(/cancelled/);
    expect(() => generateTrace(algorithm, [2, 1], { maxEvents: 1 })).toThrow(
      /Event count/,
    );
    expect(() =>
      generateTrace(algorithm, [2, 1], { maxInputBytes: 3 }),
    ).toThrow(/Input size/);
    expect(() =>
      generateTrace(algorithm, [2, 1], { maxTraceBytes: 3 }),
    ).toThrow(/Trace size/);
    expect(() => generateTrace(algorithm, ['invalid'])).toThrow(/schema/);
    expect(() => generateTrace(algorithm, () => null)).toThrow(/schema/);
  });
  it('validates and round-trips versioned traces with registered custom events', () => {
    const trace = generateTrace(gnomeSort, [3, 1, 2]);
    const result = (value: unknown): value is number[] =>
      gnomeSort.input(value);
    expect(parseTrace(serializeTrace(trace), gnomeSort, result)).toEqual(trace);
    expect(() =>
      parseTrace(
        serializeTrace(trace).replace('"version":1', '"version":2'),
        gnomeSort,
        result,
      ),
    ).toThrow();
    expect(
      isEvent({ type: 'example:move', payload: { index: '1' } }, gnomeSort),
    ).toBe(false);
    expect(isEvent({ type: 'other:event', payload: {} }, gnomeSort)).toBe(
      false,
    );
    expect(isEvent({ type: 'write', index: -1, value: 0 }, gnomeSort)).toBe(
      false,
    );
    expect(isEvent({ type: 'compare', a: 1, b: 0, line: 99 }, gnomeSort)).toBe(
      false,
    );
    const playback = createPlayback(gnomeSort, trace);
    playback.stepForward();
    expect(playback.getSnapshot().state.pointers).toEqual({ cursor: 1 });
    expect(trace.result).toEqual([1, 2, 3]);
  });
});

it('lays out reusable renderer state', () => {
  for (const kind of ['array', 'stack', 'queue', 'matrix'] as const) {
    expect(
      layoutCells({ kind, values: [1], matrix: [[1]], active: [0] })[0][0],
    ).toMatchObject({ label: '1', active: true });
  }
  for (const kind of ['graph', 'tree', 'linked', 'recursion'] as const) {
    const edge = { from: 'a', to: 'b' };
    const diagram = layoutDiagram({
      kind,
      values: [],
      nodes: [
        { id: 'a', label: 'a' },
        { id: 'b', label: 'b', depth: 1 },
      ],
      edges: [edge],
      activeEdge: edge,
    });
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges[0].active).toBe(true);
  }
});

it('skips malformed or duplicate diagram nodes and dangling edges', () => {
  const state = {
    kind: 'tree',
    values: [],
    nodes: [
      null,
      { id: 'a', label: 'First', depth: Number.MAX_SAFE_INTEGER },
      { id: 'a', label: 'Duplicate' },
    ],
    edges: [null, { from: 'a', to: 'missing' }],
  } as unknown as Parameters<typeof layoutDiagram>[0];
  const diagram = layoutDiagram(state);
  expect(diagram.nodes.map((node) => node.label)).toEqual(['First']);
  expect(diagram.edges).toEqual([]);
  expect(diagram.height).toBeLessThan(1000);
});
