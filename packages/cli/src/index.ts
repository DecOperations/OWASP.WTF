#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runScanCommand, type OutputFormat } from './commands/scan.js';
import { runDoctorCommand } from './commands/doctor.js';
import { runInstallToolsCommand } from './commands/install-tools.js';
import { runSetup } from './config.js';
import type { Severity } from './core/types.js';
import type { ScanMode } from './adapters/index.js';
import { VERSION, VERSION_STRING } from './version.js';

// OWASP = ? · WTF = ?
const TAGLINES: [string, string][] = [
  ['Outrageously Wild Audits of Sketchy Programs', "Where's The Firewall?!"],
  ['Obviously We All Ship Production', 'Without Testing First'],
  ['Oh Wait, Another Security Problem', 'Wow, That Failed'],
  ['Our Webapps Are Suspiciously Permissive', 'Why Trust Frameworks?'],
  ['Only Worried About Shipping Product', "What's This Flaw?"],
  ['Overconfident Writers of Awful Patches', "Where's The Fix?!"],
  ['Optimistically Writing Absolutely Sketchy Packages', 'Welp, Try Firewall'],
  ['Open Wide And Say Pwned', "We're Totally Fricked"],
  ['Oh Whoops, Auth Seems Pointless', 'Who Tests Functions?'],
  ['Obstinately Writing APIs Sans Protection', "Won't That Fail?"],
  ['Obsessively Worrying About Security Posture', 'Worth The Fuss'],
  ['Other Weirdos Auditing Source Professionally', 'We Track Flaws'],
  ['Officially Way Ahead of Script Patchers', 'We Triage Fast'],
  ['Out Walking Around Sans Passwords', 'What The Frankly?!'],
  ['Occasionally We Actually Secure Programs', 'Weird, That Fixed it'],
];

function getBanner(): string {
  const [owasp, wtf] = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  return `
  ${chalk.red('██████')}  ${chalk.red('██')}     ${chalk.red('██')}  ${chalk.yellow('█████')}  ${chalk.yellow('███████')} ${chalk.green('██████')}     ${chalk.blue('██')}     ${chalk.blue('██')} ${chalk.magenta('████████')} ${chalk.magenta('███████')}
  ${chalk.red('██    ██')} ${chalk.red('██')}     ${chalk.red('██')} ${chalk.yellow('██   ██')} ${chalk.yellow('██')}      ${chalk.green('██   ██')}    ${chalk.blue('██')}     ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('██')}
  ${chalk.red('██    ██')} ${chalk.red('██')}  ${chalk.red('█')}  ${chalk.red('██')} ${chalk.yellow('██████')}  ${chalk.yellow('███████')} ${chalk.green('██████')}     ${chalk.blue('██')}  ${chalk.blue('█')}  ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('█████')}
  ${chalk.red('██    ██')} ${chalk.red('██')} ${chalk.red('███')} ${chalk.red('██')} ${chalk.yellow('██   ██')}      ${chalk.yellow('██')} ${chalk.green('██')}         ${chalk.blue('██')} ${chalk.blue('███')} ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('██')}
   ${chalk.red('██████')}   ${chalk.red('███')} ${chalk.red('███')}  ${chalk.yellow('██   ██')} ${chalk.yellow('███████')} ${chalk.green('██')}          ${chalk.blue('███')} ${chalk.blue('███')}     ${chalk.magenta('██')}    ${chalk.magenta('██')}
  ${chalk.dim(owasp)} ${chalk.dim('·')} ${chalk.dim(wtf)}
  ${chalk.dim(`v${VERSION} · meta-scanner`)}
`;
}

function parseIgnore(s: string | undefined): string[] {
  return s ? s.split(',').map((p) => p.trim()).filter(Boolean) : [];
}

function parseFormat(s: string | undefined, allowed: OutputFormat[]): OutputFormat {
  if (s && allowed.includes(s as OutputFormat)) return s as OutputFormat;
  return 'terminal';
}

const program = new Command();

program
  .name('owasp-wtf')
  .description('AppSec orchestrator: best OSS scanners, one OWASP Top 10 report, agent-ready fixes.')
  .version(VERSION_STRING);

interface ScanOpts {
  format?: string;
  output?: string;
  ignore?: string;
  failOn?: string;
  verbose?: boolean;
  showAll?: boolean;
  agent?: string;
  banner?: boolean;
  includeBuildOutput?: boolean;
  workspace?: string[];
  baseline?: string;
  updateBaseline?: boolean;
}

interface ScanOptionDefaults {
  format?: OutputFormat;
  output?: string;
  failOn?: Severity;
}

