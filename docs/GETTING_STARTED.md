# Getting started

Use Node.js 22. In this workspace run:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite. Select Bubble Sort, apply a JSON array, and step forward or backward.

To install the current artifacts in a separate app:

```sh
pnpm build:packages
pnpm exec playwright install chromium
GVE_PACKAGE_ARTIFACTS=/path/to/your-app pnpm verify:packages
cd /path/to/your-app
npm install ./gvejs-*-0.1.0.tgz react@19 react-dom@19
```

Use `AlgorithmVisualizer` and import `@gvejs/themes/style.css`. The [React example](../examples/geekiscool-embed.tsx) takes its input and theme from the host. The [API reference](API_REFERENCE.md) shows framework-independent use.
