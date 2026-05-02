## Context

本项目（dungeon-gunner，Phaser 3 小游戏）的核心目标不仅是产出游戏，更是探索 AI 辅助开发的最佳实践。当前 OpenSpec 已就位但 specs/changes 均为空，全局 memory、子目录 CLAUDE.md、自定义 commands 等均未搭建。预期会经历多轮（潜在 20+ 次）会话迭代，跨会话上下文累积是核心约束。

**关键现状：**
- 项目无构建、无测试、无 lint，所有验证依赖浏览器手测
- 平衡参数集中在 `src/config.js`，调整高频
- 单人开发，无需多角色协作框架（如 BMAD）

**关键约束：**
- 不为体验框架而引入框架，要符合项目实际
- 项目本身即教材，框架决策须在仓库结构中可追溯
- 多轮迭代下，主对话上下文必须保持轻量，历史封装在 archive/specs

## Goals / Non-Goals

**Goals:**
- 建立 L2 上下文/记忆层的最小可用基建（CLAUDE.md 分层 + balance-journal）
- 建立 L3 能力扩展层的起步命令集（3 个高 ROI 的 slash commands）
- 把变更颗粒度策略与上下文卫生原则文档化，作为后续所有迭代的纪律基线
- 用 OpenSpec 自身流程引入工作流基建，构成"项目即教材"的递归示例

**Non-Goals:**
- 不修改 `src/` 下任何游戏代码
- 不创建游戏能力的 baseline specs（拆分给下一个 change）
- 不实现 debug overlay（拆分给第三个 change）
- 不引入脚手架命令（如 `/new-enemy`）— 真实迭代 2-3 次后再抽象
- 不引入子代理/多代理编排（L4）— 单人小项目过重
- 不引入 ultrareview / 自动审查（L5 高级）— 待主对话装不下时再说
- 不替换 OpenSpec 为 BMAD/Spec-Kit — 对单人小游戏 OpenSpec 已经够用

## Decisions

### 决策 1：拆 3 个相邻 change，而非一个大 change

**选择**：把 Phase 0 拆成 `add-ai-workflow-foundation` → `establish-baseline-specs` → `add-debug-overlay` 三个连续 change。

**理由**：
- OpenSpec 的 `specs/` 设计是描述"产品能力"的。工作流基建（CLAUDE.md/docs/commands）与游戏能力（player/enemy/wave...）schema 错位，混在一个 change 里会让 specs 文件半工作流半游戏，archive 后语义混乱。
- 拆开后每个 change 自洽：本变更产出 1 个 meta-capability spec，下一个变更产出 5 个游戏 capability specs。
- 强化"颗粒度 ≤ 3 天 + 独立 playtest"原则——三个 change 各自满足。

**替代方案**：
- 一个大 change 包含全部 — 拒绝，schema 错位且违反颗粒度规则。
- 完全不走 OpenSpec，直接写文件 — 拒绝，丢失"项目即教材"的递归示例价值。

### 决策 2：CLAUDE.md 仅在 scenes/ 与 entities/ 分层

**选择**：起步只新增 `src/scenes/CLAUDE.md` 和 `src/entities/CLAUDE.md` 两份。

**理由**：
- 这两个目录是架构里最复杂的子系统（场景流转、实体继承+对象池）。AI 在改这些文件时按需加载局部规则，避免主 CLAUDE.md 不断膨胀。
- `src/config.js` 本身即文档，不需要并列说明。
- `main.js` 单文件过简，无需说明。
- 起步少分层，等真实迭代中发现"AI 反复犯同类错误"时再加新分层（如 `src/systems/CLAUDE.md`）。

**替代方案**：
- 只用根 CLAUDE.md — 拒绝，多轮迭代后必膨胀。
- 每个文件夹都加 — 拒绝，过度设计。

### 决策 3：纯数值平衡走 balance-journal，不走 OpenSpec

**选择**：建立 `docs/balance-journal.md`，所有 `config.js` 数值调整只在此处记录"why + 体感"，不创建 change。

**理由**：
- 调参是高频活动（可能一次会话 5-10 次微调）。每次都走 OpenSpec 流程感大于产出感。
- 但不能完全没记录，否则历史决策无法追溯。journal 是中间方案：低成本、可累积、AI 可读。
- 涉及结构性平衡变化（如改公式、加新维度）仍走 OpenSpec change。

**替代方案**：
- 一切走 OpenSpec — 拒绝，流程开销过重。
- 不记录，靠 git log — 拒绝，git log 不写"体感"。

### 决策 4：起步只做 3 个命令（onboard / playtest / balance-tune）

**选择**：
- `/onboard`：新会话热身（读 CLAUDE.md + 最近 N 个 archive + changes/ 现状）
- `/playtest`：基于 git diff 生成手测 checklist（弥补无测试套件）
- `/balance-tune`：调参 + 自动追加 balance-journal 条目

