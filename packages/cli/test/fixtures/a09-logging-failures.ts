// Fixture for OWASP A09: Security Logging and Monitoring Failures
// Triggers: A09-SENSITIVE-LOG (high), A09-CONSOLE-SENSITIVE (medium),
//           A09-EMPTY-CATCH (medium)
// Used only by packages/cli/test/native-rules.test.mjs

// 1. Logging password directly — A09-SENSITIVE-LOG
export function trace(username: string, password: string) {
  console.info(`Login from ${username} with password ${password}`);
}

// 2. Logging full request object including headers — A09-CONSOLE-SENSITIVE
export function debugRequest(req: { body: unknown; headers: unknown }) {
  console.log('incoming request body:', req.body);
  console.log('headers:', req.headers);
}

// 3. Empty catch block — A09-EMPTY-CATCH
export function brittle(): void {
  try {
    JSON.parse('not-json');
  } catch (_err) {
  }
}
