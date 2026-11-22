import { createRoot } from "react-dom/client";
import { bubbleSort } from "@gvejs/algorithms";
import { AlgorithmVisualizer } from "@gvejs/react";
import { useSyncExternalStore } from "react";
import { getTheme, subscribeTheme } from "./theme";
import "@gvejs/themes/style.css";

const input = [6, 2, 8, 3, 5, 1];

function Hero() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  return (
    <AlgorithmVisualizer
      algorithm={bubbleSort}
      input={input}
      theme={theme}
      showControls
    />
  );
}

createRoot(document.querySelector("#hero-demo")!).render(<Hero />);
