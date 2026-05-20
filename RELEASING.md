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
   ├─► generates CHANGELOG.md (at repo root)
   ├─► creates git tag cli-vX.Y.Z
   ├─► creates GitHub Release with notes
   └─► triggers publish job to GitHub Packages
                       │
                       ▼
                  smoke-test install
```

## Conventional Commits → version bump

While the project is in `0.x` we use a conservative bump policy: `feat:` is
intermediate progress (patch), `milestone:` graduates a roadmap milestone
(minor), and breaking changes never escalate to major until we deliberately
cut `1.0.0`.

| Commit prefix              | Result (0.x)    | Result (post-1.0) |
| -------------------------- | --------------- | ----------------- |
| `milestone:`               | **minor**       | minor             |
| `feat:`                    | **patch**       | minor             |
| `fix:`                     | patch           | patch             |
| `perf:` `refactor:`        | patch           | patch             |
| `security:`                | patch           | patch             |
| `build:` `revert:`         | patch           | patch             |
| `BREAKING CHANGE:` or `!`  | **minor**       | major             |
| `docs:` `test:` `ci:` `chore:` | **no release** | **no release** |

**Why `feat:` is patch in 0.x:** sub-features that move toward a milestone
should not bump the minor on every commit. Only when a roadmap milestone is
*completed* — typically the last commit closing it out — do we use
`milestone:` to claim the minor bump.

**Graduation guard:** the major stays at `0` until we deliberately cut
`1.0.0` (manually bump the version + drop the
`{ "breaking": true, "release": "minor" }` rule from `.releaserc.json`).
1.0.0 means the CLI surface, config schema, JSON output, SARIF output, exit
codes, and plugin interface are stable.

Examples:

```
fix(cli): handle missing package.json                    # → patch
feat(scanner): wire up basic SARIF emit                  # → patch (in-flight)
feat(scanner): add severity filter                       # → patch (in-flight)
milestone(scanner): SARIF output GA                      # → minor (closes a milestone)
security(report): redact secrets in HTML output          # → patch
feat(api)!: change scan output schema                    # → minor (breaking, 0.x guard)

BREAKING CHANGE: scan output now uses findings[] instead of vulnerabilities[]
```

## Path-scoped releases

semantic-release runs from `packages/cli/` and uses
[`semantic-release-monorepo`](https://github.com/pmowrer/semantic-release-monorepo)
to **filter commits to those that touched `packages/cli/**`**. Commits that only
modify `apps/web/**`, `docs/**`, `ROADMAP.md`, or other paths outside the CLI
do not trigger a CLI release.

In practice: a `docs(web): redesign roadmap page` commit, even though it
contains the word `docs:`, would not bump the CLI version *even if it had been
`feat:`*, because none of the changed files live under `packages/cli/`. This
makes the CLI version track CLI behavior, not site updates.

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
