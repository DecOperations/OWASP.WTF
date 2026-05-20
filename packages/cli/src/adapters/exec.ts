import { spawn } from 'node:child_process';

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a command and capture stdout/stderr. Never throws — non-zero exit
 * codes are returned so callers can decide whether they're meaningful
 * (e.g. trivy exits non-zero when findings exist).
 */
export function exec(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));

    let timedOut = false;
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGKILL');
        }, opts.timeoutMs)
      : null;

    child.on('error', () => {
      if (timer) clearTimeout(timer);
      resolve({ code: -1, stdout, stderr: stderr || 'command not found' });
    });

    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({
        code: timedOut ? -2 : code ?? -1,
        stdout,
        stderr: timedOut ? `${stderr}\n[timed out]` : stderr,
      });
    });
  });
}

export async function which(bin: string): Promise<boolean> {
  const r = await exec(process.platform === 'win32' ? 'where' : 'which', [bin], { timeoutMs: 5000 });
  return r.code === 0 && r.stdout.trim().length > 0;
}
