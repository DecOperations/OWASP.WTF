// Fixture for OWASP A01: Broken Access Control.
// Used only by packages/cli/test/native-rules.test.mjs.
// Do not name mitigations in comments — content-gate regexes would
// mistake the words for actual mitigations and suppress findings.

import cors from 'cors';
import express from 'express';

const app = express();
const router = express.Router();

// CORS wildcard
app.use(cors({ origin: '*' }));

// Admin route with the handler attached directly to the path — no middleware in between.
app.get('/admin/users', function unprotected() {
  return null;
});

// Direct DB lookup by user-supplied id, no access check.
router.get('/document/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc);
});

declare const Document: { findById(id: string): Promise<unknown> };
export { app, router };
