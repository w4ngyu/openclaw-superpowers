# Forking upstream (optional)

If you prefer to keep everything inside a fork of the original Superpowers repo:

1. Fork `obra/superpowers` on GitHub.
2. Add an `openclaw/` folder (or similar) containing:
   - `openclaw.plugin.json`
   - `package.json` (with `openclaw.extensions`)
   - `dist/index.js`
3. Instruct users to copy that `openclaw/` folder into `~/.openclaw/extensions/superpowers/`.

Notes:
- Keep the upstream `LICENSE` and credit (MIT requires this).
- Try to keep plugin code self-contained (no external deps) for maximum portability.

