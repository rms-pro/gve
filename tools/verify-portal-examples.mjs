import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), "gve-portal-examples-"));
const run = (program, args) =>
  execFileSync(program, args, {
    cwd: consumer,
    stdio: "inherit",
  });

try {
  writeFileSync(
    join(consumer, "package.json"),
    '{"private":true,"type":"module"}\n',
  );
  const packages = [
    "algorithms",
    "core",
    "react",
    "renderers",
    "runtime",
    "themes",
  ];
  run("npm", [
    "install",
    "--registry",
    "https://registry.npmjs.org",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    ...packages.map((name) => `@gvejs/${name}@0.1.0`),
    "react@19.2.4",
    "@types/react@19.2.14",
  ]);
  const examples = [
    "geekiscool-embed.tsx",
    "headless-replay.ts",
    "gnome-sort.ts",
  ];
  for (const file of examples) {
    copyFileSync(join(root, "examples", file), join(consumer, file));
  }

  run(process.execPath, [
    join(root, "node_modules/typescript/bin/tsc"),
    "--strict",
    "--module",
    "NodeNext",
    "--jsx",
    "react-jsx",
    ...examples,
  ]);
  run(process.execPath, ["headless-replay.js"]);
  run(process.execPath, [
    "--input-type=module",
    "-e",
    `
    import assert from 'node:assert/strict';
    import { generateTrace } from '@gvejs/runtime';
    import { gnomeSort } from './gnome-sort.js';
    assert.deepEqual(generateTrace(gnomeSort, [4, 1, 3, 2]).result, [1, 2, 3, 4]);
  `,
  ]);
  console.log(
    "Three examples compile against the six published v0.1.0 packages.",
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
