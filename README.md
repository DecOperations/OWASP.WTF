# OWASP.WTF

> AI-powered OWASP security auditing for modern codebases.

[![CI](https://github.com/DecOperations/OWASP.WTF/actions/workflows/ci.yml/badge.svg)](https://github.com/DecOperations/OWASP.WTF/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node ≥ 20](https://img.shields.io/badge/node-%E2%89%A520-brightgreen)](https://nodejs.org)

OWASP.WTF scans a codebase for **OWASP Top 10** vulnerabilities. It combines fast
static rules with optional AI-assisted analysis (Claude, GPT, local models, or
Ollama) that traces data flow and produces concrete, framework-aware fixes.

🌐 **Website:** <https://owasp.wtf>
📚 **Docs:** [`docs/`](./docs) · [Installation](./docs/installation.md) · [Usage](./docs/usage.md) · [GitHub Action](./docs/github-action.md) · [AI providers](./docs/ai-providers.md) · [Configuration](./docs/configuration.md)
💬 **Issues:** <https://github.com/DecOperations/OWASP.WTF/issues>

---

## Quick start

```bash
# One-shot scan of the current directory
npx owasp-wtf

# Or install globally
npm install -g owasp-wtf
owasp-wtf
```

Requires Node.js **20+**.

In a CI pipeline:

```yaml
# .github/workflows/security.yml
- uses: actions/checkout@v4
- uses: decoperations/owasp.wtf@v1
  with:
    severity: high
    fail-on-findings: true
```

See [`docs/github-action.md`](./docs/github-action.md) for the full action reference.

## What it finds

| ID | Category | Detection |
|---|---|---|
| A01 | Broken Access Control | ✅ |
| A02 | Cryptographic Failures | ✅ |
| A03 | Injection | ✅ |
| A05 | Security Misconfiguration | ✅ |
| A07 | Auth Failures | ✅ |
| A09 | Logging Failures | ✅ |

A04, A06, A08, A10 surface through AI-assisted analysis when `--ai` is enabled.

## Usage

```bash
owasp-wtf [directory] [options]
```

Common options:

| Flag | Default | Description |
|---|---|---|
| `-f, --format <type>` | `terminal` | `terminal`, `json`, or `html` |
| `-o, --output <file>` | — | Write the report to a file |
| `-s, --severity <level>` | `low` | Minimum severity: `critical`, `high`, `medium`, `low`, `info` |
| `-i, --ignore <patterns>` | — | Comma-separated ignore globs |
| `--ai` | off | Enable AI-assisted analysis |
| `--setup` | — | Run interactive AI provider setup |
| `--verbose` | — | Show verbose output |
| `--no-color` | — | Disable color output |

Full reference: [`docs/usage.md`](./docs/usage.md).

### Examples

```bash
# Scan ./src, only show high and above, write JSON
owasp-wtf ./src -s high -f json -o report.json

# Scan with AI analysis, ignore tests and fixtures
owasp-wtf --ai -i "**/*.test.ts,fixtures/**"

# HTML report for the team
owasp-wtf -f html -o report.html
```

## AI providers

OWASP.WTF can use any of the following for AI-assisted analysis. Run
`owasp-wtf --setup` to configure interactively.

- **Claude Code CLI** (local, uses your existing auth)
- **OpenAI Codex CLI** (local, uses your existing auth)
- **Anthropic API** (`ANTHROPIC_API_KEY`)
- **OpenAI API** (`OPENAI_API_KEY`)
- **Ollama** (local models, no key required)

Config is stored in `~/.owasp-wtf/config.json`. Details: [`docs/ai-providers.md`](./docs/ai-providers.md).

## Repository layout

```
.
├── action.yml            # Reusable GitHub Action (composite)
├── apps/web              # Marketing & docs site (Next.js)
├── packages/cli          # The owasp-wtf CLI (TypeScript, tsup)
├── docs/                 # Markdown documentation
└── .github/workflows     # CI + release automation
```

## Development

```bash
pnpm install
pnpm build           # Build all packages
pnpm dev             # Run the web app in dev mode
pnpm --filter @decoperations/owasp-wtf dev   # Watch-build the CLI

# Run the CLI from source against this repo
node packages/cli/dist/index.js .
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full contributor guide.

## License

[MIT](./LICENSE) © DecOperations
