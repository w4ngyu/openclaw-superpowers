---
name: superpowers-nudge
description: "Nudge superpowers skills on session commands"
homepage: https://docs.openclaw.ai/hooks
metadata:
  {
    "openclaw":
      {
        "emoji": "⚡",
        "events": ["command"],
        "requires": { "config": ["workspace.dir"] },
        "install": [{ "id": "managed", "kind": "managed", "label": "User-managed hook" }],
      },
  }
---

# Superpowers Nudge Hook

On common session commands (e.g. `/new`, `/resume`), prints a short reminder of
available Superpowers skills and how to use them in OpenClaw.

