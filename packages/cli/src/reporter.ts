import chalk from 'chalk';
import type { Finding, ScanResult, Severity } from './types.js';

// ───────────────────────────────────────────────────────────────────────────
// Color helpers
// ───────────────────────────────────────────────────────────────────────────

const severityColor: Record<Severity, (s: string) => string> = {
  critical: (s) => chalk.bgRed.white.bold(` ${s} `),
  high: (s) => chalk.red.bold(s),
  medium: (s) => chalk.yellow(s),
  low: (s) => chalk.cyan(s),
  info: (s) => chalk.dim(s),
};

const severityBadge: Record<Severity, string> = {
  critical: chalk.bgRed.white.bold(' CRITICAL '),
  high: chalk.bgRedBright.white.bold(' HIGH '),
  medium: chalk.bgYellow.black.bold(' MEDIUM '),
  low: chalk.bgCyan.black.bold(' LOW '),
  info: chalk.bgGray.white(' INFO '),
};

function scoreColor(score: number): (s: string) => string {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  if (score >= 40) return chalk.hex('#FF8800');
  return chalk.red;
}

function pad(s: string, len: number): string {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

// ───────────────────────────────────────────────────────────────────────────
// Box drawing
// ───────────────────────────────────────────────────────────────────────────

function box(lines: string[], width: number): string {
  const top = `  ${chalk.dim('\u250c' + '\u2500'.repeat(width - 2) + '\u2510')}`;
  const bottom = `  ${chalk.dim('\u2514' + '\u2500'.repeat(width - 2) + '\u2518')}`;
  const content = lines.map(
    (l) => `  ${chalk.dim('\u2502')} ${pad(l, width - 4)} ${chalk.dim('\u2502')}`,
  );
  return [top, ...content, bottom].join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
// Terminal format
// ───────────────────────────────────────────────────────────────────────────

export function formatTerminal(result: ScanResult): string {
  const output: string[] = [];
  const w = 64;

  // ── Summary box ──
  const scoreVal = result.score;
  const grade =
    scoreVal >= 90 ? 'A' : scoreVal >= 80 ? 'B' : scoreVal >= 70 ? 'C' : scoreVal >= 60 ? 'D' : 'F';

  const scoreStr = scoreColor(scoreVal)(`${scoreVal}/100 (${grade})`);

  const summaryLines = [
    '',
    chalk.bold('  Security Score: ') + scoreStr,
    '',
    `  Files scanned:  ${chalk.bold(String(result.filesScanned))}`,
    `  Findings:       ${chalk.bold(String(result.findings.length))}`,
    `  Scan time:      ${chalk.bold((result.duration / 1000).toFixed(2) + 's')}`,
    '',
    `  ${severityColor.critical('CRITICAL')} ${chalk.bold(String(result.summary.critical))}  ${severityColor.high('HIGH')} ${chalk.bold(String(result.summary.high))}  ${severityColor.medium('MEDIUM')} ${chalk.bold(String(result.summary.medium))}  ${severityColor.low('LOW')} ${chalk.bold(String(result.summary.low))}`,
    '',
  ];

  output.push('');
  output.push(box(summaryLines, w));
  output.push('');

  // ── Category breakdown ──
  if (Object.keys(result.categories).length > 0) {
    output.push(chalk.bold.underline('  OWASP Top 10 Breakdown'));
    output.push('');

    const sortedCats = Object.entries(result.categories).sort((a, b) => b[1] - a[1]);
    for (const [cat, count] of sortedCats) {
      const barLen = Math.min(30, Math.round((count / Math.max(1, result.findings.length)) * 30));
      const bar = chalk.red('\u2588'.repeat(barLen)) + chalk.dim('\u2591'.repeat(30 - barLen));
      output.push(`  ${pad(cat, 40)} ${bar} ${chalk.bold(String(count))}`);
    }
    output.push('');
  }

  // ── Findings grouped by file ──
  if (result.findings.length > 0) {
    output.push(chalk.bold.underline('  Findings'));
    output.push('');

    const byFile = groupByFile(result.findings);

    for (const [filePath, fileFindings] of Object.entries(byFile)) {
      output.push(`  ${chalk.bold.blue(filePath)}`);
      output.push(`  ${chalk.dim('\u2500'.repeat(filePath.length + 4))}`);

      for (const finding of fileFindings) {
        output.push('');
        output.push(
          `    ${severityBadge[finding.severity]} ${chalk.bold(finding.ruleName)} ${chalk.dim(`(${finding.ruleId})`)}`,
        );
        output.push(
          `    ${chalk.dim('at')} ${chalk.cyan(`${finding.filePath}:${finding.line}:${finding.column}`)}`,
        );
        output.push(`    ${chalk.dim('category:')} ${finding.category}`);
        output.push('');
        output.push(`    ${finding.message}`);
        output.push('');

        // Code snippet
        if (finding.snippet) {
          const snippetLines = finding.snippet.split('\n');
          for (const sl of snippetLines) {
            if (sl.startsWith('>')) {
              output.push(`    ${chalk.bgRed.white(sl)}`);
            } else {
              output.push(`    ${chalk.dim(sl)}`);
            }
          }
          output.push('');
        }

        // Suggestion
        output.push(`    ${chalk.green('\u2192')} ${chalk.green(finding.suggestion)}`);
        output.push('');
      }

      output.push('');
    }
  } else {
    output.push(chalk.green.bold('  No security issues found! Your code looks clean.'));
    output.push('');
  }

  // ── Footer ──
  output.push(
    chalk.dim('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500'),
  );
  output.push(chalk.dim('  OWASP.WTF v0.1.0 | https://owasp.wtf'));
  output.push('');

  return output.join('\n');
}

function groupByFile(findings: Finding[]): Record<string, Finding[]> {
  const grouped: Record<string, Finding[]> = {};
  for (const f of findings) {
    if (!grouped[f.filePath]) {
      grouped[f.filePath] = [];
    }
    grouped[f.filePath].push(f);
  }
  return grouped;
}

// ───────────────────────────────────────────────────────────────────────────
// JSON format
// ───────────────────────────────────────────────────────────────────────────

export function formatJson(result: ScanResult): string {
  return JSON.stringify(
    {
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      score: result.score,
      totalFiles: result.totalFiles,
      filesScanned: result.filesScanned,
      duration: Math.round(result.duration),
      summary: result.summary,
      categories: result.categories,
      findings: result.findings.map((f) => ({
        ruleId: f.ruleId,
        ruleName: f.ruleName,
        severity: f.severity,
        category: f.category,
        file: f.filePath,
        line: f.line,
        column: f.column,
        message: f.message,
        suggestion: f.suggestion,
        snippet: f.snippet,
      })),
    },
    null,
    2,
  );
}

// ───────────────────────────────────────────────────────────────────────────
// HTML format
// ───────────────────────────────────────────────────────────────────────────

export function formatHtml(result: ScanResult): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const severityHtmlColor: Record<Severity, string> = {
    critical: '#ff4444',
    high: '#ff6b6b',
    medium: '#ffc107',
    low: '#17a2b8',
    info: '#6c757d',
  };

  const scoreVal = result.score;
  const scoreHtmlColor =
    scoreVal >= 80 ? '#28a745' : scoreVal >= 60 ? '#ffc107' : scoreVal >= 40 ? '#ff8800' : '#dc3545';

  const findingsHtml = result.findings
    .map(
      (f) => `
      <div class="finding">
        <div class="finding-header">
          <span class="severity" style="background:${severityHtmlColor[f.severity]}">${f.severity.toUpperCase()}</span>
          <span class="rule-name">${escapeHtml(f.ruleName)}</span>
          <span class="rule-id">${escapeHtml(f.ruleId)}</span>
        </div>
        <div class="location">${escapeHtml(f.filePath)}:${f.line}:${f.column}</div>
        <div class="category">${escapeHtml(f.category)}</div>
        <p class="message">${escapeHtml(f.message)}</p>
        <pre class="snippet"><code>${escapeHtml(f.snippet)}</code></pre>
        <p class="suggestion">${escapeHtml(f.suggestion)}</p>
      </div>`,
    )
    .join('\n');

  const categoryRows = Object.entries(result.categories)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([cat, count]) =>
        `<tr><td>${escapeHtml(cat)}</td><td>${count}</td></tr>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OWASP.WTF Security Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    background: #0d1117;
    color: #c9d1d9;
    padding: 2rem;
    line-height: 1.6;
  }
  h1 { color: #58a6ff; margin-bottom: 0.5rem; }
  h2 { color: #58a6ff; margin: 1.5rem 0 0.75rem; border-bottom: 1px solid #21262d; padding-bottom: 0.5rem; }
  .meta { color: #8b949e; margin-bottom: 2rem; }
  .score-box {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .score-number {
    font-size: 3rem;
    font-weight: bold;
    color: ${scoreHtmlColor};
  }
  .score-label { color: #8b949e; font-size: 0.9rem; }
  .stats { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .stat { text-align: center; }
  .stat-value { font-size: 1.5rem; font-weight: bold; }
  .stat-label { color: #8b949e; font-size: 0.8rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
  th, td { padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #21262d; }
  th { color: #58a6ff; font-weight: 600; }
  .finding {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .finding-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
  .severity {
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .rule-name { font-weight: 600; color: #c9d1d9; }
  .rule-id { color: #8b949e; font-size: 0.85rem; }
  .location { color: #58a6ff; font-size: 0.85rem; margin-bottom: 0.25rem; }
  .category { color: #8b949e; font-size: 0.85rem; margin-bottom: 0.5rem; }
  .message { margin-bottom: 0.75rem; }
  .snippet {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 4px;
    padding: 0.75rem;
    overflow-x: auto;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  .suggestion { color: #3fb950; font-style: italic; }
  footer { margin-top: 2rem; color: #8b949e; font-size: 0.85rem; border-top: 1px solid #21262d; padding-top: 1rem; }
</style>
</head>
<body>
  <h1>OWASP.WTF Security Report</h1>
  <p class="meta">Generated ${new Date().toISOString()} | v0.1.0</p>

  <div class="score-box">
    <div>
      <div class="score-number">${result.score}/100</div>
      <div class="score-label">Security Score</div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-value">${result.filesScanned}</div><div class="stat-label">Files Scanned</div></div>
      <div class="stat"><div class="stat-value">${result.findings.length}</div><div class="stat-label">Findings</div></div>
      <div class="stat"><div class="stat-value" style="color:#ff4444">${result.summary.critical}</div><div class="stat-label">Critical</div></div>
      <div class="stat"><div class="stat-value" style="color:#ff6b6b">${result.summary.high}</div><div class="stat-label">High</div></div>
      <div class="stat"><div class="stat-value" style="color:#ffc107">${result.summary.medium}</div><div class="stat-label">Medium</div></div>
      <div class="stat"><div class="stat-value" style="color:#17a2b8">${result.summary.low}</div><div class="stat-label">Low</div></div>
    </div>
  </div>

  <h2>OWASP Top 10 Breakdown</h2>
  <table>
    <thead><tr><th>Category</th><th>Findings</th></tr></thead>
    <tbody>${categoryRows}</tbody>
  </table>

  <h2>Findings (${result.findings.length})</h2>
  ${findingsHtml || '<p style="color:#3fb950;font-weight:bold;">No security issues found!</p>'}

  <footer>OWASP.WTF v0.1.0 | <a href="https://owasp.wtf" style="color:#58a6ff;">https://owasp.wtf</a></footer>
</body>
</html>`;
}