**理由**：
- 三者各自解决一个明确痛点：上下文断层 / 验证空白 / 调参留痕。
- 不做 `/new-enemy` `/new-upgrade` 等脚手架——脚手架的形态需要从真实迭代经验中抽，过早抽会做错。

**替代方案**：
- 一次做 6-8 个命令 — 拒绝，过早优化。
- 全部用 skills 而非 commands — 待评估，命令更直接，skills 适合带知识包的领域逻辑，本期先用命令验证形态。

### 决策 5：archive 是被动上下文压缩机制，必须及时归档

**选择**：变更完成后立即归档，`changes/` 中进行中变更不超过 2 个。

**理由**：
- archive 是 OpenSpec 的杀手特性：完成的 change 进 `specs/`，主对话不必重读历史。
- 堆积进行中的 changes 等于把上下文压在主对话里。
- 设定数字上限（≤ 2 个）让纪律可执行可检查。

**替代方案**：
- 不设硬上限 — 拒绝，纪律会松懈。
- 每完成一步就归档 — 拒绝，归档本身有成本，过频不值。

### 决策 6：规则与决策叙事分离（apply 阶段识别的修正）

**背景**：apply 阶段写完 `00-context-strategy.md` 后，发现该文件混合了两类内容——操作性硬规则（颗粒度表、archive 步骤、≤2 上限）和决策叙事（为何选 OpenSpec、为何拒绝 BMAD）。文件性质不清：是给 AI 读的政策，还是给人读的历史档案？

更深的问题是：根 `CLAUDE.md` 没引用 `00-context-strategy.md`，`/onboard` 也只读标题不读内容，**那些规则当前对 AI 不生效**——文件实际滑向了"写完就忘"的归档物。

**选择**：
- 操作性硬规则集中到 `docs/ai-workflow/RULES.md`（给 AI 读的单一来源）
- 决策叙事保留在 `docs/ai-workflow/NN-*.md`，改为纯 ADR 四节（背景与动机 / 决策与权衡 / 适用边界 / 后续观察项）
- 根 `CLAUDE.md` 加 ≤ 5 行 "AI 工作流规则" 节，仅作指针引用 `RULES.md`

**拒绝**：
- "全部规则放进根 CLAUDE.md" — 与游戏架构耦合，破坏 CLAUDE.md 的单一职责（用户在 apply 阶段明确否决）
- "全部规则放进 NN-*.md，根 CLAUDE.md 不变" — 规则没有 enforcement 路径（AI 不会主动读），等于装饰
- "等下一个 change 修复" — apply 中识别的修正立即处理是更便宜的，归档后再改要多走一个 change，且会污染 baseline spec

**理由**：
- 单一职责：每个文件只承担一类内容（规则 vs 叙事 vs 游戏架构）
- 多层 enforcement：CLAUDE.md 指针 + `/onboard` 主动读取 + 命令文件交叉引用，任何单点失效不会让规则蒸发
- 教材性：把"在 apply 中识别设计 bug 并即时修正"的过程留在 design.md，是真实的迭代记录

**风险与权衡**：
- [风险] AI 不主动读 `RULES.md`，规则形同虚设 → 缓解：在后续观察项中跟踪是否需要更强 enforcement（如 `/onboard` 强制加载 RULES.md 内容）
- [权衡] 多了一个文件（`RULES.md`），文档数量从 1 增至 2 → 接受：分工换清晰

## Risks / Trade-offs

- **[风险] CLAUDE.md 分层维护负担** → 缓解：起步只 2 份，每份 < 60 行；引入新分层须在 ai-workflow/ 留决策记录。
- **[风险] balance-journal 沦为流水账无人读** → 缓解：定义模板要求"why + 体感"，不允许只写数值；`/balance-tune` 命令强制追加。
- **[风险] 起步 3 个命令做错形态，后续推翻成本高** → 缓解：本期不约束命令实现细节为"正式 API"，先迭代 2-3 轮观察用法再固化。
- **[风险] 拆 3 个 change 增加流程开销** → 缓解：本变更明确不动 src/，写完即可归档；`establish-baseline-specs` 是追溯写作，零代码风险；`add-debug-overlay` 是首个真实迭代，本应走完整流程。
- **[权衡] 不引入 BMAD/多代理** → 接受：单人小游戏不需要，引入即过度。后续若主对话装不下大改动再考虑子代理（不是 BMAD）。
- **[权衡] 不引入 baseline specs** → 接受：拆给下一个 change，本期保持纯净。

## Migration Plan

零迁移成本（不动现有代码）。归档后下一个 change `establish-baseline-specs` 立即开始。

## Open Questions

- `/onboard` 命令读取 archive 的"最近 N 个"中 N 取多少？倾向 N=3，但需在第一次真实使用后确认（本变更先不固化，写为可调参数）。
- `docs/ai-workflow/` 后续每篇决策记录的命名是否要保持 `NN-name.md` 编号？倾向是，便于按引入顺序阅读。本变更产出 `00-context-strategy.md` 即建立此约定。
