# Contributing to OWASP.WTF

Thanks for your interest in helping make OWASP.WTF better. This guide covers the
basics — issues, PRs, dev setup, and how the repo is laid out.

## Code of conduct

Be kind. Critique code, not people. We follow the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/).

## Filing issues

Before opening a new issue, please:

1. **Search** [existing issues](https://github.com/DecOperations/OWASP.WTF/issues)
   so we don't double up.
2. Include:
   - A clear description of the problem or proposal.
   - For bugs: repro steps, expected vs actual, CLI version (`owasp-wtf --version`),
     Node.js version, OS.
   - For feature requests: the use case, not just the feature.

Security issues — **do not open a public issue**. Email the maintainers via
the contact listed on <https://owasp.wtf>.

## Development setup

You need Node.js **20+** and [pnpm](https://pnpm.io) (`npm i -g pnpm`).

```bash
git clone https://github.com/DecOperations/OWASP.WTF.git
cd OWASP.WTF
pnpm install
pnpm build
```

Run the CLI against this repo to sanity-check:

```bash
node packages/cli/dist/index.js .
```

Watch-mode while iterating on the CLI:

```bash
pnpm --filter @decoperations/owasp-wtf dev
```

Run the website locally:

```bash
pnpm --filter @owasp-wtf/web dev
# → http://localhost:3000
```

## Repository layout

```
.
├── action.yml            # Reusable GitHub composite action
├── apps/web              # Next.js marketing + docs site
├── packages/cli          # owasp-wtf CLI (TypeScript, tsup)
│   └── src/rules         # OWASP Top 10 detection rules
├── docs/                 # Markdown documentation
└── scripts/              # Release & maintenance scripts
```

## Pull requests

1. **Branch from `main`.** Name it `<type>/<short-description>` — for example,
   `feat/a06-vulnerable-deps` or `fix/scanner-symlink-loop`.
2. **One topic per PR.** Smaller PRs land faster.
3. **Keep CI green.** `pnpm build` and `pnpm lint` must pass before review.
4. **Add tests** when adding a new rule or fixing a non-trivial bug.
5. **Conventional commits** — we use `feat:`, `fix:`, `chore:`, `docs:`, etc.
   (See `git log` for examples.)
6. **Update docs** when you change user-facing behavior or add a new flag.

A maintainer will review. Expect feedback; expect to revise. We'll squash-merge.

## Adding a new detection rule

Rules live in [`packages/cli/src/rules/`](./packages/cli/src/rules), one file
per OWASP category. To add one:

1. Create or extend the file for the relevant `a0X-...` category.
2. Export the rule from the category's `aNNRules` array.
3. Register the category in `packages/cli/src/rules/index.ts` if it's new.
4. Add a fixture / test that demonstrates a true positive and a true negative.
5. Document the rule's purpose and any known limitations.

A rule has roughly this shape:

```ts
{
  id: 'a03-sql-template-literal',
  category: 'A03:2021',
  severity: 'critical',
  title: 'SQL built via template literal',
  description: '…',
  test: (file, ast) => { /* return findings[] */ },
}
```

Keep rules **specific and high-signal**. Noisy rules get disabled. We'd rather
miss a few cases than drown users in false positives.

## Releasing

Releases of the CLI are automated by
[`.github/workflows/release-cli.yml`](./.github/workflows/release-cli.yml): bump
the version in `packages/cli/package.json` on `main` and the workflow publishes
to the registry, tags the commit, and creates a GitHub Release.

Use the helper:

```bash
pnpm release:cli
```

## Questions

Open a [discussion](https://github.com/DecOperations/OWASP.WTF/discussions) or
ping us on the issue tracker. PRs welcome — even tiny ones.
