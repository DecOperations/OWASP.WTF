# GitHub Action

`decoperations/owasp.wtf` is a reusable **composite** action — drop it into any
workflow and it'll install the CLI and run a scan.

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
    steps:
      - uses: actions/checkout@v4
      - uses: decoperations/owasp.wtf@v1
```

That's it. The report is uploaded as a workflow artifact named
`owasp-wtf-report`.

## Inputs

| Input | Default | Description |
|---|---|---|
| `directory` | `.` | Directory to scan |
| `severity` | `low` | Minimum severity: `critical`, `high`, `medium`, `low`, `info` |
| `format` | `json` | Output format: `terminal`, `json`, `html` |
| `output` | `owasp-wtf-report.json` | Report path |
| `ignore` | — | Comma-separated ignore globs |
| `ai` | `false` | Enable AI-assisted analysis (requires provider env / config) |
| `fail-on-findings` | `false` | Fail the job if any findings ≥ `severity` exist |
| `version` | `latest` | CLI version to install (`latest`, `0.1.1`, etc.) |
| `upload-artifact` | `true` | Upload the report as a workflow artifact |
| `artifact-name` | `owasp-wtf-report` | Name for the uploaded artifact |
| `node-version` | `22` | Node.js version used to run the CLI |
| `github-token` | `${{ github.token }}` | Token for GitHub Packages install (when installing from there) |

## Outputs

| Output | Description |
|---|---|
| `report-path` | Path of the generated report |
| `findings` | Total finding count (only set when `format: json`) |

## Recipes

### Fail the build on high+ findings

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    severity: high
    fail-on-findings: true
```

### Comment the report on the PR

```yaml
- uses: actions/checkout@v4
- id: scan
  uses: decoperations/owasp.wtf@v1
  with:
    format: json
    severity: high

- name: Comment findings on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const report = JSON.parse(fs.readFileSync('${{ steps.scan.outputs.report-path }}', 'utf8'));
      const total = report.summary?.total ?? 0;
      const body = `## 🛡️ OWASP.WTF — ${total} finding(s)\n\n` +
        Object.entries(report.summary?.bySeverity ?? {})
          .map(([sev, n]) => `- **${sev}**: ${n}`).join('\n');
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body,
      });
```

### Scan a sub-directory of a monorepo

```yaml
- uses: decoperations/owasp.wtf@v1
  with:
    directory: apps/api
    ignore: "**/*.test.ts,**/__generated__/**"
```

### AI-assisted in CI (Anthropic API)

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    ai: 'true'
    severity: medium
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

The CLI reads the key from the environment at scan time when configured with
`apiKey: "env"`.

### HTML report as an artifact

```yaml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    format: html
    output: owasp-report.html
    artifact-name: owasp-html-report
```

### Pin a CLI version

```yaml
- uses: decoperations/owasp.wtf@v1
  with:
    version: 0.1.1
```

## Pinning the action

For reproducible CI, pin by tag or SHA:

```yaml
- uses: decoperations/owasp.wtf@v1                    # latest v1.x
- uses: decoperations/owasp.wtf@<full-commit-sha>      # exact commit
```

## Permissions

The action only needs read access to the repository. If you're installing from
GitHub Packages (org-internal flow), the auto-provided `github.token` needs
`read:packages` — set it at the job level:

```yaml
jobs:
  scan:
    permissions:
      contents: read
      packages: read
```

The `pull-requests: write` permission is only needed if you're posting comments
to PRs (see the recipe above).

## Source

The action definition lives in [`action.yml`](../action.yml) at the repo root.
PRs welcome — see [`CONTRIBUTING.md`](../CONTRIBUTING.md).
