// Deliberately clean fixture — must produce ZERO native findings.
// Used only by packages/cli/test/native-rules.test.mjs

export function add(a: number, b: number): number {
  return a + b;
}

export const greeting = 'Hello, world';

export interface User {
  id: number;
  name: string;
}

export function format(u: User): string {
  return `${u.name} (#${u.id})`;
}
