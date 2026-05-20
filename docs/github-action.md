# GitHub Action

`decoperations/owasp.wtf` is a reusable **composite** action — drop it into any
workflow and it'll install the OWASP.WTF CLI, install the requested OSS
scanners (Semgrep, Gitleaks, Trivy, etc.), run a scan, and upload the report
(plus SARIF to GitHub code scanning).

## Quick start

```yaml
# .github/workflows/security.yml
name: Security
on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
      security-events: write   # for SARIF upload to code scanning
    steps:
      - uses: actions/checkout@v4
      - uses: decoperations/owasp.wtf@v1
```

That's it. The defaults run a standard scan with Semgrep + Gitleaks + Trivy,
write a SARIF report, upload it to GitHub code scanning, and archive it as a
workflow artifact.

## Inputs

| Input | Default | Description |
|---|---|---|
| `directory` | `.` | Directory to scan |
| `mode` | `scan` | Scan mode: `quick`, `scan`, `deep` |
| `format` | `sarif` | Output format: `terminal`, `json`, `sarif`, `markdown`, `html`, `fix-plan` |
| `output` | `owasp-wtf.sarif` | Report path |
| `ignore` | — | Comma-separated ignore globs |
| `fail-on` | `high` | Fail the workflow when any finding ≥ this severity (`critical`, `high`, `medium`, `low`). Empty = never fail. |
| `install-tools` | `semgrep,gitleaks,trivy` | OSS scanners to auto-install. Supported: `semgrep`, `gitleaks`, `trivy`, `syft`, `grype`, `hadolint`. |
| `agent` | `generic` | For `format: fix-plan`: `claude`, `cursor`, `codex`, `copilot`, `generic` |
| `version` | `latest` | CLI version to install (`latest`, `1.0.0`, …) |
| `upload-artifact` | `true` | Upload the report as a workflow artifact |
| `upload-sarif` | `auto` | Upload SARIF to code scanning. `auto` = on when `format: sarif`. |
| `artifact-name` | `owasp-wtf-report` | Name for the uploaded artifact |
| `node-version` | `22` | Node.js version used to run the CLI |
| `github-token` | `${{ github.token }}` | Token for GitHub Packages install (needs `read:packages`) |

## Outputs

| Output | Description |
|---|---|
| `report-path` | Path of the generated report |
| `findings` | Total finding count (when `format: json` or `format: sarif`) |
| `score` | Risk score 0–100 (when `format: json`) |

## Modes

The action calls one of the v2 CLI subcommands depending on `mode`:

| Mode | Adapters | Use |
|------|----------|-----|
| `quick` | native + gitleaks | Pre-commit / fast PR check |
| `scan` (default) | + semgrep + trivy | Normal PR / push gate |
| `deep` | + syft + grype + hadolint | Nightly / pre-release |

## Recipes

### Fail the build on high+ findings (default behavior)

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    fail-on: high
```

### SARIF → GitHub code scanning (default behavior)

```yaml
permissions:
  security-events: write
steps:
  - uses: actions/checkout@v4
  - uses: decoperations/owasp.wtf@v1
    # format defaults to sarif; SARIF is auto-uploaded to code scanning
```

### Comment a Markdown summary on the PR

```yaml
- uses: actions/checkout@v4
- id: scan
  uses: decoperations/owasp.wtf@v1
  with:
    format: markdown
    output: owasp-report.md
    fail-on: ''   # don't fail the job — we just want the comment

- name: Comment report on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const body = fs.readFileSync('${{ steps.scan.outputs.report-path }}', 'utf8');
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body,
      });
```

### Hand off to a coding agent (`SECURITY_FIX_PLAN.md`)

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    format: fix-plan
    output: SECURITY_FIX_PLAN.md
    agent: claude
    fail-on: ''
- uses: actions/upload-artifact@v4
  with:
    name: security-fix-plan
    path: SECURITY_FIX_PLAN.md
```

### Scan a sub-directory of a monorepo

```yaml
- uses: decoperations/owasp.wtf@v1
  with:
    directory: apps/api
    ignore: "**/*.test.ts,**/__generated__/**"
```

### Deep nightly scan with the full toolchain

```yaml
on:
  schedule:
    - cron: '0 6 * * *'

jobs:
  deep-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: decoperations/owasp.wtf@v1
        with:
          mode: deep
          install-tools: semgrep,gitleaks,trivy,syft,grype,hadolint
          format: sarif
          fail-on: critical
```

### JSON report as an artifact

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    format: json
    output: owasp-wtf.json
    artifact-name: owasp-json-report
```

### Pin a CLI version

```yaml
- uses: decoperations/owasp.wtf@v1
  with:
    version: 1.0.0
```

### Skip auto-installing tools (use a custom matrix)

If you'd rather install scanners yourself (e.g. via cache), set
`install-tools: ''`. The CLI will gracefully skip any missing tool and still
produce a report from whatever is installed (including the bundled native
rules).

```yaml
- uses: actions/checkout@v4
- name: Cache and install Semgrep
  run: pipx install semgrep
- uses: decoperations/owasp.wtf@v1
  with:
    install-tools: ''
```

## Pinning the action

For reproducible CI, pin by tag or SHA:

```yaml
- uses: decoperations/owasp.wtf@v1                  # latest v1.x
- uses: decoperations/owasp.wtf@<full-commit-sha>   # exact commit
```

## Permissions

| Permission | Why |
|---|---|
| `contents: read` | Check out the repo |
| `packages: read` | Install the CLI from GitHub Packages |
| `security-events: write` | Upload SARIF to GitHub code scanning |
| `pull-requests: write` | Only if you're posting comments via `github-script` |

```yaml
jobs:
  scan:
    permissions:
      contents: read
      packages: read
      security-events: write
```

## Source

The action definition lives in [`action.yml`](../action.yml) at the repo root.
PRs welcome — see [`CONTRIBUTING.md`](../CONTRIBUTING.md).
