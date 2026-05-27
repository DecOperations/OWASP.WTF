/**
 * Default ignore patterns applied to every scan unless the user opts out
 * with --include-build-output. These cover build artifacts, package
 * caches, and generated bundles that produce false-positive findings
 * (especially secrets in minified JS).
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  '.next',
  '.next/**',
  '.nuxt',
  '.nuxt/**',
  'dist',
  'dist/**',
  'build',
  'build/**',
  '.turbo',
  '.turbo/**',
  'out',
  'out/**',
  '.cache',
  '.cache/**',
  'coverage',
  'coverage/**',
  'node_modules',
  'node_modules/**',
  'storybook-static',
  'storybook-static/**',
  '**/__generated__/**',
];

/**
 * Resolve the final ignore-pattern list given user input and the
 * include-build-output escape hatch.
 *
 * Default behavior is additive: user patterns extend the defaults.
 * Pass `includeBuildOutput=true` to skip the defaults entirely.
 */
export function resolveIgnorePatterns(
  userPatterns: string[],
  includeBuildOutput = false,
): string[] {
  if (includeBuildOutput) return [...userPatterns];
  return [...DEFAULT_IGNORE_PATTERNS, ...userPatterns];
}
