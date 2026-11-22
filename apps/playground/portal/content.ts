import { readFileSync } from "node:fs";

export const repository = "https://github.com/rms-pro/gve";

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[character] ?? character,
  );

const example = (name: string) =>
  readFileSync(
    new URL(`../../../examples/${name}`, import.meta.url),
    "utf8",
  ).trimEnd();

const code = (source: string) =>
  `<div class="code"><pre tabindex="0"><code>${escapeHtml(source)}</code></pre><button type="button" data-copy hidden>Copy</button><span role="status"></span></div>`;

const reactInstall =
  "npm install @gvejs/algorithms@0.1.0 @gvejs/react@0.1.0 @gvejs/themes@0.1.0";
const headlessInstall =
  "npm install @gvejs/algorithms@0.1.0 @gvejs/core@0.1.0 @gvejs/runtime@0.1.0 @gvejs/renderers@0.1.0";

const packages = [
  ["core", "Define algorithms and validate trace data."],
  ["runtime", "Generate traces, then seek, step, or play them."],
  ["algorithms", "Use twelve algorithms with example inputs."],
  ["renderers", "Lay out cells, trees, and graphs."],
  ["themes", "Apply light, dark, or system colors."],
  ["react", "Embed a visualizer with playback controls."],
];

const quickStart = example("geekiscool-embed.tsx");
const headless = example("headless-replay.ts");
const custom = example("gnome-sort.ts");

