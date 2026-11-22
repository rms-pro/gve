import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { verifyConsumerBrowser } from "./verify-consumer-browser.mjs";

const packages = [
  "core",
  "runtime",
  "renderers",
  "react",
  "algorithms",
  "themes",
];
const scope = "@gvejs";
const repository = "https://github.com/rms-pro/gve";
const reactMajor = process.argv[2] ?? "19";
const peers = {
  18: ["react@18.3.1", "react-dom@18.3.1", "@types/react@18.3.12"],
  19: ["react@19.2.4", "react-dom@19.2.4", "@types/react@19.2.14"],
};
if (!Object.hasOwn(peers, reactMajor))
  throw new Error("Expected React major 18 or 19.");
const consumer = mkdtempSync(join(tmpdir(), "gve-consumer-"));
const command = (program, args, cwd) =>
  execFileSync(program, args, { cwd, stdio: "inherit" });
try {
  for (const name of packages) {
    command(
      "pnpm",
      ["pack", "--pack-destination", consumer],
      resolve("packages", name),
    );
  }
  const artifacts = readdirSync(consumer).filter((file) =>
    file.endsWith(".tgz"),
  );
  if (artifacts.length !== packages.length)
    throw new Error("Expected six public package artifacts.");
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  command(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      ...artifacts.map((file) => `./${file}`),
      ...peers[reactMajor],
    ],
    consumer,
  );
  const versions = new Set();
  for (const name of packages) {
    const directory = join(consumer, "node_modules", scope, name);
    const manifest = JSON.parse(
      readFileSync(join(directory, "package.json"), "utf8"),
    );
    versions.add(manifest.version);
    const packagePath = `packages/${name}`;
    if (
      manifest.name !== `${scope}/${name}` ||
      !/^\d+\.\d+\.\d+$/.test(manifest.version) ||
      manifest.license !== "MIT" ||
      manifest.type !== "module" ||
      manifest.private ||
      !manifest.description?.trim() ||
      manifest.repository?.url !== `git+${repository}.git` ||
      manifest.repository?.directory !== packagePath ||
      manifest.homepage !== `${repository}/tree/main/${packagePath}#readme` ||
      manifest.bugs?.url !== `${repository}/issues` ||
      manifest.publishConfig?.access !== "public" ||
      !realpathSync(directory).startsWith(realpathSync(consumer) + sep)
    ) {
      throw new Error(`Invalid package metadata or isolation for ${name}`);
    }
    const archive = join(consumer, `gvejs-${name}-${manifest.version}.tgz`);
    const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
      .trim()
      .split("\n");
    const allowed =
      /^package\/(?:LICENSE|README\.md|package\.json|dist\/[\w-]+\.(?:js|d\.ts))$/;
    for (const entry of entries) {
      if (
        !allowed.test(entry) &&
        !(name === "themes" && entry === "package/dist/style.css")
      ) {
        throw new Error(`Unexpected archive member in ${name}: ${entry}`);
      }
    }
    if (
      !readFileSync(join(directory, "LICENSE")).equals(
        readFileSync(resolve("LICENSE")),
      )
    ) {
      throw new Error(`License differs from root MIT license in ${name}`);
    }
    for (const file of [
      "LICENSE",
      "README.md",
      ...Object.values(manifest.exports["."]),
    ]) {
      if (!existsSync(join(directory, file)))
        throw new Error(`Missing ${file} in ${name}`);
    }
    for (const [dependency, range] of Object.entries(
      manifest.dependencies ?? {},
    )) {
      if (
        range.startsWith("workspace:") ||
        range.startsWith("file:") ||
        (dependency.startsWith(`${scope}/`) &&
          (!packages.includes(dependency.slice(scope.length + 1)) ||
            range !== `^${manifest.version}`))
      ) {
        throw new Error(`Nonportable dependency ${dependency} in ${name}`);
      }
    }
    if (name === "react" && manifest.peerDependencies?.react !== "^18 || ^19") {
      throw new Error("Unexpected React peer range");
    }
  }
  if (versions.size !== 1) throw new Error("Package versions differ");
  const source = `
    import { readFileSync } from 'node:fs';
    import { AlgorithmVisualizer } from '@gvejs/react';
    import { bubbleSort } from '@gvejs/algorithms';
    import { describeEvent, parseTrace, serializeTrace } from '@gvejs/core';
    import { createPlayback, generateTrace } from '@gvejs/runtime';
    import { layoutCells } from '@gvejs/renderers';
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import.meta.resolve('@gvejs/themes/style.css');
    const trace = parseTrace(serializeTrace(generateTrace(bubbleSort, [2, 1])), bubbleSort, bubbleSort.input);
    const playback = createPlayback(bubbleSort, trace);
    playback.seek(trace.events.length);
    const state = layoutCells(playback.getSnapshot().state);
    if (state[0].map(cell => cell.label).join(',') !== '1,2') throw Error('Replay failed');
    if (describeEvent(trace, 0).event.type !== 'compare') throw Error('Event identity failed');
    playback.dispose();
    const markup = renderToStaticMarkup(createElement(AlgorithmVisualizer, { algorithm: bubbleSort, input: [2, 1] }));
    if (!markup.includes('Visualization')) throw Error('React SSR failed');
    if (!readFileSync(new URL(import.meta.resolve('@gvejs/themes/style.css')), 'utf8').includes('.gve-value')) {
      throw Error('Missing exported stylesheet');
    }
  `;
  writeFileSync(join(consumer, "smoke.mjs"), source);
  command(process.execPath, ["smoke.mjs"], consumer);
  writeFileSync(
    join(consumer, "types.ts"),
    `
    import { AlgorithmVisualizer } from '@gvejs/react';
    import { bubbleSort } from '@gvejs/algorithms';
    import { createPlayback, generateTrace } from '@gvejs/runtime';
    import type { Theme } from '@gvejs/themes';
    import { createElement } from 'react';
    const theme: Theme = { mode: 'dark', colors: {} };
    const trace = generateTrace(bubbleSort, [2, 1]);
    createPlayback(bubbleSort, trace).dispose();
    AlgorithmVisualizer({ algorithm: bubbleSort, input: [2, 1], theme });
    createElement('div');
  `,
  );
  command(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      "--strict",
      "--noEmit",
      "--module",
      "NodeNext",
      "types.ts",
    ],
    consumer,
  );
  console.log(
    `React ${reactMajor}: six tarballs passed isolated installation, ESM, SSR, CSS and declarations.`,
  );
  for (const file of ["index.html", "client.mjs"]) {
    copyFileSync(resolve("tests/consumer", file), join(consumer, file));
  }
  const vite = realpathSync(resolve("apps/playground/node_modules/vite"));
  command(process.execPath, [join(vite, "bin/vite.js"), "build"], consumer);
  await verifyConsumerBrowser(consumer);
  console.log(
    `React ${reactMajor}: Chromium mount, styles, controls and playback timer cleanup passed.`,
  );
  const destination = process.env.GVE_PACKAGE_ARTIFACTS;
  if (destination) {
    mkdirSync(destination, { recursive: true });
    for (const file of artifacts) {
      copyFileSync(join(consumer, file), join(destination, file));
    }
  }
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
