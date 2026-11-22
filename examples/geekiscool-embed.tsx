import { bubbleSort } from '@gve/algorithms';
import { AlgorithmVisualizer } from '@gve/react';
import type { Theme } from '@gve/themes';
import '@gve/themes/style.css';

const exampleInput = [8, 3, 5, 1, 9];

export function SortingLesson({ theme, input = exampleInput }: { theme: Theme; input?: number[] }) {
  return <AlgorithmVisualizer algorithm={bubbleSort} input={input} theme={theme}
    showControls showCode showVariables showInput />;
}
