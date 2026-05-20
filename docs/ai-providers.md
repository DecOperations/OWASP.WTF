# AI Providers

`owasp-wtf --ai` enhances static findings with contextual analysis: data-flow
tracing across files, framework-aware suggestions, and concrete remediation
code. The CLI doesn't ship a model — you bring one. Pick whichever fits your
threat model and budget.

Run `owasp-wtf --setup` to configure one interactively.

## Comparison

| Provider | Auth | Cost | Latency | Privacy | Best for |
|---|---|---|---|---|---|
| **Claude Code CLI** | Existing CLI session | Bundled with Claude Max | Medium | Sent to Anthropic | Devs already using Claude Code |
| **Codex CLI** | Existing CLI session | Bundled with ChatGPT | Medium | Sent to OpenAI | Devs already using Codex |
| **Anthropic API** | `ANTHROPIC_API_KEY` | Per-token | Medium | Sent to Anthropic | Teams with an Anthropic account |
| **OpenAI API** | `OPENAI_API_KEY` | Per-token | Medium | Sent to OpenAI | Teams with an OpenAI account |
| **Ollama** | None (local) | Free | Higher | Stays on your machine | Air-gapped / privacy-sensitive |
| **`none`** | — | — | — | — | Static rules only |

## Claude Code CLI

Uses the `claude` binary on your `PATH` — reuses your existing auth. No
separate API key.

```jsonc
{ "ai": { "provider": "claude-code", "cliPath": "/usr/local/bin/claude", "model": "sonnet" } }
```

Install Claude Code: <https://claude.com/claude-code>.

## OpenAI Codex CLI

Uses the `codex` binary on your `PATH`.

```jsonc
{ "ai": { "provider": "codex", "cliPath": "/usr/local/bin/codex", "model": "o4-mini" } }
```

## Anthropic API

```bash
export ANTHROPIC_API_KEY="sk-ant-…"
owasp-wtf --setup    # choose "Anthropic API", use env key
owasp-wtf --ai
```

```jsonc
{ "ai": { "provider": "anthropic", "apiKey": "env", "model": "claude-sonnet-4-20250514" } }
```

## OpenAI API

```bash
export OPENAI_API_KEY="sk-…"
owasp-wtf --setup    # choose "OpenAI API", use env key
owasp-wtf --ai
```

```jsonc
{ "ai": { "provider": "openai", "apiKey": "env", "model": "gpt-4o" } }
```

## Ollama (local)

Run a model locally, no data leaves your machine.

```bash
ollama pull llama3.2
owasp-wtf --setup    # choose "Ollama"
owasp-wtf --ai
```

```jsonc
{ "ai": { "provider": "ollama", "baseUrl": "http://localhost:11434", "model": "llama3.2" } }
```

Smaller/faster models work fine for most rule-augmentation; larger models give
better data-flow reasoning.

## Switching providers

```bash
owasp-wtf --setup   # overwrites ~/.owasp-wtf/config.json
```

Or edit the file directly — schema in [Configuration](./configuration.md).

## Cost & rate limits

API providers bill per token. A typical scan of a mid-size repo sends each
flagged snippet plus surrounding context as a single prompt. Expect tens to
low-hundreds of requests for a full run.

To keep AI usage tight:

- Raise `--severity` so fewer findings are analyzed.
- Use `--ignore` to skip generated code, vendored libs, and tests.
- Use Claude Code / Codex / Ollama if you'd rather not pay per token.

## Privacy

The CLI sends **source snippets** around each finding to your chosen provider.
It does not send the entire codebase. If your code is sensitive, use `ollama`
or the `none` provider.