function attachScanOptions(cmd: Command, defaults: ScanOptionDefaults = {}): Command {
  const format = cmd.createOption(
    '-f, --format <type>',
    'Output format: terminal, json, sarif, markdown, html, fix-plan',
  );
  if (defaults.format) format.default(defaults.format);
  else format.default('terminal');

  const output = cmd.createOption('-o, --output <file>', 'Write report to file instead of stdout');
  if (defaults.output) output.default(defaults.output);

  const failOn = cmd.createOption(
    '--fail-on <severity>',
    'Exit non-zero if any finding ≥ severity: critical, high, medium, low',
  );
  if (defaults.failOn) failOn.default(defaults.failOn);

  return cmd
    .addOption(format)
    .addOption(output)
    .option('-i, --ignore <patterns>', 'Comma-separated ignore globs', '')
    .addOption(failOn)
    .option('--agent <agent>', 'For --format=fix-plan: claude, cursor, codex, copilot, generic', 'generic')
    .option('--show-all', 'Show all findings in terminal output (default: top 15)')
    .option('--verbose', 'Verbose output')
    .option('--no-banner', 'Suppress the ASCII banner')
    .option(
      '--include-build-output',
      'Scan build artifact directories (.next, dist, build, .turbo, coverage, out). Off by default to suppress false positives.',
      false,
    )
    .option(
      '-w, --workspace <dir>',
      'Scope the scan to a workspace subdirectory (relative to the project root). Repeatable.',
      (val: string, prev: string[] = []) => prev.concat(val),
      [] as string[],
    )
    .option(
      '--baseline <file>',
      'Path to a baseline file. Findings present in the baseline are suppressed from the report and from --fail-on grading.',
    )
    .option(
      '--update-baseline',
      'Write the current findings to the baseline file and exit success. Use with --baseline.',
      false,
    );
}

async function dispatch(mode: ScanMode, directory: string, opts: ScanOpts): Promise<void> {
  const format = parseFormat(opts.format, ['terminal', 'json', 'sarif', 'markdown', 'html', 'fix-plan']);
  if (format === 'terminal' && opts.banner !== false) {
    console.log(getBanner());
  }
  const exitCode = await runScanCommand({
    directory,
    mode,
    format,
    output: opts.output,
    ignore: parseIgnore(opts.ignore),
    failOn: opts.failOn as Severity | undefined,
    verbose: opts.verbose,
    showAll: opts.showAll,
    agent: opts.agent as 'claude' | 'cursor' | 'codex' | 'copilot' | 'generic' | undefined,
    includeBuildOutput: opts.includeBuildOutput,
    workspaces: opts.workspace,
    baselineFile: opts.baseline,
    updateBaseline: opts.updateBaseline,
  });
  process.exit(exitCode);
}

// ─── quick ─────────────────────────────────────────────────────────────────
attachScanOptions(
  program.command('quick')
    .description('Pre-commit fast scan: native rules + secrets')
    .argument('[directory]', 'Directory to scan', '.')
).action((directory: string, opts: ScanOpts) => dispatch('quick', directory, opts));

// ─── scan ──────────────────────────────────────────────────────────────────
attachScanOptions(
  program.command('scan')
    .description('Standard scan: native + Semgrep + Gitleaks + Trivy')
    .argument('[directory]', 'Directory to scan', '.')
).action((directory: string, opts: ScanOpts) => dispatch('scan', directory, opts));

// ─── deep ──────────────────────────────────────────────────────────────────
attachScanOptions(
  program.command('deep')
    .description('Full coverage: scan + Syft + Grype + Hadolint')
    .argument('[directory]', 'Directory to scan', '.')
).action((directory: string, opts: ScanOpts) => dispatch('deep', directory, opts));

// ─── ci ────────────────────────────────────────────────────────────────────
attachScanOptions(
  program.command('ci')
    .description('CI mode: standard scan, SARIF output by default, fail-on high')
    .argument('[directory]', 'Directory to scan', '.'),
  { format: 'sarif', output: 'owasp-wtf.sarif', failOn: 'high' as Severity },
).action((directory: string, opts: ScanOpts) =>
  dispatch('scan', directory, { ...opts, banner: false }),
);

// ─── fix-plan ──────────────────────────────────────────────────────────────
attachScanOptions(
  program.command('fix-plan')
    .description('Run standard scan and emit SECURITY_FIX_PLAN.md for coding agents')
    .argument('[directory]', 'Directory to scan', '.'),
  { format: 'fix-plan', output: 'SECURITY_FIX_PLAN.md' },
).action((directory: string, opts: ScanOpts) => dispatch('scan', directory, opts));

// ─── doctor ────────────────────────────────────────────────────────────────
program.command('doctor')
  .description('Check which scanner tools are installed')
  .action(async () => {
    process.exit(await runDoctorCommand());
  });

// ─── install-tools ─────────────────────────────────────────────────────────
program.command('install-tools')
  .description('Print install instructions for the recommended scanner suite')
  .action(() => {
    process.exit(runInstallToolsCommand());
  });

// ─── setup ─────────────────────────────────────────────────────────────────
program.command('setup')
  .description('Interactive AI provider setup (for AI-augmented analysis)')
  .action(async () => {
    await runSetup();
    process.exit(0);
  });

// ─── default (no subcommand) — backward-compatible smart scan ─────────────
// When no subcommand is provided, fall back to `scan` mode.
const KNOWN_COMMANDS = new Set([
  'quick', 'scan', 'deep', 'ci', 'fix-plan', 'doctor', 'install-tools', 'setup', 'help',
]);

const argv = process.argv.slice(2);
const first = argv.find((a) => !a.startsWith('-'));
if (!first || !KNOWN_COMMANDS.has(first)) {
  // Prepend implicit `scan` so commander dispatches to that subcommand.
  process.argv.splice(2, 0, 'scan');
}

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
