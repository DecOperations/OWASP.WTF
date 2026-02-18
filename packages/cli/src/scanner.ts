import { readFileSync, statSync, readdirSync, existsSync, Dirent, openSync, readSync, closeSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rb', '.php',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'target',
  'vendor', '__pycache__', '.venv', 'venv', '.tox', 'coverage',
  '.nyc_output', '.turbo', '.cache', '.parcel-cache', 'bower_components',
]);

const MAX_FILE_SIZE = 1_000_000; // 1MB — skip huge files

export interface ScannedFile {
  path: string;
  relativePath: string;
  content: string;
  size: number;
}

/**
 * Parse a .gitignore file into a set of simple patterns.
 * Handles basic patterns: directory names, globs with *, and negation (!)
 */
function parseGitignore(rootDir: string): ((rel: string) => boolean) {
  const gitignorePath = join(rootDir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    return () => false;
  }

  let raw: string;
  try {
    raw = readFileSync(gitignorePath, 'utf-8');
  } catch {
    return () => false;
  }

  const patterns: { pattern: RegExp; negate: boolean }[] = [];

  for (let line of raw.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const negate = line.startsWith('!');
    if (negate) line = line.slice(1);

    // Remove trailing slash (directory indicator) — we check both files and dirs
    if (line.endsWith('/')) line = line.slice(0, -1);

    // Convert glob to regex
    const regexStr = line
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars (except * and ?)
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');

    // If pattern doesn't contain a slash, it matches any path component
    if (!line.includes('/')) {
      patterns.push({ pattern: new RegExp(`(^|/)${regexStr}(/|$)`), negate });
    } else {
      patterns.push({ pattern: new RegExp(`^${regexStr}(/|$)`), negate });
    }
  }

  return (rel: string) => {
    let ignored = false;
    for (const { pattern, negate } of patterns) {
      if (pattern.test(rel)) {
        ignored = !negate;
      }
    }
    return ignored;
  };
}

/**
 * Check if a file is likely binary by reading the first 512 bytes.
 */
function isBinary(filePath: string): boolean {
  try {
    const buf = Buffer.alloc(512);
    const fd = openSync(filePath, 'r');
    const bytesRead = readSync(fd, buf, 0, 512, 0);
    closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      // Null byte is a strong binary indicator
      if (buf[i] === 0) return true;
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Recursively scan a directory for source files.
 */
export function scanDirectory(
  rootDir: string,
  ignorePatterns: string[] = [],
): ScannedFile[] {
  const files: ScannedFile[] = [];
  const isGitignored = parseGitignore(rootDir);

  // Build additional ignore regexes from user-provided patterns
  const userIgnores = ignorePatterns
    .filter(Boolean)
    .map((p) => {
      const regexStr = p
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/\{\{GLOBSTAR\}\}/g, '.*');
      return new RegExp(regexStr);
    });

  function walk(dir: string): void {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    } catch {
      return; // permission denied, etc.
    }

    for (const entry of entries) {
      const name = String(entry.name);
      const fullPath = join(dir, name);
      const rel = relative(rootDir, fullPath);

      // Skip well-known directories
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(name)) continue;
        if (isGitignored(rel)) continue;
        if (userIgnores.some((re) => re.test(rel))) continue;
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      // Check extension
      const ext = extname(name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

      // Check gitignore & user ignores
      if (isGitignored(rel)) continue;
      if (userIgnores.some((re) => re.test(rel))) continue;

      // Check size
      try {
        const stat = statSync(fullPath);
        if (stat.size > MAX_FILE_SIZE) continue;
        if (stat.size === 0) continue;
      } catch {
        continue;
      }

      // Check binary
      if (isBinary(fullPath)) continue;

      // Read file
      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({
          path: fullPath,
          relativePath: rel,
          content,
          size: content.length,
        });
      } catch {
        // skip unreadable files
      }
    }
  }

  walk(rootDir);
  return files;
}
