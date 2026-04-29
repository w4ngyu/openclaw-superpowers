# openclaw-superpowers（OpenClaw 插件版 Superpowers）

这是基于 Claude Code Superpowers 的 OpenClaw 优化版插件包。  
目标：**保留原版技能能力**，同时提升 OpenClaw 长会话场景下的稳定性与可控性。

上游参考：
- `obra/superpowers`：https://github.com/obra/superpowers
- 官方插件页：https://claude.com/plugins/superpowers

---

## 版本说明

- **v2.0.0（当前推荐）**：OpenClaw 优化版分发结构（含便携化目录、模板、集成文件）
- **v1.0.0（Legacy）**：旧版基线（历史兼容）

> 旧命名 `v5.0.0-openclaw.1` 已并入 `v1.0.0` 口径，不再作为主版本对外。

---

## 2.0.0 更新了什么

相对旧版，2.0.0 重点更新如下：

1. **分发结构升级（自包含）**
   - 新增 `superpowers-extension/`（插件主体）
   - 新增 `templates/`（配置模板）
   - 新增 `integration/`（BOOTSTRAP + 可选 nudge hook）

2. **运行策略更稳**
   - 默认 `injectionMode: summary`
   - 默认 `maxInjectedChars: 3600`
   - `autoSelectSkills` 收敛为高频白名单，降低误命中

3. **保留原本用法，不砍能力**
   - 自动选择仍可用
   - 手动命令 `/superpowers <skill> [summary|full]` 仍可用
   - 工具调用 `superpowers({...})` 仍可用
   - skills 目录完整保留

---

## 和原版 Superpowers 的差异

1. **定位差异**
   - 原版：跨宿主通用技能框架
   - 本仓库：OpenClaw 运行时封装与优化

2. **注入策略差异**
   - 原版偏通用
   - 本仓库默认更偏“控体积、控噪声”

3. **自动路由策略差异**
   - 原版覆盖更广
   - 本仓库对白名单更保守，优先稳定

---

## 安装方式（保留原本 + 新方式）

你可以用以下任一方式安装：

### 方式 A：Git clone（延续原本方式）

macOS / Linux：

```bash
mkdir -p ~/.openclaw/extensions
cd ~/.openclaw/extensions
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
rsync -a superpowers/superpowers-extension/ ~/.openclaw/extensions/superpowers/
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.openclaw\extensions" | Out-Null
cd "$env:USERPROFILE\.openclaw\extensions"
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
robocopy ".\superpowers\superpowers-extension" "$env:USERPROFILE\.openclaw\extensions\superpowers" /E
```

### 方式 B：直接复制文件夹（原本也支持）

将 `superpowers-extension/` 直接复制到：
- macOS/Linux: `~/.openclaw/extensions/superpowers/`
- Windows: `%USERPROFILE%\.openclaw\extensions\superpowers\`

### 方式 C：使用 GitHub 分发包（2.0 新增）

下载 release 的 `v2.0.0` 分发压缩包，解压后按方式 B 复制 `superpowers-extension/`。

---

## 配置与启用

将模板中的 `pluginEntry` 合并到：
- `~/.openclaw/openclaw.json` 的 `plugins.entries.superpowers`

模板文件：
- `templates/openclaw.superpowers.config.template.json`

建议配置（2.0 推荐）：
- `enabled: true`
- `autoSelect: true`
- `injectSkillText: true`
- `injectionMode: "summary"`
- `maxInjectedChars: 3600`
- `defaultSkill: "using-superpowers"`
- `autoSelectSkills`: 高频白名单

启用与校验：

```bash
openclaw config validate
openclaw plugins list
```

重启生效：

```bash
openclaw node restart
```

---

## 原本用法（保持不变）

### 1）自动（推荐）

正常提问即可，插件会自动选择合适 skill 并注入工作流指导。

### 2）手动命令（确定性）

- `/superpowers systematic-debugging summary`
- `/superpowers test-driven-development full`

### 3）工具调用（给模型调用）

- `superpowers({ skill: "systematic-debugging", mode: "summary" })`

---

## 可选集成（2.0 提供）

### BOOTSTRAP（推荐）

```bash
mkdir -p ~/.openclaw/workspace/bootstrap/superpowers
cp integration/BOOTSTRAP.md ~/.openclaw/workspace/bootstrap/superpowers/BOOTSTRAP.md
```

### nudge hook（可选）

```bash
mkdir -p ~/.openclaw/hooks/superpowers-nudge
cp integration/superpowers-nudge.HOOK.md ~/.openclaw/hooks/superpowers-nudge/HOOK.md
cp integration/superpowers-nudge.handler.js ~/.openclaw/hooks/superpowers-nudge/handler.js
```

> 如果提示重复太多，可关闭 nudge 或把 `showTip` 设为 `false`。

---

## 疑难排查

### 插件未加载

- 检查目录名必须是 `superpowers`
- 检查 `~/.openclaw/extensions/superpowers/openclaw.plugin.json` 是否存在
- 执行：

```bash
openclaw plugins list
openclaw config validate
```

### 技能未命中 / 命中不准

- 收窄 `autoSelectSkills`
- 显式设置 `defaultSkill`
- 先用手动命令确认 skill 正常可读

### 响应变慢或上下文过长

- 确认 `injectionMode=summary`
- 把 `maxInjectedChars` 进一步调小（如 2800）

---

## 升级与回滚

### 升级

1. 替换 `~/.openclaw/extensions/superpowers`
2. 保留现有 `openclaw.json`，按需合并模板差异
3. `openclaw node restart`

### 回滚

1. 恢复旧的 `~/.openclaw/extensions/superpowers`
2. 恢复旧的 `plugins.entries.superpowers` 配置
3. `openclaw node restart`

---

## License / 致谢

- 上游 Superpowers 使用 MIT License。
- 本仓库在此基础上增加 OpenClaw 插件封装、运行策略优化与分发结构。
- 二次分发请保留原许可证与致谢信息。