const guides: [string, string, string][] = [
  [
    "introduction",
    "Introduction",
    `
    <p>GVE is an MIT-licensed TypeScript engine for interactive algorithm and computer science visualizations. Generate a trace for a specific input, play it in React, or use its visual state in your own UI.</p>
    <p><a href="../playground/">Open the playground</a> to try built-in algorithms and inspect the effects of each event.</p>`,
  ],
  [
    "installation",
    "Installation",
    `
    <p>For an existing React 18 or 19 application, install the React visualizer, its stylesheet, and the built-in algorithms.</p>
    ${code(reactInstall)}
    <p>For a headless TypeScript project, install the packages used by the trace and rendering example.</p>
    ${code(headlessInstall)}
    <p>GVE packages ship as ESM with TypeScript declarations. Use an ESM-aware bundler or an ESM Node.js project with NodeNext module resolution.</p>`,
  ],
  [
    "quick-start",
    "Quick Start",
    `
    <p>Add this component to your React project and render the exported <code>SortingLesson</code> component in your app. The supplied input is stable across renders.</p>
    ${code(quickStart)}`,
  ],
  [
    "core-concepts",
    "Core Concepts",
    `
    <p>An <code>Algorithm</code> combines metadata, an input type guard, an initial visual state, and an execution generator. Define one with <code>defineAlgorithm</code>. The generator yields events and returns the result. Pseudocode references in events are one-based.</p>
    <p>Visual state describes the current cells, nodes, edges, highlights, pointers, and variables. Reducers apply events to that state. Custom events require a namespaced type and a JSON payload guard. Keep custom reducers deterministic and copy any collection they change.</p>`,
  ],
  [
    "visualization-traces",
    "Visualization Traces",
    `
    <p><code>generateTrace</code> validates input and events and returns a version 1 trace with <code>version</code>, <code>algorithm</code>, <code>input</code>, <code>events</code>, and <code>result</code>. <code>streamExecution</code> yields validated events one at a time and returns the result when exhausted.</p>
    <p>Use <code>serializeTrace</code> to store a recording and <code>parseTrace</code> with the same algorithm and a result guard to load it. Use <code>validateTrace</code> for already parsed data. <code>describeEvent</code> exposes the event and its trace-local identity.</p>
    <p>Built-in events cover comparisons, swaps, writes, value replacement, highlights, pointers, nodes, edges, variables, calls, and returns. Events can carry an explanation, a pseudocode line, and JSON metadata.</p>`,
  ],
  [
    "playback-runtime",
    "Playback Runtime",
    `
    <p><code>createPlayback</code> takes the algorithm and its trace. Position zero is the initial state. Position N reflects N applied events. Read changes with <code>getSnapshot</code> and <code>subscribe</code>. Treat snapshot data as read-only.</p>
    <p>Use <code>stepForward</code>, <code>stepBackward</code>, or <code>seek</code> for manual navigation. <code>resume</code> continues at the current position, <code>pause</code> stops the timer, and <code>reset</code> goes to the start. <code>setSpeed</code> takes a positive finite multiplier. Unsubscribe and call <code>dispose</code> when replacing a session.</p>
    <p><a href="../examples/#headless-replay">See a headless replay with a saved trace.</a></p>`,
  ],
  [
    "algorithms",
    "Algorithms",
    `
    <p>Each definition includes a ready-to-use input under <code>metadata.examples</code>.</p>
    <dl class="details">
      <dt>Sorting</dt><dd><code>bubbleSort</code>, <code>selectionSort</code>, <code>insertionSort</code>, <code>mergeSort</code>, <code>quickSort</code> take finite number arrays.</dd>
      <dt>Searching</dt><dd><code>linearSearch</code> and <code>binarySearch</code> take an object with numeric <code>values</code> and a numeric <code>target</code>. Binary search requires ascending values and can return any matching duplicate.</dd>
      <dt>Graphs</dt><dd><code>bfs</code> and <code>dfs</code> take an object with <code>vertices</code>, directed <code>edges</code>, and a <code>start</code> vertex.</dd>
      <dt>Trees</dt><dd><code>bstInsertion</code> takes a finite number array and puts duplicates to the right.</dd>
      <dt>Stacks</dt><dd><code>stackOperations</code> takes an array of operations with <code>op</code> set to <code>push</code> or <code>pop</code>. Push operations also require a finite numeric <code>value</code>. An empty pop leaves the stack unchanged.</dd>
      <dt>Recursion</dt><dd><code>fibonacci</code> takes an integer from 0 through 12.</dd>
    </dl>`,
  ],
  [
    "renderers",
    "Renderers",
    `
    <p><code>layoutCells</code> returns rows of cells for array, stack, queue, and matrix views. <code>layoutDiagram</code> returns positioned nodes and edges for diagram views. <code>formatValue</code> converts JSON values into display labels.</p>
    <p>To plug your own view into React, supply <code>RendererRegistration</code> entries through the <code>renderers</code> prop. Each registration identifies a visual state kind and renders a compatible state.</p>`,
  ],
  [
    "themes",
    "Themes",
    `
    <p>Import <code>@gvejs/themes/style.css</code> once in your app. Pass <code>light</code>, <code>dark</code>, or <code>auto</code> as the visualizer theme. A <code>Theme</code> object with <code>mode</code> and a <code>colors</code> object lets you override the default palette. Auto follows the system color preference. The stylesheet respects reduced motion.</p>`,
  ],
  [
    "react-integration",
    "React Integration",
    `
    <p><code>AlgorithmVisualizer</code> combines visualization, playback, and inspection. Use <code>showInput</code>, <code>showCode</code>, and <code>showVariables</code> to enable the relevant panels. Keep the algorithm, initial input, and playback options stable across renders.</p>
    <p>Use <code>usePlayback</code> to subscribe to a playback instance in a custom React view. Compose <code>Visualization</code>, <code>PlaybackControls</code>, and <code>Timeline</code> with the individual inspector panels as needed.</p>
    <p>Focus the canvas to step with Left or Right and toggle playback with Space. Shift with Left or Right scrolls wide diagrams.</p>`,
  ],
  [
    "api-reference",
    "API Reference",
    `
    <dl class="details">
      <dt><code>@gvejs/core</code></dt><dd><code>defineAlgorithm</code>, <code>isJson</code>, <code>isEvent</code>, <code>reduceEvent</code>, <code>serializeTrace</code>, <code>parseTrace</code>, <code>validateTrace</code>, <code>describeEvent</code>, <code>GveError</code>. Public types include <code>Algorithm</code>, <code>Trace</code>, <code>VisualState</code>, and <code>RendererRegistration</code>.</dd>
      <dt><code>@gvejs/runtime</code></dt><dd><code>streamExecution</code>, <code>generateTrace</code>, <code>createPlayback</code>, <code>Playback</code>, <code>ExecutionLimits</code>, <code>PlaybackOptions</code>, <code>PlaybackSnapshot</code>.</dd>
      <dt><code>@gvejs/renderers</code></dt><dd><code>formatValue</code>, <code>layoutCells</code>, <code>layoutDiagram</code>, <code>Cell</code>, <code>PositionedNode</code>, <code>Diagram</code>.</dd>
      <dt><code>@gvejs/algorithms</code></dt><dd><a href="#algorithms">Twelve built-in algorithm definitions</a>.</dd>
      <dt><code>@gvejs/themes</code></dt><dd><code>ThemeMode</code>, <code>Theme</code>, and the <code>@gvejs/themes/style.css</code> export.</dd>
      <dt><code>@gvejs/react</code></dt><dd><code>AlgorithmVisualizer</code>, <code>AlgorithmVisualizerProps</code>, <code>usePlayback</code>, <code>Visualization</code>, <code>PlaybackControls</code>, <code>Timeline</code>, <code>InputEditor</code>, <code>CodePanel</code>, <code>VariablesPanel</code>, <code>ExplanationPanel</code>.</dd>
    </dl>
    <p><a href="${repository}/blob/v0.1.0/docs/API_REFERENCE.md">Extended v0.1.0 API reference</a></p>`,
  ],
  [
    "troubleshooting",
    "Troubleshooting",
    `
    <dl class="details">
      <dt>The visualization is unstyled</dt><dd>Import <code>@gvejs/themes/style.css</code> in your app entry.</dd>
      <dt>Playback resets on a React render</dt><dd>Move literal input and options outside the component or memoize values derived from props.</dd>
      <dt>The editor rejects JSON</dt><dd>Start with a built-in example and preserve its input shape. For binary search, sort the numeric array first.</dd>
      <dt>A run reaches an execution limit</dt><dd>Reduce the input size. Trace generation in the React visualizer runs synchronously, and limits are checked between generator calls.</dd>
      <dt>A stored trace fails validation</dt><dd>Check the trace version, algorithm ID, custom event schemas, and result guard.</dd>
    </dl>`,
  ],
];

