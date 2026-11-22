import { defineAlgorithm } from '@gvejs/core';
import type { CustomEvent, Schema } from '@gvejs/core';

type Move = CustomEvent<{ index: number }> & { type: 'example:move' };
const moveSchema: Schema<Move['payload']> = (value): value is Move['payload'] =>
  typeof value === 'object' && value !== null && 'index' in value &&
  typeof value.index === 'number' && Number.isSafeInteger(value.index) && value.index >= 0;

export const gnomeSort = defineAlgorithm<number[], number[], Move>({
  metadata: {
    id: 'gnome-sort',
    title: 'Gnome Sort',
    category: 'Sorting',
    description: 'Walk forward on ordered pairs and step back after swapping an inversion.',
    code: ['move the cursor', 'compare neighbors', 'swap inverted neighbors', 'return the ordered values'],
    examples: [[4, 2, 3, 1]],
  },
  input: (value): value is number[] =>
    Array.isArray(value) && Array.from(value).every(item => typeof item === 'number' && Number.isFinite(item)),
  initial: input => ({ kind: 'array', values: [...input] }),
  customEvents: { 'example:move': moveSchema },
  reduceCustom: (state, event) => ({
    ...state,
    pointers: { cursor: event.payload.index },
    variables: { ...state.variables, cursor: event.payload.index },
  }),
  *execute(input) {
    const values = [...input];
    let index = 1;
    while (index < values.length) {
      yield { type: 'example:move', payload: { index }, line: 1, explanation: `Inspect position ${index}.` };
      yield { type: 'compare', a: index - 1, b: index, line: 2 };
      if (values[index - 1] <= values[index]) {
        index++;
      } else {
        [values[index - 1], values[index]] = [values[index], values[index - 1]];
        yield { type: 'swap', a: index - 1, b: index, line: 3, explanation: 'Swap an inverted pair.' };
        index = Math.max(1, index - 1);
      }
    }
    yield { type: 'highlight', targets: [], line: 4, explanation: 'The array is sorted.' };
    return values;
  },
});
