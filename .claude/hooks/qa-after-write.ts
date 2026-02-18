#!/usr/bin/env npx tsx
/**
 * @file qa-after-write.ts
 * @description Reminds to run QA after file writes
 *
 * Runs after Write/Edit to enforce quality gates.
 * Claude Code passes input via STDIN as JSON.
 */

import { appendFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'

interface HookInput {
  tool_name?: string
  tool_input?: Record<string, unknown>
  cwd?: string
}

function getProjectRoot(): string {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd()
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
  const qaQueueFile = join(logsDir, 'qa-queue.jsonl')

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

  const tool = input.tool_name || ''
  const toolInput = input.tool_input || {}
  const filePath = String(toolInput.file_path || '')

  // Only track code files
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java']
  const ext = extname(filePath)

  if ((tool === 'Write' || tool === 'Edit') && codeExtensions.includes(ext)) {
    // Queue for QA
    const entry = {
      timestamp: new Date().toISOString(),
      file: filePath,
      tool,
      qaRun: false,
    }
    appendFileSync(qaQueueFile, JSON.stringify(entry) + '\n')

    // Count pending files
    if (existsSync(qaQueueFile)) {
      try {
        const lines = readFileSync(qaQueueFile, 'utf-8').split('\n').filter(Boolean)
        const pending = lines.filter(l => {
          try {
            return !JSON.parse(l).qaRun
          } catch {
            return false
          }
        }).length

        if (pending >= 5) {
          console.error(`\n📊 QA REMINDER: ${pending} files modified without QA scoring.`)
          console.error(`   Run: qa_score_file on modified files (target: 85+)\n`)
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  process.exit(0)
}

main()
