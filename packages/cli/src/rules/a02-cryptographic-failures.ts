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
// Rule: Hardcoded secrets
// ---------------------------------------------------------------------------
const hardcodedSecrets: Rule = {
  id: 'A02-HARDCODED-SECRET',
  name: 'Hardcoded Secret',
  severity: 'critical',
  category: 'A02:2021-Cryptographic-Failures',
  description:
    'Secrets, API keys, passwords, or tokens hardcoded in source code can be extracted by anyone with access to the codebase.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    // Skip test files and example/fixture files for reduced false positives
    if (/\.(test|spec|fixture|example|mock|stub)\./i.test(filePath)) return findings;

    const secretPatterns: { pattern: RegExp; label: string }[] = [
      {
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{4,}['"`]/i,
        label: 'password',
      },
      {
        pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
        label: 'API key',
      },
      {
        pattern: /(?:secret|secret[_-]?key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
        label: 'secret',
      },
      {
        pattern: /(?:access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
        label: 'access token',
      },
      {
        pattern: /(?:private[_-]?key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
        label: 'private key',
      },
      {
        pattern: /(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)\s*[:=]\s*['"`][A-Za-z0-9/+=]{16,}['"`]/,
        label: 'AWS credential',
      },
      {
        pattern: /(?:GITHUB_TOKEN|GH_TOKEN|GITLAB_TOKEN)\s*[:=]\s*['"`][^'"`]{8,}['"`]/,
        label: 'platform token',
      },
      {
        pattern: /(?:DATABASE_URL|DB_PASSWORD|MONGO_URI)\s*[:=]\s*['"`][^'"`]{8,}['"`]/i,
        label: 'database credential',
      },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Skip lines that reference environment variables
      if (/process\.env|os\.environ|ENV\[|getenv|env\(/i.test(line)) continue;
      // Skip lines that are just type definitions or interfaces
      if (/:\s*string|interface\s|type\s/i.test(line) && !/[:=]\s*['"`]/.test(line)) continue;

      for (const { pattern, label } of secretPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Additional check: skip placeholder values
          const value = match[0];
          if (/['"`](xxx|placeholder|changeme|your[_-]|example|TODO|REPLACE|<)/i.test(value)) continue;

          findings.push({
            ruleId: hardcodedSecrets.id,
            ruleName: hardcodedSecrets.name,
            severity: hardcodedSecrets.severity,
            category: hardcodedSecrets.category,
            filePath,
            line: i + 1,
            column: (match.index ?? 0) + 1,
            snippet: snippet(lines, i),
            message: `Hardcoded ${label} detected. Secrets in source code can be exposed through version control.`,
            suggestion:
              'Move secrets to environment variables or a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault). Use process.env.SECRET_NAME instead.',
          });
          break; // one finding per line
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Weak hashing algorithms
// ---------------------------------------------------------------------------
const weakHashing: Rule = {
  id: 'A02-WEAK-HASH',
  name: 'Weak Hashing Algorithm',
  severity: 'high',
  category: 'A02:2021-Cryptographic-Failures',
  description:
    'MD5 and SHA1 are cryptographically broken and should not be used for passwords, signatures, or integrity checks in security-sensitive contexts.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const weakHashPatterns: { pattern: RegExp; algo: string }[] = [
      { pattern: /createHash\s*\(\s*['"`]md5['"`]\s*\)/, algo: 'MD5' },
      { pattern: /createHash\s*\(\s*['"`]sha1['"`]\s*\)/, algo: 'SHA1' },
      { pattern: /hashlib\.md5\s*\(/, algo: 'MD5' },
      { pattern: /hashlib\.sha1\s*\(/, algo: 'SHA1' },
      { pattern: /MessageDigest\.getInstance\s*\(\s*['"`]MD5['"`]\s*\)/, algo: 'MD5' },
      { pattern: /MessageDigest\.getInstance\s*\(\s*['"`]SHA-?1['"`]\s*\)/, algo: 'SHA1' },
      { pattern: /Digest::MD5/, algo: 'MD5' },
      { pattern: /Digest::SHA1/, algo: 'SHA1' },
      { pattern: /md5\s*\(/, algo: 'MD5' },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const { pattern, algo } of weakHashPatterns) {
        if (pattern.test(line)) {
          // Check if it's used in a password context
          const context = lines
            .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
            .join('\n');
          const isPasswordContext = /password|passwd|pwd|credential|auth|sign|verify|token/i.test(context);
          const severity = isPasswordContext ? 'critical' : 'high';

          findings.push({
            ruleId: weakHashing.id,
            ruleName: weakHashing.name,
            severity: severity as 'critical' | 'high',
            category: weakHashing.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: `${algo} is a weak hashing algorithm${isPasswordContext ? ' and is being used in a password/auth context' : ''}. It is vulnerable to collision attacks.`,
            suggestion:
              algo === 'MD5' || algo === 'SHA1'
                ? 'For passwords, use bcrypt, scrypt, or Argon2. For integrity checks, use SHA-256 or SHA-3.'
                : 'Use a modern, secure hashing algorithm.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: HTTP in URLs (cleartext transport)
// ---------------------------------------------------------------------------
const httpUrl: Rule = {
  id: 'A02-HTTP-URL',
  name: 'HTTP Instead of HTTPS',
  severity: 'medium',
  category: 'A02:2021-Cryptographic-Failures',
  description:
    'Using HTTP instead of HTTPS transmits data in cleartext, making it susceptible to eavesdropping and man-in-the-middle attacks.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      // Match http:// URLs that aren't localhost or internal
      const match = line.match(/['"`](http:\/\/[^'"`\s]+)['"`]/);
      if (match) {
        const url = match[1];
        // Skip localhost, 127.0.0.1, internal dev URLs, and XML namespaces
        if (
          /localhost|127\.0\.0\.1|0\.0\.0\.0|\.local[:/]|\.dev[:/]|\.test[:/]/i.test(url) ||
          /schemas\.xmlsoap|www\.w3\.org|xmlns|schema\.org/i.test(url) ||
          /example\.com|placeholder/i.test(url)
        ) {
          continue;
        }

        findings.push({
          ruleId: httpUrl.id,
          ruleName: httpUrl.name,
          severity: httpUrl.severity,
          category: httpUrl.category,
          filePath,
          line: i + 1,
          column: (match.index ?? 0) + 1,
          snippet: snippet(lines, i),
          message: `URL uses HTTP instead of HTTPS: ${url.slice(0, 60)}${url.length > 60 ? '...' : ''}`,
          suggestion: 'Replace http:// with https:// to encrypt data in transit.',
        });
      }
    }

    return findings;
  },
};

// ---------------------------------------------------------------------------
// Rule: Disabled SSL verification
// ---------------------------------------------------------------------------
const disabledSsl: Rule = {
  id: 'A02-SSL-DISABLED',
  name: 'SSL Verification Disabled',
  severity: 'high',
  category: 'A02:2021-Cryptographic-Failures',
  description:
    'Disabling SSL/TLS certificate verification makes connections vulnerable to man-in-the-middle attacks.',
  detect(content: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    const sslDisablePatterns = [
      /rejectUnauthorized\s*:\s*false/,
      /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"`]?0['"`]?/,
      /verify\s*[:=]\s*false/,
      /VERIFY_SSL\s*[:=]\s*(?:false|0|['"`]0['"`])/i,
      /ssl[_-]?verify\s*[:=]\s*(?:false|0)/i,
      /InsecureSkipVerify\s*:\s*true/,
      /verify_ssl\s*=\s*False/,
      /CURLOPT_SSL_VERIFYPEER\s*,\s*(?:false|0)/,
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isComment(line)) continue;

      for (const pattern of sslDisablePatterns) {
        if (pattern.test(line)) {
          findings.push({
            ruleId: disabledSsl.id,
            ruleName: disabledSsl.name,
            severity: disabledSsl.severity,
            category: disabledSsl.category,
            filePath,
            line: i + 1,
            column: line.search(pattern) + 1,
            snippet: snippet(lines, i),
            message: 'SSL/TLS certificate verification is disabled, allowing MITM attacks.',
            suggestion:
              'Enable SSL verification. If using self-signed certs in development, use environment-specific config rather than disabling verification globally.',
          });
          break;
        }
      }
    }

    return findings;
  },
};

export const a02Rules: Rule[] = [
  hardcodedSecrets,
  weakHashing,
  httpUrl,
  disabledSsl,
];
