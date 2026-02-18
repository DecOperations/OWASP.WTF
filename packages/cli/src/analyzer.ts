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
 * Run all provided rules against all scanned files and produce a scan result.
 */
export function analyze(
  files: ScannedFile[],
  rules: Rule[],
): ScanResult {
  const startTime = performance.now();
  const findings: Finding[] = [];

  for (const file of files) {
    for (const rule of rules) {
      try {
        const results = rule.detect(file.content, file.relativePath);
        for (const finding of results) {
          // Ensure file path uses relative path for cleaner output
          finding.filePath = file.relativePath;
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
  };
}
