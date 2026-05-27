/**
 * Baseline / snapshot support for OWASP.WTF.
 *
 * A baseline file is a JSON document that records the set of findings
 * accepted at a point in time. PR scans are graded only against
 * findings that are NOT in the baseline, so a first-time rollout
 * doesn't flood reviewers with pre-existing issues.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { OwaspFinding, ScanReport, Severity } from './types.js';

export interface BaselineEntry {
  fingerprint: string;
  ruleId: string;
  file?: string;
  line?: number;
  severity: Severity;
  title: string;
  reason?: string;
  acceptedAt: string;
}

export interface BaselineFile {
  schemaVersion: '1.0';
  generatedAt: string;
  project?: string;
  entries: BaselineEntry[];
}

export function loadBaseline(path: string): BaselineFile | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw) as BaselineFile;
    if (!Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBaseline(path: string, report: ScanReport, reason?: string): BaselineFile {
  const baseline: BaselineFile = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    project: report.project.name,
    entries: report.findings.map((f) => ({
      fingerprint: f.fingerprint,
      ruleId: f.id,
      file: f.file,
      line: f.line,
      severity: f.severity,
      title: f.title,
      reason,
      acceptedAt: new Date().toISOString(),
    })),
  };
  writeFileSync(path, JSON.stringify(baseline, null, 2), 'utf-8');
  return baseline;
}

/**
 * Partition findings into (new, accepted) by fingerprint match against
 * the baseline. New findings are what the gate should grade against.
 */
export function applyBaseline(
  findings: OwaspFinding[],
  baseline: BaselineFile | null,
): { newFindings: OwaspFinding[]; acceptedFindings: OwaspFinding[] } {
  if (!baseline || baseline.entries.length === 0) {
    return { newFindings: findings, acceptedFindings: [] };
  }
  const accepted = new Set(baseline.entries.map((e) => e.fingerprint));
  const newFindings: OwaspFinding[] = [];
  const acceptedFindings: OwaspFinding[] = [];
  for (const f of findings) {
    if (accepted.has(f.fingerprint)) acceptedFindings.push(f);
    else newFindings.push(f);
  }
  return { newFindings, acceptedFindings };
}
