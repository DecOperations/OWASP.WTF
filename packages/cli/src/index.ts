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

const BANNER = `
  ${chalk.red('██████')}  ${chalk.red('██')}     ${chalk.red('██')}  ${chalk.yellow('█████')}  ${chalk.yellow('███████')} ${chalk.green('██████')}     ${chalk.blue('██')}     ${chalk.blue('██')} ${chalk.magenta('████████')} ${chalk.magenta('███████')}
  ${chalk.red('██    ██')} ${chalk.red('██')}     ${chalk.red('██')} ${chalk.yellow('██   ██')} ${chalk.yellow('██')}      ${chalk.green('██   ██')}    ${chalk.blue('██')}     ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('██')}
  ${chalk.red('██    ██')} ${chalk.red('██')}  ${chalk.red('█')}  ${chalk.red('██')} ${chalk.yellow('██████')}  ${chalk.yellow('███████')} ${chalk.green('██████')}     ${chalk.blue('██')}  ${chalk.blue('█')}  ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('█████')}
  ${chalk.red('██    ██')} ${chalk.red('██')} ${chalk.red('███')} ${chalk.red('██')} ${chalk.yellow('██   ██')}      ${chalk.yellow('██')} ${chalk.green('██')}         ${chalk.blue('██')} ${chalk.blue('███')} ${chalk.blue('██')}    ${chalk.magenta('██')}    ${chalk.magenta('██')}
   ${chalk.red('██████')}   ${chalk.red('███')} ${chalk.red('███')}  ${chalk.yellow('██   ██')} ${chalk.yellow('███████')} ${chalk.green('██')}          ${chalk.blue('███')} ${chalk.blue('███')}     ${chalk.magenta('██')}    ${chalk.magenta('██')}
                                                    ${chalk.dim('v0.1.0')}
`;

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
  .option('--ai', 'Enable AI-assisted analysis (coming soon)')
  .option('--no-color', 'Disable color output')
  .option('--verbose', 'Show verbose output')
  .action(async (directory: string, opts) => {
    // Show banner
    if (opts.format === 'terminal') {
      console.log(BANNER);
    }

    const targetDir = resolve(directory);

    if (opts.verbose) {
      console.log(chalk.dim(`  Scanning: ${targetDir}`));
      console.log(chalk.dim(`  Format:   ${opts.format}`));
      console.log(chalk.dim(`  Severity: ${opts.severity}+`));
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

      // Step 3: Analyze
      const result = analyze(files, rules);

      // Step 4: AI analysis placeholder
      if (opts.ai) {
        if (spinner) spinner.text = chalk.blue('AI analysis coming in a future release...');
      }

      spinner?.stop();

      // Step 5: Format output
      let output: string;
      switch (opts.format) {
        case 'json':
          output = formatJson(result);
          break;
        case 'html':
          output = formatHtml(result);
          break;
        case 'terminal':
        default:
          output = formatTerminal(result);
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

program.parse();
