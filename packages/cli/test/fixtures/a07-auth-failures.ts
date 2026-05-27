// Fixture for OWASP A07: Identification and Authentication Failures.
// Used only by packages/cli/test/native-rules.test.mjs.
// Do not enumerate which mitigations are missing — content-gate regexes
// would mistake the words for actual mitigations.

import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();

// Weak password requirements
export function validatePassword(password: string): boolean {
  return password.length >= 4;
}

// Login route with no protective middleware
app.post('/login', (req, res) => {
  res.json({ ok: true });
});

// Session token in URL
export function buildResetLink(userId: string, token: string): string {
  return `https://app.example.com/reset?userId=${userId}&token=${token}`;
}

// JWT signed without expiry
export function issue(userId: string): string {
  return jwt.sign({ sub: userId }, 'demo-secret-please-rotate');
}
