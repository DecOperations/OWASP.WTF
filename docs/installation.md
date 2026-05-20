# Installation

OWASP.WTF runs on Node.js **20+**. Pick the method that suits you.

## One-shot (recommended)

No install required:

```bash
npx owasp-wtf
```

`npx` will fetch the latest CLI, run it, and clean up. Best for trying it out
or for CI runners that don't already have it installed.

## Global install

```bash
npm install -g owasp-wtf
owasp-wtf --version
```

Use this when you scan often or want shell completion of the binary name.

## GitHub Action

For CI, use the reusable composite action — no Node setup required, results
upload as a workflow artifact:

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    severity: high
    fail-on-findings: true
```

Full reference: [GitHub Action](./github-action.md).

## From source

If you want to hack on the CLI itself:

```bash
git clone https://github.com/DecOperations/OWASP.WTF.git
cd OWASP.WTF
pnpm install
pnpm build
node packages/cli/dist/index.js --help
```

Or link it into your shell's PATH:

```bash
pnpm link-cli   # runs `npm link` in packages/cli
owasp-wtf --help
```

## GitHub Packages (org-internal)

The CLI is also published to GitHub Packages as `@decoperations/owasp-wtf`.
You'll need a token with `read:packages`:

```bash
echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> ~/.npmrc
echo "@decoperations:registry=https://npm.pkg.github.com" >> ~/.npmrc
npm install -g @decoperations/owasp-wtf
```

## Verifying the install

```bash
owasp-wtf --version
owasp-wtf --help
```

If `owasp-wtf` isn't found after a global install, your `npm bin -g` directory
isn't on your `PATH`. Either add it, or use `npx owasp-wtf` instead.

## Next steps

- [Usage](./usage.md) — flags, formats, examples
- [Configuration](./configuration.md) — set up AI providers
