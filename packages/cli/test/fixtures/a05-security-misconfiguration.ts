// Fixture for OWASP A05: Security Misconfiguration.
// Used only by packages/cli/test/native-rules.test.mjs.
// Do not enumerate which mitigations are missing — content-gate regexes
// would mistake the words for actual mitigations.

import express from 'express';

// Debug mode in config
export const appConfig = {
  debug: true,
  NODE_ENV: 'development',
};

// Default admin credentials
export const adminUser = {
  username: 'admin',
  password: 'admin',
};

// Server with no protective middleware and a verbose error handler
export function createApp() {
  const app = express();

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use((err: Error, _req: express.Request, res: express.Response) => {
    res.json({ error: err.message });
  });

  app.listen(3000);
  return app;
}
