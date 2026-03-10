# Changelog

This project follows a lightweight changelog format. Versions here refer to the **OpenClaw packaging** of upstream Superpowers.

## v5.0.0-openclaw.1

- Package upstream Superpowers skills as a native OpenClaw plugin.
- Auto-select a workflow skill based on the user prompt and (optionally) inject `SKILL.md` into `prependContext`.
- Add manual entrypoints:
  - Tool: `superpowers({ skill, mode, maxChars })`
  - Command: `/superpowers <skill> [summary|full]`
- Add install scripts:
  - `scripts/install-macos.sh`
  - `scripts/install-windows.ps1`

