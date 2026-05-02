## Context

项目当前的平衡迭代闭环：

```
想法 → 改 config.js → 浏览器手测 → /balance-tune 留 why+after-feel → 重复
```

after-feel 是定性的口语描述，没有任何数值锚点。当一周后回头看 balance-journal，看到"调高 rusher.speed 220→180，after-feel：节奏松了"，没法判断当时的"松"是因为 (a) 这一个数的影响，还是 (b) 上一波同时改了 chaser.hp 的连带影响，还是 (c) 玩家上次手测时刚拿了某个升级路线导致的偏差。

balance-journal 已要求每条调整必填 why + after-feel（见 `ai-workflow-foundation` 规范），是项目的"定性事实"层。本变更引入"定量事实"层——不是替代 after-feel，而是在它旁边再放一组从 `config.js` 静态推算出的派生指标，作为对照基线。

游戏当前没有测试套件、没有打包器、所有逻辑通过浏览器手测验证（见根 CLAUDE.md）。这意味着任何"运行时仪表"路线（埋点、模拟）都需要先把游戏逻辑层和渲染层解耦——成本极大且与本变更的"轻量化"目标冲突。本变更刻意收敛在**纯静态分析**上：只读 `config.js` 字段，不实例化任何游戏对象，不模拟任何帧循环。

## Goals / Non-Goals

**Goals:**

- 给每次平衡调整提供"调前 → 调后"的量化对照（一组派生指标的 diff），作为 balance-journal 中 after-feel 的客观补充。
- 把 after-feel 从"凭感觉好/坏"升级为"预测 X，实测 Y，差值原因是 Z"——形成可累积的判断力。
- 公式集合内嵌在子代理 prompt 中，零代码、零依赖、零运行时改动。
- 复用 Claude Code 子代理机制（`.claude/agents/`）：让评审过程独立于主对话上下文运行，不污染主会话。
- 与 `/balance-tune` 解耦：评审是独立工具，可在调参前预测、可在调参后复盘，可对纯假设性参数做 what-if。

**Non-Goals:**

- **不做**模拟。Headless 模拟（方案 B）需要把 Player/Enemy/Bullet 的逻辑层从 Phaser 渲染层抽出，工作量远超本变更。本变更不预留任何"未来加模拟"的接口耦合——若要做，单独立 change `add-balance-review-simulation`。
- **不做**运行时埋点。方案 C 需要改 GameScene 增加事件钩子 + localStorage 持久化 + 跨会话日志聚合，是另一条独立路线。
- **不做**自动决策。子代理只产出"指标 diff + 风险点 + 建议手测重点"，**不**给出"应该调到 X.X"的具体建议——避免量化结果掩盖手测体感的不可替代性。
- **不做** UI 可视化（图表、面板）。输出是纯 markdown 文本到对话流。
- **不强制**集成到 `/balance-tune`。强制集成会破坏 balance-tune 的现有 UX（短闭环、必填 why/after-feel），而且让两个工具职责耦合。后续若验证有价值，单独立 change 把它嵌进去。
- **不**反推代码。子代理只看 `config.js` 字段值，**不**爬 `src/scenes/GameScene.js` 的碰撞处理、不读 `Player.preUpdate` 的射击循环。代码层有不一致是另一个问题，本变更不解决。
- **不**给敌人组合权重。波次混合敌人时，本变更只对每个敌种独立计算 EHP / TTK，不计算"波次平均 TTK"——平均化掩盖体感（玩家面对的是 spike，不是均值）。

## Decisions

### D1：交付物是 Claude Code 子代理 + 斜杠命令，不是独立脚本

- **选择**：在 `.claude/agents/balance-review.md` 写子代理定义（含公式 prompt），在 `.claude/commands/balance-review.md` 写斜杠命令调用入口。两文件都是 markdown，零代码。
- **理由**：
  - 项目已采用 `.claude/commands/` 模式（见 `balance-tune.md`、`onboard.md`、`playtest.md`），子代理是该模式的自然扩展，不引入新概念。
  - 子代理隔离上下文：评审过程读 config.js + 算公式，主会话不必关心中间步骤，只看产出。
  - markdown prompt 比脚本更易迭代——公式调整不需要改代码、不需要测试。
  - 用户可以直接编辑公式集（在子代理 prompt 里），不必懂构建链。
- **替代**：写一个 `scripts/balance-review.js` 独立脚本，npm/node 跑。否决：项目当前**无构建步骤、无 node 依赖**（Phaser 走 CDN，所有源码 ES module 直加载），引入 node 脚本会破坏"零依赖"约定。
- **替代**：直接写一个普通的斜杠命令，不分子代理。否决：评审涉及读多个文件、迭代多组公式，prompt 体量大；放在主会话会污染上下文，子代理隔离更干净。

### D2：派生指标首版清单

不追求一步到位的全集，先收敛在"看了真有用"的核心 6 项：

