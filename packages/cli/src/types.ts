export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

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

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  category: OwaspCategory;
  description: string;
  detect: (content: string, filePath: string) => Finding[];
}

export interface Finding {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  category: OwaspCategory;
  filePath: string;
  line: number;
  column: number;
  snippet: string;
  message: string;
  suggestion: string;
}

export interface ScanResult {
  score: number;
  totalFiles: number;
  filesScanned: number;
  findings: Finding[];
  summary: Record<Severity, number>;
  categories: Record<string, number>;
  duration: number;
  suppressed: number;
}
