import { useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import type { Algorithm } from "@gvejs/core";
import { AlgorithmVisualizer } from "@gvejs/react";
import {
  bubbleSort,
  selectionSort,
  insertionSort,
  mergeSort,
  quickSort,
  linearSearch,
  binarySearch,
  bfs,
  dfs,
  bstInsertion,
  stackOperations,
  fibonacci,
} from "@gvejs/algorithms";
import type { ThemeMode } from "@gvejs/themes";
import "@gvejs/themes/style.css";
import { getTheme, subscribeTheme } from "./theme";

function catalogEntry<I, R>(algorithm: Algorithm<I, R>) {
  return {
    metadata: algorithm.metadata,
    render: (theme: ThemeMode) => (
      <AlgorithmVisualizer
        algorithm={algorithm}
        input={algorithm.metadata.examples[0]}
        theme={theme}
        showControls
        showCode
        showVariables
        showInput
      />
    ),
  };
}
const entries = [
  catalogEntry(bubbleSort),
  catalogEntry(selectionSort),
  catalogEntry(insertionSort),
  catalogEntry(mergeSort),
  catalogEntry(quickSort),
  catalogEntry(linearSearch),
  catalogEntry(binarySearch),
  catalogEntry(bfs),
  catalogEntry(dfs),
  catalogEntry(bstInsertion),
  catalogEntry(stackOperations),
  catalogEntry(fibonacci),
];
const categories = [
  ...new Set(entries.map((entry) => entry.metadata.category)),
];

function App() {
  const [selected, select] = useState(entries[0].metadata.id);
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  const entry = entries.find((item) => item.metadata.id === selected)!;
  return (
    <div className="playground" data-theme={theme}>
      <div className="shell">
        <nav aria-label="Algorithms" className="catalog">
          <h2>Algorithms</h2>
          {categories.map((category) => (
            <section key={category}>
              <h3>{category}</h3>
              {entries
                .filter((item) => item.metadata.category === category)
                .map(({ metadata }) => (
                  <button
                    type="button"
                    key={metadata.id}
                    aria-current={selected === metadata.id ? "true" : undefined}
                    onClick={() => select(metadata.id)}
                  >
                    {metadata.title}
                  </button>
                ))}
            </section>
          ))}
        </nav>
        <main id="visualizer" tabIndex={-1}>
          <header className="intro">
            <p>{entry.metadata.category}</p>
            <h1>{entry.metadata.title}</h1>
            <div>{entry.metadata.description}</div>
          </header>
          <div key={selected}>{entry.render(theme)}</div>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("playground")!).render(<App />);