1. **PlayerEffectiveDPS** = `damage * multishot * (1 + pierce) * 1000 / fireRateMs`
   - 注：pierce 的乘数是粗粒度近似（假设每发都恰好穿 N+1 个，实际取决于敌密度）。在评审输出中显式标注此假设。
2. **PlayerEHP** = `maxHp / (1 - 0)`（当前无 armor 维度，留 0 占位；未来若加 armor 字段公式可扩）。在 regen 存在时附加 `regenPerSecond * expectedFightDurationSec` 做参考行。
3. **EnemyEHP[type]** = `enemy.hp`（当前无 armor，等于 hp 本身；保留命名为后续扩展留口）。
4. **TimeToKill[type]** = `enemy.hp / PlayerEffectiveDPS`，秒。
5. **WaveTheoreticalClearTime** = 在 `WAVE.startSpawnMs → WAVE.minSpawnMs` 区间假设均匀刷新，用 `WAVE.durationMs` 与单只 TTK 估算单波清场时间下界（说明"下界"指假设走位完美、子弹全中）。
6. **SkillUptime** = `dropChance / killRatePerSec`（其中 killRate 由 PlayerEffectiveDPS 反推），代表"每秒新增多少充能"。配合 `skillChargesMax` 给出"充能池满需要多久"。

附加（无需主推）：
- **XPLevelInterval** = `xpToNext(level) / (avgEnemyXP * killRatePerSec)`，估"下一级要多久"。
- **ContactDamageWindow** = `playerHp / max(enemy.contactDamage)`，玩家被某种敌人贴脸最多撑几次。

每个指标输出格式：`<name>: <调前值> → <调后值> (Δ <差值或百分比>)`。

- **理由**：6 项覆盖"输出"、"耐久"、"节奏"、"资源"四象限，且每项都能从 `config.js` 字段单步算出。更复杂的指标（敌人组合下的 DPS 摊薄、走位影响的命中率折扣）涉及假设链过长，价值/复杂度比不划算。
- **替代**：一上来就把"波次平均 TTK"和"难度曲线斜率"做进去。否决：均值掩盖体感（rusher 突然贴脸的瞬间比"平均 1.2 秒/只"更影响游玩感受）。

### D3：评审输入有两种模式

- **模式 A（diff 模式）**：`/balance-review` 无参数 → 子代理读 `git diff src/config.js`（包括未提交改动），自动识别变化字段，输出"调前 → 调后"对照。最常用场景：刚改完 config 还没 `/balance-tune`，先看预测。
- **模式 B（what-if 模式）**：`/balance-review <参数路径> <旧值→新值>` → 子代理把假设性改动套用到当前 config，算指标。场景：还没动 config，想先看"如果把 rusher.hp 从 12 调到 18 会怎样"。
- **理由**：A 模式服务"已经动手、求量化预测"，B 模式服务"还没动手、求决策依据"。覆盖典型工作流。
- **替代**：只做 A 模式（简单）。否决：B 模式是这个工具最有价值的一面——避免无效手测往返。
- **替代**：增加 C 模式接 git history（"评审上次提交相对前次的变化"）。否决：YAGNI，git diff 命令已能手动指定 commit 范围，不必专门做。

### D4：输出结构 = 指标对照表 + 风险点 + 建议手测重点

子代理输出格式（强约束）：

```markdown
## Balance Review: <参数路径或 diff 摘要>

### 指标对照
| 指标 | 调前 | 调后 | Δ |
|---|---|---|---|
| PlayerEffectiveDPS | 35.7 dmg/s | 35.7 | 0% |
| EnemyEHP[rusher] | 12 HP | 18 HP | +50% |
| TTK[rusher] | 0.34s | 0.50s | +47% |
| ... | ... | ... | ... |

### 风险点
- TTK[rusher] 上升 47%，接近 chaser TTK（0.56s），可能让两敌种"清场难度感"趋同，弱化敌种身份。
- ...

### 建议手测重点
- 第 3 波后 rusher 数量起来时，玩家是否需要多走一步位才能清线？
- 与 multishot 升级路线的协同：multishot=3 时上述 TTK 是否仍有意义差异？
```

- **理由**：固定结构让 balance-journal 可以直接引用——after-feel 就用"指标对照表"作为锚点写"DPS 没变但 TTK 涨了 47%，体感是节奏从 X 变成 Y"。
- **替代**：自由格式叙事。否决：跨调整不可对比，难以累积。

### D5：ADR 编号 = 02

当前 `docs/ai-workflow/` 已有 `00-context-strategy.md`、`01-claude-md-sync-on-archive.md`，本变更新 ADR 取 `02-balance-static-review.md`。

