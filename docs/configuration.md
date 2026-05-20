# Configuration

OWASP.WTF needs zero config for static scans. AI-assisted analysis (`--ai`)
needs a provider configured.

## Interactive setup

```bash
owasp-wtf --setup
```

Walks you through picking a provider, supplying a key (if needed), and
choosing a model. Writes `~/.owasp-wtf/config.json`.

The wizard auto-detects:

- The `claude` CLI in your `PATH`
- The `codex` CLI in your `PATH`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` in your environment
- A local Ollama install (`~/.ollama` or `OLLAMA_HOST`)

## Config file

`~/.owasp-wtf/config.json`:

```jsonc
{
  "version": 1,
  "ai": {
    "provider": "anthropic",        // claude-code | codex | openai | anthropic | ollama | none
    "model": "claude-sonnet-4-20250514",
    "apiKey": "env",                // literal key, or "env" to read at runtime
    "baseUrl": "http://localhost:11434",  // ollama only
    "cliPath": "/usr/local/bin/claude"     // claude-code / codex only
  }
}
```

Notes:

- `"apiKey": "env"` means "read from the corresponding env var at scan time"
  (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`). Keeps the key out of the file.
- Default models per provider:

| Provider | Default model |
|---|---|
| `claude-code` | `sonnet` |
| `codex` | `o4-mini` |
| `openai` | `gpt-4o` |
| `anthropic` | `claude-sonnet-4-20250514` |
| `ollama` | `llama3.2` |

## Environment variables

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | Used when `provider: openai` and `apiKey: "env"` |
| `ANTHROPIC_API_KEY` | Used when `provider: anthropic` and `apiKey: "env"` |
| `OLLAMA_HOST` | Detected by `--setup`; can override `baseUrl` |
| `NO_COLOR` | Standard. Disables ANSI colors (`--no-color` does the same) |

## Resetting

Just delete the file:

```bash
rm ~/.owasp-wtf/config.json
owasp-wtf --setup   # start over
```

## See also

- [AI providers](./ai-providers.md) — details and tradeoffs per provider
- [Usage](./usage.md) — how `--ai` interacts with other flags
