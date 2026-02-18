#!/usr/bin/env npx tsx
/**
 * @file track-tool-calls.ts
 * @description Tracks tool calls for meta-cognition enforcement
 *
 * Runs on every tool call to detect:
 * - Search loops (same pattern 3+)
 * - Error loops (same error 3+)
 * - Context thrashing (many files, no completion)
 *
 * Claude Code passes input via STDIN as JSON.
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface HookInput {
  tool_name?: string
  tool_input?: Record<string, unknown>
  cwd?: string
}

interface ToolCall {
  timestamp: string
  tool: string
  input: Record<string, unknown>
}

interface MetaState {
  sessionStart: string
  toolCalls: number
  searchPatterns: Record<string, number>
  errorPatterns: Record<string, number>
  filesAccessed: string[]
  lastCheckpoint: number
  warnings: string[]
}

function getProjectRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
}

function loadState(stateFile: string): MetaState {
  if (existsSync(stateFile)) {
    try {
      return JSON.parse(readFileSync(stateFile, 'utf-8'))
    } catch {
      // Corrupted, start fresh
    }
  }
  return {
    sessionStart: new Date().toISOString(),
    toolCalls: 0,
    searchPatterns: {},
    errorPatterns: {},
    filesAccessed: [],
    lastCheckpoint: 0,
    warnings: [],
  }
}

function saveState(stateFile: string, state: MetaState): void {
  writeFileSync(stateFile, JSON.stringify(state, null, 2))
}

function checkForLoops(state: MetaState): string[] {
  const warnings: string[] = []

  // Check search loops (3+ same pattern)
  for (const [pattern, count] of Object.entries(state.searchPatterns)) {
    if (count >= 3) {
      warnings.push(`SEARCH_LOOP: "${pattern}" searched ${count} times. STOP and use systematic exploration.`)
    }
  }

  // Check error loops
  for (const [error, count] of Object.entries(state.errorPatterns)) {
    if (count >= 3) {
      warnings.push(`ERROR_LOOP: "${error}" occurred ${count} times. STOP and diagnose root cause.`)
    }
  }

  // Check context thrashing (10+ files without completing work)
  if (state.filesAccessed.length > 10 && state.toolCalls - state.lastCheckpoint > 20) {
    warnings.push(`CONTEXT_THRASH: ${state.filesAccessed.length} files accessed. Focus on completing one task.`)
  }

  return warnings
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
    // Timeout after 1 second if no input
    setTimeout(() => resolve(data), 1000)
  })
}

async function main() {
  const projectRoot = getProjectRoot()
  const logsDir = join(projectRoot, '.claude/logs')
  const trackingFile = join(logsDir, 'tool-tracking.jsonl')
  const stateFile = join(logsDir, 'meta-state.json')

  // Ensure logs directory exists
  mkdirSync(logsDir, { recursive: true })

  // Parse input from Claude Code hook (via stdin)
  let input: HookInput = {}
  try {
    const stdinData = await readStdin()
    if (stdinData.trim()) {
      input = JSON.parse(stdinData)
    }
  } catch {
    // Invalid JSON, continue with empty input
  }

  const tool = input.tool_name || 'unknown'
  const toolInput = input.tool_input || {}

  const state = loadState(stateFile)
  state.toolCalls++

  // Track the call
  const call: ToolCall = {
    timestamp: new Date().toISOString(),
    tool,
    input: toolInput,
  }
  appendFileSync(trackingFile, JSON.stringify(call) + '\n')

  // Save pending call start time for PostToolUse duration calculation
  const pendingFile = join(logsDir, '.pending-call.json')
  writeFileSync(pendingFile, JSON.stringify({
    tool,
    startedAt: Date.now(),
    timestamp: call.timestamp,
  }))

  // Track patterns based on tool type
  if (tool === 'Grep' || tool === 'Glob') {
    const pattern = String(toolInput.pattern || '')
    if (pattern) {
      state.searchPatterns[pattern] = (state.searchPatterns[pattern] || 0) + 1
    }
  }

  if (tool === 'Read' || tool === 'Edit' || tool === 'Write') {
    const filePath = String(toolInput.file_path || '')
    if (filePath && !state.filesAccessed.includes(filePath)) {
      state.filesAccessed.push(filePath)
    }
  }

  // Check for meta-cognition triggers
  const warnings = checkForLoops(state)

  // Checkpoint check (every 10 actions)
  if (state.toolCalls - state.lastCheckpoint >= 10) {
    state.lastCheckpoint = state.toolCalls
    warnings.push(`CHECKPOINT: ${state.toolCalls} tool calls. Review progress and flow state.`)
  }

  // Output warnings to stderr (will be shown to Claude)
  if (warnings.length > 0) {
    state.warnings.push(...warnings)
    console.error('\n⚠️ META-COGNITION ALERTS:')
    warnings.forEach(w => console.error(`  • ${w}`))
    console.error('')
  }

  saveState(stateFile, state)

  // Exit 0 to allow tool to proceed
  process.exit(0)
}

main()
