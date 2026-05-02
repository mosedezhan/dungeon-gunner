# balance-review-agent Specification

## Purpose
TBD - created by archiving change add-balance-review-agent. Update Purpose after archive.
## Requirements
### Requirement: 平衡静态分析子代理存在

项目 SHALL 在 `.claude/agents/balance-review.md` 提供一个 Claude Code 子代理，用于对 `src/config.js` 的平衡参数变化做静态推算评审。该子代理 MUST 仅基于 `config.js` 的字段值计算派生指标，MUST NOT 实例化任何游戏对象，MUST NOT 模拟帧循环，MUST NOT 读取 `src/scenes/` 或 `src/entities/` 下的代码逻辑。

#### Scenario: 子代理文件存在并可被 Claude Code 加载

- **WHEN** 用户在 Claude Code 中启动会话
- **THEN** `.claude/agents/balance-review.md` 必须存在
- **AND** 该文件必须包含 Claude Code 子代理标准 frontmatter（`name`、`description` 字段）
- **AND** 必须能通过 Agent 工具的 `subagent_type` 字段调用

#### Scenario: 子代理拒绝读取游戏代码

- **WHEN** 子代理被调用执行评审
- **THEN** 评审过程必须仅读 `src/config.js`（含 `git diff` 形式）
- **AND** 必须不读取 `src/scenes/`、`src/entities/`、`src/main.js` 等游戏运行时文件
- **AND** 若用户在调用时指示读取游戏代码，必须拒绝并提示"本评审为静态分析，仅基于 config.js"

### Requirement: 斜杠命令 `/balance-review` 提供双模式入口

项目 SHALL 在 `.claude/commands/balance-review.md` 提供 `/balance-review` 斜杠命令，作为子代理的调用入口。该命令 MUST 支持两种触发模式：(A) 无参数时读 `git diff src/config.js` 评审未提交改动；(B) 带参数 `<参数路径> <旧值→新值>` 时评审假设性改动。

#### Scenario: 无参数触发 diff 模式

- **WHEN** 用户运行 `/balance-review`（不带参数）
- **AND** `git diff src/config.js` 输出非空
- **THEN** 命令必须把 diff 内容传给子代理
- **AND** 子代理必须识别每个改动的字段并输出指标对照

#### Scenario: 带参数触发 what-if 模式

- **WHEN** 用户运行 `/balance-review ENEMY.rusher.hp 12→18`
- **THEN** 命令必须解析参数路径与旧/新值
- **AND** 必须把假设性改动套用在当前 config 上算指标
- **AND** 不得修改 `src/config.js`

#### Scenario: 无 diff 且无参数时报错

- **WHEN** 用户运行 `/balance-review`（不带参数）
- **AND** `git diff src/config.js` 输出为空
- **THEN** 命令必须输出"无可评审的改动；请提供参数或先修改 config.js"
- **AND** 不得调用子代理

### Requirement: 派生指标必含集

子代理评审输出 MUST 至少包含以下四个象限的指标：

1. **输出（Output）**：玩家有效 DPS（damage × multishot × (1+pierce) × 1000 / fireRateMs）
2. **耐久（Durability）**：玩家 EHP 与各敌种 EHP（HP）
3. **节奏（Pacing）**：每敌种的 TTK（EnemyEHP / PlayerEffectiveDPS），以秒为单位
4. **资源（Resource）**：技能 uptime（充能积累速率 = killRate × dropChance）

每个指标 MUST 同时呈现"调前值 → 调后值 → Δ（差值或百分比）"三列。指标 MUST 以 markdown 表格形式输出。

#### Scenario: 输出包含四象限指标

- **WHEN** 子代理对任意改动输出评审
- **THEN** 输出必须包含至少一项 Output 指标（如 PlayerEffectiveDPS）
- **AND** 必须包含至少一项 Durability 指标（PlayerEHP 或 EnemyEHP）
- **AND** 必须包含至少一项 Pacing 指标（TTK）
- **AND** 必须包含至少一项 Resource 指标（SkillUptime 或类似）

