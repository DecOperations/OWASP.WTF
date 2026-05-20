import chalk from 'chalk';

/**
 * Print installation instructions for each supported OSS tool. We do not
 * auto-download binaries — that would be a supply-chain risk for a security
 * tool. The user runs the install commands themselves.
 */
export function runInstallToolsCommand(): number {
  console.log('');
  console.log(chalk.bold('  OWASP.WTF — Recommended Tool Install'));
  console.log('');
  console.log(chalk.dim('  OWASP.WTF orchestrates the following open-source scanners.'));
  console.log(chalk.dim('  Install whichever ones you want; missing tools are skipped gracefully.'));
  console.log('');

  const lines = [
    ['Semgrep',   'pipx install semgrep',                            'brew install semgrep',                'https://semgrep.dev'],
    ['Gitleaks',  'brew install gitleaks',                           'https://github.com/gitleaks/gitleaks/releases', ''],
    ['Trivy',     'brew install aquasecurity/trivy/trivy',           'https://aquasecurity.github.io/trivy/', ''],
    ['Syft',      'brew install syft',                               'curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin', ''],
    ['Grype',     'brew install grype',                              'curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin', ''],
    ['Hadolint',  'brew install hadolint',                           'https://github.com/hadolint/hadolint/releases', ''],
  ];

  for (const [name, mac, other, homepage] of lines) {
    console.log(`  ${chalk.bold(name)}`);
    console.log(`    macOS:  ${chalk.cyan(mac)}`);
    if (other) console.log(`    Other:  ${chalk.cyan(other)}`);
    if (homepage) console.log(`    Docs:   ${chalk.dim(homepage)}`);
    console.log('');
  }

  console.log(chalk.dim('  When finished, verify with: ') + chalk.bold('npx owasp-wtf doctor'));
  console.log('');
  return 0;
}
