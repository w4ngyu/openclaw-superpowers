# v5.0.0-openclaw.1

First public release of **openclaw-superpowers**.

## What’s included

- Native OpenClaw plugin wrapper for the upstream Superpowers skills library
- Auto-select + optional injection of the chosen workflow into `prependContext`
- Manual access:
  - Tool: `superpowers({ skill, mode, maxChars })`
  - Command: `/superpowers <skill> [summary|full]`

## Install

macOS/Linux:

```bash
mkdir -p ~/.openclaw/extensions
cd ~/.openclaw/extensions
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
openclaw plugins enable superpowers
openclaw config validate
```

Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.openclaw\extensions" | Out-Null
cd "$env:USERPROFILE\.openclaw\extensions"
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
openclaw plugins enable superpowers
openclaw config validate
```

