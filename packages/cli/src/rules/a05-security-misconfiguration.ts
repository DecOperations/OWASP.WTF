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
// Rule: Debug mode enabled
// ---------------------------------------------------------------------------
const debugMode: Rule = {
  id: 'A05-DEBUG-ENABLED',
  name: 'Debug Mode Enabled',
  severity: 'medium',
  category: 'A05:2021-Security-Misconfiguration',
  description:
    'Debug mode enabled in configuration exposes detailed error information, internal paths, and potentially sensitive data in production.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check configuration-like files
    const isConfig =
      /config|settings|env|\.json$|\.ya?ml$|\.toml$/i.test(filePath) ||
      /DEBUG|NODE_ENV/i.test(content);

    if (!isConfig) return findings;

    const debugPatterns: { pattern: RegExp; label: string }[] = [
      { pattern: /DEBUG\s*[:=]\s*(?:true|1|['"]true['"])/i, label: 'DEBUG flag is enabled' },
      { pattern: /debug\s*:\s*true/, label: 'debug mode is enabled' },
      { pattern: /NODE_ENV\s*[:=]\s*['"`]development['"`]/, label: 'NODE_ENV set to development' },
      { pattern: /FLASK_DEBUG\s*[:=]\s*(?:1|true|['"]1['"])/i, label: 'Flask DEBUG is enabled' },
      { pattern: /app\.debug\s*=\s*True/, label: 'Flask app.debug is True' },
      { pattern: /DJANGO_DEBUG\s*[:=]\s*(?:True|1)/i, label: 'Django DEBUG is enabled' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const { pattern, label } of debugPatterns) {
        if (pattern.test(line)) {
          // Skip if clearly in a test/dev context
          if (/test|spec|\.dev\.|\.development\.|\.local\./i.test(filePath)) continue;

          findings.push({
            ruleId: debugMode.id,
            ruleName: debugMode.name,
            severity: debugMode.severity,
            category: debugMode.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. Debug mode in production exposes sensitive internal information.`,
            suggestion:
              'Ensure debug mode is disabled in production. Use environment-specific config files and set DEBUG=false / NODE_ENV=production.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Default credentials
// ---------------------------------------------------------------------------
const defaultCredentials: Rule = {
  id: 'A05-DEFAULT-CREDS',
  name: 'Default Credentials',
  severity: 'high',
  category: 'A05:2021-Security-Misconfiguration',
  description:
    'Using default or well-known credentials that ship with software or documentation examples.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Skip test/mock files
    if (/\.(test|spec|mock|fixture|example)\./i.test(filePath)) return findings;

    const defaultCreds = [
      { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`](admin|password|123456|root|default|test|guest|letmein|qwerty|12345678)['"`]/i, label: 'default password' },
      { pattern: /(?:username|user)\s*[:=]\s*['"`](admin|root|administrator|sa|postgres|mysql|guest)['"`]/i, label: 'default username' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const { pattern, label } of defaultCreds) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: defaultCredentials.id,
            ruleName: defaultCredentials.name,
            severity: defaultCredentials.severity,
            category: defaultCredentials.category,
            filePath,
            line: i + 1,
            column: (line.match(pattern)?.index ?? 0) + 1,
            snippet: snippet(lines, i),
            message: `Detected ${label}. Default credentials are easily guessable and widely known.`,
            suggestion:
              'Use strong, unique credentials. Generate random passwords and store them in environment variables or a secrets manager.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Verbose error messages / stack traces exposed
// ---------------------------------------------------------------------------
const verboseErrors: Rule = {
  id: 'A05-VERBOSE-ERRORS',
  name: 'Verbose Error Exposure',
  severity: 'medium',
  category: 'A05:2021-Security-Misconfiguration',
  description:
    'Exposing detailed error messages or stack traces to users reveals internal implementation details that aid attackers.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      const errorPatterns: { pattern: RegExp; label: string }[] = [
        {
          pattern: /res\.\w*(?:json|send|status)\s*\([^)]*(?:err\.stack|error\.stack|e\.stack)/,
          label: 'Stack trace sent in HTTP response',
        },
        {
          pattern: /res\.\w*(?:json|send)\s*\([^)]*(?:err\.message|error\.message|e\.message)/,
          label: 'Raw error message sent in HTTP response',
        },
        {
          pattern: /(?:response|resp|ctx\.body)\s*=\s*.*(?:err\.stack|error\.stack|e\.stack)/,
          label: 'Stack trace assigned to response body',
        },
        {
          pattern: /(?:traceback|stacktrace|stack_trace).*(?:response|render|send|json|write)/i,
          label: 'Stack trace in response',
        },
      ];

      for (const { pattern, label } of errorPatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: verboseErrors.id,
            ruleName: verboseErrors.name,
            severity: verboseErrors.severity,
            category: verboseErrors.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. Internal error details help attackers understand your application\'s internals.`,
            suggestion:
              'Return generic error messages to users (e.g., "An error occurred"). Log detailed errors server-side only.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Missing security headers
// ---------------------------------------------------------------------------
const missingSecurityHeaders: Rule = {
  id: 'A05-MISSING-HEADERS',
  name: 'Missing Security Headers',
  severity: 'low',
  category: 'A05:2021-Security-Misconfiguration',
  description:
    'Server configuration files that set up HTTP servers without essential security headers.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check files that appear to set up an HTTP server
    const isServerSetup =
      /createServer|express\(\)|new\s+Koa|new\s+Hapi|fastify\(/i.test(content) ||
      /app\.listen\s*\(/i.test(content);

    if (!isServerSetup) return findings;

    // Check if helmet or security headers are set
    const hasHelmet = /helmet|lusca/i.test(content);
    const hasCSP = /Content-Security-Policy|contentSecurityPolicy/i.test(content);
    const hasHSTS = /Strict-Transport-Security|hsts/i.test(content);
    const hasXFrame = /X-Frame-Options|frameguard/i.test(content);

    if (!hasHelmet && !hasCSP && !hasHSTS && !hasXFrame) {
      // Find the line where the server is created
      for (let i = 0; i < lines.length; i++) {
        if (/createServer|express\(\)|new\s+Koa|new\s+Hapi|fastify\(/i.test(lines[i])) {
          findings.push({
            ruleId: missingSecurityHeaders.id,
            ruleName: missingSecurityHeaders.name,
            severity: missingSecurityHeaders.severity,
            category: missingSecurityHeaders.category,
            filePath,
            line: i + 1,
            column: 1,
            snippet: snippet(lines, i),
            message: 'HTTP server created without security headers (CSP, HSTS, X-Frame-Options).',
            suggestion:
              'Use the helmet middleware (npm install helmet) to set security headers automatically: app.use(helmet())',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Stack traces in error handlers
// ---------------------------------------------------------------------------
const stackTraceExposure: Rule = {
  id: 'A05-STACK-TRACE',
  name: 'Stack Trace in Error Response',
  severity: 'medium',
  category: 'A05:2021-Security-Misconfiguration',
  description:
    'Sending full stack traces in error responses reveals internal file paths, library versions, and application structure.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Express-style error handlers sending stack
      if (/\.status\s*\(\s*500\s*\).*\.(?:json|send)\s*\(\s*\{[^}]*stack/i.test(line)) {
        findings.push({
          ruleId: stackTraceExposure.id,
          ruleName: stackTraceExposure.name,
          severity: stackTraceExposure.severity,
          category: stackTraceExposure.category,
          filePath,
          line: i + 1,
          column: 1,
          snippet: snippet(lines, i),
          message: 'Error handler includes stack trace in the 500 response.',
          suggestion:
            'Remove stack traces from production error responses. Only include them in development mode.',
        });
      }

      // Catch blocks that return the full error
      if (/catch\s*\(/.test(line)) {
        const catchBlock = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
        if (/res\.\w*(?:json|send)\s*\(\s*(?:err|error|e)\s*\)/.test(catchBlock)) {
          findings.push({
            ruleId: stackTraceExposure.id,
            ruleName: stackTraceExposure.name,
            severity: stackTraceExposure.severity,
            category: stackTraceExposure.category,
            filePath,
            line: i + 1,
            column: 1,
            snippet: snippet(lines, i),
            message: 'Entire error object sent as response, which may include stack traces.',
            suggestion:
              'Send only a safe error message: res.status(500).json({ error: "Internal server error" })',
          });
        }
      }
    }

    return findings;
  },
};

export const a05Rules: Rule[] = [
  debugMode,
  defaultCredentials,
  verboseErrors,
  missingSecurityHeaders,
  stackTraceExposure,
];
