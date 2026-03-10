# openclaw-superpower（OpenClaw 插件版 Superpowers）

把 **Claude Code Superpowers** 以 **OpenClaw 原生插件**的方式接入：

- 自动：根据你的提问自动选择合适的 workflow skill，并（可选）把对应 `SKILL.md` 注入到本次 run 的 `prependContext`
- 手动：
  - 工具（给 LLM 调用）：`superpowers({ skill, mode, maxChars })`
  - 命令（确定性、不依赖 LLM）：`/superpowers <skill> [summary|full]`

> 安全提示：OpenClaw 插件在 Gateway 进程内运行，属于 **受信任代码**。只安装你信任的代码。

## 依赖 / 版本要求

- OpenClaw `2026.3.x`（或更高版本且插件 API 兼容）

## 安装（macOS / Linux）

二选一即可：

### 方法 A：直接 clone 到 OpenClaw 扩展目录（推荐）

```bash
mkdir -p ~/.openclaw/extensions
cd ~/.openclaw/extensions
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
```

验证文件存在：

```bash
ls -la ~/.openclaw/extensions/superpowers/openclaw.plugin.json
ls -la ~/.openclaw/extensions/superpowers/dist/index.js
find ~/.openclaw/extensions/superpowers/skills -maxdepth 2 -name SKILL.md | wc -l
```

### 方法 B：直接复制文件夹

Copy this repo folder to:

- `~/.openclaw/extensions/superpowers/`

## 安装（Windows / PowerShell）

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.openclaw\extensions" | Out-Null
cd "$env:USERPROFILE\.openclaw\extensions"
git clone https://github.com/w4ngyu/openclaw-superpowers.git superpowers
```

验证文件存在：

```powershell
Test-Path "$env:USERPROFILE\.openclaw\extensions\superpowers\openclaw.plugin.json"
Test-Path "$env:USERPROFILE\.openclaw\extensions\superpowers\dist\index.js"
```

## 启用插件（不要手写改配置）

```bash
openclaw plugins enable superpowers
openclaw config validate
openclaw plugins list
```

如果你更新了插件代码，需要 **重启 Gateway** 才会加载新代码。

- If you run a Gateway service unit: `openclaw gateway restart`
- If your Gateway is supervised by another process (phoenix/leader-manager/etc.), restart via that supervisor.

## 可选配置（按需）

所有配置都在 `plugins.entries.superpowers.config` 下。

示例：

```bash
# Turn off the per-run tip text (keeps auto injection if enabled)
openclaw config set plugins.entries.superpowers.config.showTip false

# Disable auto-selection (only inject when user explicitly mentions a skill name)
openclaw config set plugins.entries.superpowers.config.autoSelect false

# Disable skill text injection entirely (keeps tool + command)
openclaw config set plugins.entries.superpowers.config.injectSkillText false

# Adjust injected size limit
openclaw config set plugins.entries.superpowers.config.maxInjectedChars 12000
```

验证配置合法：

```bash
openclaw config validate
```

## 使用方式

### 1）自动（推荐）

正常提问即可。插件会自动选一个 skill 并注入 workflow 指导。

### 2）手动（命令，确定性）

在任意 OpenClaw 对话入口（WebUI / Telegram / Discord）发送：

- `/superpowers systematic-debugging summary`
- `/superpowers test-driven-development full`

### 3）手动（工具，给 LLM 调用）

让智能体调用：

- `superpowers({ skill: "systematic-debugging", mode: "summary" })`

## 疑难解答 / FAQ

### 插件找不到 / 没有加载（Plugin not found / not loaded）

- 确认扩展目录下的文件夹名必须是 `superpowers`：
  - macOS: `~/.openclaw/extensions/superpowers/`
  - Windows: `%USERPROFILE%\.openclaw\extensions\superpowers\`
- 确认该目录下存在 `openclaw.plugin.json`
- 执行：

```bash
openclaw plugins list
openclaw config validate
```

### skills 缺失（Skills missing）

- 确认插件目录内存在 `skills/<name>/SKILL.md`

### 本地 `gateway closed (1006 abnormal closure …)`（常见是代理导致）

常见原因：代理环境变量影响本地 WS 连接（`ALL_PROXY/HTTP_PROXY/HTTPS_PROXY`）。

Try (macOS/Linux):

```bash
env -u ALL_PROXY -u HTTP_PROXY -u HTTPS_PROXY openclaw gateway health
```

Try (Windows):

```powershell
$env:ALL_PROXY=""
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""
openclaw gateway health
```

### 太吵（每次都提示 / 重复提示）

- Set `showTip=false`:

```bash
openclaw config set plugins.entries.superpowers.config.showTip false
```

## 一键安装脚本（可选）

- macOS：`scripts/install-macos.sh`
- Windows：`scripts/install-windows.ps1`

它们会：
1) 备份已有 `~/.openclaw/extensions/superpowers`（带时间戳）  
2) 复制当前仓库内容到目标目录  
3) 执行 `openclaw plugins enable superpowers` + `openclaw config validate`

## License / 致谢

- 本项目基于上游 Superpowers（MIT License，见 `LICENSE`）。
- 本仓库仅增加 OpenClaw 插件封装与安装文档（细节见 `NOTICE.md`）。
- 二次分发请保留许可证与版权声明（MIT 要求）。
