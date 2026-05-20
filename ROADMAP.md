# OWASP.WTF Roadmap

Public roadmap for the OWASP.WTF security auditing platform. Phases are
shipped, in-progress, planned, or exploring. Items map to GitHub issues
where applicable.

## Phase 1 — Release Automation Foundation

<!-- meta: status=shipped, eta=2026-Q2 -->

Productionize the release pipeline so every version ships automatically from
Conventional Commits with no manual bumps.

- [x] Conventional Commits enforced via commitlint + husky
- [x] semantic-release wired with conventionalcommits preset
- [x] Tag format anchored to `cli-v*`
- [x] 0.x graduation guard (BREAKING → minor while pre-1.0)
- [x] CI quality gates: lint, typecheck, test, build, self-scan
- [x] Release workflow: gated by CI, publishes to GitHub Packages
- [x] Post-release smoke test
- [x] Build-time version metadata (`--version` reports SHA + build date)

## Phase 2 — Supply Chain & Security Hardening

<!-- meta: status=in-progress, eta=2026-Q3 -->

Make the release artifacts verifiable end-to-end. SBOMs, provenance, secret
scans, and CodeQL gating every publish.

- [ ] Gitleaks secret scan on PR + push
- [ ] OSV-Scanner dependency audit
- [ ] CodeQL workflow for JS/TS
- [ ] Syft SBOM generation, uploaded as release artifact
- [ ] npm Trusted Publishing (OIDC, no long-lived `NPM_TOKEN`)
- [ ] Provenance attestations on every published version
- [ ] Branch protection: linear history, signed commits, required reviews
- [ ] `SECURITY.md` with vuln disclosure policy

## Phase 3 — Continuous Delivery for PRs

<!-- meta: status=planned, eta=2026-Q3 -->

Every PR ships an installable canary so reviewers can test the exact change
without a stable release.

- [ ] Per-PR canary workflow publishing `0.x.y-pr.<num>.<sha>`
- [ ] PR comment bot with `npm install @canary` instructions
- [ ] Nightly prerelease channel
- [ ] Preview-deploy scanner reports linked from PR
- [ ] Auto-revert if smoke-test fails post-publish

## Phase 4 — Public API Stabilization

<!-- meta: status=planned, eta=2026-Q4 -->

Lock down the contracts users depend on so we can cut a deliberate `1.0.0`.

- [ ] Document CLI command surface and flags
- [ ] Document config file schema with JSON Schema
- [ ] Stable JSON output schema with versioning
- [ ] Stable SARIF output conforming to SARIF 2.1.0
- [ ] Documented exit codes
- [ ] Plugin interface for custom rules and scanners
- [ ] Backwards-compat policy in `CONTRIBUTING.md`

## Phase 5 — Scanner Engine

<!-- meta: status=exploring, eta=2026-Q4 -->

Expand detection beyond pattern matching. Cross-file data flow, framework
awareness, and CVE-informed rule updates.

- [ ] Cross-file taint tracking
- [ ] Framework-aware rules (Next.js, Express, Django, Flask, Gin)
- [ ] CVE-aware rule synchronization
- [ ] Semgrep adapter
- [ ] Custom rule DSL

## Phase 6 — Web Platform

<!-- meta: status=exploring -->

Hosted dashboards, team collaboration, historical trends.

- [ ] Hosted scan history per repo
- [ ] Team accounts and access control
- [ ] Trend charts (severity over time)
- [ ] PR check integration as a GitHub App
- [ ] Webhook delivery for findings
