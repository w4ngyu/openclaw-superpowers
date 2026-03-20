---
name: openclaw-goal-driven-orchestrator
description: orchestrate long-running or failure-prone implementation tasks in openclaw using a goal-driven controller loop that delegates work to isolated workers, verifies machine-checkable criteria independently, records failed attempts, and respawns fresh workers until the criteria pass. use when a user explicitly asks to activate goal-driven mode, wants a master-orchestrator workflow, needs repeated subagent retries with memory across attempts, or wants openclaw sessions_spawn patterns for codex, claude code, gemini cli, or native subagents.
---

# OpenClaw goal-driven orchestrator

Use this skill to act as a **master orchestrator** inside OpenClaw. Your role is to coordinate isolated workers, preserve cross-attempt memory, and independently verify completion.

## Core rules

- Do **not** implement the requested solution yourself unless the user explicitly asks you to abandon goal-driven mode.
- Treat the worker as untrusted until the criteria are independently verified.
- Keep all attempt history in `{workspace}/ATTEMPTS_LOG.md`.
- Reuse prior failures ruthlessly: every new worker must read the latest `ATTEMPTS_LOG.md` before starting.
- Prefer small, explicit, machine-verifiable success criteria.
- Stop only when the criteria pass, `maxAttempts` is reached, or the environment cannot continue safely.

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxAttempts` | 5 | Maximum worker spawns before stopping |
| `timeoutSeconds` | 300 | Per-worker timeout (kill if exceeded) |
| `cleanup` | `keep` | `keep` preserves ATTEMPTS_LOG, `archive` renames with timestamp |

## Workflow

Follow this loop exactly.

1. **Parse the user request**
   - Extract `[Goal]` and `[Criteria]`.
   - Rewrite them into a precise internal summary.
   - If the criteria are vague, convert them into the most concrete machine-verifiable checks available from the user's wording.

2. **Prepare task memory**
   - Read `ATTEMPTS_LOG.md` if it exists.
   - If it does not exist, create it at `{workspace}/ATTEMPTS_LOG.md`.
   - Ensure the file contains:
     - the goal
     - the criteria
     - prior failed attempts
     - exact error output or test failures
     - your brief diagnosis of why each attempt failed
     - any constraints or dead ends to avoid next time

3. **Spawn an isolated worker**
   - Use OpenClaw's `sessions_spawn` mechanism.
   - **Always use `mode: "run"` for isolation** — workers must not persist or modify orchestrator state.
   - Choose the runtime that matches the user's environment:
     - **External coding harness via ACP**: use `runtime: "acp"` and a concrete `agentId` such as `codex`, `claude-code`, or `gemini-cli`.
     - **Native OpenClaw subagent**: use the default subagent runtime when the task does not require an external ACP harness.
   - Set `timeoutSeconds` to prevent infinite hangs.

4. **Give the worker a strict prompt**
   Use this structure and fill in the real values:

   ```text
   Your task is to achieve: [Goal].

   Success criteria:
   [Criteria]

   Read ATTEMPTS_LOG.md carefully to avoid previous mistakes.
   Work only on the implementation.
   Run relevant tests/checks before reporting back.
   Only report back when you believe the task is done, or when you are blocked with concrete evidence.
   ```

5. **Wait for the worker result, then verify independently**
   - Never accept "done" at face value.
   - Run the verification commands **yourself** in the orchestrator environment.
   - Use the exact commands implied by the criteria whenever possible.
   - Prefer commands that return a clear exit status.

6. **On failure**
   - Append a new section to `ATTEMPTS_LOG.md` containing:
     - timestamp or attempt number
     - worker type/runtime used
     - exact commands run for verification
     - exact stderr/stdout from the failure when available
     - your short diagnosis
     - instructions for the next worker about what to avoid or inspect
   - If `maxAttempts` reached: report failure to user with full attempt history.
   - Otherwise: spawn a fresh worker and repeat.

7. **On success**
   - Report success to the user.
   - Summarize which checks passed.
   - Archive `ATTEMPTS_LOG.md` as `ATTEMPTS_LOG.{timestamp}.md` (preserves history for future reference).

## Verification standards

Use these rules when translating criteria into checks.

- If the criteria mention tests, run those exact tests.
- If the criteria mention a script, run that exact script.
- If the criteria mention a build, run the build.
- If the criteria mention output shape, run the program and inspect the produced artifact.
- If there are multiple checks, run all of them before declaring success.

Good criteria examples:

- `pytest tests/test_auth.py -q exits with code 0`
- `npm test -- login passes`
- `python scripts/check_output.py returns 0`
- `cargo test -p api_server auth_flow succeeds`

Weak criteria examples to improve internally before acting:

- `make sure it works`
- `fix the bug completely`
- `ship a good solution`

## OpenClaw execution patterns

### Pattern A: ACP worker for external coding agents

Use this when the user wants Codex, Claude Code, Gemini CLI, or another ACP-compatible harness.

```json
{
  "task": "Your task is to achieve: [Goal]. Success criteria: [Criteria]. Read ATTEMPTS_LOG.md carefully to avoid previous mistakes. Work only on the implementation. Run relevant tests/checks before reporting back. Only report back when you believe the task is done, or when you are blocked with concrete evidence.",
  "runtime": "acp",
  "agentId": "codex",
  "mode": "run",
  "timeoutSeconds": 300
}
```

### Pattern B: Native OpenClaw worker

Use this when the user wants OpenClaw-native delegation rather than an external ACP harness.

```json
{
  "task": "Your task is to achieve: [Goal]. Success criteria: [Criteria]. Read ATTEMPTS_LOG.md carefully to avoid previous mistakes. Work only on the implementation. Run relevant tests/checks before reporting back. Only report back when you believe the task is done, or when you are blocked with concrete evidence.",
  "mode": "run",
  "timeoutSeconds": 300
}
```

### Pattern C: Persistent session worker

Use `mode: "session"` only when the worker needs follow-up interaction (e.g., debugging sessions that require steering). Prefer `mode: "run"` by default.

```json
{
  "task": "...",
  "thread": true,
  "mode": "session",
  "timeoutSeconds": 600
}
```

## ATTEMPTS_LOG.md template

Use or regenerate this format as needed.

```markdown
# Goal
[Goal]

# Criteria
[Criteria]

# Configuration
- maxAttempts: 5
- timeoutSeconds: 300

# Attempt history

## Attempt 1
- worker runtime: codex (ACP)
- verification commands: pytest tests/test_x.py -q
- result: FAILED
- failure output: AssertionError at line 42
- diagnosis: boundary condition not handled
- next attempt guidance: handle empty array input

## Attempt 2
- worker runtime: native subagent
- verification commands: pytest tests/test_x.py -q
- result: PASSED ✓
```

## Reporting style to the user

When updating the user during the loop:
- report only verified status, not worker claims
- mention the current attempt number
- mention the verification command(s) you ran
- be explicit about whether the criteria passed or failed

When reporting final success:
- state that the criteria passed
- list the verification checks that succeeded
- mention that `ATTEMPTS_LOG.md` was archived

## Boundaries

- Do not claim success based only on worker narration.
- Do not skip verification because the worker sounds confident.
- Do not keep reusing a contaminated worker session after repeated failures; always spawn a fresh worker.
- Do not let `ATTEMPTS_LOG.md` become vague. Preserve concrete evidence.
- Do not exceed `maxAttempts` without user escalation.
- Do not use `mode: "session"` without explicit need (isolation breaks with persistent sessions).
