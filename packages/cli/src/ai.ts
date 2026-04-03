/**
 * @file ai.ts
 * @description AI-powered security analysis — sends findings + code context to the configured LLM provider.
 *              Supports CLI wrappers (Claude Code, Codex) and direct API calls (OpenAI, Anthropic, Ollama).
 * @layer Services
 */

import { execFile } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Finding, ScanResult } from './types.js';
import type { AiProviderConfig } from './config.js';
import type { ScannedFile } from './scanner.js';

export interface AiInsight {
  findingId: string;
  assessment: string;
  falsePositive: boolean;
  exploitability: string;
  remediation: string;
}

export interface AiAnalysisResult {
  insights: AiInsight[];
  overallSummary: string;
  riskAssessment: string;
}

const JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    insights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          findingId: { type: 'string' },
          assessment: { type: 'string' },
          falsePositive: { type: 'boolean' },
          exploitability: { type: 'string' },
          remediation: { type: 'string' },
        },
        required: ['findingId', 'assessment', 'falsePositive', 'exploitability', 'remediation'],
      },
    },
    overallSummary: { type: 'string' },
    riskAssessment: { type: 'string' },
  },
  required: ['insights', 'overallSummary', 'riskAssessment'],
});

const SYSTEM_PROMPT = `You are an expert application security engineer. You are reviewing static analysis findings from OWASP.WTF, a security scanner.

For each finding, assess:
1. Is this a true positive or likely false positive?
2. How exploitable is this in a real-world scenario?
3. What is the specific remediation?

Be concise and actionable. Respond ONLY with valid JSON matching this schema:
${JSON_SCHEMA}`;

function buildUserPrompt(findings: Finding[], files: ScannedFile[]): string {
  const fileMap = new Map(files.map(f => [f.relativePath, f.content]));

  const findingContexts = findings.slice(0, 20).map((f) => {
    const content = fileMap.get(f.filePath);
    let contextSnippet = f.snippet;
    if (content) {
      const lines = content.split('\n');
      const start = Math.max(0, f.line - 5);
      const end = Math.min(lines.length, f.line + 5);
      contextSnippet = lines.slice(start, end).join('\n');
    }

    return `### ${f.ruleId}: ${f.ruleName} (${f.severity})
File: ${f.filePath}:${f.line}
Message: ${f.message}
\`\`\`
${contextSnippet}
\`\`\``;
  });

  return `Analyze these ${findings.length} security findings (showing top 20):

${findingContexts.join('\n\n')}

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI-based providers (Claude Code, Codex)
// ─────────────────────────────────────────────────────────────────────────────

function execPromise(cmd: string, args: string[], options?: { timeout?: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: options?.timeout ?? 120_000,
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${cmd} failed: ${error.message}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Invoke Claude Code in print mode with --dangerously-skip-permissions.
 * Uses --output-format json for structured output, --json-schema for validation,
 * and --bare to skip hooks/LSP/plugins for a clean non-interactive run.
 */
async function callClaudeCode(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const bin = config.cliPath || 'claude';
  const model = config.model || 'sonnet';

  const args = [
    '--print',                          // Non-interactive, print result and exit
    '--dangerously-skip-permissions',   // No permission prompts
    '--bare',                           // Skip hooks, LSP, plugins, CLAUDE.md
    '--output-format', 'json',          // Structured JSON output
    '--model', model,
    '--system-prompt', systemPrompt,
    '--json-schema', JSON_SCHEMA,
    '--no-session-persistence',         // Don't save throwaway analysis sessions
    userPrompt,
  ];

  const raw = await execPromise(bin, args, { timeout: 180_000 });

  // Claude Code --output-format json wraps the result in a JSON envelope
  // Extract the assistant's text content from it
  try {
    const envelope = JSON.parse(raw);
    // The json output format returns { result: string } with the text content
    if (envelope.result) return envelope.result;
    // Or it may be the direct content
    if (typeof envelope === 'string') return envelope;
    return raw;
  } catch {
    // If the envelope isn't valid JSON, the raw output is the text
    return raw;
  }
}

/**
 * Invoke OpenAI Codex CLI in exec (non-interactive) mode.
 * Uses --dangerously-bypass-approvals-and-sandbox for unattended operation.
 */
async function callCodex(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const bin = config.cliPath || 'codex';
  const model = config.model || 'o4-mini';

  // Codex exec mode: non-interactive, returns output to stdout
  // Write the prompt to a temp file to avoid shell escaping issues
  const tmpDir = mkdtempSync(join(tmpdir(), 'owasp-wtf-'));
  const promptFile = join(tmpDir, 'prompt.txt');
  writeFileSync(promptFile, `${systemPrompt}\n\n---\n\n${userPrompt}`, 'utf-8');

  try {
    const args = [
      'exec',
      '--model', model,
      '--dangerously-bypass-approvals-and-sandbox',
      '-q',                             // Quiet — suppress status output
      `Review the security findings and respond with JSON. Read the prompt from: ${promptFile}`,
    ];

    const raw = await execPromise(bin, args, { timeout: 180_000 });
    return raw;
  } finally {
    try { unlinkSync(promptFile); } catch { /* ignore cleanup errors */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API-based providers (OpenAI, Anthropic, Ollama)
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAi(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

async function callAnthropic(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { content: { type: string; text: string }[] };
  const textBlock = data.content.find((c) => c.type === 'text');
  return textBlock?.text || '';
}

async function callOllama(
  config: AiProviderConfig,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const baseUrl = config.baseUrl || 'http://localhost:11434';
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || 'llama3.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { message: { content: string } };
  return data.message.content;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run AI-powered analysis on scan findings using the configured provider.
 */
export async function analyzeWithAi(
  result: ScanResult,
  files: ScannedFile[],
  config: AiProviderConfig,
): Promise<AiAnalysisResult> {
  if (config.provider === 'none') {
    throw new Error('No AI provider configured. Run `owasp-wtf --setup` to configure.');
  }

  if (result.findings.length === 0) {
    return {
      insights: [],
      overallSummary: 'No findings to analyze — the codebase appears clean.',
      riskAssessment: 'low',
    };
  }

  const userPrompt = buildUserPrompt(result.findings, files);

  let rawResponse: string;
  switch (config.provider) {
    case 'claude-code':
      rawResponse = await callClaudeCode(config, SYSTEM_PROMPT, userPrompt);
      break;
    case 'codex':
      rawResponse = await callCodex(config, SYSTEM_PROMPT, userPrompt);
      break;
    case 'openai':
      rawResponse = await callOpenAi(config, SYSTEM_PROMPT, userPrompt);
      break;
    case 'anthropic':
      rawResponse = await callAnthropic(config, SYSTEM_PROMPT, userPrompt);
      break;
    case 'ollama':
      rawResponse = await callOllama(config, SYSTEM_PROMPT, userPrompt);
      break;
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }

  // Parse the JSON response, extracting from markdown code blocks if wrapped
  let jsonStr = rawResponse.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  try {
    return JSON.parse(jsonStr) as AiAnalysisResult;
  } catch {
    return {
      insights: [],
      overallSummary: rawResponse.slice(0, 500),
      riskAssessment: 'unknown',
    };
  }
}
