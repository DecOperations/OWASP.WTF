---
name: Example Knowledge
description: Template for project-specific expertise
category: pattern
tags: example, template
triggers:
  always: false
priority: 0
---

# Example Knowledge File

This is a template for adding project-specific knowledge to UnicornDev.

## When to Use

Create knowledge files for:
- **APIs**: Document external APIs your project uses (e.g., 100ms.live, LiveKit)
- **Patterns**: Project-specific coding patterns and conventions
- **Libraries**: Deep expertise on libraries not covered by built-in knowledge
- **Rules**: Project-specific rules and constraints

## Triggers

Knowledge files are auto-loaded based on triggers:

```yaml
triggers:
  packages: ['livekit-client']  # Load when these npm packages are detected
  files: ['livekit.config.ts']  # Load when these files exist
  frameworks: ['nextjs']        # Load for these frameworks
  languages: ['typescript']     # Load for these languages
  always: true                  # Always load for this project
```

## Upstreaming

To share knowledge across projects, move the file to:
`~/.unicorn/knowledge/<category>/<name>.md`

Categories: language, framework, library, api, pattern, tool
