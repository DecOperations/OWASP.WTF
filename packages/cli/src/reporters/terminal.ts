/**
 * Terminal reporter for v2 ScanReport. Compact, color-coded, OWASP-aware.
 */

import chalk from 'chalk';
import type { OwaspFinding, ScanReport, Severity } from '../core/types.js';

const SEV_BADGE: Record<Severity, string> = {
  critical: chalk.bgRed.white.bold(' CRITICAL '),
  high: chalk.bgRedBright.white.bold(' HIGH '),
  medium: chalk.bgYellow.black.bold(' MEDIUM '),
  low: chalk.bgCyan.black.bold(' LOW '),
  info: chalk.bgGray.white(' INFO '),
};

const TOOL_COLOR: Record<string, (s: string) => string> = {
  native: chalk.magenta,
  semgrep: chalk.cyan,
  gitleaks: chalk.red,
  trivy: chalk.blue,
  syft: chalk.gray,
  grype: chalk.yellow,
  hadolint: chalk.green,
  zap: chalk.hex('#FF8800'),
  deepsec: chalk.hex('#A855F7'),
};

function scoreColor(score: number): (s: string) => string {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex('#FF8800');
  return chalk.red;
}

export function formatTerminalReport(report: ScanReport, opts: { showAll?: boolean } = {}): string {
  const lines: string[] = [];

  // Adapter status row
  lines.push('');
  lines.push(chalk.bold('  Scanners'));
  for (const a of report.adapters) {
    const colored = TOOL_COLOR[a.tool] ?? chalk.white;
    const status = a.skipped
      ? chalk.dim(`skipped — ${a.skipReason ?? ''}`)
      : a.ok
        ? chalk.green(`ok · ${a.findings.length} findings · ${(a.durationMs / 1000).toFixed(2)}s`)
        : chalk.red(`error: ${a.error ?? ''}`);
    lines.push(`    ${colored(a.tool.padEnd(9))} ${status}`);
  }
  lines.push('');

  // Score
  lines.push(chalk.bold('  Risk Score'));
  lines.push(`    ${scoreColor(report.score)(`${report.score} / 100`)}`);
  lines.push('');

  // Summary table
  const s = report.summary;
  lines.push(chalk.bold('  Severity'));
  lines.push(
    `    ${chalk.bgRed.white.bold(` ${s.critical} `)}  ${chalk.bgRedBright.white.bold(` ${s.high} `)}  ${chalk.bgYellow.black.bold(` ${s.medium} `)}  ${chalk.bgCyan.black.bold(` ${s.low} `)}  ${chalk.bgGray.white(` ${s.info} `)}`,
  );
  lines.push(
    `    ${chalk.dim('crit')}  ${chalk.dim('high')}  ${chalk.dim('med')}  ${chalk.dim('low')}  ${chalk.dim('info')}`,
  );
  lines.push('');

  // OWASP breakdown
  const owaspEntries = Object.entries(report.byOwasp).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (owaspEntries.length > 0) {
    lines.push(chalk.bold('  OWASP Top 10'));
    for (const [cat, count] of owaspEntries.slice(0, 5)) {
      lines.push(`    ${chalk.dim('•')} ${cat.padEnd(38)} ${chalk.bold(String(count))}`);
    }
    lines.push('');
  }

  // Top findings
  const top = opts.showAll
    ? report.findings
    : report.findings.filter((f) => f.severity !== 'info' && f.severity !== 'low').slice(0, 15);

  if (top.length > 0) {
    lines.push(chalk.bold(`  Findings${opts.showAll ? '' : ' (top 15)'}`));
    lines.push('');
    for (const f of top) {
      lines.push(formatFindingTerminal(f));
    }
  } else if (report.findings.length === 0) {
    lines.push(chalk.green.bold('  ✓ No findings'));
    lines.push('');
  }

  return lines.join('\n');
}

function formatFindingTerminal(f: OwaspFinding): string {
  const tool = (TOOL_COLOR[f.sourceTool] ?? chalk.white)(`[${f.sourceTool}]`);
  const loc = f.file ? chalk.dim(` ${f.file}${f.line ? `:${f.line}` : ''}`) : '';
  const conf = f.confirmedBy && f.confirmedBy.length > 1
    ? chalk.dim(` (×${f.confirmedBy.length})`)
    : '';
  const cveTag = f.cve?.length ? chalk.yellow(` ${f.cve[0]}`) : '';
  const pkgTag = f.packageName ? chalk.gray(` ${f.packageName}@${f.installedVersion ?? '?'}`) : '';
  const out: string[] = [];
  out.push(`    ${SEV_BADGE[f.severity]} ${tool}${conf} ${chalk.bold(f.title)}${cveTag}${pkgTag}${loc}`);
  if (f.description && f.description !== f.title) {
    const trimmed = f.description.split('\n')[0].slice(0, 140);
    out.push(`      ${chalk.dim(trimmed)}`);
  }
  out.push(`      ${chalk.dim('→')} ${f.remediation.split('\n')[0].slice(0, 140)}`);
  out.push('');
  return out.join('\n');
}
