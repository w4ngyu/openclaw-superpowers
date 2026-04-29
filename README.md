# OpenClaw Superpowers v2.0.0

OpenClaw-optimized Superpowers plugin package based on Claude Code Superpowers, tuned for lower prompt bloat and more stable auto-routing in long-running sessions.

## What this is

This distribution keeps the original Superpowers skills set, and adds OpenClaw runtime optimizations:

- Summary-first injection (`injectionMode: summary`)
- Injection size cap (`maxInjectedChars: 3600`)
- Auto-select skill allowlist (high-frequency skills only)
- Optional nudge hook + bootstrap integration

Upstream reference:
- `obra/superpowers`: https://github.com/obra/superpowers
- Claude plugin page: https://claude.com/plugins/superpowers

## Package layout

- `superpowers-extension/`
  - OpenClaw plugin runtime (`dist/index.js`)
  - Plugin manifest (`openclaw.plugin.json`)
  - Skills library (`skills/*`)
- `templates/openclaw.superpowers.config.template.json`
  - Production-tested plugin config template
- `integration/BOOTSTRAP.md`
  - Session bootstrap guidance (optional but recommended)
- `integration/superpowers-nudge.*`
  - Optional nudge hook assets

## Key differences vs upstream

1. Host targeting
   - Upstream: multi-host skill framework
   - This package: OpenClaw-native plugin wrapper + runtime behavior

2. Prompt budget control
   - Uses summary injection by default
   - Caps injected chars to reduce context inflation

3. Safer auto-routing
   - Uses explicit high-frequency allowlist for `autoSelectSkills`
   - Reduces low-frequency accidental matches

4. Manual control preserved
   - Keeps full skills directory
   - Supports manual skill invocation paths

## Install (macOS/Linux)

1. Copy extension directory:

```bash
mkdir -p ~/.openclaw/extensions
rsync -a superpowers-extension/ ~/.openclaw/extensions/superpowers/
```

2. Merge plugin entry config from template into `~/.openclaw/openclaw.json`:

- Copy `pluginEntry` into `plugins.entries.superpowers`
- Ensure plugin is enabled

3. Optional: install integration files:

```bash
mkdir -p ~/.openclaw/workspace/bootstrap/superpowers
cp integration/BOOTSTRAP.md ~/.openclaw/workspace/bootstrap/superpowers/BOOTSTRAP.md
```

Optional nudge hook:

```bash
mkdir -p ~/.openclaw/hooks/superpowers-nudge
cp integration/superpowers-nudge.HOOK.md ~/.openclaw/hooks/superpowers-nudge/HOOK.md
cp integration/superpowers-nudge.handler.js ~/.openclaw/hooks/superpowers-nudge/handler.js
```

4. Restart OpenClaw node:

```bash
openclaw node restart
```

## Recommended runtime config

Use these values in `plugins.entries.superpowers.config`:

- `enabled: true`
- `autoSelect: true`
- `injectSkillText: true`
- `injectionMode: "summary"`
- `maxInjectedChars: 3600`
- `defaultSkill: "using-superpowers"`
- `autoSelectSkills`: high-frequency allowlist only

## Verification checklist

Run after restart:

```bash
openclaw config validate
openclaw channels status --probe --json
```

Check plugin behavior:

- Superpowers plugin loads without config errors
- Skill guidance is injected in summary mode
- No abnormal prompt growth over long sessions
- Auto-selected skills match user intent

## Troubleshooting

1. Plugin loads but no effect
   - Check `plugins.entries.superpowers.enabled` is `true`
   - Confirm extension path is `~/.openclaw/extensions/superpowers`

2. Prompt too large / slow responses
   - Ensure `injectionMode` is `summary`
   - Lower `maxInjectedChars` further (e.g. 2800)

3. Wrong auto-selected skill
   - Narrow `autoSelectSkills` allowlist
   - Set `defaultSkill` explicitly

4. Too many repeated tips
   - Disable nudge hook or set `showTip: false`

## Upgrade and rollback

Upgrade:

- Replace `superpowers-extension/`
- Keep your existing `openclaw.json`
- Re-apply only needed config deltas

Rollback:

- Restore previous `~/.openclaw/extensions/superpowers`
- Restore previous `plugins.entries.superpowers` config
- Restart OpenClaw node

## License and attribution

- Upstream Superpowers is MIT licensed.
- This distribution keeps upstream attribution and adds OpenClaw packaging/runtime tuning.
