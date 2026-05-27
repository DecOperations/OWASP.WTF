// Fixture for OWASP A03: Injection
// Triggers: A03-EVAL (high), A03-COMMAND-INJECTION (critical), A03-SQL-INJECTION (critical),
//           A03-XSS (high), A03-PATH-TRAVERSAL (high)
// Used only by packages/cli/test/native-rules.test.mjs

import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';

declare const db: { query(sql: string): Promise<unknown> };
declare const document: { getElementById(id: string): { innerHTML: string } };

// 1. eval() of user input — A03-EVAL
export function runUserCode(input: string): unknown {
  return eval(input);
}

// 2. exec() with template-literal interpolation — A03-COMMAND-INJECTION
export function tail(userFile: string): void {
  exec(`tail -n 50 ${userFile}`);
}

// 3. SQL via template literal — A03-SQL-INJECTION
export async function findUser(req: { params: { id: string } }) {
  return db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
}

// 4. innerHTML sink — A03-XSS
export function render(msg: string) {
  document.getElementById('out').innerHTML = msg;
}

// 5. Path traversal — A03-PATH-TRAVERSAL
export async function dump(req: { params: { name: string } }) {
  return readFile(`/var/data/${req.params.name}`, 'utf-8');
}
