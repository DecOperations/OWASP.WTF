import type { ScannerAdapter } from './types.js';
import { nativeAdapter } from './native.js';
import { semgrepAdapter } from './semgrep.js';
import { gitleaksAdapter } from './gitleaks.js';
import { trivyAdapter } from './trivy.js';
import { syftAdapter } from './syft.js';
import { grypeAdapter } from './grype.js';
import { hadolintAdapter } from './hadolint.js';

export const allAdapters: ScannerAdapter[] = [
  nativeAdapter,
  semgrepAdapter,
  gitleaksAdapter,
  trivyAdapter,
  syftAdapter,
  grypeAdapter,
  hadolintAdapter,
];

export type ScanMode = 'quick' | 'scan' | 'deep';

export function adaptersForMode(mode: ScanMode): ScannerAdapter[] {
  switch (mode) {
    case 'quick':
      // Pre-commit fast: native + secrets only.
      return [nativeAdapter, gitleaksAdapter];
    case 'scan':
      // Smart default: native + SAST + secrets + SCA/IaC.
      return [nativeAdapter, semgrepAdapter, gitleaksAdapter, trivyAdapter];
    case 'deep':
      // Full coverage: everything except DAST/semantic agentic passes.
      return [
        nativeAdapter,
        semgrepAdapter,
        gitleaksAdapter,
        trivyAdapter,
        syftAdapter,
        grypeAdapter,
        hadolintAdapter,
      ];
  }
}

export { nativeAdapter, semgrepAdapter, gitleaksAdapter, trivyAdapter, syftAdapter, grypeAdapter, hadolintAdapter };
export type { ScannerAdapter, ProjectContext } from './types.js';
