import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';
import { runOrchestrator } from '../orchestrator.js';
import { adaptersForMode, type ScanMode } from '../adapters/index.js';
import type { OwaspCategory, OwaspFinding, ScanReport, Severity, SourceTool } from '../core/types.js';
import {
  formatTerminalReport,
  formatJsonReport,
  formatSarif,
  formatMarkdown,
  formatHtmlReport,
  formatFixPlan,
} from '../reporters/index.js';
import { resolveIgnorePatterns } from '../core/defaults.js';
import { applyBaseline, loadBaseline, writeBaseline } from '../core/baseline.js';

export type OutputFormat = 'terminal' | 'json' | 'sarif' | 'markdown' | 'html' | 'fix-plan';

export interface ScanCommandOpts {
  directory: string;
  mode: ScanMode;
  format: OutputFormat;
  output?: string;
  ignore: string[];
  failOn?: Severity;
  verbose?: boolean;
  showAll?: boolean;
  agent?: 'claude' | 'cursor' | 'codex' | 'copilot' | 'generic';
  includeBuildOutput?: boolean;
  workspaces?: string[];
  baselineFile?: string;
  updateBaseline?: boolean;
}

const SEV_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export async function runScanCommand(opts: ScanCommandOpts): Promise<number> {
  const projectRoot = resolve(opts.directory);

  // Resolve scan roots: explicit workspaces if provided, else the project root.
  const scanRoots: string[] = opts.workspaces && opts.workspaces.length > 0
    ? opts.workspaces.map((w) => resolve(projectRoot, w))
    : [projectRoot];

  for (const r of scanRoots) {
    if (!existsSync(r)) {
      console.error(chalk.red(`Workspace not found: ${r}`));
      return 1;
    }
  }

  const adapters = adaptersForMode(opts.mode);
  const ignore = resolveIgnorePatterns(opts.ignore, opts.includeBuildOutput);

  if (opts.verbose && opts.format === 'terminal') {
    console.log(chalk.dim(`  Project:    ${projectRoot}`));
    console.log(chalk.dim(`  Mode:       ${opts.mode}`));
    console.log(chalk.dim(`  Adapters:   ${adapters.map((a) => a.id).join(', ')}`));
    if (scanRoots.length > 1 || scanRoots[0] !== projectRoot) {
      console.log(chalk.dim(`  Workspaces: ${scanRoots.map((r) => r.replace(projectRoot + '/', '')).join(', ')}`));
    }
    if (opts.baselineFile) {
      console.log(chalk.dim(`  Baseline:   ${opts.baselineFile}`));
    }
    console.log('');
  }

  const spinner = opts.format === 'terminal'
    ? ora({ text: chalk.blue('Running scanners...'), spinner: 'dots12', color: 'blue' }).start()
    : null;

  // Run scanners over each scan root and merge findings.
  const reports: ScanReport[] = [];
  for (const root of scanRoots) {
    const r = await runOrchestrator({
      project: { root, ignore },
      adapters,
      onAdapterStart: (a) => {
        if (spinner) {
          const label = scanRoots.length > 1
            ? `Running ${a.name} on ${root.replace(projectRoot + '/', '')}...`
            : `Running ${a.name}...`;
          spinner.text = chalk.blue(label);
        }
      },
    });
    reports.push(r);
  }

  const report: ScanReport = scanRoots.length === 1
    ? { ...reports[0], project: { ...reports[0].project, root: projectRoot } }
    : mergeReports(reports, projectRoot);

  // Baseline handling: if --update-baseline, write a snapshot from the
  // raw report and exit success. Otherwise filter findings against any
  // existing baseline.
  if (opts.updateBaseline && opts.baselineFile) {
    const path = resolve(projectRoot, opts.baselineFile);
    writeBaseline(path, report, 'snapshot');
    if (opts.format === 'terminal') {
      console.log(chalk.green(`  Baseline written: ${path} (${report.findings.length} accepted findings)`));
    } else {
      console.log(`Baseline written: ${path} (${report.findings.length} accepted findings)`);
    }
    return 0;
  }

  let acceptedCount = 0;
  if (opts.baselineFile) {
    const baselinePath = resolve(projectRoot, opts.baselineFile);
    const baseline = loadBaseline(baselinePath);
    if (baseline) {
      const { newFindings, acceptedFindings } = applyBaseline(report.findings, baseline);
      acceptedCount = acceptedFindings.length;
      report.findings = newFindings;
      // Recompute summary counts to reflect only graded findings.
      report.summary = recountSummary(newFindings);
      report.byCategory = recountByCategory(newFindings);
      report.byOwasp = recountByOwasp(newFindings);
      report.byTool = recountByTool(newFindings);
    } else if (opts.verbose) {
      console.log(chalk.dim(`  Baseline file not found at ${baselinePath} — grading all findings.`));
    }
  }

  spinner?.stop();

  let output: string;
  switch (opts.format) {
    case 'json': output = formatJsonReport(report); break;
    case 'sarif': output = formatSarif(report); break;
    case 'markdown': output = formatMarkdown(report); break;
    case 'html': output = formatHtmlReport(report); break;
    case 'fix-plan': output = formatFixPlan(report, { agent: opts.agent }); break;
    case 'terminal':
    default: output = formatTerminalReport(report, { showAll: opts.showAll }); break;
  }

  if (opts.output) {
    writeFileSync(opts.output, output, 'utf-8');
    if (opts.format === 'terminal') {
      console.log(chalk.green(`  Report written to ${opts.output}`));
    }
  } else {
    console.log(output);
  }

  if (acceptedCount > 0 && opts.format === 'terminal') {
    console.log(chalk.dim(`  Baseline: ${acceptedCount} pre-existing finding(s) suppressed.`));
  }

  // Fail-on threshold
  if (opts.failOn) {
    const threshold = SEV_ORDER[opts.failOn];
    const hit = report.findings.some((f) => SEV_ORDER[f.severity] >= threshold);
    if (hit) return 1;
  } else {
    if (report.summary.critical > 0) return 2;
    if (report.summary.high > 0) return 1;
  }
  return 0;
}

