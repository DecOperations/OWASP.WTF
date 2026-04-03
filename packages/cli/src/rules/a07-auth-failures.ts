// owasp-wtf-ignore-file — rule definitions, not actual vulnerabilities
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
// Rule: Weak password requirements
// ---------------------------------------------------------------------------
const weakPasswordReqs: Rule = {
  id: 'A07-WEAK-PASSWORD',
  name: 'Weak Password Requirements',
  severity: 'medium',
  category: 'A07:2021-Auth-Failures',
  description:
    'Password validation that accepts very short passwords or lacks complexity requirements makes brute-force attacks feasible.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Detect password length checks that are too low
      const lengthMatch = line.match(
        /(?:password|passwd|pwd).*\.length\s*(?:>=?|>)\s*(\d+)/i,
      );
      if (lengthMatch) {
        const minLen = parseInt(lengthMatch[1], 10);
        if (minLen < 8) {
          findings.push({
            ruleId: weakPasswordReqs.id,
            ruleName: weakPasswordReqs.name,
            severity: weakPasswordReqs.severity,
            category: weakPasswordReqs.category,
            filePath,
            line: i + 1,
            column: (lengthMatch.index ?? 0) + 1,
            snippet: snippet(lines, i),
            message: `Password minimum length is ${minLen}, which is below the recommended minimum of 8 characters.`,
            suggestion:
              'Require passwords of at least 8 characters (NIST recommends 8+). Consider requiring 12+ for higher security.',
          });
        }
      }

      // Detect minLength in schema/config for password
      const schemaMatch = line.match(
        /(?:password|passwd|pwd).*minLength\s*[:=]\s*(\d+)/i,
      );
      if (schemaMatch) {
        const minLen = parseInt(schemaMatch[1], 10);
        if (minLen < 8) {
          findings.push({
            ruleId: weakPasswordReqs.id,
            ruleName: weakPasswordReqs.name,
            severity: weakPasswordReqs.severity,
            category: weakPasswordReqs.category,
            filePath,
            line: i + 1,
            column: (schemaMatch.index ?? 0) + 1,
            snippet: snippet(lines, i),
            message: `Password minLength is ${minLen}, below the recommended 8 characters.`,
            suggestion:
              'Set minLength to at least 8. NIST SP 800-63B recommends allowing up to 64 characters.',
          });
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Missing rate limiting
// ---------------------------------------------------------------------------
const missingRateLimit: Rule = {
  id: 'A07-NO-RATE-LIMIT',
  name: 'Missing Rate Limiting on Auth',
  severity: 'high',
  category: 'A07:2021-Auth-Failures',
  description:
    'Authentication endpoints without rate limiting are vulnerable to brute-force and credential stuffing attacks.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check files that have login/auth routes
    const hasAuthEndpoint =
      /\/login|\/signin|\/auth|\/authenticate|\/register|\/signup/i.test(content);

    if (!hasAuthEndpoint) return findings;

    // Check if rate limiting is used anywhere in the file
    const hasRateLimit =
      /rateLimit|rate[_-]?limit|throttle|brute[_-]?force|express-rate-limit|bottleneck|slowDown/i.test(
        content,
      );

    if (hasRateLimit) return findings;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      const authEndpointMatch = line.match(
        /\.(post|put)\s*\(\s*['"`](\/login|\/signin|\/auth|\/authenticate|\/register|\/signup)['"`]/i,
      );

      if (authEndpointMatch) {
        findings.push({
          ruleId: missingRateLimit.id,
          ruleName: missingRateLimit.name,
          severity: missingRateLimit.severity,
          category: missingRateLimit.category,
          filePath,
          line: i + 1,
          column: (authEndpointMatch.index ?? 0) + 1,
          snippet: snippet(lines, i),
          message: `Authentication endpoint "${authEndpointMatch[2]}" has no visible rate limiting.`,
          suggestion:
            'Add rate limiting middleware to auth endpoints. Use express-rate-limit: app.use("/login", rateLimit({ windowMs: 15*60*1000, max: 5 }))',
        });
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Session tokens in URLs
// ---------------------------------------------------------------------------
const sessionInUrl: Rule = {
  id: 'A07-SESSION-IN-URL',
  name: 'Session Token in URL',
  severity: 'high',
  category: 'A07:2021-Auth-Failures',
  description:
    'Passing session tokens or authentication tokens in URLs exposes them in browser history, server logs, referrer headers, and proxy logs.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      const urlTokenPatterns: { pattern: RegExp; label: string }[] = [
        {
          pattern: /[?&](?:token|session[_-]?id|auth[_-]?token|access[_-]?token|jwt|sid)=/i,
          label: 'Authentication token passed as URL query parameter',
        },
        {
          pattern: /redirect.*[?&](?:token|session|auth|jwt)=/i,
          label: 'Token in redirect URL',
        },
        {
          pattern: /href\s*=\s*['"`][^'"`]*[?&](?:token|session|auth|jwt)=/i,
          label: 'Token in hyperlink URL',
        },
      ];

      for (const { pattern, label } of urlTokenPatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: sessionInUrl.id,
            ruleName: sessionInUrl.name,
            severity: sessionInUrl.severity,
            category: sessionInUrl.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${label}. Tokens in URLs are logged, cached, and leaked via referrer headers.`,
            suggestion:
              'Send tokens in HTTP headers (Authorization: Bearer <token>) or cookies with HttpOnly and Secure flags. Never in URLs.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Missing CSRF protection
// ---------------------------------------------------------------------------
const missingCsrf: Rule = {
  id: 'A07-NO-CSRF',
  name: 'Missing CSRF Protection',
  severity: 'medium',
  category: 'A07:2021-Auth-Failures',
  description:
    'Forms or state-changing endpoints without CSRF protection allow attackers to trick users into performing unintended actions.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Check if file has forms or POST handlers
    const hasForms = /<form\s[^>]*method\s*=\s*['"]?post/i.test(content);
    const hasPostHandlers =
      /\.(post|put|patch|delete)\s*\(\s*['"`]\//i.test(content) &&
      /session|cookie|auth/i.test(content);

    if (!hasForms && !hasPostHandlers) return findings;

    // Check for CSRF middleware/token
    const hasCsrf =
      /csrf|csurf|csrfToken|_csrf|xsrf|anti[_-]?forgery|SameSite/i.test(content);

    if (hasCsrf) return findings;

    // Find the form or POST handler
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      if (/<form\s[^>]*method\s*=\s*['"]?post/i.test(line)) {
        findings.push({
          ruleId: missingCsrf.id,
          ruleName: missingCsrf.name,
          severity: missingCsrf.severity,
          category: missingCsrf.category,
          filePath,
          line: i + 1,
          column: 1,
          snippet: snippet(lines, i),
          message: 'HTML form with POST method has no visible CSRF token.',
          suggestion:
            'Add a CSRF token to forms: <input type="hidden" name="_csrf" value="{{csrfToken}}">. Use the csurf middleware.',
        });
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: JWT without expiration
// ---------------------------------------------------------------------------
const jwtNoExpiry: Rule = {
  id: 'A07-JWT-NO-EXPIRY',
  name: 'JWT Without Expiration',
  severity: 'high',
  category: 'A07:2021-Auth-Failures',
  description:
    'JSON Web Tokens created without an expiration time never expire, meaning a compromised token provides permanent access.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Only check files that sign JWTs
    if (!/jwt\.sign|jsonwebtoken|jose/i.test(content)) return findings;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // jwt.sign(payload, secret) without options or with options but no expiresIn
      if (/jwt\.sign\s*\(/.test(line)) {
        // Look at the sign call and the next few lines for expiresIn/exp
        const signBlock = lines.slice(i, Math.min(i + 8, lines.length)).join('\n');

        const hasExpiry =
          /expiresIn|exp\s*:|expires[_-]?in|maxAge|ttl/i.test(signBlock);

        if (!hasExpiry) {
          findings.push({
            ruleId: jwtNoExpiry.id,
            ruleName: jwtNoExpiry.name,
            severity: jwtNoExpiry.severity,
            category: jwtNoExpiry.category,
            filePath,
            line: i + 1,
            column: line.search(/jwt\.sign/) + 1,
            snippet: snippet(lines, i),
            message: 'JWT signed without an expiration time. Compromised tokens grant indefinite access.',
            suggestion:
              'Always set an expiration: jwt.sign(payload, secret, { expiresIn: "1h" }). Use short-lived access tokens with refresh tokens.',
          });
        }
      }
    }

    return findings;
  },
};

export const a07Rules: Rule[] = [
  weakPasswordReqs,
  missingRateLimit,
  sessionInUrl,
  missingCsrf,
  jwtNoExpiry,
];
