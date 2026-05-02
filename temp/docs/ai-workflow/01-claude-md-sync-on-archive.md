# 01 — 归档时自动同步 CLAUDE.md

## 背景与动机

OpenSpec 工作流把"为什么这么改"沉淀在 `openspec/changes/archive/` 下，但新会话主要靠根 `CLAUDE.md` 加载项目上下文（`/onboard` 也以此为入口）。

随着 archive 累积，CLAUDE.md 与代码现状会逐渐脱节：

- `add-shockwave-skill` 引入了 `SKILL` 顶层 config 块、`SkillOrb` 实体、`fireShockwave` 跨文件钩子；
- 这些都是新会话开口需要知道的高层事实；
- 但仅靠人工维护 CLAUDE.md，容易在 archive 即时性的压力下被遗漏。

结果：新会话拿到的是过时架构图，要么不知道某个机制存在（盲区），要么需要去翻 archive 才能补齐（违反"上下文卫生"）。

## 决策与权衡

让 `/opsx:archive` 在 mv change 目录后自动跑一步 CLAUDE.md 同步评估——读 archive 里的 proposal/design/specs，对比当前 CLAUDE.md，若有"促销值得"的事实就输出 diff 让用户确认。

**接受：**

- 仅同步**高层、稳定的事实**：新场景、新 Entity 类、新物理组、新顶层 `config.js` 块、新跨文件约定 / 钩子。
- bug 修复 / refactor / 平衡数值微调 / 单卡 / 单敌人变体不进。
- 判断标准：**未来新会话不读它就上不了手，才进 CLAUDE.md。**
- 输出 diff 而非直写，由用户 y/n 确认——同步是判断题不是机械活。
- 新规则若属子系统（如 `src/entities/`），写入子系统 `CLAUDE.md` 而非根（仍受 RULES.md "CLAUDE.md 分层加载"约束）。
- 失败不回滚归档——archive 已成功，CLAUDE.md 同步是 best-effort。

**拒绝的方案：**

- **全量自动写入归档摘要到 CLAUDE.md**：会把 CLAUDE.md 退化成变更日志，膨胀失效；归档目录已经是历史。
- **完全人工同步**：archive 即时性的压力下容易忘；新会话拿到漂移的架构图。
- **写 PostToolUse hook**：判断哪些事实"值得促销"是判断题，不适合 shell 脚本；放在 skill instructions 里让 Claude 跑更合适。
- **独立 `/sync-claude-md` 命令**：opt-in 等于选择性遗忘；同步必须捆绑在归档动作里。

## 适用边界

- **仅适用于 archive 这一刻**：日常 commit / 中间 apply 不触发。
- **仅 `/opsx:archive` 自动触发**：人工 mv 仍需手动遵守 RULES.md "上下文卫生"第 4 条。
- 同步规则覆盖根 CLAUDE.md **和**子系统 CLAUDE.md，但通常归档的 change 影响的是根；子系统 CLAUDE.md 当前还没引入，等首次分层后此 ADR 自然适用。
- 不替代 `openspec-sync-specs`：那个同步的是 capability spec，本规则同步的是 Claude 的"开局 brief"。两者并存。

## 后续观察项

- **拒绝率**：用户多频繁选 "Skip"？若 > 50%，说明过滤规则太宽，需收紧促销标准（例如把"新升级卡"显式列入 skip）。
- **CLAUDE.md 体量**：是否仍 ≤ 200 行？若膨胀，需重审促销标准——可能"新跨文件约定"被滥用了。
- **遗漏率**：手动 review archive 后，发现该进 CLAUDE.md 但本流程没识别出来的频率。前几次归档后做一次回看校准。
- **子系统 CLAUDE.md 触发时机**：当根 CLAUDE.md 因促销变到 ≥ 200 行时，是否需要按 RULES.md 引入子系统分层？若是，写下一篇 ADR。
