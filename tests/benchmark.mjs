import { bubbleSort, mergeSort, fibonacci } from '@gvejs/algorithms';
import { createPlayback, generateTrace } from '@gvejs/runtime';
import { layoutCells, layoutDiagram } from '@gvejs/renderers';

const values = (size) =>
  Array.from({ length: size }, (_, i) => (i * 31) % (size + 3));
const cases = [
  [bubbleSort, values(16), 'small'],
  [mergeSort, values(200), 'medium'],
  [mergeSort, values(1000), 'large'],
  [fibonacci, 10, 'recursion'],
];
function timed(run) {
  const start = performance.now();
  run();
  return Number((performance.now() - start).toFixed(2));
}
function heap() {
  globalThis.gc?.();
  return process.memoryUsage().heapUsed;
}
console.log({
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  forcedGC: !!globalThis.gc,
});
for (const [algorithm, input, workload] of cases) {
  const baseline = heap();
  let trace;
  let player;
  const generationMs = timed(() => {
    trace = generateTrace(algorithm, input);
  });
  const processMs = timed(() => {
    player = createPlayback(algorithm, trace);
  });
  const retainedKiB = Math.round((heap() - baseline) / 1024);
  const steps = Math.min(trace.events.length, 1000);
  const stepMs = timed(() => {
    for (let i = 0; i < steps; i++) player.stepForward();
    for (let i = 0; i < steps; i++) player.stepBackward();
  });
  const seekMs = timed(() => {
    for (let i = 0; i < 1000; i++)
      player.seek((i * 97) % (trace.events.length + 1));
  });
  const state = player.getSnapshot().state;
  const layout = state.kind === 'recursion' ? layoutDiagram : layoutCells;
  const layoutMs = timed(() => {
    for (let i = 0; i < 100; i++) layout(state);
  });
  console.log({
    workload,
    algorithm: algorithm.metadata.id,
    events: trace.events.length,
    generationMs,
    processMs,
    retainedKiB,
    steps: steps * 2,
    stepMs,
    seeks: 1000,
    seekMs,
    layoutRuns: 100,
    layoutMs,
  });
  player.dispose();
}
