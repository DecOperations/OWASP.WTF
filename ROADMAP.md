# OWASP.WTF Roadmap

> Source of truth for what OWASP.WTF is becoming. Tracked in issue
> [#3](https://github.com/DecOperations/OWASP.WTF/issues/3).

## Vision

> OWASP.WTF runs the best open-source security scanners and turns the mess
> into one OWASP Top 10 semantic report with agent-ready fixes.

We are not building another scanner. We orchestrate, normalize, prioritize,
map to OWASP, and emit reports humans and coding agents can act on.

## Default tool bundle

| Layer | Tool | Default? | Notes |
|-------|------|---------|-------|
| Native rules | bundled regex rules | ✅ | Zero-dep fallback so the CLI works without anything installed |
| SAST | [Semgrep](https://semgrep.dev) | ✅ | Runs the `p/owasp-top-ten` ruleset |
| Secrets | [Gitleaks](https://github.com/gitleaks/gitleaks) | ✅ | Working-tree scan, redacted output |
| Repo / deps / IaC | [Trivy](https://trivy.dev) | ✅ | `vuln` + `misconfig` scanners |
| SBOM | [Syft](https://github.com/anchore/syft) | `deep` | CycloneDX, consumed by Grype |
| SBOM vuln scan | [Grype](https://github.com/anchore/grype) | `deep` | Prefers SBOM input from Syft |
| Dockerfile | [Hadolint](https://github.com/hadolint/hadolint) | `deep` | Auto-enables when a Dockerfile is present |
| Semantic / agentic | [deepsec](https://github.com/vercel-labs/deepsec) | Phase 5 | Agent-driven business-logic review |
| DAST | [OWASP ZAP](https://www.zaproxy.org/) | Phase 5 | Opt-in via `--url` |

## Phases

### ✅ Phase 1 — Orchestrator MVP (this PR)

- [x] Adapter interface + normalized `OwaspFinding` schema
- [x] Native adapter (wraps existing rules — zero-dep default)
- [x] Semgrep, Gitleaks, Trivy adapters
- [x] CWE → OWASP Top 10 deterministic mapper (2021 mapping table)
- [x] Cross-tool dedupe with `confirmedBy`
- [x] `scan` / `quick` / `deep` / `ci` / `fix-plan` / `doctor` / `install-tools` commands
- [x] Terminal / JSON / SARIF / Markdown / HTML reporters
- [x] Agent fix-plan reporter (`SECURITY_FIX_PLAN.md`)
- [x] Severity-based fail-on threshold for CI

### Phase 2 — Supply chain

- [x] Syft + Grype adapters (in `deep` mode)
- [x] Hadolint auto-enable on Dockerfile
- [ ] CycloneDX + SPDX as first-class output formats
- [ ] [Dependency-Track](https://dependencytrack.org/) push integration
- [ ] VEX statements for known-not-exploitable CVEs

### Phase 3 — CI/CD polish

- [ ] GitHub Action (`decoperations/owasp-wtf-action`)
- [ ] PR comment summary (markdown + emoji badges)
- [ ] DefectDojo-compatible JSON importer
- [ ] Workflow templates for Vercel, Cloudflare, Fly.io

### Phase 4 — Agent layer

- [ ] Per-agent prompt formats (Claude, Cursor, Codex, Copilot variants)
- [ ] `.cursor/rules/security.mdc` writer
- [ ] `CLAUDE_SECURITY.md` writer
- [ ] MCP server exposing `scan`, `explain`, `fix-plan`
- [ ] Live mode: `owasp-wtf watch` re-scans on file changes

### Phase 5 — Semantic + DAST

- [ ] `deepsec` adapter (semantic agentic scan, gated behind `semantic` command)
- [ ] OWASP ZAP adapter (`--url` for DAST against live app)
- [ ] Framework packs: Next.js / NestJS / Rails / Django / Laravel
- [ ] Optional: Solana / EVM smart-contract rule packs

## Non-goals

- Reimplementing what Trivy / Semgrep / Gitleaks already do
- Hosted SaaS scanning
- Enterprise SSO / RBAC / multi-tenant
- Replacing vulnerability management platforms (DefectDojo, ArmorCode, Apiiro)

## Naming guidance

OWASP is a real foundation. Marketing must say _"OWASP Top 10 oriented"_ —
never imply official endorsement.
