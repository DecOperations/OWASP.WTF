# Policy: Distribute internal CLI tools via GitHub Release assets, not GitHub Packages

**Status:** Proposed
**Scope:** All DecOperations CLI packages consumed by composite GitHub Actions across repos
**Origin:** OWASP.WTF POC adoption in `DecOperations/Calibrate.WTF`, May 2026

---

## TL;DR

The default `GITHUB_TOKEN` in a consumer repo's workflow **cannot install
npm packages from `npm.pkg.github.com` that are owned by a different
repository**, even within the same organization. This is a long-standing,
documented GitHub Packages limitation with no token-side fix.

For CLI tools we ship as composite Actions, the canonical distribution
channel should be a **tarball asset attached to the GitHub Release of the
source repo**, downloaded by the action and installed with
`npm install -g <tarball>`. This works out-of-the-box with the consumer's
ambient `GITHUB_TOKEN`, requires no PAT, no org-package-permission ritual,
and no secret provisioning per consuming repo.

GitHub Packages remains valid for *intra-repo* consumption (a repo
installing its own published package) and for cases where end users
authenticate with a PAT they manage themselves.

---

## Situation

`DecOperations/Calibrate.WTF` is the pilot consumer for the
`DecOperations/OWASP.WTF@main` composite Action.

`.github/workflows/security-scan.yml`:

```yaml
- uses: actions/checkout@v4
- uses: DecOperations/OWASP.WTF@main
  with:
    mode: scan
    fail-on: high
```

Every run on every branch fails at the install step:

```
npm error code E403
npm error 403 Forbidden - GET https://npm.pkg.github.com/@decoperations%2fowasp-wtf
  - Permission installation not allowed to Read organization package
```

The action wiring itself is correct: it calls `actions/setup-node@v4` with
`registry-url: https://npm.pkg.github.com` and `scope: @decoperations`, and
exports `NODE_AUTH_TOKEN: ${{ inputs.github-token }}` (which defaults to
`${{ github.token }}`). The auth reaches the registry. The registry
refuses.

## Problem

A workflow's auto-provisioned `GITHUB_TOKEN` is scoped to the **triggering
repository**. For GitHub Packages reads, that scope is enforced at the
registry: the token may only install packages whose owning repo is the
triggering repo. Cross-repo installs — including **same-org** cross-repo —
return `403 Permission installation not allowed to Read organization
package`.

There is no workflow-side toggle, action input, or `permissions:` key that
lifts this restriction. The only token-based workarounds are:

1. A **classic PAT** with `read:packages`, stored as a secret in every
   consuming repo. Requires a human owner, rotation, and per-repo
   provisioning. Breaks the "drop in the action and go" promise.
2. A **fine-grained PAT** or **GitHub App installation token** scoped to
   the package's owning repo. Same provisioning burden, plus GitHub Apps
   famously [cannot authenticate to GitHub Packages][gh-apps-packages].

Both options put friction on the consumer side that the action author
cannot eliminate.

## Why GitHub Release assets work

GitHub Releases on a **public** repo (`DecOperations/OWASP.WTF` is public)
are downloadable by anyone, with or without auth. From within a consuming
workflow on a private repo, the ambient `GITHUB_TOKEN` is sufficient to
hit `api.github.com/repos/.../releases/latest` and the
`/releases/download/<tag>/<asset>` URL — no cross-repo permission grant
involved, because public-repo release reads are not gated on package
permissions at all.

Concretely the install step becomes:

```bash
tag=$(curl -sSfL -H "Authorization: Bearer $GH_TOKEN" \
  https://api.github.com/repos/DecOperations/OWASP.WTF/releases/latest \
  | jq -r .tag_name)
asset_url=$(curl -sSfL -H "Authorization: Bearer $GH_TOKEN" \
  "https://api.github.com/repos/DecOperations/OWASP.WTF/releases/tags/$tag" \
  | jq -r '.assets[] | select(.name | endswith(".tgz")) | .browser_download_url')
curl -sSfL -H "Authorization: Bearer $GH_TOKEN" -o /tmp/cli.tgz "$asset_url"
npm install -g /tmp/cli.tgz
```

