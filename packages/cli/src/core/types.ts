/**
 * Unified finding schema. Every scanner adapter normalizes into this shape
 * so reporters/dedupe/OWASP mapping only ever sees one type.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'low' | 'medium' | 'high';

export type OwaspCategory =
  | 'A01:2021-Broken-Access-Control'
  | 'A02:2021-Cryptographic-Failures'
  | 'A03:2021-Injection'
  | 'A04:2021-Insecure-Design'
  | 'A05:2021-Security-Misconfiguration'
  | 'A06:2021-Vulnerable-Components'
  | 'A07:2021-Auth-Failures'
  | 'A08:2021-Software-Integrity-Failures'
  | 'A09:2021-Logging-Failures'
  | 'A10:2021-SSRF';

export type SourceTool =
  | 'native'
  | 'semgrep'
  | 'gitleaks'
  | 'trivy'
  | 'syft'
  | 'grype'
  | 'hadolint'
  | 'zap'
  | 'deepsec';

export type Category =
  | 'sast'
  | 'secrets'
  | 'sca'
  | 'iac'
  | 'container'
  | 'sbom'
  | 'dast'
  | 'semantic';

export interface OwaspFinding {
  /** Stable identifier within the source tool (e.g. semgrep rule ID, CVE). */
  id: string;
  sourceTool: SourceTool;
  category: Category;
  title: string;
  description: string;
  severity: Severity;
  confidence: Confidence;
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
  /** Hash used to dedupe across tools. Set by the normalizer. */
  fingerprint: string;
  /** When multiple tools find the same issue, list of tools that confirmed it. */
  confirmedBy?: SourceTool[];
}

export interface AdapterRunResult {
  tool: SourceTool;
  ok: boolean;
  durationMs: number;
  findings: OwaspFinding[];
  skipped?: boolean;
  skipReason?: string;
  error?: string;
  /** Free-form diagnostic info (versions, args). */
  diagnostics?: Record<string, unknown>;
}

export interface ScanReport {
  schemaVersion: '2.0';
  generatedAt: string;
  durationMs: number;
  project: {
    root: string;
    name?: string;
  };
  score: number;
  summary: Record<Severity, number>;
  byCategory: Record<string, number>;
  byOwasp: Partial<Record<OwaspCategory, number>>;
  byTool: Partial<Record<SourceTool, number>>;
  findings: OwaspFinding[];
  adapters: AdapterRunResult[];
}
