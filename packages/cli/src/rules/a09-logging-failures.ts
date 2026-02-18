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
// Rule: Sensitive data in logs
// ---------------------------------------------------------------------------
const sensitiveDataInLogs: Rule = {
  id: 'A09-SENSITIVE-LOG',
  name: 'Sensitive Data in Logs',
  severity: 'high',
  category: 'A09:2021-Logging-Failures',
  description:
    'Logging sensitive data (passwords, tokens, secrets, credit cards) can expose credentials in log files, monitoring systems, and log aggregation services.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const logFunctions = /(?:console\.(?:log|info|warn|error|debug)|logger?\.\w+|log\.\w+|print|puts)\s*\(/;

    const sensitivePatterns: { pattern: RegExp; label: string }[] = [
      { pattern: /password|passwd|pwd/i, label: 'password' },
      { pattern: /(?:access[_-]?)?token/i, label: 'token' },
      { pattern: /secret(?:[_-]?key)?/i, label: 'secret' },
      { pattern: /api[_-]?key/i, label: 'API key' },
      { pattern: /credit[_-]?card|card[_-]?number|cvv|ccn/i, label: 'credit card data' },
      { pattern: /ssn|social[_-]?security/i, label: 'SSN' },
      { pattern: /private[_-]?key/i, label: 'private key' },
      { pattern: /bearer/i, label: 'bearer token' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Check if this is a logging statement
      if (!logFunctions.test(line)) continue;

      for (const { pattern, label } of sensitivePatterns) {
        if (pattern.test(line)) {
          // Reduce false positives: skip lines that are just checking/validating
          if (/if\s*\(|\.length|===|!==|typeof|undefined|null|missing/i.test(line)) continue;
          // Skip lines that redact
          if (/redact|mask|sanitize|\*\*\*|xxx|REDACTED/i.test(line)) continue;

          findings.push({
            ruleId: sensitiveDataInLogs.id,
            ruleName: sensitiveDataInLogs.name,
            severity: sensitiveDataInLogs.severity,
            category: sensitiveDataInLogs.category,
            filePath,
            line: i + 1,
            column: line.search(logFunctions) + 1,
            snippet: snippet(lines, i),
            message: `Logging statement appears to include ${label}. Sensitive data in logs can be accessed by unauthorized parties.`,
            suggestion:
              'Remove sensitive data from log output. If needed for debugging, redact values: log("password: [REDACTED]"). Use structured logging with field-level redaction.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Empty catch blocks (missing error logging)
// ---------------------------------------------------------------------------
const emptyCatch: Rule = {
  id: 'A09-EMPTY-CATCH',
  name: 'Silent Error Handling',
  severity: 'low',
  category: 'A09:2021-Logging-Failures',
  description:
    'Catch blocks that silently swallow errors hide failures and make debugging impossible. Security events may go unnoticed.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Match catch blocks
      if (/catch\s*\(/.test(line)) {
        // Look at the catch block body (next few lines until closing brace)
        let braceCount = 0;
        let blockStart = -1;
        let blockContent = '';
        let hasLogging = false;

        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
          const l = lines[j];
          for (const ch of l) {
            if (ch === '{') {
              if (braceCount === 0) blockStart = j;
              braceCount++;
            }
            if (ch === '}') braceCount--;
          }

          if (blockStart >= 0 && j > blockStart) {
            blockContent += l + '\n';
          }

          if (braceCount === 0 && blockStart >= 0) break;
        }

        // Check if block has any logging or error handling
        hasLogging =
          /console\.|logger|log\.|throw|reject|next\(|emit|report|notify|alert|sentry|bugsnag/i.test(
            blockContent,
          );

        // If block is essentially empty or just has a comment
        const stripped = blockContent.replace(/\/\/.*|\/\*[\s\S]*?\*\/|\s/g, '');
        const isEmpty = stripped.length < 3; // just closing brace

        if (isEmpty || !hasLogging) {
          if (isEmpty) {
            findings.push({
              ruleId: emptyCatch.id,
              ruleName: emptyCatch.name,
              severity: 'medium' as const,
              category: emptyCatch.category,
              filePath,
              line: i + 1,
              column: line.search(/catch/) + 1,
              snippet: snippet(lines, i),
              message: 'Empty catch block silently swallows errors. Failures will go undetected.',
              suggestion:
                'At minimum, log the error: catch(err) { console.error("Operation failed:", err); }. Consider re-throwing or handling appropriately.',
            });
          }
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: console.log of sensitive data
// ---------------------------------------------------------------------------
const consoleLogSensitive: Rule = {
  id: 'A09-CONSOLE-SENSITIVE',
  name: 'console.log with Sensitive Data',
  severity: 'medium',
  category: 'A09:2021-Logging-Failures',
  description:
    'console.log statements that dump entire request bodies, user objects, or auth headers may inadvertently log sensitive data.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      const sensitiveLogPatterns: { pattern: RegExp; label: string }[] = [
        {
          pattern: /console\.log\s*\(\s*(?:['"`].*['"`]\s*,\s*)?req\.body\s*\)/,
          label: 'Logging entire request body (may contain passwords, tokens)',
        },
        {
          pattern: /console\.log\s*\(\s*(?:['"`].*['"`]\s*,\s*)?req\.headers\s*\)/,
          label: 'Logging all request headers (includes Authorization, cookies)',
        },
        {
          pattern: /console\.log\s*\(\s*(?:['"`].*['"`]\s*,\s*)?(?:user|currentUser|session)\s*\)/,
          label: 'Logging entire user/session object (may contain sensitive fields)',
        },
        {
          pattern: /console\.log\s*\(\s*JSON\.stringify\s*\(\s*(?:req\.body|req\.headers|user|session)/,
          label: 'JSON.stringify of request/user data sent to console',
        },
      ];

      for (const { pattern, label } of sensitiveLogPatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: consoleLogSensitive.id,
            ruleName: consoleLogSensitive.name,
            severity: consoleLogSensitive.severity,
            category: consoleLogSensitive.category,
            filePath,
            line: i + 1,
            column: line.search(/console\.log/) + 1,
            snippet: snippet(lines, i),
            message: `${label}.`,
            suggestion:
              'Log only specific, non-sensitive fields. Use structured logging with field-level filtering. Remove debug console.log statements before deploying.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: No audit trail for auth events
// ---------------------------------------------------------------------------
const noAuditTrail: Rule = {
  id: 'A09-NO-AUDIT',
  name: 'Missing Auth Event Audit Trail',
  severity: 'medium',
  category: 'A09:2021-Logging-Failures',
  description:
    'Authentication events (login, logout, failed attempts, password changes) should be logged for security monitoring and incident response.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check files that handle authentication
    const isAuthFile =
      /login|signin|authenticate|logout|signout|password.*change|password.*reset/i.test(
        filePath,
      ) ||
      (/\/login|\/signin|\/auth|\/logout|\/password/i.test(content) &&
        /\.(post|get|put)\s*\(/i.test(content));

    if (!isAuthFile) return findings;

    // Check for any logging in the file
    const hasLogging =
      /(?:logger|log|audit|winston|bunyan|pino)\.\w+\s*\(/i.test(content) ||
      /console\.(?:log|info|warn|error)\s*\(/i.test(content);

    // Check for audit-specific logging
    const hasAuditLogging =
      /audit|security[_-]?log|auth[_-]?log|login[_-]?attempt|failed[_-]?login|access[_-]?log/i.test(
        content,
      );

    // If there's auth logic but no logging at all
    if (!hasLogging) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isComment(line)) continue;

        if (/\/login|\/signin|\/authenticate/i.test(line) && /\.(post|put)\s*\(/i.test(line)) {
          findings.push({
            ruleId: noAuditTrail.id,
            ruleName: noAuditTrail.name,
            severity: noAuditTrail.severity,
            category: noAuditTrail.category,
            filePath,
            line: i + 1,
            column: 1,
            snippet: snippet(lines, i),
            message: 'Authentication endpoint has no logging. Failed login attempts and security events will go unrecorded.',
            suggestion:
              'Log authentication events: successful logins, failed attempts, logouts, password changes. Include timestamps, user identifiers, and IP addresses (but not passwords).',
          });
          break;
        }
      }
    } else if (!hasAuditLogging) {
      // Has some logging but not security/audit specific — this is a softer finding
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isComment(line)) continue;

        if (/\/login|\/signin|\/authenticate/i.test(line) && /\.(post|put)\s*\(/i.test(line)) {
          findings.push({
            ruleId: noAuditTrail.id,
            ruleName: noAuditTrail.name,
            severity: 'low',
            category: noAuditTrail.category,
            filePath,
            line: i + 1,
            column: 1,
            snippet: snippet(lines, i),
            message: 'Authentication endpoint has general logging but no structured security audit trail.',
            suggestion:
              'Implement structured audit logging for auth events. Include: event type, timestamp, user ID, IP address, success/failure status.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

export const a09Rules: Rule[] = [
  sensitiveDataInLogs,
  emptyCatch,
  consoleLogSensitive,
  noAuditTrail,
];
