# pi-ranoid

> Pi coding agent extension that intercepts every LLM tool call and allows manual revision before execution.

When the LLM wants to call a tool (bash, edit, write, etc.), pi-ranoid pauses execution and presents an interactive menu where you can **allow**, **edit**, or **block** the call. No more silent file overwrites or runaway shell commands.

## How It Works

Every time the agent attempts a tool call, pi-ranoid intercepts it and shows a select menu:

- **Allow** — proceed with the original arguments unchanged
- **Edit args** — opens a text editor with the tool's JSON arguments so you can revise them before execution
- **Block** — prevents execution and sends a user-provided reason back to the LLM as an error message

If you pick "Edit args" and enter invalid JSON, the extension loops back to the menu so you can fix it or choose another option.

## Installation

```bash
npm install pi-ranoid
```

Add to your pi settings (e.g. `~/.pi/settings.json`):

```json
{
  "extensions": ["pi-ranoid"]
}
```

## CLI Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--intercept-allow-all` | boolean | `false` | Bypass all interception — auto-approve every tool call |
| `--intercept-auto-allow` | string | `""` | Comma-separated tool names to auto-approve (e.g. `read,ls,grep`) |

### Examples

Approve read-only tools automatically but intercept everything else:

```bash
pi --intercept-auto-allow=read,ls,grep
```

Temporarily disable interception:

```bash
pi --intercept-allow-all
```

## Behavior Details

- **Non-interactive modes** (RPC/print) — tool calls are auto-approved since there's no UI to prompt
- **Agent abort** — if the agent is aborted while the menu is displayed, the tool call is allowed through (returns `undefined`)
- **Argument mutation** — edited arguments are applied in-place on the `event.input` object, which is the mechanism supported by the pi extension API. No re-validation is performed after mutation.

## Building from Source

```bash
git clone https://github.com/pebaryan/pi-ranoid.git
cd pi-ranoid
npm install
npm run build
```

The compiled extension is output to `dist/`.

## License

MIT