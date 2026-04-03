/**
 * @file analyzer.ts
 * @description Runs security rules against scanned files, with inline ignore support.
 * @layer Services
 *
 * Supports suppression comments:
 *   // owasp-wtf-ignore           — ignore the next line
 *   // owasp-wtf-ignore A03-EVAL  — ignore specific rule on next line
 *   // owasp-wtf-ignore-file      — ignore entire file
 */

import type { Rule, Finding, ScanResult, Severity } from './types.js';
import type { ScannedFile } from './scanner.js';

const SEVERITY_DEDUCTION: Record<Severity, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

/**
 * Parse ignore directives from file content.
 * Returns a set of ignored line numbers (1-indexed) and optional rule IDs per line.
 */
function parseIgnoreDirectives(content: string): {
  ignoreFile: boolean;
  ignoredLines: Map<number, Set<string> | 'all'>;
} {
  const ignoredLines = new Map<number, Set<string> | 'all'>();
  let ignoreFile = false;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // owasp-wtf-ignore-file — skip entire file
    if (/owasp-wtf-ignore-file/.test(line)) {
      ignoreFile = true;
      return { ignoreFile, ignoredLines };
    }

    // owasp-wtf-ignore [RULE-ID, RULE-ID, ...] — ignore next line
    const ignoreMatch = line.match(/owasp-wtf-ignore(?:\s+(.+))?$/);
    if (ignoreMatch) {
      const nextLine = i + 2; // +2 because lines are 1-indexed and we want the NEXT line
      const ruleIds = ignoreMatch[1]?.trim();
      if (ruleIds) {
        const ids = new Set(ruleIds.split(/[,\s]+/).map(id => id.trim()).filter(Boolean));
        ignoredLines.set(nextLine, ids);
      } else {
        ignoredLines.set(nextLine, 'all');
      }
    }
  }

  return { ignoreFile, ignoredLines };
}

/**
 * Check if a finding should be suppressed by an ignore directive.
 */
function isSuppressed(
  finding: Finding,
  directives: { ignoreFile: boolean; ignoredLines: Map<number, Set<string> | 'all'> },
): boolean {
  if (directives.ignoreFile) return true;

  const lineDirective = directives.ignoredLines.get(finding.line);
  if (!lineDirective) return false;
  if (lineDirective === 'all') return true;
  return lineDirective.has(finding.ruleId);
}

/**
 * Run all provided rules against all scanned files and produce a scan result.
 */
export function analyze(
  files: ScannedFile[],
  rules: Rule[],
): ScanResult {
  const startTime = performance.now();
  const findings: Finding[] = [];
  let suppressed = 0;

  for (const file of files) {
    const directives = parseIgnoreDirectives(file.content);

    // Skip entire file if owasp-wtf-ignore-file is present
    if (directives.ignoreFile) continue;

    for (const rule of rules) {
      try {
        const results = rule.detect(file.content, file.relativePath);
        for (const finding of results) {
          finding.filePath = file.relativePath;

          if (isSuppressed(finding, directives)) {
            suppressed++;
            continue;
          }

          findings.push(finding);
        }
      } catch {
        // A rule crashed on a file — skip silently to avoid blocking the scan
      }
    }
  }

  // Sort by severity (critical first), then by file path, then by line number
  findings.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (sevDiff !== 0) return sevDiff;
    const fileDiff = a.filePath.localeCompare(b.filePath);
    if (fileDiff !== 0) return fileDiff;
    return a.line - b.line;
  });

  // Calculate summary counts
  const summary: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const categories: Record<string, number> = {};

  for (const f of findings) {
    summary[f.severity]++;
    categories[f.category] = (categories[f.category] || 0) + 1;
  }

  // Calculate security score
  let score = 100;
  for (const f of findings) {
    score -= SEVERITY_DEDUCTION[f.severity];
  }
  score = Math.max(0, score);

  const duration = performance.now() - startTime;

  return {
    score,
    totalFiles: files.length,
    filesScanned: files.length,
    findings,
    summary,
    categories,
    duration,
    suppressed,
  };
}
