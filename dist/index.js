import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const SKILL_DIR = "skills";
const SKILL_MD = "SKILL.md";
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_SKILLS = [
  "brainstorming",
  "dispatching-parallel-agents",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-git-worktrees",
  "using-superpowers",
  "verification-before-completion",
  "writing-plans",
  "writing-skills",
];

const SKILL_FILE_CACHE = new Map();

function toInt(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : d;
}

function normalizeSkillName(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  return lower.replace(/_/g, "-");
}

function findExplicitSkill(prompt, skills) {
  const p = String(prompt || "").toLowerCase();
  const list = Array.isArray(skills) && skills.length ? skills : DEFAULT_SKILLS;
  const byLength = [...list].sort((a, b) => b.length - a.length);
  for (const name of byLength) {
    if (p.includes(name)) return name;
  }
  return "";
}

function chooseSkillHeuristic(prompt, defaultSkill, skills) {
  const p = String(prompt || "").toLowerCase();

  // Explicit always wins.
  const explicit = findExplicitSkill(p, skills);
  if (explicit) return explicit;

  // Debugging
  if (
    /debug|bug|trace|stack|exception|crash|hang|timeout|regression|flaky|race/.test(p) ||
    /报错|错误|异常|崩溃|卡住|超时|不工作|定位|排查|根因/.test(p)
  ) {
    return "systematic-debugging";
  }

  // TDD / tests
  if (
    /\btdd\b|unit test|integration test|e2e|jest|vitest|pytest|assert|coverage/.test(p) ||
    /单测|测试驱动|先写测试|覆盖率/.test(p)
  ) {
    return "test-driven-development";
  }

  // Brainstorming / ideation
  if (
    /brainstorm|ideas?|explore|alternatives?|trade-?offs?|design options/.test(p) ||
    /发散|脑暴|点子|方案|备选|取舍|对比/.test(p)
  ) {
    return "brainstorming";
  }

  // Planning / execution
  if (
    /plan|roadmap|steps|phases|milestone/.test(p) ||
    /计划|规划|步骤|阶段|里程碑|拆解/.test(p)
  ) {
    return "writing-plans";
  }

  // Code review
  if (
    /code review|review this|审查|评审|review 意见|review 建议/.test(p)
  ) {
    return "receiving-code-review";
  }

  const normalized = normalizeSkillName(defaultSkill);
  const list = Array.isArray(skills) && skills.length ? skills : DEFAULT_SKILLS;
  if (normalized && list.includes(normalized)) return normalized;
  if (list.includes("using-superpowers")) return "using-superpowers";
  return list[0] || "using-superpowers";
}

function clip(text, maxChars) {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars) + "\n\n...(truncated)";
}

async function readFileCached(filePath) {
  const stat = await fs.stat(filePath);
  const cached = SKILL_FILE_CACHE.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs && typeof cached.text === "string") {
    return cached.text;
  }
  const text = await fs.readFile(filePath, "utf-8");
  SKILL_FILE_CACHE.set(filePath, { mtimeMs: stat.mtimeMs, text });
  return text;
}

async function listSuperpowersSkills() {
  const pluginSkillsRoot = path.join(PLUGIN_ROOT, SKILL_DIR);
  try {
    const entries = await fs.readdir(pluginSkillsRoot, { withFileTypes: true });
    const found = [];
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (ent.name.startsWith(".")) continue;
      const skillMdPath = path.join(pluginSkillsRoot, ent.name, SKILL_MD);
      try {
        await fs.access(skillMdPath);
        found.push(ent.name);
      } catch {
        // ignore
      }
    }
    if (found.length) return found.sort();
  } catch {
    // ignore and fall back
  }

  // Fallback: look under managed skills dir, but only allow default superpowers names.
  const managedRoot = path.join(os.homedir(), ".openclaw", "skills");
  const found = [];
  for (const name of DEFAULT_SKILLS) {
    const skillMdPath = path.join(managedRoot, name, SKILL_MD);
    try {
      await fs.access(skillMdPath);
      found.push(name);
    } catch {
      // ignore
    }
  }
  return found.length ? found : [...DEFAULT_SKILLS];
}

let AVAILABLE_SKILLS_PROMISE;
async function getAvailableSkills() {
  if (!AVAILABLE_SKILLS_PROMISE) AVAILABLE_SKILLS_PROMISE = listSuperpowersSkills();
  try {
    const skills = await AVAILABLE_SKILLS_PROMISE;
    return Array.isArray(skills) && skills.length ? skills : [...DEFAULT_SKILLS];
  } catch {
    return [...DEFAULT_SKILLS];
  }
}

