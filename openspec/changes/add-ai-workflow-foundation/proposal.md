## Why

本项目预期经历多轮迭代，跨会话的上下文累积会成为主要瓶颈：每次会话重新解释历史决策的成本会逐步压垮干活的时间。同时项目自身定位为"AI 辅助开发实践教材"，需要在仓库结构中显化框架引入决策。当前 OpenSpec 已就位（L1 工作流），但 L2 上下文/记忆、L3 能力扩展、L5 质量等层尚是空白。本次变更搭建 Phase 0 工作流基建，不动游戏代码，为后续所有迭代奠定上下文卫生与流程纪律的基础。

## What Changes

- 新增 `src/scenes/CLAUDE.md`：场景流转与场景间通信的局部规则（按需加载，避免主 CLAUDE.md 膨胀）
- 新增 `src/entities/CLAUDE.md`：实体继承约定与对象池模式的局部规则
- 新增 `docs/ai-workflow/` 目录及第一篇决策记录 `00-context-strategy.md`：
  - 变更颗粒度策略（哪些走 OpenSpec、哪些走 balance-journal、哪些直接修）
  - 上下文卫生原则（archive 时机、CLAUDE.md 分层、changes/ 进行中数量上限）
  - 多轮迭代下的上下文管理战术
- 新增 `docs/balance-journal.md` 模板：纯数值平衡调整的 why + 体感记录载体（高频，不走 OpenSpec）
- 新增 `.claude/commands/onboard.md`：新会话热身命令（读 CLAUDE.md + 最近 archive + 当前 changes）
- 新增 `.claude/commands/playtest.md`：基于本次改动生成手测 checklist 的命令
- 新增 `.claude/commands/balance-tune.md`：调参 + 自动追加 balance-journal 条目的命令

## Capabilities

### New Capabilities

- `ai-workflow-foundation`: 描述本项目 AI 辅助开发的工作流基建——上下文管理策略、变更颗粒度规则、命令集与文档约定。这是元能力（meta-capability），约束的是开发流程而非游戏功能。

### Modified Capabilities

（无 — 本变更不修改任何现有能力规范）

## Impact

- **代码影响**：零。`src/` 下不修改任何游戏逻辑。
- **新增文件**：`src/scenes/CLAUDE.md`、`src/entities/CLAUDE.md`、`docs/ai-workflow/00-context-strategy.md`、`docs/balance-journal.md`、`.claude/commands/onboard.md`、`.claude/commands/playtest.md`、`.claude/commands/balance-tune.md`、`openspec/specs/ai-workflow-foundation/spec.md`。
- **流程影响**：本变更归档后，所有后续迭代必须遵守 `00-context-strategy.md` 中的颗粒度策略与归档纪律。
- **依赖关系**：完成后立即开启 `establish-baseline-specs`（追溯当前游戏 5 大能力），随后是 `add-debug-overlay`（首个真实游戏迭代）。
- **教材价值**：本变更是"OpenSpec 自身也走 OpenSpec 流程"的递归示例，归档后 `changes/archive/` + `docs/ai-workflow/` 共同构成框架引入决策的可追溯记录。
