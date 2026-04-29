## ADDED Requirements

### Requirement: 变更颗粒度策略

项目 SHALL 遵守明确的变更分流规则，决定哪些工作走 OpenSpec change、哪些走 balance-journal、哪些直接修复。每个 OpenSpec change MUST 满足"≤ 3 天工作量 + 能独立 playtest 验证"两个约束。`changes/` 目录中进行中的 change MUST NOT 超过 2 个。

#### Scenario: 新增游戏功能走 OpenSpec change

- **WHEN** 开发者要新增一类敌人、升级、场景或系统
- **THEN** 必须创建 OpenSpec change（含 proposal/design/specs/tasks）
- **AND** 该 change 完成后必须立即归档

#### Scenario: 重构走 OpenSpec change

- **WHEN** 开发者要进行影响多文件的重构（如抽取共用 emitter）
- **THEN** 必须创建 OpenSpec change，明确 BEFORE/AFTER 行为不变

#### Scenario: 小 bug 修复直接修

- **WHEN** 开发者发现 bug 且修复预估 < 1 小时
- **THEN** 直接修改并提交，不走 OpenSpec
- **AND** commit message 必须使用 `fix:` 前缀

#### Scenario: 纯数值平衡走 balance-journal

- **WHEN** 开发者只调整 `src/config.js` 中的现有数值（不增维度、不改公式）
- **THEN** 不创建 OpenSpec change
- **AND** 必须在 `docs/balance-journal.md` 追加条目，记录改动 + why + 体感

#### Scenario: 进行中变更超过上限拒绝新建

- **WHEN** `openspec/changes/` 下已有 2 个未归档的 change，开发者尝试创建第 3 个
- **THEN** 必须先归档至少 1 个已完成 change，或明确暂停一个 change
- **AND** 不得简单累加

### Requirement: CLAUDE.md 分层加载

项目 SHALL 通过 CLAUDE.md 的分层布局让 AI 按需加载子系统规则，避免根 CLAUDE.md 膨胀。起步分层 MUST 至少包含 `src/scenes/CLAUDE.md` 和 `src/entities/CLAUDE.md` 两份。新增分层 MUST 在 `docs/ai-workflow/` 留决策记录。

#### Scenario: 修改场景代码自动加载场景规则

- **WHEN** AI 在 `src/scenes/` 下读写文件
- **THEN** Claude Code 自动加载 `src/scenes/CLAUDE.md` 中的局部规则（场景流转、HUDScene 通信约定等）

#### Scenario: 修改实体代码自动加载实体规则

- **WHEN** AI 在 `src/entities/` 下读写文件
- **THEN** Claude Code 自动加载 `src/entities/CLAUDE.md` 中的局部规则（继承约定、对象池模式、preUpdate 与碰撞回调位置等）

#### Scenario: 引入新分层留决策记录

- **WHEN** 开发者决定为某子目录新增 CLAUDE.md
- **THEN** 必须在 `docs/ai-workflow/` 新增一篇决策记录，说明引入理由与适用边界

### Requirement: balance-journal 记录纪律

项目 SHALL 在 `docs/balance-journal.md` 集中记录所有未走 OpenSpec 的数值调整。每条条目 MUST 包含日期、改动项、改动前后值、改动原因（why）、体感反馈（after-feel）。

#### Scenario: 调参后追加条目

- **WHEN** 开发者修改 `src/config.js` 中的现有数值
- **THEN** 必须在 `docs/balance-journal.md` 末尾追加一条记录
- **AND** 该条目必须包含 why 与 after-feel 字段（不允许仅记录数值）

#### Scenario: balance-tune 命令辅助记录

- **WHEN** 开发者使用 `/balance-tune` 命令
- **THEN** 命令必须引导填写 why 与 after-feel
- **AND** 命令必须自动追加到 `docs/balance-journal.md`

### Requirement: 起步命令集

项目 SHALL 在 `.claude/commands/` 提供至少 3 个起步命令：`onboard`、`playtest`、`balance-tune`。每个命令 MUST 是单文件 markdown，定义清晰的输入与产出。

#### Scenario: onboard 命令热身新会话

- **WHEN** 开发者在新会话使用 `/onboard`
- **THEN** 命令必须读取根 `CLAUDE.md`、最近 3 个 archive 中的 change、当前 `openspec/changes/` 下进行中的 change
- **AND** 必须用 ≤ 200 字总结当前项目状态

