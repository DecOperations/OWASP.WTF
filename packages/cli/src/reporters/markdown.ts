/**
 * Markdown reporter — produces a human-readable security review with an
 * executive summary, per-OWASP-category sections, and per-finding detail.
 */

import type { OwaspFinding, ScanReport, Severity } from '../core/types.js';

const SEVERITY_BADGES: Record<Severity, string> = {
  critical: '`CRITICAL`',
  high: '`HIGH`',
  medium: '`MEDIUM`',
  low: '`LOW`',
  info: '`INFO`',
};

export function formatMarkdown(report: ScanReport): string {
  const lines: string[] = [];
  lines.push(`# OWASP.WTF Security Report`);
  lines.push('');
  lines.push(`_Generated ${report.generatedAt} · scanned in ${(report.durationMs / 1000).toFixed(1)}s_`);
  lines.push('');

  // Executive summary
  lines.push(`## Executive Summary`);
  lines.push('');
  lines.push(`**Risk Score:** ${report.score} / 100`);
  lines.push('');
  lines.push(`| Critical | High | Medium | Low | Info |`);
  lines.push(`|---:|---:|---:|---:|---:|`);
  lines.push(`| ${report.summary.critical} | ${report.summary.high} | ${report.summary.medium} | ${report.summary.low} | ${report.summary.info} |`);
  lines.push('');

  // OWASP Top 10 breakdown
  const owaspEntries = Object.entries(report.byOwasp).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (owaspEntries.length > 0) {
    lines.push(`### OWASP Top 10 breakdown`);
    lines.push('');
    for (const [cat, count] of owaspEntries) {
      lines.push(`- **${cat}** — ${count}`);
    }
    lines.push('');
  }

  // Adapter status
  lines.push(`### Scanners`);
  lines.push('');
  lines.push(`| Tool | Status | Findings | Duration |`);
  lines.push(`|---|---|---:|---:|`);
  for (const a of report.adapters) {
    const status = a.skipped ? `skipped — ${a.skipReason ?? ''}` : a.ok ? 'ok' : `error: ${a.error ?? ''}`;
    lines.push(`| ${a.tool} | ${status} | ${a.findings.length} | ${(a.durationMs / 1000).toFixed(2)}s |`);
  }
  lines.push('');

  // Top risks
  const top = report.findings
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 10);
  if (top.length > 0) {
    lines.push(`## Top Risks`);
    lines.push('');
    top.forEach((f, i) => {
      lines.push(formatFindingMarkdown(f, i + 1));
    });
  }

  // Full findings grouped by OWASP category
  if (report.findings.length > 0) {
    lines.push(`## All Findings`);
    lines.push('');

    const groups = groupByOwasp(report.findings);
    for (const [cat, group] of groups) {
      lines.push(`### ${cat} (${group.length})`);
      lines.push('');
      for (let i = 0; i < group.length; i++) {
        lines.push(formatFindingMarkdown(group[i], i + 1));
      }
    }
  } else {
    lines.push(`## No findings 🎉`);
    lines.push('');
    lines.push(`No security issues detected by the configured scanners.`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatFindingMarkdown(f: OwaspFinding, index: number): string {
  const out: string[] = [];
  const loc = f.file ? ` — \`${f.file}${f.line ? `:${f.line}` : ''}\`` : '';
  out.push(`#### ${index}. ${SEVERITY_BADGES[f.severity]} ${escapeMd(f.title)}${loc}`);
  out.push('');
  out.push(`- **Source:** ${f.sourceTool}${f.confirmedBy && f.confirmedBy.length > 1 ? ` (confirmed by: ${f.confirmedBy.join(', ')})` : ''}`);
  out.push(`- **Confidence:** ${f.confidence}`);
  if (f.cwe?.length) out.push(`- **CWE:** ${f.cwe.join(', ')}`);
  if (f.cve?.length) out.push(`- **CVE:** ${f.cve.join(', ')}`);
  if (f.owaspTop10?.length) out.push(`- **OWASP:** ${f.owaspTop10.join(', ')}`);
  if (f.packageName) {
    out.push(`- **Package:** ${f.packageName}@${f.installedVersion ?? '?'}${f.fixedVersion ? ` → ${f.fixedVersion}` : ''}`);
  }
  out.push('');
  if (f.description) {
    out.push(escapeMd(f.description));
    out.push('');
  }
  if (f.evidence) {
    out.push('```');
    out.push(f.evidence.slice(0, 800));
    out.push('```');
    out.push('');
  }
  out.push(`**Fix:** ${escapeMd(f.remediation)}`);
  out.push('');
  if (f.references.length > 0) {
    out.push(`**References:** ${f.references.slice(0, 3).map((r) => `<${r}>`).join(' · ')}`);
    out.push('');
  }
  return out.join('\n');
}

function groupByOwasp(findings: OwaspFinding[]): Array<[string, OwaspFinding[]]> {
  const map = new Map<string, OwaspFinding[]>();
  for (const f of findings) {
    const cats = f.owaspTop10 ?? ['(unmapped)'];
    for (const c of cats) {
      const arr = map.get(c) ?? [];
      arr.push(f);
      map.set(c, arr);
    }
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|');
}
