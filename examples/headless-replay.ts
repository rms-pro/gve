import { bubbleSort } from "@gvejs/algorithms";
import { parseTrace, serializeTrace } from "@gvejs/core";
import { layoutCells } from "@gvejs/renderers";
import { createPlayback, generateTrace } from "@gvejs/runtime";

const recording = serializeTrace(generateTrace(bubbleSort, [3, 1, 2]));
const trace = parseTrace(recording, bubbleSort, bubbleSort.input);
const playback = createPlayback(bubbleSort, trace);

try {
  playback.seek(trace.events.length);
  const [row] = layoutCells(playback.getSnapshot().state);
  console.log(row.map((cell) => cell.label).join(", "));
} finally {
  playback.dispose();
}
