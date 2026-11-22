import { defineAlgorithm } from '@gve/core';
import type { BuiltinEvent, VisualEdge, VisualNode } from '@gve/core';
import { numbers } from './sorting.js';

interface GraphInput { vertices: string[]; edges: [string, string][]; start: string }
const graphExample: GraphInput = {
  vertices: ['A', 'B', 'C', 'D', 'E'], edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'E']], start: 'A',
};
function graphInput(value: unknown): value is GraphInput {
  if (!value || typeof value !== 'object') return false;
  const { vertices, edges, start } = value as Partial<GraphInput>;
  if (!Array.isArray(vertices) || !Array.from(vertices).every(node => typeof node === 'string' && node.length > 0)) return false;
  const ids = new Set(vertices);
  return ids.size === vertices.length && typeof start === 'string' && ids.has(start) &&
    Array.isArray(edges) && Array.from(edges).every(edge =>
      Array.isArray(edge) && edge.length === 2 && ids.has(edge[0]) && ids.has(edge[1]));
}
function traversal(breadthFirst: boolean) {
  return defineAlgorithm({
    metadata: {
      id: breadthFirst ? 'bfs' : 'dfs', title: breadthFirst ? 'Breadth-first Search' : 'Depth-first Search',
      category: 'Graphs', description: breadthFirst ? 'Visit reachable vertices in queue order.' : 'Follow outgoing edges before backtracking.',
      code: [breadthFirst ? 'remove the first pending vertex' : 'remove the last pending vertex',
        'visit the vertex and add its outgoing neighbors', 'return the reachable vertices in visit order'],
      examples: [graphExample],
    },
    input: graphInput,
    initial: input => ({
      kind: 'graph', values: [], nodes: input.vertices.map(id => ({ id, label: id })),
      edges: input.edges.map(([from, to]) => ({ from, to })),
    }),
    *execute({ edges, start }) {
      const adjacency = new Map<string, string[]>();
      for (const [from, to] of edges) {
        const neighbors = adjacency.get(from) ?? [];
        neighbors.push(to);
        adjacency.set(from, neighbors);
      }
      const pending: { id: string; from?: string }[] = [{ id: start }];
      const seen = new Set<string>();
      const result: string[] = [];
      let head = 0;
      while (head < pending.length) {
        const { id, from } = breadthFirst ? pending[head++] : pending.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        result.push(id);
        yield { type: 'highlight', targets: [id], ...(from === undefined ? {} : { edge: { from, to: id } }),
          line: 1, explanation: `Visit vertex ${id}.` };
        const neighbors = adjacency.get(id) ?? [];
        for (const neighbor of breadthFirst ? neighbors : [...neighbors].reverse()) {
          if (!seen.has(neighbor)) pending.push({ id: neighbor, from: id });
        }
        yield { type: 'variable', name: 'visited', value: [...result], line: 2 };
      }
      yield { type: 'highlight', targets: [], line: 3, explanation: 'Traversal finished.' };
      return result;
    },
  });
}
export const bfs = traversal(true);
export const dfs = traversal(false);

interface TreeEntry { id: string; value: number; depth: number; left?: TreeEntry; right?: TreeEntry }
export const bstInsertion = defineAlgorithm({
  metadata: {
    id: 'bst-insertion', title: 'BST Insertion', category: 'Trees',
    description: 'Insert smaller values on the left and larger or equal values on the right.',
    code: ['compare with the current node', 'attach the new node at the first empty branch'],
    examples: [[8, 3, 10, 1, 6, 14, 4]],
  },
  input: numbers,
  initial: () => ({ kind: 'tree', values: [] }),
  *execute(input) {
    let root: TreeEntry | undefined;
    const nodes: VisualNode[] = [];
    const edges: VisualEdge[] = [];
    for (const [index, value] of input.entries()) {
      let parent: TreeEntry | undefined;
      let cursor = root;
      let branch: 'left' | 'right' = 'left';
      while (cursor) {
        yield { type: 'highlight', targets: [cursor.id], line: 1, explanation: `Compare ${value} with ${cursor.value}.` };
        parent = cursor;
        branch = value < cursor.value ? 'left' : 'right';
        cursor = cursor[branch];
      }
      const entry = { id: String(index), value, depth: parent ? parent.depth + 1 : 0 };
      const node = { id: entry.id, label: String(value), depth: entry.depth };
      if (parent) parent[branch] = entry;
      else root = entry;
      nodes.push(node);
      yield { type: 'node', node, line: 2, explanation: `Insert ${value}.` };
      if (parent) {
        const edge = { from: parent.id, to: entry.id };
        edges.push(edge);
        yield { type: 'edge', edge, line: 2 };
      }
      yield { type: 'highlight', targets: [entry.id], line: 2 };
    }
    return { nodes, edges };
  },
});

type StackOperation = { op: 'push'; value: number } | { op: 'pop' };
const stackInput = (value: unknown): value is StackOperation[] =>
  Array.isArray(value) && Array.from(value).every(item => item &&
    (item.op === 'pop' || (item.op === 'push' && typeof item.value === 'number' && Number.isFinite(item.value))));
export const stackOperations = defineAlgorithm<StackOperation[], number[]>({
  metadata: {
    id: 'stack-operations', title: 'Stack Operations', category: 'Data Structures',
    description: 'Push and pop values in last-in, first-out order.', code: ['apply the next stack operation'],
    examples: [[{ op: 'push', value: 4 }, { op: 'push', value: 7 }, { op: 'pop' }, { op: 'push', value: 2 }]],
  },
  input: stackInput,
  initial: () => ({ kind: 'stack', values: [] }),
  *execute(operations) {
    const values: number[] = [];
    for (const operation of operations) {
      let value: number | undefined;
      if (operation.op === 'push') {
        value = operation.value;
        values.push(value);
      } else {
        value = values.pop();
      }
      yield { type: 'values', values: [...values], line: 1,
        explanation: operation.op === 'push' ? `Push ${value}.` : value === undefined ? 'The stack is empty.' : `Pop ${value}.` };
      yield { type: 'variable', name: 'size', value: values.length, line: 1 };
    }
    return values;
  },
});
export const fibonacci = defineAlgorithm({
  metadata: {
    id: 'fibonacci', title: 'Fibonacci Recursion', category: 'Recursion',
    description: 'Expand Fibonacci calls recursively. Inputs 0 through 12 keep the call tree readable.',
    code: ['enter fib(n)', 'return n if n < 2', 'return fib(n − 1) + fib(n − 2)'], examples: [5],
  },
  input: (value): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 12,
  initial: () => ({ kind: 'recursion', values: [] }),
  *execute(input) {
    let counter = 0;
    function* visit(n: number, depth: number, parent?: string): Generator<BuiltinEvent, number> {
      const id = String(counter++);
      const label = `fib(${n})`;
      yield { type: 'node', node: { id, label, depth }, line: 1 };
      if (parent !== undefined) yield { type: 'edge', edge: { from: parent, to: id }, line: 1 };
      yield { type: 'call', label, line: 1, explanation: `Enter ${label}.` };
      yield { type: 'highlight', targets: [id], line: 1 };
      const result: number = n < 2 ? n : (yield* visit(n - 1, depth + 1, id)) + (yield* visit(n - 2, depth + 1, id));
      yield { type: 'highlight', targets: [id], line: n < 2 ? 2 : 3, explanation: `${label} returns ${result}.` };
      yield { type: 'return', line: n < 2 ? 2 : 3 };
      return result;
    }
    return yield* visit(input, 0);
  },
});
