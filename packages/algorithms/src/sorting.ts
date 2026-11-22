import { defineAlgorithm } from '@gvejs/core';
import type { BuiltinEvent } from '@gvejs/core';

export const numbers = (value: unknown): value is number[] =>
  Array.isArray(value) && Array.from(value).every(n => typeof n === 'number' && Number.isFinite(n));
const compare = (a: number, b: number, explanation = 'Compare the highlighted values.'): BuiltinEvent =>
  ({ type: 'compare', a, b, line: 1, explanation });
const swap = (values: number[], a: number, b: number): BuiltinEvent => {
  [values[a], values[b]] = [values[b], values[a]];
  return { type: 'swap', a, b, line: 2, explanation: 'Swap the highlighted values.' };
};
export function sorting(
  id: string, title: string, description: string, code: string[],
  execute: (values: number[]) => Generator<BuiltinEvent, void>,
) {
  return defineAlgorithm({
    metadata: { id, title, category: 'Sorting', description, code, examples: [[8, 3, 5, 1, 9, 4, 7, 2]] },
    input: numbers,
    initial: input => ({ kind: 'array', values: [...input] }),
    *execute(input) {
      const values = [...input];
      yield* execute(values);
      yield { type: 'highlight', targets: [], line: code.length, explanation: 'The array is sorted.' };
      return values;
    },
  });
}
export const bubbleSort = sorting('bubble-sort', 'Bubble Sort',
  'Compare adjacent values and move the largest unsorted value to the end on each pass.',
  ['for each adjacent pair in the unsorted prefix', '  swap if the left value is larger', 'return the sorted array'],
  function* (values) {
    for (let end = values.length - 1; end > 0; end--) {
      let changed = false;
      for (let i = 0; i < end; i++) {
        yield compare(i, i + 1);
        if (values[i] > values[i + 1]) {
          yield swap(values, i, i + 1);
          changed = true;
        }
      }
      if (!changed) break;
    }
  });
export const selectionSort = sorting('selection-sort', 'Selection Sort',
  'Find the smallest value in the unsorted suffix and place it at the next sorted position.',
  ['scan the unsorted suffix for its minimum', 'place the minimum at the start of the suffix', 'return the sorted array'],
  function* (values) {
    for (let i = 0; i < values.length - 1; i++) {
      let minimum = i;
      for (let j = i + 1; j < values.length; j++) {
        yield compare(minimum, j);
        if (values[j] < values[minimum]) minimum = j;
      }
      if (minimum !== i) yield swap(values, i, minimum);
    }
  });
export const insertionSort = sorting('insertion-sort', 'Insertion Sort',
  'Grow a sorted prefix by moving each new value left until it reaches its position.',
  ['compare the new value with its left neighbor', 'move the new value left if needed', 'return the sorted array'],
  function* (values) {
    for (let i = 1; i < values.length; i++) {
      for (let j = i; j > 0; j--) {
        yield compare(j - 1, j);
        if (values[j - 1] <= values[j]) break;
        yield swap(values, j - 1, j);
      }
    }
  });
export const mergeSort = sorting('merge-sort', 'Merge Sort',
  'Merge adjacent sorted runs, doubling the run size after each pass.',
  ['compare the heads of adjacent runs', 'write merged values into the destination range', 'return the sorted array'],
  function* (values) {
    for (let width = 1; width < values.length; width *= 2) {
      for (let left = 0; left + width < values.length; left += width * 2) {
        const mid = left + width;
        const end = Math.min(mid + width, values.length);
        const merged: number[] = [];
        let a = left, b = mid;
        while (a < mid && b < end) {
          yield compare(a, b);
          merged.push(values[a] <= values[b] ? values[a++] : values[b++]);
        }
        merged.push(...values.slice(a, mid), ...values.slice(b, end));
        for (const [offset, value] of merged.entries()) {
          const index = left + offset;
          values[index] = value;
          yield { type: 'write', index, value, line: 2, explanation: 'Write the next merged value.' };
        }
      }
    }
  });
export const quickSort = sorting('quick-sort', 'Quick Sort',
  'Partition around a pivot and repeat for the ranges on either side.',
  ['compare with the pivot at the end of the range', 'swap to partition the range', 'return the sorted array'],
  function* (values) {
    const pending: [number, number][] = [[0, values.length - 1]];
    while (pending.length) {
      const [start, end] = pending.pop()!;
      if (start >= end) continue;
      yield { type: 'pointer', name: 'pivot', target: end, line: 1 };
      let pivot = start;
      for (let i = start; i < end; i++) {
        yield compare(i, end, 'Compare the current value with the pivot.');
        if (values[i] < values[end]) {
          if (pivot !== i) yield swap(values, pivot, i);
          pivot++;
        }
      }
      if (pivot !== end) yield swap(values, pivot, end);
      pending.push([pivot + 1, end], [start, pivot - 1]);
    }
  });
