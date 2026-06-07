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
    mode: scan        # quick | scan | deep
    fail-on: high     # fail the build on high+ findings
```

See [`docs/github-action.md`](./docs/github-action.md) for the full action reference.

## What it finds

OWASP.WTF orchestrates several best-in-class OSS scanners and maps every
finding to the OWASP Top 10 2021. Coverage depends on which tools are
installed (see `owasp-wtf doctor`):

| Layer | Tool | OWASP categories |
|-------|------|------------------|
| Native rules (bundled) | regex rules | A01, A02, A03, A05, A07, A09, A10 |
| SAST | [Semgrep](https://semgrep.dev) | A01–A05, A07, A08 |
| Secrets | [Gitleaks](https://github.com/gitleaks/gitleaks) | A02, A05 |
| Dependencies / IaC | [Trivy](https://trivy.dev) | A05, A06, A08 |
| SBOM + CVE matching | [Syft](https://github.com/anchore/syft) + [Grype](https://github.com/anchore/grype) | A06 |
| Dockerfile | [Hadolint](https://github.com/hadolint/hadolint) | A05 |

Phase 5 will add [deepsec](https://github.com/vercel-labs/deepsec) for
agentic semantic review (A04) and [OWASP ZAP](https://www.zaproxy.org/) for
DAST.

## Usage

```bash
owasp-wtf <command> [directory] [options]
```

Commands:

| Command | Description |
|---|---|
| `owasp-wtf` | Default — runs `scan` mode |
| `owasp-wtf quick` | Pre-commit fast: native + Gitleaks |
| `owasp-wtf scan` | Standard: native + Semgrep + Gitleaks + Trivy |
| `owasp-wtf deep` | Full: scan + Syft + Grype + Hadolint |
| `owasp-wtf ci` | scan + SARIF + `--fail-on high` |
| `owasp-wtf fix-plan` | scan + `SECURITY_FIX_PLAN.md` for coding agents |
| `owasp-wtf doctor` | Which scanner tools are installed? |
| `owasp-wtf install-tools` | Print install instructions |

Common options:

| Flag | Default | Description |
|---|---|---|
| `-f, --format <type>` | `terminal` | `terminal`, `json`, `sarif`, `markdown`, `html`, `fix-plan` |
| `-o, --output <file>` | — | Write the report to a file |
| `-i, --ignore <patterns>` | — | Comma-separated ignore globs |
| `--fail-on <severity>` | — | Exit non-zero if any finding ≥ `critical`/`high`/`medium`/`low` |
| `--agent <name>` | `generic` | For `--format fix-plan`: `claude`/`cursor`/`codex`/`copilot`/`generic` |
| `--show-all` | — | Show all findings in terminal output (default: top 15) |
| `--verbose` | — | Show verbose output |
| `--no-banner` | — | Suppress the ASCII banner |
| `-w, --workspace <dir>` | — | Scope the scan to a workspace subdir (repeatable) — handy for monorepos |
| `--baseline <file>` | — | Suppress findings recorded in the baseline; only grade net-new findings |
| `--update-baseline` | — | Write/refresh the baseline file from the current findings |
| `--include-build-output` | off | Scan build artifact dirs (`.next`, `dist`, `build`, `.turbo`, …). Off by default to suppress false positives |

By default the scanner excludes common build output and cache directories (`.next/`, `.nuxt/`, `dist/`, `build/`, `.turbo/`, `out/`, `coverage/`, `node_modules/`, `storybook-static/`, `**/__generated__/`). Pass `--include-build-output` to scan them anyway.

Baseline workflow (recommended for first-time PR-gate adoption):

```bash
# 1. Snapshot existing findings into a baseline you commit to the repo.
owasp-wtf scan . --baseline owasp-baseline.json --update-baseline

# 2. From now on, the gate fails only on net-new findings.
owasp-wtf scan . --baseline owasp-baseline.json --fail-on high
```

Full reference: [`docs/usage.md`](./docs/usage.md).

### Examples

```bash
# Standard scan, only fail the shell on high+
owasp-wtf scan ./src --fail-on high

# CI mode — SARIF for GitHub code scanning
owasp-wtf ci ./src

# Hand a fix plan to your coding agent
owasp-wtf fix-plan ./src --agent claude

# Deep scan, write Markdown summary, ignore tests
owasp-wtf deep --format markdown -o REPORT.md -i "**/*.test.ts,fixtures/**"

# Monorepo — scan only changed workspaces, suppress pre-existing findings
owasp-wtf scan . --workspace apps/web --workspace packages/shared \
  --baseline owasp-baseline.json --fail-on high

# Which OSS tools do I have installed?
owasp-wtf doctor
```

## AI providers (Phase 4 — roadmap)

The v1 `--ai` flow is being rebuilt as a dedicated agent layer that emits
agent-specific fix plans (`SECURITY_FIX_PLAN.md`, `.cursor/rules/security.mdc`,
`CLAUDE_SECURITY.md`) and exposes an MCP server. See [`ROADMAP.md`](./ROADMAP.md).

For now you can run `owasp-wtf setup` to configure providers (Claude Code,
Codex, Anthropic API, OpenAI API, Ollama); the credentials carry forward into
the new flow. Details: [`docs/ai-providers.md`](./docs/ai-providers.md).

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
