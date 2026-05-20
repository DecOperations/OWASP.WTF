import chalk from 'chalk';
import { allAdapters } from '../adapters/index.js';

export async function runDoctorCommand(): Promise<number> {
  console.log('');
  console.log(chalk.bold('  OWASP.WTF — Tool Availability'));
  console.log('');

  let missing = 0;
  for (const adapter of allAdapters) {
    const avail = await adapter.available();
    const label = adapter.id.padEnd(10);
    if (avail.ok) {
      console.log(`  ${chalk.green('✓')} ${chalk.bold(label)} ${chalk.dim(avail.version ?? '')}`);
      console.log(`    ${chalk.dim(adapter.description)}`);
    } else {
      missing++;
      console.log(`  ${chalk.yellow('✗')} ${chalk.bold(label)} ${chalk.yellow('not found')}`);
      console.log(`    ${chalk.dim(adapter.description)}`);
      if (avail.hint) console.log(`    ${chalk.cyan('→')} ${avail.hint}`);
    }
    console.log('');
  }

  if (missing > 0) {
    console.log(chalk.dim(`  ${missing} tool(s) missing. OWASP.WTF will still run, but coverage will be reduced.`));
    console.log(chalk.dim(`  Run 'npx owasp-wtf install-tools' for setup instructions.`));
  } else {
    console.log(chalk.green('  All recommended tools are installed.'));
  }
  console.log('');
  return 0;
}
