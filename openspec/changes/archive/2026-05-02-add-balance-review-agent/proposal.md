## Why

当前所有平衡调整完全依赖手测体感：`/balance-tune` 强制留下 why + after-feel，但 after-feel 是定性的（"节奏松了"、"第 8 波重新紧张"），没有任何量化依据。结果是：(1) 同一参数反复横跳——上周调高、这周觉得过强又调低，缺少跨调整的客观锚点；(2) 多维耦合改动（如 `damage` ↑ 同时 `fireRateMs` ↓）的体感无法分摊到具体维度；(3) 新会话回看 balance-journal 难以判断当时的"过强"是绝对过强还是相对当时环境过强。引入一个静态分析子代理，在每次平衡变动时基于 `config.js` 自动计算一组派生指标（玩家 DPS、敌人 EHP、波次理论清场时间、XP 升级节奏、技能 uptime），把"调一个数"和"它对系统的二阶影响"一起摆到 balance-journal 旁边，让每次调参都有量化镜像。

## What Changes

- 新增 Claude Code 子代理 `.claude/agents/balance-review.md`：定义一组**纯静态分析公式**（不跑游戏），输入是 `git diff src/config.js`（或显式参数路径），输出是改前/改后指标对比 + 风险点 + 建议的手测重点。
- 新增斜杠命令 `.claude/commands/balance-review.md`：调用上述子代理。两种触发模式——
  - **diff 模式**：`/balance-review`（无参数）→ 自动读 `git diff src/config.js` 评审最近未提交的调整
  - **指定模式**：`/balance-review <参数路径> <旧值→新值>` → 评审任意假设性调整
- 新增 ADR `docs/ai-workflow/02-balance-static-review.md`：记录"为什么是静态分析而不是 headless 模拟或运行时 telemetry"的决策（参考此次会话中已经梳理的 A/B/C 方案权衡）。
- 公式范围（首版）：玩家有效 DPS、玩家 EHP、各敌种 EHP、单波理论清场时间（按 spawn 频率与玩家 DPS 比值）、XP 升级速率（按敌人击杀×xp 值÷曲线）、技能 uptime（充能 / dropChance）。所有公式来自 `config.js` 的可读字段，**不**反推代码逻辑。
- 不强制集成到 `/balance-tune`：`/balance-review` 是独立的、可在 `/balance-tune` 之前或之后任意时机运行的工具。两者解耦避免破坏 balance-tune 的现有 UX。

## Capabilities

### New Capabilities

- `balance-review-agent`: 定义平衡静态分析子代理的输入/输出契约、必含派生指标清单、调用方式（slash 命令 + 子代理）、与 balance-journal 的协同关系。约束分析的"边界"（不模拟、不读运行时、不改代码）。

### Modified Capabilities

<!-- 无 — 不修改 ai-workflow-foundation 的现有 requirement。新命令仅是"≥ 3 个起步命令"的增量补充，不破坏既有约束。 -->

## Impact

- **代码**：零。游戏运行时不变，`src/` 下不动一行。
- **新增文件**：
  - `.claude/agents/balance-review.md`（子代理定义 + 公式集）
  - `.claude/commands/balance-review.md`（斜杠命令）
  - `docs/ai-workflow/02-balance-static-review.md`（ADR）
  - `openspec/specs/balance-review-agent/spec.md`（归档时由 `/opsx:archive` 生成）
- **流程影响**：归档后，`/balance-tune` 的使用流程**推荐**（不强制）增加前置步骤——先 `/balance-review` 看量化预测，再决定是否调、调多少；调完手测填 after-feel 时可对照预测做"预测 vs 实测"复盘。
- **依赖**：零外部依赖；纯本地 markdown + Claude Code agent 机制。
- **教材价值**：本变更是项目"AI 工作流自我演进"的第二步——继 `add-ai-workflow-foundation` 之后，首次引入 subagent 层（L3 能力扩展），与 RULES.md 已有的 L1/L2 形成立体。
- **后续候选 change（不在本范围）**：
  - `add-balance-review-into-tune`：把 `/balance-review` 嵌入 `/balance-tune` 的 after-feel 步骤
  - `add-balance-review-simulation`：升级到方案 B（headless 模拟），跑 N 次产出 TTK 分布
  - `add-balance-telemetry`：升级到方案 C（运行时埋点），从真人 playtest 收集事件
