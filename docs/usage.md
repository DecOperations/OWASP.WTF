# Usage

```bash
owasp-wtf [directory] [options]
```

`directory` defaults to `.`. The scanner walks the directory recursively,
respecting `.gitignore`, and emits a report.

## Options

| Flag | Default | Description |
|---|---|---|
| `-f, --format <type>` | `terminal` | Output format: `terminal`, `json`, `html` |
| `-o, --output <file>` | — | Write the report to a file (in addition to stdout) |
| `-s, --severity <level>` | `low` | Minimum severity reported. One of: `critical`, `high`, `medium`, `low`, `info` |
| `-i, --ignore <patterns>` | — | Comma-separated glob patterns to skip |
| `--ai` | off | Enable AI-assisted analysis (requires a configured provider) |
| `--setup` | — | Run the interactive AI provider setup wizard and exit |
| `--no-color` | — | Disable ANSI colors |
| `--verbose` | — | Show verbose progress |
| `-V, --version` | — | Print CLI version |
| `-h, --help` | — | Print help |

## Output formats

### `terminal` (default)

Color-coded human-readable report with a per-category breakdown, severity
counts, and the worst findings inlined. Best for local runs.

### `json`

Machine-readable. Stable shape:

```jsonc
{
  "version": "0.1.1",
  "scannedAt": "2026-05-20T14:23:00.000Z",
  "directory": "/path/to/repo",
  "summary": {
    "total": 14,
    "bySeverity": { "critical": 2, "high": 5, "medium": 4, "low": 3 }
  },
  "findings": [
    {
      "id": "a03-sql-template-literal",
      "category": "A03:2021",
      "severity": "critical",
      "title": "SQL built via template literal",
      "file": "src/db/users.ts",
      "line": 42,
      "snippet": "…",
      "remediation": "…"
    }
  ]
}
```

Pipe it anywhere:

```bash
owasp-wtf -f json | jq '.summary'
owasp-wtf -f json -o report.json
```

### `html`

Self-contained HTML report you can share or attach to a PR. Includes inline
syntax-highlighted snippets and a severity dashboard.

```bash
owasp-wtf -f html -o report.html
open report.html
```

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Scan completed; no fatal errors |
| `1` | Scan failed (CLI error, bad flags, IO failure) |
| `2` | Scan completed but findings ≥ `--severity` exist (only when `--fail-on-findings` style gates are used — see [GitHub Action](./github-action.md)) |

The CLI itself does **not** non-zero-exit on findings by default — wire that
into your CI gate using the GitHub Action's `fail-on-findings: true` input, or
check the JSON output yourself.

## Examples

```bash
# Quick local scan
owasp-wtf

# Limit to high-severity findings, write JSON
owasp-wtf ./src -s high -f json -o report.json

# AI-assisted, ignore tests and generated code
owasp-wtf --ai -i "**/*.test.ts,**/__generated__/**"

# HTML report for sharing
owasp-wtf -f html -o report.html

# CI gate (exit non-zero if any high+ findings)
owasp-wtf -f json -o report.json -s high
node -e "process.exit(JSON.parse(require('fs').readFileSync('report.json')).summary.total ? 1 : 0)"
```

## Tips

- The first `--ai` run kicks off [`--setup`](./configuration.md) if no provider
  is configured.
- `.gitignore` is honored automatically. Use `--ignore` for additional patterns.
- For monorepos, run the CLI from each app's directory and collect reports
  separately — or scan from the root and let the report group findings by path.
