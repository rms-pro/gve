# Contributing

Use Node.js 22 and the pnpm version pinned in the root manifest. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm exec playwright install chromium`, `pnpm test:browser`, and `pnpm verify:packages` and `pnpm verify:packages 18` before submitting a change. Run `pnpm format` on new or edited source.

Keep algorithm rules in generators and presentation in renderer packages. For an algorithm change, test both the independent result and forward/backward replay. For a trace change, document reader compatibility and include malformed input tests. For a UI change, follow the manual checks in the release checklist. Keep runtime dependency additions purposeful.
