import type { Rule, Finding } from '../types.js';

function snippet(lines: string[], idx: number): string {
  const start = Math.max(0, idx - 2);
  const end = Math.min(lines.length - 1, idx + 2);
  const result: string[] = [];
  for (let i = start; i <= end; i++) {
    const marker = i === idx ? '>' : ' ';
    result.push(`${marker} ${i + 1} | ${lines[i]}`);
  }
  return result.join('\n');
}

function isComment(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('<!--')
  );
}

// ---------------------------------------------------------------------------
// Rule: SQL Injection
// ---------------------------------------------------------------------------
const sqlInjection: Rule = {
  id: 'A03-SQL-INJECTION',
  name: 'SQL Injection',
  severity: 'critical',
  category: 'A03:2021-Injection',
  description:
    'Constructing SQL queries by concatenating user input allows attackers to execute arbitrary SQL commands.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // String concatenation in SQL queries
      // e.g., "SELECT * FROM users WHERE id = " + userId
      if (sqlKeywords.test(line)) {
        // Concatenation with +
        if (/['"`]\s*\+\s*(?!['"`])/.test(line) || /(?<!['"`])\s*\+\s*['"`]/.test(line)) {
          if (/\b(req\.|params\.|query\.|body\.|input|user|arg|var)/i.test(line)) {
            findings.push({
              ruleId: sqlInjection.id,
              ruleName: sqlInjection.name,
              severity: sqlInjection.severity,
              category: sqlInjection.category,
              filePath,
              line: i + 1,
              column: line.search(sqlKeywords) + 1,
              snippet: snippet(lines, i),
              message: 'SQL query built using string concatenation with potentially untrusted input.',
              suggestion:
                'Use parameterized queries or prepared statements. E.g., db.query("SELECT * FROM users WHERE id = $1", [userId])',
            });
            continue;
          }
        }

        // Template literals in SQL: `SELECT * FROM users WHERE id = ${userId}`
        if (/`[^`]*\$\{[^}]+\}[^`]*`/.test(line)) {
          findings.push({
            ruleId: sqlInjection.id,
            ruleName: sqlInjection.name,
            severity: sqlInjection.severity,
            category: sqlInjection.category,
            filePath,
            line: i + 1,
            column: line.search(sqlKeywords) + 1,
            snippet: snippet(lines, i),
            message: 'SQL query uses template literal interpolation, which is vulnerable to injection.',
            suggestion:
              'Use parameterized queries instead of template literals for SQL. E.g., db.query("SELECT * FROM users WHERE id = ?", [userId])',
          });
          continue;
        }

        // f-strings in Python: f"SELECT * FROM users WHERE id = {user_id}"
        if (/f['"].*\{[^}]+\}.*['"]/.test(line)) {
          findings.push({
            ruleId: sqlInjection.id,
            ruleName: sqlInjection.name,
            severity: sqlInjection.severity,
            category: sqlInjection.category,
            filePath,
            line: i + 1,
            column: line.search(sqlKeywords) + 1,
            snippet: snippet(lines, i),
            message: 'SQL query uses Python f-string interpolation, which is vulnerable to injection.',
            suggestion: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
          });
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: XSS
// ---------------------------------------------------------------------------
const xss: Rule = {
  id: 'A03-XSS',
  name: 'Cross-Site Scripting (XSS)',
  severity: 'high',
  category: 'A03:2021-Injection',
  description:
    'Inserting unsanitized data into the DOM can allow attackers to execute arbitrary JavaScript in users\' browsers.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const xssPatterns: { pattern: RegExp; label: string; suggestion: string }[] = [
      {
        pattern: /\.innerHTML\s*=(?!\s*['"`]\s*['"`])/,
        label: 'Direct innerHTML assignment can execute injected scripts.',
        suggestion: 'Use textContent instead of innerHTML, or sanitize with DOMPurify: element.innerHTML = DOMPurify.sanitize(value)',
      },
      {
        pattern: /dangerouslySetInnerHTML/,
        label: 'dangerouslySetInnerHTML renders raw HTML, creating XSS risk.',
        suggestion: 'Sanitize the HTML before rendering: dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}',
      },
      {
        pattern: /document\.write\s*\(/,
        label: 'document.write() can inject arbitrary HTML into the page.',
        suggestion: 'Use DOM APIs like createElement/appendChild instead of document.write().',
      },
      {
        pattern: /\.outerHTML\s*=/,
        label: 'outerHTML assignment can execute injected scripts.',
        suggestion: 'Use textContent or sanitize with DOMPurify before assigning to outerHTML.',
      },
      {
        pattern: /\.insertAdjacentHTML\s*\(/,
        label: 'insertAdjacentHTML renders raw HTML without sanitization.',
        suggestion: 'Sanitize HTML before using insertAdjacentHTML: el.insertAdjacentHTML(pos, DOMPurify.sanitize(html))',
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const { pattern, label, suggestion } of xssPatterns) {
        if (pattern.test(line)) {
          // Check for sanitization in surrounding context
          const context = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
            .join('\n');
          if (/DOMPurify|sanitize|escapeHtml|xss\(/i.test(context)) continue;

          findings.push({
            ruleId: xss.id,
            ruleName: xss.name,
            severity: xss.severity,
            category: xss.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: label,
            suggestion,
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Command Injection
// ---------------------------------------------------------------------------
const commandInjection: Rule = {
  id: 'A03-COMMAND-INJECTION',
  name: 'Command Injection',
  severity: 'critical',
  category: 'A03:2021-Injection',
  description:
    'Executing system commands with unsanitized user input allows attackers to run arbitrary OS commands.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Node.js exec/spawn with string interpolation or concatenation
      const cmdPatterns: { pattern: RegExp; label: string }[] = [
        {
          pattern: /exec\s*\(\s*`[^`]*\$\{/,
          label: 'exec() with template literal interpolation',
        },
        {
          pattern: /exec\s*\(\s*['"][^'"]*['"\s]*\+/,
          label: 'exec() with string concatenation',
        },
        {
          pattern: /execSync\s*\(\s*`[^`]*\$\{/,
          label: 'execSync() with template literal interpolation',
        },
        {
          pattern: /execSync\s*\(\s*['"][^'"]*['"\s]*\+/,
          label: 'execSync() with string concatenation',
        },
        {
          pattern: /child_process.*exec\s*\(/,
          label: 'child_process.exec() usage (prefer execFile or spawn with array args)',
        },
        {
          pattern: /os\.system\s*\(\s*f?['"`].*[{+]/,
          label: 'os.system() with dynamic input (Python)',
        },
        {
          pattern: /subprocess\.call\s*\(\s*f?['"`]/,
          label: 'subprocess with shell string (Python)',
        },
        {
          pattern: /Runtime\.getRuntime\(\)\.exec\s*\(\s*['"][^'"]*['"\s]*\+/,
          label: 'Runtime.exec() with string concatenation (Java)',
        },
      ];

      for (const { pattern, label } of cmdPatterns) {
        if (pattern.test(line)) {
          // Check for input sanitization nearby
          const context = lines
            .slice(Math.max(0, i - 5), Math.min(lines.length, i + 1))
            .join('\n');
          if (/sanitize|escape|whitelist|allowlist|validate|shellescape|shlex\.quote/i.test(context)) continue;

          findings.push({
            ruleId: commandInjection.id,
            ruleName: commandInjection.name,
            severity: commandInjection.severity,
            category: commandInjection.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. Unsanitized input in command execution enables OS command injection.`,
            suggestion:
              'Use execFile() or spawn() with an array of arguments instead of exec() with a string. Never interpolate user input into shell commands.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Path Traversal
// ---------------------------------------------------------------------------
const pathTraversal: Rule = {
  id: 'A03-PATH-TRAVERSAL',
  name: 'Path Traversal',
  severity: 'high',
  category: 'A03:2021-Injection',
  description:
    'Using user-supplied input in file paths without sanitization allows attackers to access arbitrary files on the server.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // File operations with user input
      const fileOps = [
        /(?:readFile|readFileSync|createReadStream)\s*\(\s*(?:`[^`]*\$\{|.*req\.(params|query|body))/,
        /(?:writeFile|writeFileSync|createWriteStream)\s*\(\s*(?:`[^`]*\$\{|.*req\.(params|query|body))/,
        /(?:open|access|stat)\s*\(\s*(?:`[^`]*\$\{|.*req\.(params|query|body))/,
        /path\.join\s*\([^)]*req\.(params|query|body)/,
        /path\.resolve\s*\([^)]*req\.(params|query|body)/,
        /send[Ff]ile\s*\(\s*(?:`[^`]*\$\{|.*req\.(params|query|body))/,
      ];

      for (const pattern of fileOps) {
        if (pattern.test(line)) {
          // Check for path sanitization
          const context = lines
            .slice(Math.max(0, i - 5), Math.min(lines.length, i + 3))
            .join('\n');
          if (/path\.normalize|sanitize|\.replace\(.*\.\./i.test(context)) continue;
          if (/\.includes\(\s*['"`]\.\.['"]\s*\)/i.test(context)) continue;

          findings.push({
            ruleId: pathTraversal.id,
            ruleName: pathTraversal.name,
            severity: pathTraversal.severity,
            category: pathTraversal.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: 'User-supplied input used in file path without visible sanitization. May allow path traversal (../).',
            suggestion:
              'Validate and sanitize file paths. Use path.normalize() and verify the resolved path is within the expected directory. Reject paths containing "..".',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: eval() usage
// ---------------------------------------------------------------------------
const evalUsage: Rule = {
  id: 'A03-EVAL',
  name: 'Dangerous eval() Usage',
  severity: 'high',
  category: 'A03:2021-Injection',
  description:
    'eval() executes arbitrary code and can lead to code injection if used with untrusted input.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Match eval(), new Function(), setTimeout/setInterval with strings
      const evalPatterns: { pattern: RegExp; label: string }[] = [
        { pattern: /\beval\s*\(/, label: 'eval()' },
        { pattern: /new\s+Function\s*\(/, label: 'new Function()' },
        { pattern: /setTimeout\s*\(\s*['"`]/, label: 'setTimeout() with string argument' },
        { pattern: /setInterval\s*\(\s*['"`]/, label: 'setInterval() with string argument' },
      ];

      for (const { pattern, label } of evalPatterns) {
        if (pattern.test(line)) {
          // Skip ESLint disable comments
          if (/eslint-disable|nosonar|nosec|NOLINT/i.test(line)) continue;

          findings.push({
            ruleId: evalUsage.id,
            ruleName: evalUsage.name,
            severity: evalUsage.severity,
            category: evalUsage.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label} executes arbitrary code. If any input is user-controlled, this enables code injection.`,
            suggestion:
              'Avoid eval() and new Function(). Use JSON.parse() for data, or a safe expression parser for computed values.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Template injection
// ---------------------------------------------------------------------------
const templateInjection: Rule = {
  id: 'A03-TEMPLATE-INJECTION',
  name: 'Server-Side Template Injection',
  severity: 'high',
  category: 'A03:2021-Injection',
  description:
    'Rendering user input directly in server-side templates can allow attackers to execute arbitrary code on the server.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      const templatePatterns: { pattern: RegExp; label: string }[] = [
        {
          pattern: /render_template_string\s*\(/,
          label: 'Flask render_template_string() with potential user input',
        },
        {
          pattern: /Template\s*\(\s*(?:req\.|request\.|params|query|body|user_input)/,
          label: 'Template constructed from user input',
        },
        {
          pattern: /\.render\s*\(\s*(?:req\.|request\.)/,
          label: 'Template rendered with request data directly',
        },
        {
          pattern: /nunjucks\.renderString\s*\(\s*(?:req\.|request\.|params)/,
          label: 'Nunjucks renderString with user input',
        },
      ];

      for (const { pattern, label } of templatePatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: templateInjection.id,
            ruleName: templateInjection.name,
            severity: templateInjection.severity,
            category: templateInjection.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. This may allow server-side template injection (SSTI).`,
            suggestion:
              'Never pass user input as the template string. Use template files with parameterized data instead.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

export const a03Rules: Rule[] = [
  sqlInjection,
  xss,
  commandInjection,
  pathTraversal,
  evalUsage,
  templateInjection,
];
