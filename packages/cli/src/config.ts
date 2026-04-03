/**
 * @file config.ts
 * @description User configuration management — stores AI provider settings in ~/.owasp-wtf/config.json
 * @layer Services
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

export type AiProvider = 'claude-code' | 'codex' | 'openai' | 'anthropic' | 'ollama' | 'none';

export interface AiProviderConfig {
  provider: AiProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  cliPath?: string;
}

export interface UserConfig {
  ai: AiProviderConfig;
  version: number;
}

const CONFIG_DIR = join(homedir(), '.owasp-wtf');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');
const CONFIG_VERSION = 1;

const DEFAULT_MODELS: Record<AiProvider, string> = {
  'claude-code': 'sonnet',
  codex: 'o4-mini',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  ollama: 'llama3.2',
  none: '',
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): UserConfig | null {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as UserConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: UserConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function prompt(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function whichSync(cmd: string): string | null {
  try {
    const result = execFileSync('which', [cmd], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Auto-detect which AI tools are available on the system by checking for
 * environment variables, CLI tools, and local services.
 */
function detectAvailableProviders(): { provider: AiProvider; hint: string }[] {
  const available: { provider: AiProvider; hint: string }[] = [];

  // Claude Code CLI
  const claudePath = whichSync('claude');
  if (claudePath) {
    available.push({ provider: 'claude-code', hint: `Claude Code CLI at ${claudePath}` });
  }

  // OpenAI Codex CLI
  const codexPath = whichSync('codex');
  if (codexPath) {
    available.push({ provider: 'codex', hint: `Codex CLI at ${codexPath}` });
  }

  // API-based providers
  if (process.env.OPENAI_API_KEY) {
    available.push({ provider: 'openai', hint: 'OPENAI_API_KEY found in environment' });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    available.push({ provider: 'anthropic', hint: 'ANTHROPIC_API_KEY found in environment' });
  }
  if (process.env.OLLAMA_HOST || existsSync('/usr/local/bin/ollama') || existsSync(join(homedir(), '.ollama'))) {
    available.push({ provider: 'ollama', hint: 'Ollama detected locally' });
  }

  return available;
}

/**
 * Interactive first-run setup — asks the user to pick an AI provider and configure it.
 */
export async function runSetup(): Promise<UserConfig> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   OWASP.WTF — First-Run Configuration   ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  // Auto-detect
  const detected = detectAvailableProviders();
  if (detected.length > 0) {
    console.log('  Detected AI providers:');
    for (const d of detected) {
      console.log(`    ✓ ${d.provider} — ${d.hint}`);
    }
    console.log('');
  }

  console.log('  Select an AI provider for enhanced analysis:');
  console.log('');
  console.log('    1) Claude Code  (Local CLI — uses your existing auth, no extra key needed)');
  console.log('    2) Codex        (OpenAI Codex CLI — uses your existing auth)');
  console.log('    3) OpenAI API   (GPT-4o, GPT-4.1 — requires API key)');
  console.log('    4) Anthropic API (Claude — requires API key)');
  console.log('    5) Ollama       (Local models — no API key needed)');
  console.log('    6) None         (Static analysis only, no AI)');
  console.log('');

  let choice = '';
  while (!['1', '2', '3', '4', '5', '6'].includes(choice)) {
    // Default to first detected provider if user just hits enter
    const defaultChoice = detected.length > 0 ? '1' : '';
    choice = await prompt(rl, `  Choose [1-6]: `);
    if (!choice && defaultChoice) choice = defaultChoice;
  }

  const providerMap: Record<string, AiProvider> = {
    '1': 'claude-code',
    '2': 'codex',
    '3': 'openai',
    '4': 'anthropic',
    '5': 'ollama',
    '6': 'none',
  };
  const provider = providerMap[choice];
  let apiKey: string | undefined;
  let model: string | undefined;
  let baseUrl: string | undefined;
  let cliPath: string | undefined;

  if (provider === 'claude-code') {
    const detectedPath = whichSync('claude');
    if (detectedPath) {
      const useDetected = await prompt(rl, `  Use Claude Code at ${detectedPath}? [Y/n]: `);
      if (!useDetected || useDetected.toLowerCase() === 'y') {
        cliPath = detectedPath;
      }
    }
    if (!cliPath) {
      cliPath = await prompt(rl, '  Path to claude binary: ');
    }
    const defaultModel = DEFAULT_MODELS['claude-code'];
    const customModel = await prompt(rl, `  Model [${defaultModel}]: `);
    model = customModel || defaultModel;
  }

  if (provider === 'codex') {
    const detectedPath = whichSync('codex');
    if (detectedPath) {
      const useDetected = await prompt(rl, `  Use Codex at ${detectedPath}? [Y/n]: `);
      if (!useDetected || useDetected.toLowerCase() === 'y') {
        cliPath = detectedPath;
      }
    }
    if (!cliPath) {
      cliPath = await prompt(rl, '  Path to codex binary: ');
    }
    const defaultModel = DEFAULT_MODELS['codex'];
    const customModel = await prompt(rl, `  Model [${defaultModel}]: `);
    model = customModel || defaultModel;
  }

  if (provider === 'openai' || provider === 'anthropic') {
    const envKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
    if (envKey) {
      const useEnv = await prompt(rl, `  Use ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} from environment? [Y/n]: `);
      if (!useEnv || useEnv.toLowerCase() === 'y') {
        apiKey = 'env';
      }
    }
    if (apiKey !== 'env') {
      apiKey = await prompt(rl, `  Enter your ${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key: `);
    }
    const defaultModel = DEFAULT_MODELS[provider];
    const customModel = await prompt(rl, `  Model [${defaultModel}]: `);
    model = customModel || defaultModel;
  }

  if (provider === 'ollama') {
    const customUrl = await prompt(rl, '  Ollama URL [http://localhost:11434]: ');
    baseUrl = customUrl || 'http://localhost:11434';
    const defaultModel = DEFAULT_MODELS['ollama'];
    const customModel = await prompt(rl, `  Model [${defaultModel}]: `);
    model = customModel || defaultModel;
  }

  rl.close();

  const config: UserConfig = {
    version: CONFIG_VERSION,
    ai: {
      provider,
      ...(apiKey && { apiKey }),
      ...(model && { model }),
      ...(baseUrl && { baseUrl }),
      ...(cliPath && { cliPath }),
    },
  };

  saveConfig(config);
  console.log('');
  console.log(`  ✓ Configuration saved to ${CONFIG_PATH}`);
  console.log('');

  return config;
}

/**
 * Get the resolved AI config — loads from file, resolves "env" API keys to actual values.
 */
export function getResolvedAiConfig(config: UserConfig): AiProviderConfig {
  const ai = { ...config.ai };

  if (ai.apiKey === 'env') {
    if (ai.provider === 'openai') ai.apiKey = process.env.OPENAI_API_KEY;
    if (ai.provider === 'anthropic') ai.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  return ai;
}
