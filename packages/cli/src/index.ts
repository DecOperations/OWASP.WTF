#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { scanDirectory } from './scanner.js';
import { allRules, rulesAtSeverity } from './rules/index.js';
import { analyze } from './analyzer.js';
import { formatTerminal, formatJson, formatHtml } from './reporter.js';
import { loadConfig, runSetup, getResolvedAiConfig } from './config.js';
import { analyzeWithAi } from './ai.js';
import type { AiAnalysisResult } from './ai.js';

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
  ${chalk.dim('v0.1.0')}
`;
}

const program = new Command();

program
  .name('owasp-wtf')
  .description('AI-powered OWASP security auditing CLI')
  .version('0.1.0')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-f, --format <type>', 'Output format: terminal, json, html', 'terminal')
  .option('-o, --output <file>', 'Write report to file')
  .option(
    '-s, --severity <level>',
    'Minimum severity: critical, high, medium, low, info',
    'low',
  )
  .option('-i, --ignore <patterns>', 'Comma-separated ignore patterns', '')
  .option('--ai', 'Enable AI-assisted analysis')
  .option('--setup', 'Run interactive configuration setup')
  .option('--no-color', 'Disable color output')
  .option('--verbose', 'Show verbose output')
  .action(async (directory: string, opts) => {
    // Handle --setup: run config wizard and exit
    if (opts.setup) {
      await runSetup();
      return;
    }

    // If --ai is requested, ensure config exists (first-run setup)
    let aiResult: AiAnalysisResult | null = null;
    let config = loadConfig();
    if (opts.ai && (!config || !config.ai?.provider)) {
      console.log(chalk.yellow('  No AI provider configured yet.'));
      config = await runSetup();
    }

    // Show banner
    if (opts.format === 'terminal') {
      console.log(getBanner());
    }

    const targetDir = resolve(directory);

    if (opts.verbose) {
      console.log(chalk.dim(`  Scanning: ${targetDir}`));
      console.log(chalk.dim(`  Format:   ${opts.format}`));
      console.log(chalk.dim(`  Severity: ${opts.severity}+`));
      if (opts.ai && config?.ai) {
        console.log(chalk.dim(`  AI:       ${config.ai.provider} (${config.ai.model})`));
      }
      console.log('');
    }

    // Start spinner
    const spinner = opts.format === 'terminal' ? ora({
      text: chalk.blue('Scanning for security vulnerabilities...'),
      spinner: 'dots12',
      color: 'blue',
    }).start() : null;

    try {
      // Step 1: Discover files
      if (spinner) spinner.text = chalk.blue('Discovering source files...');
      const ignorePatterns = opts.ignore
        ? opts.ignore.split(',').map((p: string) => p.trim())
        : [];
      const files = scanDirectory(targetDir, ignorePatterns);

      if (files.length === 0) {
        spinner?.warn(chalk.yellow('No source files found to scan.'));
        console.log(chalk.dim('  Supported: .ts, .tsx, .js, .jsx, .py, .go, .java, .rb, .php'));
        process.exit(0);
      }

      if (spinner) spinner.text = chalk.blue(`Analyzing ${files.length} files against ${allRules.length} security rules...`);

      // Step 2: Get rules at the requested severity level
      const rules = rulesAtSeverity(opts.severity);

      // Step 3: Static analysis
      const result = analyze(files, rules);

      // Step 4: AI analysis
      if (opts.ai && config?.ai && config.ai.provider !== 'none') {
        if (spinner) spinner.text = chalk.blue(`Running AI analysis with ${config.ai.provider} (${config.ai.model})...`);
        try {
          const resolvedConfig = getResolvedAiConfig(config);
          aiResult = await analyzeWithAi(result, files, resolvedConfig);
        } catch (err) {
          spinner?.warn(chalk.yellow(`AI analysis failed: ${err instanceof Error ? err.message : String(err)}`));
        }
      }

      spinner?.stop();

      // Step 5: Format output
      let output: string;
      switch (opts.format) {
        case 'json':
          output = formatJson(result, aiResult ?? undefined);
          break;
        case 'html':
          output = formatHtml(result);
          break;
        case 'terminal':
        default:
          output = formatTerminal(result);
          // Append AI insights to terminal output
          if (aiResult) {
            output += formatAiTerminal(aiResult);
          }
          break;
      }

      // Step 6: Write or print
      if (opts.output) {
        writeFileSync(opts.output, output, 'utf-8');
        if (opts.format === 'terminal') {
          console.log(
            chalk.green(`  Report written to ${opts.output}`),
          );
        }
      } else {
        console.log(output);
      }

      // Exit with non-zero if critical findings
      if (result.summary.critical > 0) {
        process.exit(2);
      }
      if (result.summary.high > 0) {
        process.exit(1);
      }
    } catch (err) {
      spinner?.fail(chalk.red('Scan failed'));
      console.error(chalk.red(`  Error: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  });

function formatAiTerminal(ai: AiAnalysisResult): string {
  const lines: string[] = [
    '',
    chalk.cyan('  ┌─────────────────────────────────────────┐'),
    chalk.cyan('  │') + chalk.bold.cyan('         AI Security Assessment          ') + chalk.cyan('│'),
    chalk.cyan('  └─────────────────────────────────────────┘'),
    '',
  ];

  if (ai.overallSummary) {
    lines.push(chalk.white(`  ${ai.overallSummary}`));
    lines.push('');
  }

  if (ai.riskAssessment) {
    const riskColors: Record<string, (s: string) => string> = {
      critical: chalk.bgRed.white,
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.green,
    };
    const colorFn = riskColors[ai.riskAssessment] || chalk.dim;
    lines.push(`  Risk Level: ${colorFn(ai.riskAssessment.toUpperCase())}`);
    lines.push('');
  }

  if (ai.insights.length > 0) {
    lines.push(chalk.dim('  AI Insights:'));
    for (const insight of ai.insights) {
      const fpBadge = insight.falsePositive
        ? chalk.dim.strikethrough(' FP ')
        : chalk.red(' TP ');
      lines.push(`  ${fpBadge} ${chalk.bold(insight.findingId)} — ${insight.assessment}`);
      if (insight.remediation) {
        lines.push(chalk.dim(`       Fix: ${insight.remediation}`));
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

program.parse();