Producer side (one-time addition to the publish workflow):

```yaml
- run: pnpm --filter @decoperations/owasp-wtf pack
- run: gh release upload "$RELEASE_TAG" decoperations-owasp-wtf-*.tgz
  env: { GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

This produces an immutable, version-pinned, integrity-checkable artifact
that any consumer can install without us granting them anything.

## Trade-off matrix

| Concern | GHP (`npm.pkg.github.com`) | Release tarball |
|---|---|---|
| Same-repo install | Works | Works |
| Cross-repo same-org install with default `GITHUB_TOKEN` | **Fails 403** | Works |
| Cross-org install | Needs PAT in consumer | Works (if source repo public) |
| Anonymous install | Not supported | Works (if source repo public) |
| Source repo private | Needs PAT | Needs token with `contents:read` on source repo (still simpler than `read:packages` on org) |
| Discoverability via `npm view` | Yes | No (intentional — internal channel) |
| Semver range resolution (`^1.2`) | Yes | No (we pin to release tag) |
| Audit trail | Package versions | Git tag + release notes + asset SHA |

For composite Actions, every row that matters is a win or a wash for the
release-asset approach.

## When to still use GitHub Packages

- **Library packages** consumed at build time inside the same repo that
  publishes them (no cross-repo hop).
- **Public-npm dual-publish** scenarios where GHP is the mirror and npmjs
  is the primary — consumers hit npmjs.
- **End-user-authenticated installs** where the human running `npm
  install` already has a PAT in their `~/.npmrc` (developer machines, not
  CI in foreign repos).

For everything else — and especially for "drop this action into your
workflow" CLIs — default to release-asset distribution.

## Implementation checklist for new CLI packages

- [ ] Publish workflow runs `pnpm pack` after `semantic-release`.
- [ ] Tarball uploaded as a release asset on every tag.
- [ ] Composite action resolves `<tag>` from the GitHub Releases API
      (pinned input wins; `latest` falls back to `releases/latest`).
- [ ] Composite action downloads the asset using the consumer's
      `${{ github.token }}` and installs with `npm install -g <tarball>`.
- [ ] Action documents `permissions: contents: read` as the minimum.
- [ ] No `registry-url` / `scope` / `NODE_AUTH_TOKEN` setup needed in the
      action.
- [ ] Optional: dual-publish to public npmjs.org for non-Actions users.

## References

GitHub's own documentation acknowledges the limitation but buries it:

- **GitHub Docs — *About permissions for GitHub Packages***:
  "To install packages associated with other private repositories that
  `GITHUB_TOKEN` can't access, use a personal access token (classic)."
  <https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages>

- **GitHub Docs — *Working with the npm registry***: registry-url and
  scope setup for `npm.pkg.github.com` — silent on cross-repo installs.
  <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry>

- **GitHub Docs — *Automatic token authentication***: defines
  `GITHUB_TOKEN` scope as bound to the triggering repository.
  <https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication>

- **GitHub Community discussion #24636** — *"Cannot install package from
  another private repository"*. Open since 2020, still active in 2026.
  GitHub staff (`francisfuzz`) confirm the `packages` permission visible
  in GitHub App settings only grants billing-API access, not package
  read/write, and the only supported workaround for cross-repo installs
  is a classic PAT.
  <https://github.com/orgs/community/discussions/24636>

- **GitHub Docs — *Installing a package***: includes the canonical
  workaround text recommending PATs for cross-repo / cross-org installs.
  <https://docs.github.com/en/packages/working-with-a-github-packages-registry/installing-a-package>

There is, as of this writing, no GitHub-published guidance that names
release-asset distribution as the recommended pattern for cross-repo
Action-installed CLIs. This policy fills that gap for our org.

[gh-apps-packages]: https://github.com/orgs/community/discussions/24636