#### Scenario: 指标以"调前→调后→Δ"三列呈现

- **WHEN** 子代理输出指标对照表
- **THEN** 表格必须包含至少四列：指标名 / 调前 / 调后 / Δ
- **AND** Δ 必须是绝对值或百分比（明确标注单位）
- **AND** 未变化的指标必须显示 Δ 为 `0` 或 `0%`，不得省略

#### Scenario: 字段未识别时跳过相关指标并告警

- **WHEN** `config.js` 出现子代理未在公式集中识别的字段（如未来新增的 `armor`、`critRate`）
- **THEN** 子代理必须输出 `WARNING: 未识别字段 <name>，跳过受影响指标`
- **AND** 不得静默用默认值填补
- **AND** 仍必须输出剩余可计算的指标

### Requirement: 输出结构固定

子代理输出 MUST 遵循以下三段固定结构：(1) 指标对照表；(2) 风险点（叙事段，列出指标变化可能引发的二阶问题）；(3) 建议手测重点（基于风险点反推的浏览器手测 checklist）。每次输出末尾 MUST 附一段 disclaimer，说明本评审为静态推算、不替代 playtest 体感。

#### Scenario: 输出包含三段结构

- **WHEN** 子代理完成一次评审
- **THEN** 输出必须包含 `### 指标对照`、`### 风险点`、`### 建议手测重点` 三个二级 markdown 段
- **AND** 三段必须按此顺序出现

#### Scenario: 输出末尾附 disclaimer

- **WHEN** 子代理完成一次评审
- **THEN** 输出末尾必须有一段不少于 1 句的 disclaimer
- **AND** disclaimer 必须明确说明"静态推算、不替代 playtest 体感"
- **AND** disclaimer 必须提示走位、敌人组合、玩家升级路线会影响实际体验

#### Scenario: 不输出具体数值建议

- **WHEN** 子代理输出风险点或建议
- **THEN** 输出必须不包含"应该调到 X.X"形式的具体数值建议
- **AND** 仅可包含定性方向（"可考虑下调"、"风险偏强"）
- **AND** 终审决策必须由用户结合 playtest 体感做出

### Requirement: 与 balance-journal 解耦

`/balance-review` MUST 与 `/balance-tune` 在调用流程上解耦：`/balance-review` MUST NOT 自动写入 `docs/balance-journal.md`，MUST NOT 自动触发 `/balance-tune`。用户 MAY 在 balance-journal 条目中手动引用评审输出（如复制指标对照表片段）作为 after-feel 的对照。

#### Scenario: 评审不写 balance-journal

- **WHEN** 用户运行 `/balance-review`
- **THEN** `docs/balance-journal.md` 必须不被修改
- **AND** 子代理必须不调用 `/balance-tune` 命令

#### Scenario: 评审不修改 config.js

- **WHEN** 用户运行 `/balance-review`（任意模式）
- **THEN** `src/config.js` 必须不被修改
- **AND** 即使在 what-if 模式接收 `旧值→新值` 参数，也仅在子代理上下文内套用，不写盘

### Requirement: ADR 留痕

引入本子代理 MUST 在 `docs/ai-workflow/` 留下决策记录 `02-balance-static-review.md`，按 RULES.md 规定的 ADR 四节结构（背景与动机 / 决策与权衡 / 适用边界 / 后续观察项）撰写。该 ADR MUST 显式说明"为什么是静态分析而非 headless 模拟或运行时埋点"的选型理由。

#### Scenario: ADR 文件存在且符合编号

- **WHEN** 本变更归档完成
- **THEN** `docs/ai-workflow/02-balance-static-review.md` 必须存在
- **AND** 文件名编号必须紧接 `01-claude-md-sync-on-archive.md`

#### Scenario: ADR 包含选型对比

- **WHEN** 阅读 ADR 的"决策与权衡"节
- **THEN** 必须显式对比静态分析、headless 模拟、运行时埋点三种方案
- **AND** 必须说明为何首版选择静态分析

