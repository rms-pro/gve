# GVE Developer Portal

## Architecture decision

The monorepo has six published ESM libraries under `packages/`, a React/Vite playground under `apps/playground/`, a repository developer guide under `apps/docs/`, and engine, browser and isolated consumer tests under `tests/`. The public entry points cover algorithm and trace contracts (core), execution and replay (runtime), built-in definitions (algorithms), layout helpers (renderers), a stylesheet and theme types (themes), and the React visualizer and its components (react).

The portal extends the private Vite app at `apps/playground/`. Vite emits four HTML entry points with shared navigation, metadata and styles. The homepage, documentation and examples include their text in the HTML. React runs the homepage demo and the existing playground visualizer. The playground keeps its catalog, JSON editor, timeline, playback and inspector from the published packages. Documentation embeds the files from `examples/`, so a change to a compiled example flows directly into the site.

Vite already provides static builds, relative asset paths and a local dev server. The portal needs no request-time rendering, so Next.js would add framework and routing maintenance. The production artifact is a directory of files for a static host. The only browser storage is a local theme preference.

The app pins its direct GVE dependencies to npm v0.1.0. Workspace unit tests continue to exercise local package sources. CI and the manually triggered release dry run use the root checks, cross-browser suite and isolated tarball consumers for React 18 and 19. The publish workflow consumes verified dry-run artifacts subject to the existing npm environment. The portal adds an independent check for the actual npm distributions.

## Local development

Use Node.js 22 and the pnpm version in the root package manifest.

```sh
pnpm install --frozen-lockfile
pnpm --filter @gvejs/playground dev
```

Open the Vite URL to visit `/`, `/docs/`, `/examples/` and `/playground/`. Edit site content in `apps/playground/portal/content.ts`, presentation in `apps/playground/src/portal.css`, and example sources in `examples/`.

## Build and deployment

Build with the final public URL. Include the path prefix if the site will live below the domain root.

```sh
GVE_SITE_URL=https://example.com/gve/ pnpm --filter @gvejs/playground build
pnpm --filter @gvejs/playground preview
```

Use the preview URL to check the build locally. Upload the contents of `apps/playground/dist/` to the intended static hosting directory after receiving deployment approval. Configure directory index handling so paths such as `/docs/` serve `docs/index.html`. For a prefix such as `/gve/`, mount the entire output at that prefix. Relative links and assets work at either location. The build adds canonical and Open Graph URLs to the HTML and emits `sitemap.xml` when `GVE_SITE_URL` is set. Use the preview build without this variable when a production URL has yet to be chosen.

## Verification commands

```sh
pnpm check
pnpm exec playwright install chromium firefox webkit
GVE_CROSS_BROWSER=1 pnpm test:browser
pnpm verify:portal-examples
pnpm verify:packages
pnpm verify:packages 18
```

The browser suite consumes the production artifact and verifies keyboard navigation, theme switching, playback, validation, reduced motion and accessibility. The package checks install isolated tarballs and test ESM, declarations, React SSR, CSS and a browser mount. The portal example check installs all six exact npm versions in a temporary directory and compiles the three examples with strict TypeScript.

## Current scope

The playground runs the twelve bundled algorithms. It accepts schema-validated JSON for those algorithms. Trace generation in the React component runs synchronously, so keep examples and interactive inputs bounded. The documentation uses one indexable guide with section links. Interactive pages require JavaScript, while the documentation, examples and homepage copy can be read directly from the HTML.
