// Fixture for OWASP A02: Cryptographic Failures
// Triggers: A02-WEAK-HASH (critical in pwd context), A02-HTTP-URL (medium), A02-SSL-DISABLED (high)
// Used only by packages/cli/test/native-rules.test.mjs

import { createHash } from 'node:crypto';

// 1. MD5 in a password context — A02-WEAK-HASH at severity=critical
export function hashPassword(password: string): string {
  return createHash('md5').update(password).digest('hex');
}

// 2. Cleartext HTTP URL to an external service — A02-HTTP-URL
export const UPSTREAM_API = 'http://api.partner.example.org/v1';

// 3. Disabled TLS verification — A02-SSL-DISABLED
export const httpsOpts = {
  rejectUnauthorized: false,
  timeout: 5000,
};