interface Page {
  label: string;
  title: string;
  description: string;
  script?: string;
  body: string;
}

export const pages: Record<string, Page> = {
  "": {
    label: "Home",
    title: "GVE | Generic Visualizer Engine",
    description:
      "Build interactive algorithm and computer science visualizations with GVE, an open-source TypeScript engine.",
    script: "hero.tsx",
    body: `<main id="content" tabindex="-1">
      <div class="wrap hero">
        <div class="hero-copy">
          <p class="eyebrow">Generic Visualizer Engine</p>
          <h1>Make algorithms<br> <em>come alive.</em></h1>
          <p class="lede">An open-source TypeScript engine for building interactive algorithm and computer science visualizations.</p>
          <div class="actions"><a class="action primary" href="./docs/#quick-start">Get started</a><a class="action" href="./playground/">Open playground</a></div>
          ${code("npm install @gvejs/react@0.1.0")}
        </div>
        <section class="demo" aria-labelledby="demo-title">
          <div class="demo-header"><h2 id="demo-title">Bubble Sort</h2><p>Step through the comparisons and swaps.</p></div>
          <div id="hero-demo"></div>
          <noscript><p>Enable JavaScript to run the interactive sorting demo.</p></noscript>
        </section>
      </div>
      <section class="band"><div class="wrap capability">
        <div><h2>Record a trace</h2><p>Capture how an algorithm runs on a specific input and serialize the result as JSON.</p></div>
        <div><h2>Explore every step</h2><p>Pause, rewind, and seek through changes in data, pointers, and variables.</p></div>
        <div><h2>Render in your app</h2><p>Embed the React visualizer or use the layout functions to build your own view.</p></div>
      </div></section>
      <section class="wrap architecture">
        <div class="section-intro"><h2>Package architecture</h2><p>Core defines the trace contract. Algorithms produce events, runtime replays them, and renderers turn visual state into layouts. React assembles the interface and themes supply the styles.</p></div>
        <div class="package-grid">${packages.map(([name, description]) => `<article><h3><a href="https://www.npmjs.com/package/@gvejs/${name}/v/0.1.0">@gvejs/${name}</a></h3><p>${description}</p></article>`).join("")}</div>
      </section>
    </main>`,
  },
  docs: {
    label: "Documentation",
    title: "GVE Documentation",
    description:
      "Install GVE, generate and replay traces, and integrate the v0.1.0 TypeScript and React APIs.",
    body: `<main id="content" tabindex="-1" class="wrap guide">
      <nav aria-label="Documentation sections"><ul>${guides.map(([id, title]) => `<li><a href="#${id}">${title}</a></li>`).join("")}</ul></nav>
      <div class="article"><h1>Documentation</h1><p class="lede">Build with the GVE v0.1.0 public API.</p>
      ${guides.map(([id, title, body]) => `<section aria-labelledby="${id}"><h2 id="${id}">${title}</h2>${body}</section>`).join("")}</div>
    </main>`,
  },
  examples: {
    label: "Examples",
    title: "GVE Integration Examples",
    description:
      "Complete examples for embedding a React visualization, replaying a trace, and defining a custom algorithm.",
    body: `<main id="content" tabindex="-1" class="wrap guide">
      <nav aria-label="Example sections"><ul><li><a href="#react-lesson">React lesson</a></li><li><a href="#headless-replay">Headless replay</a></li><li><a href="#custom-algorithm">Custom algorithm</a></li></ul></nav>
      <div class="article"><h1>Examples</h1><p class="lede">Three integrations using the published v0.1.0 packages.</p>
        <section aria-labelledby="react-lesson"><h2 id="react-lesson">Embed a React lesson</h2><p>Save as <code>SortingLesson.tsx</code>. Render the exported component in a React 18 or 19 application with an optional <code>Theme</code> prop. Pass a stable input to reuse it across multiple lessons.</p>${code(reactInstall)}${code(quickStart)}</section>
        <section aria-labelledby="headless-replay"><h2 id="headless-replay">Replay a saved trace</h2><p>Save as <code>headless-replay.ts</code> in an ESM TypeScript project. Compile and run the emitted JavaScript in Node.js to print the sorted cell labels. The trace passes through the same validation it would receive after loading a saved recording.</p>${code(headlessInstall)}${code(headless)}</section>
        <section aria-labelledby="custom-algorithm"><h2 id="custom-algorithm">Define a custom algorithm</h2><p>Save as <code>gnome-sort.ts</code> and install <code>@gvejs/core@0.1.0</code>. Import the exported <code>gnomeSort</code> in place of <code>bubbleSort</code> in either example above. A namespaced event tracks the moving cursor and built-in events handle comparisons and swaps.</p>${code(custom)}</section>
      </div>
    </main>`,
  },
  playground: {
    label: "Playground",
    title: "GVE Algorithm Playground",
    description:
      "Explore 12 algorithms with editable inputs, step-by-step playback, and interactive GVE visualizations.",
    script: "playground.tsx",
    body: '<div id="playground"></div><noscript><main id="visualizer" tabindex="-1" class="wrap"><h1>Algorithm playground</h1><p>Enable JavaScript to run the playground.</p></main></noscript>',
  },
};
