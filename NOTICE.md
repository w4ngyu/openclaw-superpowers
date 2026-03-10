# Notices / Credits

This repository packages the **Superpowers** skills library for use as an **OpenClaw plugin**.

## Upstream

- **Superpowers** by Jesse Vincent (MIT License)
  - Source project: `obra/superpowers`
  - This repo includes upstream `skills/*` content and ships a copy of the MIT `LICENSE`.

## OpenClaw

- OpenClaw is the host application that loads this plugin.
- This plugin uses the OpenClaw plugin API (`before_prompt_build`, `registerTool`, `registerCommand`).

## What’s modified here

- Added an OpenClaw plugin wrapper (`openclaw.plugin.json`, `dist/index.js`) to:
  - auto-select a suitable workflow skill by prompt
  - inject the selected `SKILL.md` into `prependContext` (configurable)
  - provide manual access via:
    - tool: `superpowers({skill, mode, maxChars})`
    - command: `/superpowers <skill> [summary|full]`

