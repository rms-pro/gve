# Release checklist

- [x] Migrate all six public packages to the `@gvejs` scope at `0.1.0`.
- [x] Confirm MIT license files, canonical repository metadata, and public package access settings.
- [ ] Confirm clean Ubuntu CI and download the six verified archives from the GitHub release artifact dry run for the release commit.
- [ ] Complete the [desktop and mobile accessibility matrix](MANUAL_ACCESSIBILITY.md).
- [ ] Confirm private vulnerability reporting is enabled on `rms-pro/gve`.
- [ ] Confirm the releasing npm account has publish access to the `gvejs` organization and obtain maintainer approval for first publication.

See the [validation report](RELEASE_VALIDATION_REPORT.md) for local test results.

## Prepare and inspect the release archives

Run these commands on the proposed release commit. On macOS, omit `--with-deps`.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm verify:packages 18
pnpm audit --audit-level high
GVE_CROSS_BROWSER=1 pnpm test:browser

artifact_dir="$(mktemp -d)"
GVE_PACKAGE_ARTIFACTS="$artifact_dir" pnpm verify:packages
```

After merging the reviewed commit to `main`, dispatch `gh workflow run release-dry-run.yml --repo rms-pro/gve --ref main`. Check that both CI jobs and the dry run pass for that commit. Download the `gve-release-dry-run` artifact from its Actions run. It contains the same archives that the job installed and verified with React 19.

## First publication

npm configures trusted publishers from an existing package's settings. For any name that has yet to be created, an authorized organization maintainer should publish the approved `0.1.0` archive interactively with npm and account 2FA. Complete the checklist and obtain release approval before running these commands. Use the downloaded archives from the approved dry run and set `artifact_dir` to the directory containing them.

```sh
npm login --registry https://registry.npmjs.org
for package in core themes algorithms renderers runtime react; do
  npm publish "$artifact_dir/gvejs-$package-0.1.0.tgz" --access public --registry https://registry.npmjs.org || break
done
```

If publication stops partway through, check each package with `npm view "@gvejs/PACKAGE@0.1.0" dist.integrity --registry https://registry.npmjs.org`. Compare existing versions with the approved archives, then publish only the missing packages in dependency order. Published npm versions are immutable. [npm scoped package documentation](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)

## Subsequent releases with Trusted Publishing

1. In GitHub, create an environment named `npm-publish`, restrict deployments to `main`, and require maintainer approval with self-approval disabled where supported. Protect `main` with required CI and review.
2. In the settings for each npm package, add a GitHub Actions trusted publisher with owner `rms-pro`, repository `gve`, workflow file `publish.yml`, environment `npm-publish`, and permission to publish directly. Schedule setup near the next release. npm expires unused new trusted publisher configurations after two days. [npm Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers/)
3. When a new version has been reviewed and merged to `main`, dispatch `gh workflow run publish.yml --repo rms-pro/gve --ref main -f version=VERSION` with the reviewed version, and approve the environment deployment after verification passes. The workflow publishes the verified archives using OIDC. For the initial interactive `0.1.0` publication, skip this dispatch.
4. Once OIDC publishing is verified, set each npm package's publishing access to require 2FA and disallow tokens. Review any partial release using the integrity check above before retrying an individual archive.
