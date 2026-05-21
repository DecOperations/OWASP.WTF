# Installing `@decoperations/owasp-wtf` from GitHub Packages

OWASP.WTF publishes its CLI to the **public npm registry** as `owasp-wtf` and
to **GitHub Packages** as `@decoperations/owasp-wtf`. This page covers the
GitHub Packages flow, which is what any DecOperations or Dial-WTF repo
should use when consuming the scoped build.

GitHub Packages requires authentication even for public packages, so every
consumer needs:

1. A scope mapping that points `@decoperations` at `https://npm.pkg.github.com`.
2. A token in `NODE_AUTH_TOKEN` with at least `read:packages`.

> Reference implementation: this mirrors the pattern shipped in
> [Calibrate.WTF#82](https://github.com/DecOperations/Calibrate.WTF/issues/82).
> If the two ever drift, treat Calibrate.WTF's docs as authoritative for the
> scope/auth pattern and adapt names here.

---

## 1. The `.npmrc` (safe to commit)

```ini
@decoperations:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

`${NODE_AUTH_TOKEN}` is expanded by npm/pnpm at install time, so committing
this file does **not** leak credentials. The token only exists in the
process environment of the runner (or your shell) when `install` runs.

You can either copy the snippet above into your repo's `.npmrc`, or run the
idempotent helper:

```bash
node <(curl -fsSL https://raw.githubusercontent.com/DecOperations/OWASP.WTF/main/scripts/setup-github-packages.mjs)
```

Re-running it is a no-op once the two lines are present.

---

## 2. Same-org consumers (DecOperations)

For any repo in the `DecOperations` org, the workflow's built-in
`GITHUB_TOKEN` already has `read:packages` against DecOperations packages.

```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@decoperations'
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Make sure the job has `permissions: packages: read` (or rely on the
default repo permissions if they include packages read).

---

## 3. Cross-org consumers (Dial-WTF or any other org)

`GITHUB_TOKEN` from a Dial-WTF workflow **cannot** read DecOperations
packages. You need a PAT issued by a DecOperations member, stored as an
org secret in Dial-WTF.

### One-time org setup

1. From a DecOperations account, create a token with `read:packages`:
   - Classic PAT: `Settings → Developer settings → Personal access tokens (classic)`
   - Fine-grained PAT: scope to the DecOperations org with `Packages: read`
2. In the Dial-WTF org: `Settings → Secrets and variables → Actions → New organization secret`
   - Name: `DECOPERATIONS_NPM_TOKEN`
   - Value: the PAT
   - Repository access: as needed (all / private / selected)

### Workflow

```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'
    registry-url: 'https://npm.pkg.github.com'
    scope: '@decoperations'
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.DECOPERATIONS_NPM_TOKEN }}
```

The only difference from the same-org case is the secret name.

---

## 4. Local development

```bash
export NODE_AUTH_TOKEN=ghp_xxx   # PAT with read:packages
pnpm install
```

Don't put the token in `.npmrc` directly — keep it in your shell env (or a
secrets manager) so the committed `.npmrc` stays clean.

For a one-off install outside a repo:

```bash
mkdir consumer && cd consumer
cat > .npmrc <<'EOF'
@decoperations:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
EOF
NODE_AUTH_TOKEN=ghp_xxx npm install @decoperations/owasp-wtf
```

---

## 5. Common failure modes

### `npm ERR! 401 Unauthorized`

Token missing, expired, or lacks `read:packages`.

- Confirm `NODE_AUTH_TOKEN` is set in the same shell/job that runs install:
  `echo "${NODE_AUTH_TOKEN:+set}"` should print `set`.
- For cross-org installs, confirm the secret is `DECOPERATIONS_NPM_TOKEN`
  and that the workflow references `secrets.DECOPERATIONS_NPM_TOKEN`
  (org secrets only show up if the repo is in their access list).
- For fine-grained PATs, confirm the org grants `Packages: read`.

### `npm ERR! 404 Not Found - @decoperations/owasp-wtf`

The request hit `registry.npmjs.org` instead of GitHub Packages.

- Check that `.npmrc` contains the scope line **exactly**:
  `@decoperations:registry=https://npm.pkg.github.com`
- Watch for typos (`@decopearations`, `@dec-operations`) — npm silently
  falls back to the public registry on a scope miss.
- Verify with `npm config get @decoperations:registry`.

### `ERR_PNPM_OUTDATED_LOCKFILE` on `--frozen-lockfile`

`pnpm-lock.yaml` records the resolved tarball URL. If the lockfile was
generated before the scope flip, pnpm will refuse to install.

- Regenerate locally with `NODE_AUTH_TOKEN` set: `pnpm install` (no
  `--frozen-lockfile`), then commit the updated `pnpm-lock.yaml`.
- Re-run CI; `--frozen-lockfile` should now pass.

### `npm ERR! code E403` / wrong scope

You authenticated, but the scope is wrong (e.g. `@decoperation`
singular, or pointing `@dial-wtf` at the DecOperations registry).

- Inspect `.npmrc` with `cat .npmrc` — every `@scope:registry=...` line
  must match an `@scope/name` in your dependencies.
- If a workflow does `scope: '@something-else'` on `setup-node`, that
  rewrites `~/.npmrc` for the job and can clobber a repo-level `.npmrc`.

---

## 6. Quick verification

From any repo with the `.npmrc` and a token in env:

```bash
npm view @decoperations/owasp-wtf version
# Should print the latest published version, not 404.
```

If that works, `pnpm install` (or `npm install`) against the same registry
will work too.

---

## See also

- [Installation](./installation.md) — for end-user install methods
  (`npx`, global, GitHub Action, source).
- [Releasing](../RELEASING.md) — for how this package is published.