async function readSkillMarkdown(api, skillName) {
  const candidates = [
    path.join(PLUGIN_ROOT, SKILL_DIR, skillName, SKILL_MD),
    path.join(os.homedir(), ".openclaw", "skills", skillName, SKILL_MD),
  ];
  let lastErr;
  for (const candidate of candidates) {
    try {
      return await readFileCached(candidate);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`SKILL.md not found for ${skillName}`);
}

function buildInjectedContext(skillName, skillText) {
  return [
    "Superpowers (Claude Code) plugin:",
    `- Selected workflow skill: ${skillName}`,
    "Instruction: You MUST follow this skill's workflow for this task unless the user explicitly requests otherwise.",
    "",
    `--- ${skillName}/SKILL.md ---`,
    skillText,
  ].join("\n");
}

const SuperpowersToolSchema = {
  type: "object",
  additionalProperties: false,
  required: ["skill"],
  properties: {
    skill: {
      type: "string",
      description:
        "Skill name (e.g. systematic-debugging, test-driven-development, brainstorming, using-superpowers).",
    },
    mode: {
      type: "string",
      enum: ["summary", "full"],
      description: "Return summary (default) or full SKILL.md text.",
    },
    maxChars: {
      type: "number",
      minimum: 500,
      maximum: 30000,
      description: "Max chars of SKILL.md to return (summary/full). Default: 9000.",
    },
  },
};

function summarizeSkillText(text, maxChars) {
  const lines = String(text || "").split(/\n/);
  const head = lines.slice(0, 120).join("\n");
  return clip(head, maxChars);
}

export default function superpowersPlugin(api) {
  const cfg = api.pluginConfig || {};
  if (cfg.enabled === false) return;

  const autoSelect = cfg.autoSelect !== false;
  const injectSkillText = cfg.injectSkillText !== false;
  const showTip = cfg.showTip !== false;
  const maxInjectedChars = toInt(cfg.maxInjectedChars, 9000);
  const defaultSkill = cfg.defaultSkill || "using-superpowers";

  api.logger?.info?.(
    `[superpowers] plugin loaded (autoSelect=${autoSelect}, injectSkillText=${injectSkillText}, showTip=${showTip})`,
  );

  api.on("before_prompt_build", async (event) => {
    const prompt = typeof event?.prompt === "string" ? event.prompt : "";
    const skills = await getAvailableSkills();

    const tip = showTip
      ? [
          "Tip: Superpowers workflows are available.",
          '- Ask: "use the <skill> skill" (e.g. systematic-debugging, test-driven-development).',
          '- Or call the tool: superpowers({skill: \"systematic-debugging\"}).',
          '- Or use the command: /superpowers systematic-debugging (summary|full).',
        ].join("\n")
      : "";

    let injected = "";
    if (injectSkillText && prompt.trim().length >= 5) {
      const explicit = findExplicitSkill(prompt, skills);
      const chosen =
        explicit || (autoSelect ? chooseSkillHeuristic(prompt, defaultSkill, skills) : "");
      if (chosen) {
        try {
          const skillMd = await readSkillMarkdown(api, chosen);
          injected = buildInjectedContext(chosen, clip(skillMd, maxInjectedChars));
        } catch (e) {
          api.logger?.warn?.(
            `[superpowers] failed to read SKILL.md for ${chosen}: ${String(e)}`,
          );
        }
      }
    }

    const prependContext = injected ? (tip ? `${tip}\n\n${injected}` : injected) : tip;
    return prependContext ? { prependContext } : {};
  });

  api.registerTool({
    name: "superpowers",
    label: "Superpowers",
    description: "Load a Claude Code Superpowers SKILL.md (summary or full) by name.",
    parameters: SuperpowersToolSchema,
    execute: async (_toolCallId, params) => {
      const skills = await getAvailableSkills();
      const skill = normalizeSkillName(params?.skill);
      const mode = params?.mode || "summary";
      const maxChars = toInt(params?.maxChars, 9000);

      if (!skill || !skills.includes(skill)) {
        return {
          content: [
            {
              type: "text",
              text:
                `Unknown skill: ${String(params?.skill || "")}\n` +
                `Known skills: ${skills.join(", ")}`,
            },
          ],
        };
      }

      const raw = await readSkillMarkdown(api, skill);
      const out = mode === "full" ? clip(raw, maxChars) : summarizeSkillText(raw, maxChars);

      return {
        content: [{ type: "text", text: `--- ${skill}/SKILL.md (${mode}) ---\n` + out }],
        details: { skill, mode },
      };
    },
  });

  api.registerCommand({
    name: "superpowers",
    description:
      "Show a Superpowers skill (summary/full). Usage: /superpowers <skill> [summary|full]",
    acceptsArgs: true,
    handler: async (ctx) => {
      const skills = await getAvailableSkills();
      const rawArgs = String(ctx?.args || "").trim();
      const [skillRaw, modeRaw] = rawArgs.split(/\s+/, 2);
      const skill = normalizeSkillName(skillRaw);
      const mode = modeRaw === "full" ? "full" : "summary";

      if (!skill || !skills.includes(skill)) {
        return {
          content: [
            {
              type: "text",
              text:
                `Usage: /superpowers <skill> [summary|full]\n` +
                `Unknown skill: ${String(skillRaw || "")}\n` +
                `Known skills: ${skills.join(", ")}`,
            },
          ],
        };
      }

      try {
        const md = await readSkillMarkdown(api, skill);
        const out = mode === "full" ? clip(md, 9000) : summarizeSkillText(md, 9000);
        return {
          content: [{ type: "text", text: `--- ${skill}/SKILL.md (${mode}) ---\n` + out }],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to load ${skill}/SKILL.md: ${String(e)}`,
            },
          ],
        };
      }
    },
  });
}
