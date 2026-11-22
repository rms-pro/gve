import { defineAlgorithm } from '@gvejs/core';
import type { BuiltinEvent } from '@gvejs/core';
import { numbers } from './sorting.js';

interface SearchInput { values: number[]; target: number }
function isSearchInput(value: unknown): value is SearchInput {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<SearchInput>;
  return numbers(input.values) && typeof input.target === 'number' && Number.isFinite(input.target);
}
function search(
  id: string, title: string, description: string, code: string[],
  input: typeof isSearchInput, execute: (input: SearchInput) => Generator<BuiltinEvent, number>,
) {
  return defineAlgorithm({
    metadata: { id, title, category: 'Searching', description, code, examples: [{ values: [1, 3, 5, 7, 9], target: 7 }] },
    input,
    initial: ({ values, target }) => ({ kind: 'array', values, variables: { target } }),
    execute,
  });
}
export const linearSearch = search('linear-search', 'Linear Search', 'Scan from left to right for the target.',
  ['check the current value', 'return the matching index or −1'], isSearchInput,
  function* ({ values, target }) {
    let index = -1;
    for (let i = 0; i < values.length; i++) {
      yield { type: 'highlight', targets: [i], line: 1, explanation: `Compare ${values[i]} with ${target}.` };
      if (values[i] === target) { index = i; break; }
    }
    yield { type: 'variable', name: 'result', value: index, line: 2, explanation: index < 0 ? 'Target not found.' : 'Target found.' };
    return index;
  });
export const binarySearch = search('binary-search', 'Binary Search', 'Halve the search range on each comparison. Input must be sorted.',
  ['inspect the midpoint', 'return the matching index or −1'],
  (value): value is SearchInput => isSearchInput(value) && value.values.every((n, i, a) => i === 0 || a[i - 1] <= n),
  function* ({ values, target }) {
    let low = 0, high = values.length - 1, result = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      yield { type: 'pointer', name: 'low', target: low, line: 1 };
      yield { type: 'pointer', name: 'high', target: high, line: 1 };
      yield { type: 'highlight', targets: [mid], line: 1, explanation: `Compare midpoint ${values[mid]} with ${target}.` };
      if (values[mid] === target) { result = mid; break; }
      if (values[mid] < target) low = mid + 1;
      else high = mid - 1;
    }
    yield { type: 'variable', name: 'result', value: result, line: 2, explanation: result < 0 ? 'Target not found.' : 'Target found.' };
    return result;
  });
