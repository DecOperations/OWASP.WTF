/**
 * Native adapter — wraps the project's built-in regex rules so OWASP.WTF
 * always produces results even when no external tools are installed.
 */

import { scanDirectory } from '../scanner.js';
import { analyze } from '../analyzer.js';
import { allRules, rulesAtSeverity } from '../rules/index.js';
import type { OwaspFinding, AdapterRunResult, OwaspCategory } from '../core/types.js';
import type { ScannerAdapter, ProjectContext } from './types.js';

const RULE_TO_CWE: Record<string, string[]> = {
  'A01-IDOR': ['CWE-639'],
  'A01-PATH-TRAVERSAL': ['CWE-22'],
  'A02-WEAK-HASH': ['CWE-327', 'CWE-328'],
  'A02-HARDCODED-SECRET': ['CWE-798'],
  'A02-WEAK-CRYPTO': ['CWE-327'],
  'A03-EVAL': ['CWE-95'],
  'A03-SQL-INJECTION': ['CWE-89'],
  'A03-XSS': ['CWE-79'],
  'A03-COMMAND-INJECTION': ['CWE-78'],
  'A05-CORS-WILDCARD': ['CWE-942'],
  'A05-DEBUG-ENABLED': ['CWE-489'],
  'A07-WEAK-PASSWORD': ['CWE-521'],
  'A07-MISSING-AUTH': ['CWE-306'],
  'A09-CONSOLE-SECRET': ['CWE-532'],
};

export const nativeAdapter: ScannerAdapter = {
  id: 'native',
  name: 'native (built-in regex rules)',
  category: 'sast',
  description: 'Zero-dep OWASP Top 10 regex rules. Always available.',
  homepage: 'https://github.com/DecOperations/OWASP.WTF',

  async applicable() {
    return true;
  },

  async available() {
    return { ok: true, version: 'bundled' };
  },

  async run(project: ProjectContext): Promise<AdapterRunResult> {
    const t0 = performance.now();
    const files = scanDirectory(project.root, project.ignore);
    const result = analyze(files, rulesAtSeverity('info'));

    const findings: OwaspFinding[] = result.findings.map((f) => ({
      id: f.ruleId,
      sourceTool: 'native',
      category: 'sast',
      title: f.ruleName,
      description: f.message,
      severity: f.severity,
      confidence: 'medium',
      cwe: RULE_TO_CWE[f.ruleId],
      owaspTop10: [f.category as OwaspCategory],
      file: f.filePath,
      line: f.line,
      column: f.column,
      evidence: f.snippet,
      remediation: f.suggestion,
      references: [
        'https://owasp.org/Top10/',
        `https://owasp.org/Top10/${f.category.split(':')[0]}/`,
      ],
      fingerprint: '',
    }));

    return {
      tool: 'native',
      ok: true,
      durationMs: performance.now() - t0,
      findings,
      diagnostics: {
        files: files.length,
        rulesEvaluated: allRules.length,
        nativeScore: result.score,
      },
    };
  },
};
