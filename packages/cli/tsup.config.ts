import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

function safeExec(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return fallback;
  }
}

const version = process.env.RELEASE_VERSION || pkg.version;
const commit = process.env.RELEASE_COMMIT || safeExec('git rev-parse --short HEAD', 'unknown');
const buildDate = process.env.RELEASE_BUILD_DATE || new Date().toISOString();

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  define: {
    __RELEASE_VERSION__: JSON.stringify(version),
    __RELEASE_COMMIT__: JSON.stringify(commit),
    __RELEASE_BUILD_DATE__: JSON.stringify(buildDate),
  },
});
