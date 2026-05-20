# OWASP.WTF Roadmap

> Source of truth for what OWASP.WTF is becoming. The `<!-- meta: -->`
> markers below are parsed by the website at
> [/roadmap](https://owasp.wtf/roadmap). Architecture details for the
> meta-scanner direction live in
> [`specs/owasp-wtf-v2.md`](./specs/owasp-wtf-v2.md). Tracked in
> issue [#3](https://github.com/DecOperations/OWASP.WTF/issues/3).

## Vision

> OWASP.WTF runs the best open-source security scanners and turns the mess
> into one OWASP Top 10 semantic report with agent-ready fixes.

We don't compete on detection. We orchestrate, normalize, prioritize, map
to OWASP, and emit reports humans and coding agents can act on.

## Phase 1 — Release Automation Foundation

<!-- meta: status=shipped, eta=2026-Q2 -->

Productionize the release pipeline so every version ships automatically
from Conventional Commits with no manual bumps.

- [x] Conventional Commits enforced via commitlint + husky
- [x] semantic-release wired with conventionalcommits preset
- [x] Tag format anchored to `cli-v*`
- [x] 0.x graduation guard (BREAKING → minor while pre-1.0)
- [x] CI quality gates: lint, typecheck, test, build, self-scan
- [x] Release workflow: gated by CI, publishes to GitHub Packages
- [x] Post-release smoke test
- [x] Build-time version metadata (`--version` reports SHA + build date)

## Phase 2 — Meta-Scanner Orchestrator

<!-- meta: status=in-progress, eta=2026-Q2 -->

Reposition the CLI from "another scanner" to an AppSec orchestrator that
runs best-of-breed OSS tools, normalizes their output, and maps to OWASP
Top 10. See [`specs/owasp-wtf-v2.md`](./specs/owasp-wtf-v2.md).

- [x] Adapter interface + normalized `OwaspFinding` schema
- [x] Native adapter (zero-dep regex rules, always available)
- [x] Semgrep / Gitleaks / Trivy adapters
- [x] Deterministic CWE → OWASP Top 10 2021 mapping table
- [x] Cross-tool dedupe with `confirmedBy`
- [x] `quick` / `scan` / `deep` / `ci` / `fix-plan` / `doctor` / `install-tools` subcommands
- [x] Terminal / JSON / SARIF / Markdown / HTML reporters
- [x] Agent fix-plan reporter (`SECURITY_FIX_PLAN.md`)
- [x] Severity-based `--fail-on` for CI
- [x] GitHub Action wired to the v2 subcommand surface
- [ ] Per-finding deduplication tests / golden files

## Phase 3 — Supply Chain & Security Hardening

<!-- meta: status=in-progress, eta=2026-Q3 -->

Make release artifacts verifiable end-to-end and expand the orchestrator
to cover the supply chain.

- [x] Syft SBOM generation adapter (Phase 2 of the CLI)
- [x] Grype CVE matching adapter
- [x] Hadolint Dockerfile linting (auto-enabled when Dockerfile present)
- [ ] Gitleaks secret scan in repo CI on PR + push
- [ ] OSV-Scanner dependency audit
- [ ] CodeQL workflow for JS/TS
- [ ] Syft SBOM uploaded as release artifact (CycloneDX + SPDX)
- [ ] [Dependency-Track](https://dependencytrack.org/) push integration
- [ ] VEX statements for known-not-exploitable CVEs
- [ ] npm Trusted Publishing (OIDC, no long-lived `NPM_TOKEN`)
- [ ] Provenance attestations on every published version
- [ ] Branch protection: linear history, signed commits, required reviews
- [ ] `SECURITY.md` with vulnerability disclosure policy

## Phase 4 — CI/CD & PR Continuous Delivery

<!-- meta: status=planned, eta=2026-Q3 -->

Ship every PR as an installable canary, and make the GitHub Action a
first-class part of the dev loop.

- [ ] Per-PR canary publishing `0.x.y-pr.<num>.<sha>`
- [ ] PR comment bot with `npm install @canary` instructions
- [ ] Nightly prerelease channel
- [ ] PR comment summary from the Action (markdown + emoji badges)
- [ ] DefectDojo-compatible JSON importer output
- [ ] Workflow templates for Vercel / Cloudflare / Fly.io
- [ ] Preview-deploy scanner reports linked from PR
- [ ] Auto-revert if smoke-test fails post-publish

## Phase 5 — Coding-Agent Layer

<!-- meta: status=planned, eta=2026-Q3 -->

Translate findings into machine-actionable remediation that agents
(Claude Code, Cursor, Codex, Copilot) can apply.

- [x] Generic `SECURITY_FIX_PLAN.md` writer
- [ ] Per-agent prompt formats (Claude / Cursor / Codex / Copilot variants)
- [ ] `.cursor/rules/security.mdc` writer
- [ ] `CLAUDE_SECURITY.md` writer
- [ ] MCP server exposing `scan`, `explain`, `fix-plan`
- [ ] Live mode: `owasp-wtf watch` re-scans on file changes

## Phase 6 — Public API Stabilization

<!-- meta: status=planned, eta=2026-Q4 -->

Lock down the contracts users depend on so we can cut a deliberate
`1.0.0`.

- [ ] Document CLI command surface and flags
- [ ] Document config file schema with JSON Schema
- [ ] Stable JSON output schema with versioning (`schemaVersion`)
- [ ] Stable SARIF output conforming to SARIF 2.1.0
- [ ] Documented exit codes
- [ ] Plugin interface for custom adapters and rules
- [ ] Backwards-compat policy in `CONTRIBUTING.md`

## Phase 7 — Semantic + DAST

<!-- meta: status=exploring, eta=2026-Q4 -->

Go beyond pattern matching and SCA. Agentic semantic review for business
logic, dynamic scanning for live apps, framework-specific rule packs.

- [ ] [deepsec](https://github.com/vercel-labs/deepsec) adapter (agentic semantic scan)
- [ ] OWASP ZAP adapter (`--url` against a live app)
- [ ] Framework packs: Next.js / NestJS / Rails / Django / Laravel
- [ ] Optional: Solana / EVM smart-contract rule packs
- [ ] CVE-aware adapter version synchronization

## Phase 8 — Web Platform

<!-- meta: status=exploring -->

Hosted dashboards, team collaboration, historical trends.

- [ ] Hosted scan history per repo
- [ ] Team accounts and access control
- [ ] Trend charts (severity over time)
- [ ] PR check integration as a GitHub App
- [ ] Webhook delivery for findings

## Non-goals

- Reimplementing what Trivy / Semgrep / Gitleaks already do
- Replacing vulnerability management platforms (DefectDojo, ArmorCode, Apiiro)
- Implying official OWASP foundation endorsement — marketing must say
  _"OWASP Top 10 oriented."_
