# Releasing

OWASP.WTF uses **fully automated** semantic versioning. You do not manually bump
versions, tag releases, or edit the changelog. Just write Conventional Commits.

## How it works

```
PR opened ──► CI (lint • typecheck • test • build • self-scan)
   │
   ▼
PR commits validated against Conventional Commits
   │
   ▼
PR merged to main
   │
   ▼
.github/workflows/release.yml runs semantic-release
   │
   ▼
semantic-release decides: patch / minor / major / no-release
   │
   ├─► updates packages/cli/package.json version
   ├─► generates CHANGELOG.md
   ├─► creates git tag vX.Y.Z
   ├─► creates GitHub Release with notes
   └─► triggers publish job to GitHub Packages
                       │
                       ▼
                  smoke-test install
```

## Conventional Commits → version bump

| Commit prefix              | Result (0.x)    | Result (post-1.0) |
| -------------------------- | --------------- | ----------------- |
| `fix:`                     | patch           | patch             |
| `perf:` `refactor:`        | patch           | patch             |
| `security:`                | patch           | patch             |
| `build:` `revert:`         | patch           | patch             |
| `feat:`                    | minor           | minor             |
| `BREAKING CHANGE:` or `!`  | **minor**       | major             |
| `docs:` `test:` `ci:` `chore:` | **no release** | **no release** |

While the project is in `0.x` we use a graduation guard: breaking changes only
bump the minor (`0.1.x` → `0.2.0`), never the major. The major stays at `0` until
we deliberately cut `1.0.0` (manually bump the version + drop the
`{ "breaking": true, "release": "minor" }` rule from `.releaserc.json`).
1.0.0 means the CLI surface, config schema, JSON output, SARIF output, exit
codes, and plugin interface are stable.

Examples:

```
fix(cli): handle missing package.json
feat(scanner): add SARIF output
security(report): redact secrets in HTML output
feat(api)!: change scan output schema

BREAKING CHANGE: scan output now uses findings[] instead of vulnerabilities[]
```

## Branches

| Branch | Stream    | Example version            |
| ------ | --------- | -------------------------- |
| `main` | stable    | `0.2.1`                    |
| `beta` | prerelease| `0.3.0-beta.1`             |
| `alpha`| prerelease| `0.3.0-alpha.1`            |

## Local commit hook

The `commit-msg` hook (`.husky/commit-msg`) runs commitlint on every commit:

```bash
pnpm install   # installs husky via the `prepare` script
```

Bypass only in emergencies with `git commit --no-verify`. CI will still reject
invalid commit messages on PRs.

## Tag format

semantic-release is configured with `tagFormat: cli-v${version}` to match the
historical tag scheme (`cli-v0.1.0`, `cli-v0.1.1`). Do not introduce `v${version}`
tags; semantic-release will not find them and may compute a brash first-release
jump to `1.0.0` from history.

## Manual escape hatch

The old `pnpm release:cli` script (`scripts/release-cli.mjs`) is kept as a
break-glass tool. Do not use it in normal operation — every manual bump
desyncs from semantic-release's commit-driven state.

## Version metadata in the CLI

`owasp-wtf --version` reports the published version, git short SHA, and build
date. These are injected at build time via `tsup` `define` from the
`RELEASE_VERSION`, `RELEASE_COMMIT`, and `RELEASE_BUILD_DATE` env vars
(set by `.github/workflows/release.yml`).
