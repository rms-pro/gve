import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { verifyConsumerBrowser } from './verify-consumer-browser.mjs';

const packages = [
  'core',
  'runtime',
  'renderers',
  'react',
  'algorithms',
  'themes',
];
const reactMajor = process.argv[2] ?? '19';
const peers = {
  18: ['react@18.3.1', 'react-dom@18.3.1', '@types/react@18.3.12'],
  19: ['react@19.2.4', 'react-dom@19.2.4', '@types/react@19.2.14'],
};
if (!Object.hasOwn(peers, reactMajor))
  throw new Error('Expected React major 18 or 19.');
const consumer = mkdtempSync(join(tmpdir(), 'gve-consumer-'));
const command = (program, args, cwd) =>
  execFileSync(program, args, { cwd, stdio: 'inherit' });
try {
  for (const name of packages) {
    command(
      'pnpm',
      ['pack', '--pack-destination', consumer],
      resolve('packages', name),
    );
  }
  const artifacts = readdirSync(consumer).filter((file) =>
    file.endsWith('.tgz'),
  );
  if (artifacts.length !== packages.length)
    throw new Error('Expected six public package artifacts.');
  writeFileSync(
    join(consumer, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  );
  command(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      ...artifacts.map((file) => `./${file}`),
      ...peers[reactMajor],
    ],
    consumer,
  );
  const versions = new Set();
  for (const name of packages) {
    const directory = join(consumer, 'node_modules', '@gve', name);
    const manifest = JSON.parse(
      readFileSync(join(directory, 'package.json'), 'utf8'),
    );
    versions.add(manifest.version);
    if (
      manifest.name !== `@gve/${name}` ||
      manifest.license !== 'MIT' ||
      manifest.type !== 'module' ||
      manifest.private ||
      !realpathSync(directory).startsWith(realpathSync(consumer) + sep)
    ) {
      throw new Error(`Invalid package metadata or isolation for ${name}`);
    }
    for (const file of [
      'LICENSE',
      'README.md',
      ...Object.values(manifest.exports['.']),
    ]) {
      if (!existsSync(join(directory, file)))
        throw new Error(`Missing ${file} in ${name}`);
    }
    for (const [dependency, range] of Object.entries(
      manifest.dependencies ?? {},
    )) {
      if (
        range.startsWith('workspace:') ||
        range.startsWith('file:') ||
        (dependency.startsWith('@gve/') &&
          !packages.includes(dependency.slice(5)))
      ) {
        throw new Error(`Nonportable dependency ${dependency} in ${name}`);
      }
    }
    if (name === 'react' && manifest.peerDependencies?.react !== '^18 || ^19') {
      throw new Error('Unexpected React peer range');
    }
  }
  if (versions.size !== 1) throw new Error('Package versions differ');
  const source = `
    import { readFileSync } from 'node:fs';
    import { AlgorithmVisualizer } from '@gve/react';
    import { bubbleSort } from '@gve/algorithms';
    import { describeEvent, parseTrace, serializeTrace } from '@gve/core';
    import { createPlayback, generateTrace } from '@gve/runtime';
    import { layoutCells } from '@gve/renderers';
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import.meta.resolve('@gve/themes/style.css');
    const trace = parseTrace(serializeTrace(generateTrace(bubbleSort, [2, 1])), bubbleSort, bubbleSort.input);
    const playback = createPlayback(bubbleSort, trace);
    playback.seek(trace.events.length);
    const state = layoutCells(playback.getSnapshot().state);
    if (state[0].map(cell => cell.label).join(',') !== '1,2') throw Error('Replay failed');
    if (describeEvent(trace, 0).event.type !== 'compare') throw Error('Event identity failed');
    playback.dispose();
    const markup = renderToStaticMarkup(createElement(AlgorithmVisualizer, { algorithm: bubbleSort, input: [2, 1] }));
    if (!markup.includes('Visualization')) throw Error('React SSR failed');
    if (!readFileSync(new URL(import.meta.resolve('@gve/themes/style.css')), 'utf8').includes('.gve-value')) {
      throw Error('Missing exported stylesheet');
    }
  `;
  writeFileSync(join(consumer, 'smoke.mjs'), source);
  command(process.execPath, ['smoke.mjs'], consumer);
  writeFileSync(
    join(consumer, 'types.ts'),
    `
    import { AlgorithmVisualizer } from '@gve/react';
    import { bubbleSort } from '@gve/algorithms';
    import { createPlayback, generateTrace } from '@gve/runtime';
    import type { Theme } from '@gve/themes';
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
      resolve('node_modules/typescript/bin/tsc'),
      '--strict',
      '--noEmit',
      '--module',
      'NodeNext',
      'types.ts',
    ],
    consumer,
  );
  console.log(
    `React ${reactMajor}: six tarballs passed isolated installation, ESM, SSR, CSS and declarations.`,
  );
  for (const file of ['index.html', 'client.mjs']) {
    copyFileSync(resolve('tests/consumer', file), join(consumer, file));
  }
  const vite = realpathSync(resolve('apps/playground/node_modules/vite'));
  command(process.execPath, [join(vite, 'bin/vite.js'), 'build'], consumer);
  await verifyConsumerBrowser(consumer);
  console.log(
    `React ${reactMajor}: Chromium mount, styles, controls and playback timer cleanup passed.`,
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