- **理由**：RULES.md 第 5 条要求"每引入一个新 AI 框架元素必须留 ADR"。子代理是新框架元素（首次引入子代理层），必须留 ADR。
- ADR 内容覆盖：(1) 为什么是静态分析而非模拟/埋点（A vs B vs C 的选型回顾）；(2) 公式范围与已知偏差；(3) 与 balance-journal 的协同关系；(4) 后续观察项（命中率折扣是否需要、敌人组合权重是否需要）。

### D6：spec 中"必含指标"作为约束，公式细节作为附录

spec 把"必须输出哪些指标 + 输出格式"写成 SHALL 级别约束，但**不**把具体计算公式写进 spec——公式属于实现细节，存在子代理 prompt 里。spec 只规定输入输出契约。

- **理由**：公式会随项目演进调整（加 armor 维度、加敌人组合权重），但"必须有 DPS / EHP / TTK / Uptime 四象限指标"是稳定契约。把易变的公式锁进 spec 会让每次微调都要走 modified spec 流程，违背 spec 的"稳定行为约束"定位。
- **替代**：公式也进 spec。否决：理由如上。

## Risks / Trade-offs

- **Risk: 量化结果误导手测体感**——玩家看到"TTK 上升 47%"可能先入为主"应该会变难"，手测时确认偏差。
  → **Mitigation**：子代理输出在末尾固定附一段 disclaimer："本评审为静态推算，不替代 playtest 体感；走位、敌人组合、玩家升级路线均会显著偏离上述指标。"balance-journal 的 after-feel 仍是终审。

- **Risk: 公式偏差被当成 bug**——pierce 的 `(1 + pierce)` 乘数是粗粒度近似，遇到敌密度低的场景会高估玩家 DPS。
  → **Mitigation**：每个指标在子代理 prompt 中显式标注假设条件，输出时简短引用（如 "假设 pierce 每发命中 N+1 个目标"）。让用户看得到偏差来源。

- **Risk: 子代理与主会话上下文脱节**——子代理读 config.js 但不知道主会话当前的讨论上下文（如玩家当前正在测某个升级路线）。
  → **Mitigation**：斜杠命令支持透传额外上下文（`/balance-review <args> --context "<注释>"`），让用户在调用时把场景手喂给子代理。首版只是文档约定，不强制语法。

- **Risk: 公式集老化**——未来若 `config.js` 加 `armor` 字段、`critRate` 字段、`shieldHp` 字段，公式不更新会静默给错值。
  → **Mitigation**：在子代理 prompt 顶部硬编码一段"已识别字段清单"，遇到未识别字段时输出 "WARNING: 未识别字段 X，跳过相关指标"。下游升级公式时同步更新此清单。

- **Trade-off: 与 `/balance-tune` 不绑定意味着用户可能忘了用**——评审纯靠自觉。
  → **接受**：本变更刻意保持解耦。若使用率低且证明价值高，下个 change `add-balance-review-into-tune` 把它接入 balance-tune 流程。

- **Trade-off: 派生指标只覆盖"局部"——单参数调整对单维度的影响**。多参数同改、敌人组合、波次曲线带来的涌现效应不在范围内。
  → **接受**：首版收敛。若用户反馈"局部正确但全局误判频发"，下一步走方案 B（headless 模拟）。

## Migration Plan

不涉及代码运行时；流程演进步骤：

1. 写 `.claude/agents/balance-review.md` 子代理定义（含公式集 + 输入输出格式）。
2. 写 `.claude/commands/balance-review.md` 斜杠命令（含两种模式触发逻辑、参数解析）。
3. 写 `docs/ai-workflow/02-balance-static-review.md` ADR。
4. 自我验证：在当前未提交的 `src/config.js` 改动（`SKILL.damagePercent` 新加）上跑一次 `/balance-review`，看输出是否合理。
5. 在 balance-journal 末尾追加一条引用条目作为"使用范本"（手写），让后续会话有先例可循。
6. 提交 `feat: add balance-review subagent + slash command`。

回滚策略：删除三个新文件即可，零代码影响。

## Open Questions

- **公式范围首版是否够用**：6 项核心 + 2 项附加是否覆盖了用户最常关心的判断面？需要在前 3 次实际使用中观察"用户最常追问的指标"，决定是否扩。
- **要不要给指标定阈值告警**（如"TTK 跨某门槛触发警告"）？倾向不做——阈值因敌种/波次差异极大，阈值化会产生大量假告警。改为子代理在"风险点"段做定性叙事更准。
- **是否在 spec 里强制"输出末尾必含 disclaimer"**？倾向是——避免后续公式扩展时漏掉这层心理安全垫。落到 spec 里的 SHALL 约束。
- **未来与升级路线交互**：玩家选择 multishot vs damage 路线下的指标差异如何呈现？首版不做（YAGNI），但记录为后续 change 候选。
- **agent 的 `model` 字段选哪个**：默认 sonnet 或 haiku？倾向 sonnet——评审涉及多字段对比 + 风险叙事，haiku 可能不够。但运行成本敏感的话首版用 haiku 试。最终在 tasks.md 落实时决。
