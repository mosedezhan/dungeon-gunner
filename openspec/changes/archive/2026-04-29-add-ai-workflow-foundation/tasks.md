## 1. 文档基建：docs/ai-workflow

- [x] 1.1 创建 `docs/` 与 `docs/ai-workflow/` 目录
- [x] 1.2 编写 `docs/ai-workflow/00-context-strategy.md`，必须包含四节：**为何引入**、**怎么用**（含变更颗粒度策略表 + 上下文卫生原则 + archive 即时性规则）、**适用边界**、**后续观察项**
- [x] 1.3 在文档中明确"changes/ 进行中变更 ≤ 2 个"的硬规则与执行说明
- [x] 1.4 在文档中明确"`docs/ai-workflow/` 后续记录使用 NN-name.md 编号"的命名约定

## 2. 文档基建：balance-journal

- [x] 2.1 创建 `docs/balance-journal.md`，提供模板说明（每条目格式：日期、改动项、改动前后值、why、after-feel）
- [x] 2.2 在文档顶部加示例条目（虚构示例，便于理解格式）
- [x] 2.3 在文档中明确"调参不走 OpenSpec、必须在此处留痕"的规则

## 3. CLAUDE.md 子目录分层

- [x] 3.1 编写 `src/scenes/CLAUDE.md`：覆盖场景流转图、HUDScene 通信模式、UpgradeScene 数据传递、首波 banner 异步处理等局部规则；不重复根 CLAUDE.md 已有内容
- [x] 3.2 编写 `src/entities/CLAUDE.md`：覆盖 Sprite 自注册模式、physics group + 对象池约定、preUpdate 中 AI 写法、Player 与 Enemy 子类继承关系；不重复根 CLAUDE.md 已有内容
- [x] 3.3 验证两份子 CLAUDE.md 各自 ≤ 60 行，避免内容膨胀

## 4. Slash 命令集

- [x] 4.1 编写 `.claude/commands/onboard.md`：定义"读根 CLAUDE.md + 最近 3 个 archive + 当前 changes/ + 列出 docs/ai-workflow/ 目录"的执行步骤；产出 ≤ 200 字状态总结
- [x] 4.2 编写 `.claude/commands/playtest.md`：定义"读 git diff，按修改文件类型推导手测 checkpoint，区分 golden path 与 edge case"的执行步骤
- [x] 4.3 编写 `.claude/commands/balance-tune.md`：定义"接收参数名+新值，修改 src/config.js，引导用户提供 why 与 after-feel，追加条目到 docs/balance-journal.md"的执行步骤

## 5. 验证与归档

- [x] 5.1 在浏览器启动游戏（`python -m http.server 8000` → http://localhost:8000），确认零代码改动未影响运行
- [x] 5.2 在新会话中模拟 `/onboard` 流程（手动执行命令所定义的读取序列），确认产出符合预期
- [x] 5.3 检查所有新增文件路径与 proposal Impact 节列出的文件清单一致
- [x] 5.4 运行 `openspec validate add-ai-workflow-foundation --strict`（如可用）；若 CLI 无 validate 命令，至少运行 `openspec status --change add-ai-workflow-foundation --json` 确认无未完成 artifacts
- [x] 5.5 提交 git commit，message 使用 `feat:` 前缀，引用本 change 名称
- [x] 5.6 执行 `/opsx:archive add-ai-workflow-foundation`，归档本变更
- [x] 5.7 确认归档后 `openspec/specs/ai-workflow-foundation/spec.md` 已生成，`openspec/changes/add-ai-workflow-foundation/` 已移入 archive

## 6. Scope Refine：规则与决策叙事分离（apply 阶段识别）

- [x] 6.1 新建 `docs/ai-workflow/RULES.md`：抽出颗粒度策略表、上下文卫生、archive 步骤、命名约定、文档分工矩阵；作为工作流硬规则的唯一来源
- [x] 6.2 重写 `docs/ai-workflow/00-context-strategy.md`：改为纯 ADR 四节（背景与动机 / 决策与权衡 / 适用边界 / 后续观察项），保留并扩展 6 条决策的权衡叙事
- [x] 6.3 在根 `CLAUDE.md` 末尾追加 "AI 工作流规则" 节（≤ 5 行），指向 `RULES.md` 与 `NN-*.md`，提示新会话先跑 `/onboard`
- [x] 6.4 修正 `spec.md` 中"ai-workflow 决策记录目录"的 Requirement：四节改为 ADR 四节；新增 Scenario "决策记录拒绝混入硬规则"
- [x] 6.5 在 `spec.md` 新增 Requirement "工作流硬规则集中管理"，含 3 个 Scenario（CLAUDE.md 指针、规则只改 RULES.md、AI 变更前应读 RULES.md）
- [x] 6.6 在 `design.md` 追加"决策 6：规则与决策叙事分离"，记录 apply 阶段的识别与修正
- [x] 6.7 重新运行 `openspec validate add-ai-workflow-foundation --strict` 确认仍合规
