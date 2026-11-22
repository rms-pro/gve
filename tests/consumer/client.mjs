import { AlgorithmVisualizer } from '@gvejs/react';
import { bubbleSort } from '@gvejs/algorithms';
import '@gvejs/themes/style.css';
import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(
  createElement(
    StrictMode,
    null,
    createElement(AlgorithmVisualizer, {
      algorithm: bubbleSort,
      input: [3, 2, 1],
      theme: 'dark',
      showControls: true,
    }),
  ),
);
window.unmountGve = () => root.unmount();
