# OWASP.WTF v2 Specification — Meta-Scanner Architecture

> Supersedes `owasp-wtf-v1.md`. Driven by issue
> [#3](https://github.com/DecOperations/OWASP.WTF/issues/3).

## Repositioning

v1: "AI-powered OWASP Top 10 scanner."
v2: **"AppSec orchestrator. Best OSS scanners, one OWASP report, agent-ready fixes."**

The crowded categories (SAST, SCA, secrets, IaC, container, AI remediation)
are well-served by existing tools. The real gap is **orchestration,
normalization, OWASP intelligence, and agent-actionable fix plans.**

## Architecture

```
packages/cli/src/
├── core/
│   ├── types.ts          # OwaspFinding, ScanReport, severity/category unions
│   ├── owasp-map.ts      # CWE/category → OWASP Top 10 2021 deterministic table
│   ├── normalize.ts      # fingerprint + dedupe + sort
│   └── score.ts          # build ScanReport from findings
│
├── adapters/
│   ├── types.ts          # ScannerAdapter interface
│   ├── exec.ts           # shell-out helper with timeouts
│   ├── native.ts         # bundled regex rules (always available)
│   ├── semgrep.ts        # p/owasp-top-ten ruleset, JSON ingest
│   ├── gitleaks.ts       # working-tree secret scan
│   ├── trivy.ts          # fs scan: vuln + misconfig
│   ├── syft.ts           # CycloneDX SBOM generation
│   ├── grype.ts          # CVE matching against SBOM
│   ├── hadolint.ts       # Dockerfile lint (auto-enabled)
│   └── index.ts          # adapter registry + mode → adapters
│
├── orchestrator.ts       # run adapters, normalize, dedupe, build report
│
├── reporters/
│   ├── terminal.ts       # color-coded summary + top findings
│   ├── sarif.ts          # SARIF 2.1.0 (GitHub Code Scanning compatible)
│   ├── markdown.ts       # human-readable security review
│   ├── html.ts           # self-contained HTML report
│   ├── fix-plan.ts       # SECURITY_FIX_PLAN.md for coding agents
│   └── index.ts          # + formatJsonReport
│
├── commands/
│   ├── scan.ts           # runs orchestrator → reporters → exit code
│   ├── doctor.ts         # show installed-vs-missing tools
│   └── install-tools.ts  # print install instructions
│
└── index.ts              # commander wiring
```

## Unified finding schema

```ts
type OwaspFinding = {
  id: string;                  // tool-local rule/vuln id
  sourceTool: 'native' | 'semgrep' | 'gitleaks' | 'trivy'
            | 'syft' | 'grype' | 'hadolint' | 'zap' | 'deepsec';
  category: 'sast' | 'secrets' | 'sca' | 'iac'
          | 'container' | 'sbom' | 'dast' | 'semantic';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: 'low' | 'medium' | 'high';
  cwe?: string[];
  cve?: string[];
  owaspTop10?: OwaspCategory[];
  file?: string;
  line?: number;
  column?: number;
  endLine?: number;
  packageName?: string;
  installedVersion?: string;
  fixedVersion?: string;
  evidence?: string;
  remediation: string;
  references: string[];
  fingerprint: string;         // sha1(file|line|cve|cwe|pkg|title)
  confirmedBy?: SourceTool[];  // set when multiple tools find the same issue
};
```

## Scan modes

| Mode | Adapters | Intended use |
|------|----------|--------------|
| `quick` | native, gitleaks | pre-commit, `< 5s` |
| `scan` (default) | native, semgrep, gitleaks, trivy | normal local / CI |
| `deep` | scan + syft, grype, hadolint | pre-release |
| `ci` | scan + SARIF output + `--fail-on high` | GitHub Actions |
| `fix-plan` | scan + `SECURITY_FIX_PLAN.md` | hand off to coding agent |

Future modes (Phase 5): `semantic` (deepsec), `zap` (DAST).

## OWASP Top 10 mapping

Mapping is **deterministic** — driven by `core/owasp-map.ts`. The LLM never
invents categories. Order of precedence:

1. If the adapter already supplied `owaspTop10`, keep it.
2. Otherwise, map each CWE through the 2021 mapping table.
3. If no CWE is present, fall back to category default:
   - `sast` → A03
   - `secrets` → A02 + A05
   - `sca` / `sbom` → A06
   - `iac` / `container` / `dast` → A05
   - `semantic` → A04

## Dedupe

Two findings with the same `fingerprint` are merged. The winner is the
finding with the higher `(severity, confidence)`. The merged finding's
`confirmedBy` lists every tool that observed it — useful for prioritizing
"three tools agree this is real" over single-tool noise.

## Output formats

| Format | Default file | Use case |
|--------|--------------|----------|
| `terminal` | stdout | local dev |
| `json` | stdout | machine consumption |
| `sarif` | `owasp-wtf.sarif` | GitHub code scanning |
| `markdown` | `owasp-wtf-report.md` | PR descriptions, docs |
| `html` | `owasp-wtf-report.html` | shareable report |
| `fix-plan` | `SECURITY_FIX_PLAN.md` | coding agents |

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success, no blocking findings |
| 1 | At least one finding ≥ `--fail-on` threshold (default: `high`) |
| 2 | At least one `critical` finding (when `--fail-on` not set) |

## Backward compatibility

v1 commands (`npx owasp-wtf` with no subcommand) still work — they map to
`scan` mode with terminal output. The `--ai` / `--setup` paths from v1 will
move into the Phase 4 agent layer.