#### Scenario: playtest 命令生成手测清单

- **WHEN** 开发者改完代码使用 `/playtest`
- **THEN** 命令必须基于 `git diff` 推导出本次改动需要在浏览器手测的 checkpoint
- **AND** 必须区分"golden path"与"边缘 case"两类

#### Scenario: balance-tune 命令调参留痕

- **WHEN** 开发者使用 `/balance-tune <参数名> <新值>`
- **THEN** 命令必须修改 `src/config.js` 对应数值
- **AND** 必须引导用户填写 why 与 after-feel
- **AND** 必须追加条目到 `docs/balance-journal.md`

### Requirement: ai-workflow 决策记录目录

项目 SHALL 在 `docs/ai-workflow/` 维护框架引入决策的可追溯记录（ADR 风格）。每篇记录 MUST 使用 `NN-name.md` 编号命名（NN 从 00 起递增），按引入顺序排列。每篇 MUST 包含"背景与动机 / 决策与权衡 / 适用边界 / 后续观察项"四节。决策记录 MUST 仅承载叙事（给人读），操作性硬规则 MUST 不放在决策记录中。

#### Scenario: 引入新框架层留决策记录

- **WHEN** 开发者引入一个新的 AI 框架元素（如新命令、新分层、新工作流、新约定）
- **THEN** 必须在 `docs/ai-workflow/` 新增 `NN-name.md`
- **AND** 文件名编号必须紧接前一篇
- **AND** 文件内容必须按 ADR 四节组织

#### Scenario: 决策记录可被 onboard 读取

- **WHEN** 开发者使用 `/onboard`
- **THEN** 命令必须能列出 `docs/ai-workflow/` 当前所有决策记录
- **AND** 必须能在用户请求时展示具体一篇内容

#### Scenario: 决策记录拒绝混入硬规则

- **WHEN** 开发者尝试在 `NN-name.md` 中加入操作性硬规则（如"必须 X"、"禁止 Y"形式的命令式约束）
- **THEN** 必须把规则迁移到 `docs/ai-workflow/RULES.md`
- **AND** 决策记录中只保留对该规则的引用与决策动机叙事

### Requirement: 工作流硬规则集中管理

项目 SHALL 将所有工作流硬规则（颗粒度策略、上下文卫生、archive 步骤、命名约定、文档分工等）集中维护在 `docs/ai-workflow/RULES.md`。该文件 MUST 是项目工作流规则的唯一来源（single source of truth）。根 `CLAUDE.md` MUST 通过短指针引用该文件，但 MUST NOT 复制具体规则内容。

#### Scenario: 根 CLAUDE.md 包含工作流指针

- **WHEN** AI 加载根 `CLAUDE.md`
- **THEN** 必须能看到一个"AI 工作流规则"节，指向 `docs/ai-workflow/RULES.md`
- **AND** 该节字数必须保持在 ≤ 5 行（避免与游戏架构内容耦合）

#### Scenario: 规则变更只改 RULES.md

- **WHEN** 工作流规则需要修改（如调整颗粒度上限）
- **THEN** 必须仅修改 `docs/ai-workflow/RULES.md`
- **AND** 不得在根 CLAUDE.md 或其他位置维护副本

#### Scenario: AI 在变更开始前应读取 RULES.md

- **WHEN** AI 准备开始一个 OpenSpec change（执行 `/opsx:propose` 或 `/opsx:apply`）
- **THEN** 应读取 `docs/ai-workflow/RULES.md` 以确认规则约束
- **AND** 若违反规则（如尝试创建第 3 个进行中 change）必须拒绝执行并提示用户

### Requirement: archive 即时性

项目 SHALL 在每个 change 实现完成且 playtest 通过后立即归档，不得让已完成的 change 滞留在 `openspec/changes/` 中。

#### Scenario: 完成实现后归档

- **WHEN** 一个 change 的所有 tasks 完成且 playtest checklist 全部通过
- **THEN** 必须执行 `/opsx:archive <change-name>`（或等价操作）
- **AND** 不得堆积已完成但未归档的 change

#### Scenario: 多 change 并行时强制归档优先

- **WHEN** `changes/` 中有 2 个 change，其中 1 个已完成实现
- **THEN** 必须先归档已完成的，再开始新 change
