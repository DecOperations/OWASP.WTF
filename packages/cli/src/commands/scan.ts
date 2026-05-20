import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { runOrchestrator } from '../orchestrator.js';
import { adaptersForMode, type ScanMode } from '../adapters/index.js';
import type { ScanReport, Severity } from '../core/types.js';
import {
  formatTerminalReport,
  formatJsonReport,
  formatSarif,
  formatMarkdown,
  formatHtmlReport,
  formatFixPlan,
} from '../reporters/index.js';

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
}

const SEV_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

export async function runScanCommand(opts: ScanCommandOpts): Promise<number> {
  const root = resolve(opts.directory);
  const adapters = adaptersForMode(opts.mode);

  if (opts.verbose && opts.format === 'terminal') {
    console.log(chalk.dim(`  Project:  ${root}`));
    console.log(chalk.dim(`  Mode:     ${opts.mode}`));
    console.log(chalk.dim(`  Adapters: ${adapters.map((a) => a.id).join(', ')}`));
    console.log('');
  }

  const spinner = opts.format === 'terminal'
    ? ora({ text: chalk.blue('Running scanners...'), spinner: 'dots12', color: 'blue' }).start()
    : null;

  const report: ScanReport = await runOrchestrator({
    project: { root, ignore: opts.ignore },
    adapters,
    onAdapterStart: (a) => {
      if (spinner) spinner.text = chalk.blue(`Running ${a.name}...`);
    },
  });

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
