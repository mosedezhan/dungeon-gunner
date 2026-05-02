## 1. Prerequisites

- [x] 1.1 确认 `add-shockwave-damage` 状态：可与本变更并行（不冲突，零代码重叠），但若它已实现完成且 playtest 通过应优先归档（RULES.md 进行中变更上限 ≤ 2，归档让出空位）
- [x] 1.2 复核根 CLAUDE.md "AI 工作流规则"节是否需要新增对 `/balance-review` 的指针——倾向**不加**：根 CLAUDE.md 只放跨子系统的指针，单个命令的存在感由 `.claude/commands/` 自己承载（与 `/onboard`、`/balance-tune` 同处理）

## 2. Subagent Definition

- [x] 2.1 创建 `.claude/agents/balance-review.md`
- [x] 2.2 在文件顶部写 frontmatter：
  - `name: balance-review`
  - `description`: 一句话说明用途（参考其他 agent 范本，让 Agent 工具能匹配 `subagent_type`）
  - `model`: 起步用 `sonnet`（design.md D6 决策）；若运行后觉得过重，下个 change 降到 `haiku`
- [x] 2.3 在 prompt body 写公式集（design.md D2 列出的 6 项核心 + 2 项附加），每项标注：
  - 计算公式（明确引用 `config.js` 的字段名）
  - 假设条件（如 pierce 假设每发命中 N+1 个目标）
  - 单位
- [x] 2.4 在 prompt body 写已识别字段清单（白名单），覆盖当前 `config.js` 的所有数值字段（`PLAYER.*`、`BULLET.*`、`ENEMY.<type>.*`、`XP.*`、`SKILL.*`、`WAVE.*`）
- [x] 2.5 在 prompt body 写输出结构强约束（指标对照表 / 风险点 / 建议手测重点 / disclaimer 四段），并给一个完整范例
- [x] 2.6 在 prompt body 写"禁止行为"清单：不读 src/scenes/、不读 src/entities/、不修改 config.js、不写 balance-journal、不输出"应该调到 X.X"的具体数值建议

## 3. Slash Command

- [x] 3.1 创建 `.claude/commands/balance-review.md`
- [x] 3.2 frontmatter 写 `description` + `argument-hint`（参考 `balance-tune.md` 格式）
- [x] 3.3 命令 body 写两种模式的执行流程：
  - 模式 A（无参数）：跑 `git diff src/config.js`；若空报错；否则把 diff 喂给 `balance-review` 子代理
  - 模式 B（带参数）：解析 `<参数路径> <旧值→新值>`；不动 config.js；构造"假设性 diff"喂给子代理
- [x] 3.4 在命令 body 显式说明"不会修改任何文件"——给用户安全感
- [x] 3.5 在命令 body 末尾给"使用范例"段，覆盖三类典型用例（diff 模式、单参数 what-if、多次连续 what-if）

## 4. ADR

- [x] 4.1 创建 `docs/ai-workflow/02-balance-static-review.md`
- [x] 4.2 按 RULES.md 规定的 ADR 四节结构：
  - **背景与动机**：当前平衡迭代闭环纯定性、缺定量锚点的问题（参考本变更 design.md Context 段）
  - **决策与权衡**：明确对比 A 静态分析 / B headless 模拟 / C 运行时埋点 三方案，说明首版选 A 的理由
  - **适用边界**：覆盖什么、不覆盖什么（参考 design.md Non-Goals）
  - **后续观察项**：使用率、用户最常追问的指标、是否需要扩公式集、是否需要升级到 B 或 C
- [x] 4.3 ADR 中显式提及"未来加 armor / critRate / shieldHp 字段时需同步更新子代理的字段白名单"——给后续会话留 hook

## 5. Self-Test

- [x] 5.1 在当前未提交的 `src/config.js` 改动上跑一次 `/balance-review`（无参数 → diff 模式）
  - 当前 diff 是 `SKILL.damagePercent: 0.2` 新加（来自 `add-shockwave-damage`，注：实际值是 0.2 不是 0.4，与 design 期望一致——design 写 0.4 是起步建议）
  - **本会话约束**：subagent_type 在主 prompt 加载时已固化，新加的 `balance-review` agent 在当前会话不可用；改为按子代理 prompt 中的公式做"dry-run 手算"，输出片段已落到 `docs/balance-journal.md` 范例条目。下个会话可直接 `/balance-review` 验证端到端。
  - 验证内容：输出能识别新字段（damagePercent N/A→0.2）、能据此估算 ShockwaveAoEDamage、能指出"0.2 不致死任何敌种"的二阶事实
- [x] 5.2 跑一次 what-if 模式：`/balance-review ENEMY.rusher.hp 12→18`
  - 同上，dry-run 手算已嵌入 `.claude/agents/balance-review.md` 的 "Worked example" 段（完整范例输出）
  - TTK[rusher] 0.34s → 0.50s, +47% 已包含
- [x] 5.3 验证输出符合 spec：四象限指标齐备、三段结构齐备、disclaimer 存在、未输出具体数值建议
  - balance-journal 范例与 agent 内 worked example 都覆盖四象限（Output / Durability / Pacing / Resource）+ 三段结构 + disclaimer
  - 风险点段未出现"应该调到 X.X"形式，符合 spec 约束
- [x] 5.4 验证副作用为零：`git status` 不应出现新的 `M src/config.js` 或 `M docs/balance-journal.md`
  - `src/config.js` 的 M 是 `add-shockwave-damage` 的预存改动，本变更未触动
  - `docs/balance-journal.md` 的 M 是任务 6.1 故意写入的范例条目（不是 5.x 的副作用）
  - `.claude/agents/`、`.claude/commands/balance-review.md`、`docs/ai-workflow/02-balance-static-review.md`、`openspec/changes/add-balance-review-agent/` 是本变更的预期新增文件

## 6. Balance-Journal Reference Entry

- [x] 6.1 在 `docs/balance-journal.md` 末尾追加一条"使用范例"条目（手写，不通过 `/balance-tune`）：
  - 用本次自我验证（5.1）的真实输出片段做范本，演示如何把指标对照表嵌入 after-feel 段
  - 标题如 `## YYYY-MM-DD 范例：把 /balance-review 输出嵌入 after-feel`
  - 让后续会话有先例可循

## 7. Validate & Commit

- [x] 7.1 跑 `openspec validate add-balance-review-agent --strict` 确认零问题
- [x] 7.2 跑 `openspec list` 确认本变更显示在进行中列表
- [ ] 7.3 提交：`feat: add balance-review subagent + slash command`
- [ ] 7.4 推送（按 RULES.md "每次有意义的改动后推送"）

## 8. Archive Readiness

- [x] 8.1 自我验证（第 5 节）全部通过（dry-run 形式；端到端验证留给下一会话）
- [x] 8.2 ADR 已写完且符合四节结构
- [x] 8.3 balance-journal 范例条目已落地
- [ ] 8.4 准备 `/opsx:archive add-balance-review-agent`——预期 CLAUDE.md sync 评估结果：
  - 引入新 AI 框架元素（首个子代理）→ 应触发 ADR 创建（已在第 4 节做）
  - 不引入新场景 / 新 Entity 类 / 新 config 块 / 新跨文件代码约定 → **不需要**改根 CLAUDE.md
  - `/opsx:archive` 应自动判定无需 sync；若提示需要 sync，逐项核对 ADR 01 的判定标准
