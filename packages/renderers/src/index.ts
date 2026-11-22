import { isJson } from '@gvejs/core';
import type { Json, VisualState } from '@gvejs/core';
export interface Cell {
  key: string;
  label: string;
  active: boolean;
  magnitude?: number;
  pointers: string[];
}
export interface PositionedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  active: boolean;
}
export interface Diagram {
  width: number;
  height: number;
  nodes: PositionedNode[];
  edges: { from: PositionedNode; to: PositionedNode; active: boolean }[];
}
export const formatValue = (value: Json) =>
  typeof value === 'string'
    ? value
    : isJson(value)
      ? JSON.stringify(value)
      : 'Invalid value';
export function layoutCells(state: VisualState): Cell[][] {
  const values = Array.isArray(state.values) ? state.values : [];
  const active = new Set(Array.isArray(state.active) ? state.active : []);
  const rows =
    state.kind === 'matrix'
      ? Array.isArray(state.matrix)
        ? state.matrix.filter(Array.isArray)
        : []
      : state.kind === 'stack'
        ? [...values].reverse().map((value) => [value])
        : [values];
  const max = values.reduce<number>(
    (largest, value) =>
      typeof value === 'number'
        ? Number.isFinite(value)
          ? Math.max(largest, Math.abs(value))
          : largest
        : largest,
    1,
  );
  let offset = 0;
  return rows.map((row) =>
    row.map((value) => {
      const index =
        state.kind === 'stack' ? values.length - 1 - offset++ : offset++;
      return {
        key: String(index),
        label: formatValue(value),
        active: active.has(index),
        magnitude:
          state.kind === 'array' &&
          typeof value === 'number' &&
          Number.isFinite(value)
            ? Math.abs(value) / max
            : undefined,
        pointers: Object.entries(state.pointers ?? {})
          .filter(([, target]) => target === index)
          .map(([name]) => name),
      };
    }),
  );
}
export function layoutDiagram(state: VisualState): Diagram {
  const nodes = Array.isArray(state.nodes) ? state.nodes : [];
  const active = new Set(Array.isArray(state.active) ? state.active : []);
  const seen = new Set<string>();
  const layers = new Map<number, (typeof nodes)[number][]>();
  for (const node of nodes) {
    if (
      !node ||
      typeof node.id !== 'string' ||
      typeof node.label !== 'string' ||
      seen.has(node.id)
    )
      continue;
    seen.add(node.id);
    const depth =
      Number.isSafeInteger(node.depth) && node.depth >= 0
        ? Math.min(node.depth, nodes.length)
        : 0;
    const layer = state.kind === 'linked' || state.kind === 'graph' ? 0 : depth;
    const row = layers.get(layer);
    if (row) row.push(node);
    else layers.set(layer, [node]);
  }
  const width = Array.from(layers.values()).reduce(
    (max, row) => Math.max(max, row.length * 92 + 48),
    420,
  );
  const height =
    state.kind === 'graph'
      ? 360
      : Array.from(layers.keys()).reduce(
          (max, depth) => Math.max(max, 110 + depth * 74),
          140,
        );
  const positioned: PositionedNode[] = [];
  for (const [depth, row] of layers) {
    row.forEach((node, index) => {
      const angle = (index / row.length) * Math.PI * 2 - Math.PI / 2;
      positioned.push({
        id: node.id,
        label: node.label,
        x:
          state.kind === 'graph'
            ? width / 2 +
              (row.length === 1 ? 0 : Math.cos(angle) * (width / 2 - 54))
            : ((index + 1) * width) / (row.length + 1),
        y:
          state.kind === 'graph'
            ? height / 2 + (row.length === 1 ? 0 : Math.sin(angle) * 125)
            : 55 + depth * 74,
        active: active.has(node.id),
      });
    });
  }
  const byId = new Map(positioned.map((node) => [node.id, node]));
  const edges = (Array.isArray(state.edges) ? state.edges : []).flatMap(
    (edge) => {
      if (!edge) return [];
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      return from && to
        ? [
            {
              from,
              to,
              active:
                state.activeEdge?.from === edge.from &&
                state.activeEdge?.to === edge.to,
            },
          ]
        : [];
    },
  );
  return { width, height, nodes: positioned, edges };
}
