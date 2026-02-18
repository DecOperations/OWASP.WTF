#!/usr/bin/env npx tsx
/**
 * @file track-tool-results.ts
 * @description PostToolUse hook that captures tool results, timing, and summaries
 * @layer Hooks
 *
 * Runs after every tool call to record:
 * - Duration (from PreToolUse start time)
 * - Result summary (truncated, not full content)
 * - Success/failure status
 *
 * Writes enriched entries to .claude/logs/tool-results.jsonl
 */

import { appendFileSync, existsSync, readFileSync, unlinkSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

interface PostHookInput {
  session_id?: string
  tool_name?: string
  tool_input?: Record<string, unknown>
  tool_output?: string
  tool_result?: string
  response?: string
}

interface EnrichedToolResult {
  timestamp: string
  tool: string
  durationMs: number
  summary: string
  status: 'success' | 'error'
  meta: Record<string, unknown>
}

function getProjectRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

/**
 * Summarize tool output without storing full content.
 * Extracts key metrics (line counts, file names, exit codes) not raw data.
 */
function summarizeOutput(tool: string, input: Record<string, unknown>, output: string): {
  summary: string
  status: 'success' | 'error'
  meta: Record<string, unknown>
} {
  const meta: Record<string, unknown> = {}

  if (!output || output.length === 0) {
    return { summary: 'empty output', status: 'success', meta }
  }

  const lines = output.split('\n')
  const lineCount = lines.length
  const charCount = output.length

  // Detect errors
  const isError = /error|failed|not found|permission denied|ENOENT|EACCES/i.test(output.slice(0, 500))

  switch (tool) {
    case 'Read': {
      const filePath = input.file_path as string || ''
      const fileName = basename(filePath)
      meta.file = fileName
      meta.lines = lineCount
      meta.chars = charCount
      return {
        summary: `${lineCount} lines from ${fileName} (${Math.round(charCount / 1024)}KB)`,
        status: isError ? 'error' : 'success',
        meta,
      }
    }

    case 'Write': {
      const filePath = input.file_path as string || ''
      const fileName = basename(filePath)
      const contentLines = (input.content as string || '').split('\n').length
      meta.file = fileName
      meta.lines = contentLines
      return {
        summary: `wrote ${contentLines} lines to ${fileName}`,
        status: isError ? 'error' : 'success',
        meta,
      }
    }

    case 'Edit': {
      const filePath = input.file_path as string || ''
      const fileName = basename(filePath)
      meta.file = fileName
      meta.replaceAll = input.replace_all || false
      return {
        summary: `edited ${fileName}`,
        status: isError ? 'error' : 'success',
        meta,
      }
    }

    case 'Bash': {
      const cmd = (input.command as string || '').split('\n')[0].slice(0, 100)
      meta.command = cmd
      meta.outputLines = lineCount
      // First meaningful line of output
      const firstLine = lines.find(l => l.trim().length > 0) || ''
      return {
        summary: `${cmd} → ${lineCount} lines${isError ? ' (ERROR)' : ''}`,
        status: isError ? 'error' : 'success',
        meta: { ...meta, preview: firstLine.slice(0, 120) },
      }
    }

    case 'Grep': {
      // Count matches
      const matchCount = lines.filter(l => l.trim().length > 0).length
      meta.pattern = input.pattern
      meta.matches = matchCount
      return {
        summary: `${matchCount} matches for "${(input.pattern as string || '').slice(0, 40)}"`,
        status: 'success',
        meta,
      }
    }

    case 'Glob': {
      const matchCount = lines.filter(l => l.trim().length > 0).length
      meta.pattern = input.pattern
      meta.matches = matchCount
      return {
        summary: `${matchCount} files matching "${(input.pattern as string || '').slice(0, 40)}"`,
        status: 'success',
        meta,
      }
    }

    case 'Task': {
      meta.agentType = input.subagent_type
      meta.outputChars = charCount
      return {
        summary: `${input.subagent_type || 'agent'} task (${Math.round(charCount / 1024)}KB output)`,
        status: isError ? 'error' : 'success',
        meta,
      }
    }

    case 'WebSearch': {
      meta.query = input.query
      return {
        summary: `search: "${(input.query as string || '').slice(0, 60)}"`,
        status: 'success',
        meta,
      }
    }

    case 'WebFetch': {
      meta.url = input.url
      return {
        summary: `fetch: ${(input.url as string || '').slice(0, 80)}`,
        status: isError ? 'error' : 'success',
        meta,
      }
    }

    default: {
      return {
        summary: `${tool}: ${charCount} chars output`,
        status: isError ? 'error' : 'success',
        meta: { outputChars: charCount },
      }
    }
  }
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('readable', () => {
      let chunk
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk
      }
    })
    process.stdin.on('end', () => {
      resolve(data)
    })
    setTimeout(() => resolve(data), 1000)
  })
}

async function main() {
  const projectRoot = getProjectRoot()
  const logsDir = join(projectRoot, '.claude/logs')
  const resultsFile = join(logsDir, 'tool-results.jsonl')
  const pendingFile = join(logsDir, '.pending-call.json')

  mkdirSync(logsDir, { recursive: true })

  // Parse PostToolUse input
  let input: PostHookInput = {}
  try {
    const stdinData = await readStdin()
    if (stdinData.trim()) {
      input = JSON.parse(stdinData)
    }
  } catch {
    // Invalid JSON
  }

  const tool = input.tool_name || 'unknown'
  const toolInput = input.tool_input || {}
  const toolOutput = input.tool_output || input.tool_result || input.response || ''

  // Calculate duration from pending call
  let durationMs = 0
  if (existsSync(pendingFile)) {
    try {
      const pending = JSON.parse(readFileSync(pendingFile, 'utf-8'))
      durationMs = Date.now() - (pending.startedAt || Date.now())
      unlinkSync(pendingFile)
    } catch {
      // Missing or corrupted pending file
    }
  }

  // Summarize the result
  const { summary, status, meta } = summarizeOutput(tool, toolInput, toolOutput)

  // Write enriched result
  const entry: EnrichedToolResult = {
    timestamp: new Date().toISOString(),
    tool,
    durationMs,
    summary,
    status,
    meta,
  }

  appendFileSync(resultsFile, JSON.stringify(entry) + '\n')

  process.exit(0)
}

main()