function mergeReports(reports: ScanReport[], projectRoot: string): ScanReport {
  const findings = reports.flatMap((r) => r.findings);
  const adapters = reports.flatMap((r) => r.adapters);
  const durationMs = reports.reduce((a, r) => a + r.durationMs, 0);
  return {
    schemaVersion: '2.0',
    generatedAt: new Date().toISOString(),
    durationMs,
    project: { root: projectRoot, name: reports[0]?.project.name },
    score: Math.min(...reports.map((r) => r.score)),
    summary: recountSummary(findings),
    byCategory: recountByCategory(findings),
    byOwasp: recountByOwasp(findings),
    byTool: recountByTool(findings),
    findings,
    adapters,
  };
}

function recountSummary(findings: OwaspFinding[]): Record<Severity, number> {
  const out: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) out[f.severity]++;
  return out;
}

function recountByCategory(findings: OwaspFinding[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of findings) out[f.category] = (out[f.category] ?? 0) + 1;
  return out;
}

function recountByOwasp(findings: OwaspFinding[]): Partial<Record<OwaspCategory, number>> {
  const out: Partial<Record<OwaspCategory, number>> = {};
  for (const f of findings) {
    for (const c of f.owaspTop10 ?? []) {
      out[c] = (out[c] ?? 0) + 1;
    }
  }
  return out;
}

function recountByTool(findings: OwaspFinding[]): Partial<Record<SourceTool, number>> {
  const out: Partial<Record<SourceTool, number>> = {};
  for (const f of findings) out[f.sourceTool] = (out[f.sourceTool] ?? 0) + 1;
  return out;
}
