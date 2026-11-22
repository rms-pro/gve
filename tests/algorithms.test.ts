import { expect, it } from 'vitest';
import * as algorithms from '@gve/algorithms';
import type { Algorithm } from '@gve/core';
import { isEvent } from '@gve/core';
import { createPlayback, generateTrace } from '@gve/runtime';

function verify<I, R>(algorithm: Algorithm<I, R>, input: NoInfer<I>) {
  const trace = generateTrace(algorithm, input);
  expect(trace).toEqual(generateTrace(algorithm, input));
  expect(trace.events.every((event) => isEvent(event, algorithm))).toBe(true);
  const session = createPlayback(algorithm, trace);
  session.seek(trace.events.length);
  const state = session.getSnapshot().state;
  session.reset();
  expect(session.getSnapshot().state.values).toEqual(
    algorithm.initial(input).values,
  );
  session.dispose();
  return { ...trace, state };
}
const sorts = [
  algorithms.bubbleSort,
  algorithms.selectionSort,
  algorithms.insertionSort,
  algorithms.mergeSort,
  algorithms.quickSort,
];
it.each(sorts.map((sort) => [sort.metadata.id, sort] as const))(
  '%s preserves the multiset and agrees with numeric ordering',
  (_, sort) => {
    let seed = 71;
    for (let size = 0; size < 24; size++) {
      const input = Array.from({ length: size }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return (seed % 13) - 6;
      });
      const expected = [...input].sort((a, b) => a - b);
      const { result, state } = verify(sort, input);
      expect(result).toEqual(expected);
      expect(state.values).toEqual(expected);
    }
    for (const input of [null, [Infinity], Array(1), ['1']])
      expect(() => generateTrace(sort, input)).toThrow();
  },
);

it('searches return matching positions and preserve their input', () => {
  for (const algorithm of [algorithms.linearSearch, algorithms.binarySearch]) {
    for (const values of [[], [1], [1, 1, 2, 2, 3]]) {
      for (const target of [0, 1, 2, 3, 4]) {
        const { result, state } = verify(algorithm, { values, target });
        expect(
          result === -1 ? values.includes(target) : values[result] !== target,
        ).toBe(false);
        if (algorithm === algorithms.linearSearch)
          expect(result).toBe(values.indexOf(target));
        expect(state.values).toEqual(values);
        expect(state.variables?.result).toBe(result);
      }
    }
    expect(() =>
      generateTrace(algorithm, { values: [], target: null }),
    ).toThrow();
  }
});

it('graph traversals handle cycles, duplicate edges and disconnected nodes', () => {
  const input = {
    vertices: ['a', 'b', 'c', 'd', 'e'],
    edges: [
      ['a', 'b'],
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['d', 'a'],
    ] as [string, string][],
    start: 'a',
  };
  for (const [algorithm, order] of [
    [algorithms.bfs, ['a', 'b', 'c', 'd']],
    [algorithms.dfs, ['a', 'b', 'd', 'c']],
  ] as const) {
    const { result, state } = verify(algorithm, input);
    expect(result).toEqual(order);
    expect(state.variables?.visited).toEqual(order);
    expect(
      verify(algorithm, { vertices: ['a'], edges: [], start: 'a' }).result,
    ).toEqual(['a']);
    for (const invalid of [
      { vertices: [], edges: [], start: 'a' },
      { ...input, edges: [['a', 'z']] },
      { ...input, vertices: ['a', 'a'] },
    ]) {
      expect(() => generateTrace(algorithm, invalid)).toThrow();
    }
  }
});

it('checks tree insertion ancestry and stack prefix semantics', () => {
  for (const input of [[], [2], [8, 4, 11, 4, 3, 5, 8]]) {
    const { result, state } = verify(algorithms.bstInsertion, input);
    expect(result.nodes.map((node) => Number(node.label))).toEqual(input);
    expect(result.edges).toHaveLength(Math.max(0, input.length - 1));
    expect(state.nodes ?? []).toEqual(result.nodes);
    expect(state.edges ?? []).toEqual(result.edges);
    for (const { from, to } of result.edges) {
      expect(Number(from)).toBeLessThan(Number(to));
      expect(result.nodes[Number(to)].depth).toBe(
        (result.nodes[Number(from)].depth ?? 0) + 1,
      );
    }
  }
  expect(() => generateTrace(algorithms.bstInsertion, ['x'])).toThrow();
  expect(verify(algorithms.stackOperations, []).result).toEqual([]);
  expect(verify(algorithms.stackOperations, [{ op: 'pop' }]).result).toEqual(
    [],
  );
  const stack = verify(algorithms.stackOperations, [
    { op: 'push', value: 2 },
    { op: 'push', value: 2 },
    { op: 'pop' },
  ]);
  expect(stack.result).toEqual([2]);
  expect(stack.state.values).toEqual([2]);
  expect(() =>
    generateTrace(algorithms.stackOperations, [{ op: 'push' }]),
  ).toThrow();
});

it('matches Fibonacci recurrence across its supported range and balances call frames', () => {
  let a = 0,
    b = 1;
  for (let n = 0; n <= 12; n++) {
    const { result, events, state } = verify(algorithms.fibonacci, n);
    expect(result).toBe(a);
    [a, b] = [b, a + b];
    let depth = 0;
    for (const event of events) {
      if (event.type === 'call') depth++;
      if (event.type === 'return') depth--;
      expect(depth).toBeGreaterThanOrEqual(0);
    }
    expect(depth).toBe(0);
    expect(state.frames).toEqual([]);
  }
  for (const value of [null, -1, 0.5, 13])
    expect(() => generateTrace(algorithms.fibonacci, value)).toThrow();
});
