# Balance Journal

本文件记录所有**纯数值平衡**调整。规则参见 [`ai-workflow/00-context-strategy.md`](./ai-workflow/00-context-strategy.md)。

## 规则摘要

- **范围**：仅 `src/config.js` 中现有数值的调整（不增维度、不改公式）。结构性平衡变化（改公式、加维度）走 OpenSpec change，不在此处。
- **必须**：每条调参在此处留痕，不得仅靠 git log。
- **不得**：仅记录数值。每条**必须**包含 `why`（为什么调）与 `after-feel`（调完手测体感）。
- **辅助**：使用 `/balance-tune <参数路径> <新值>` 命令，会引导填写 why/after-feel 并自动追加到本文件。

## 条目格式

```
## YYYY-MM-DD <短标题>

- **改动**：<参数路径>: <旧值> → <新值>
- **why**：<为什么调，1-2 句话>
- **after-feel**：<调完手测体感，1-2 句话>
```

支持一次会话多条改动合并为一个条目（共享 why），但每个改动行必须独立列出。

---

## 示例（虚构，仅供格式参考，删除前请确认有真实条目）

## 2026-04-29 Rusher 太硬，节奏被打断

- **改动**：`ENEMY.rusher.speed`: 220 → 180
- **改动**：`ENEMY.rusher.hp`: 30 → 22
- **why**：第 4 波 Rusher 数量起来后，玩家几乎没有走位空间，体感像被锁血。降速 + 降血让玩家有反制时间。
- **after-feel**：第 4-6 波节奏明显松了，玩家可以选择"先打 Shooter 还是先躲 Rusher"；第 8 波之后又开始紧张，曲线感正常。

---

## 2026-05-02 战士职业初始数值 baseline

- **改动**：`CLASSES.warrior.baseStats` 新增（非纯数值调整，走 OpenSpec change `add-warrior-class`）
  - `maxHp`: 120（vs mage 默认 100）
  - `moveSpeed`: 200（vs 180）
  - `damage`: 18（vs 10）
  - `attackRateMs`: 380（vs mage fireRateMs 280）
  - `swingRange`: 80
  - `swingArc`: π/2 (90°)
- **why**：近战职业需要更高 HP 与移速抵消接触风险；高单次伤害 + 较慢攻击节奏弥补没有射程的劣势；90° 弧与 80 像素范围提供"扫开一片"的基础体感。
- **after-feel**：前 3 波 TTK 与法师接近；挥砍节奏（380ms）比射击（280ms）慢一档，但单次命中 2-3 敌人时 Cleaving Edge 未激活前已有明显"一扫一片"感；Hit-stop 在单命中时给出短促冻结，≥3 命中 burst（屏闪+强震）强化多目标反馈。子弹时间 2.5s 持续足够躲一整波 shooter 齐射，玩家 100% 速度的"不变量"保持清晰。无结构性平衡改动需求——初始值可直接上 prod。

---

<!-- 真实条目请加在下方，删除上面的示例条目 -->

---

## 2026-04-30 范例：把 /balance-review 输出嵌入 after-feel

> **本条为 `add-balance-review-agent` 引入的格式范例**（详见 `docs/ai-workflow/02-balance-static-review.md`）。后续真实条目可参照此格式，把量化指标对照表嵌入 `after-feel`，作为定性体感的客观锚点。本条**不是**真实的调参留痕——展示新增 `SKILL.damagePercent: 0.2`（来自 `add-shockwave-damage` change，非纯 balance-tune）时 `/balance-review` 子代理会输出什么。

- **改动**：`SKILL.damagePercent`: N/A → 0.2（新字段，非纯数值平衡，实际走 OpenSpec change `add-shockwave-damage`）
- **why**：作为新增字段的"调前 → 调后"评审范例，演示子代理输出格式与 after-feel 的衔接。
- **after-feel（含 /balance-review 输出片段）**：

  ```markdown
  ## Balance Review: SKILL.damagePercent N/A→0.2

  ### 指标对照

  | 指标 | 调前 | 调后 | Δ |
  |---|---|---|---|
  | PlayerEffectiveDPS | 35.71 dmg/s | 35.71 dmg/s | 0% |
  | PlayerEHP | 100 HP | 100 HP | 0 |
  | EnemyEHP[chaser/rusher/shooter] | 20/12/30 HP | 20/12/30 HP | 0 |
  | TTK[chaser/rusher/shooter] | 0.56/0.34/0.84 s | 0.56/0.34/0.84 s | 0 |
  | ShockwaveAoEDamage[chaser] | N/A | 4 HP | 新增 |
  | ShockwaveAoEDamage[rusher] | N/A | 2.4 HP | 新增 |
  | ShockwaveAoEDamage[shooter] | N/A | 6 HP | 新增 |
  | SkillChargeAccrualPerSec | 0.119/s | 0.119/s | 0% |
  | TimeToFillSkillPool | 8.4 s | 8.4 s | 0 |

  ### 风险点

  - 0.2 不致死任何敌种（最大 shockwave 伤害 6 < rusher.hp 12）。`add-shockwave-damage` 提案的"清场 → 击杀掉 SkillOrb → 回充"闭环依赖 post-shockwave 子弹补刀，**不**由 shockwave 自身触发。
  - 残血敌人 post-shockwave 子弹补刀次数：chaser 1.6 → 2 发, rusher 0.96 → 1 发, shooter 2.4 → 3 发。技能效果是"软化"而非"清场"。

  ### 建议手测重点

  - 触发一次冲击波后，rusher / chaser / shooter 残血是否符合演算（残 9.6 / 16 / 24）？
  - 0.2 vs 0.4 vs 0.5 对照（参考 `add-shockwave-damage` tasks 4.8），哪档让"补刀感"最自然？
  - 0.2 时单次冲击波是否能清掉低血垃圾兵堆？若不能，提案中的"闭环"价值显著打折。

  > 本评审为静态推算，**不替代** playtest 体感。走位优劣、敌人组合、玩家升级路线均会显著偏离上述指标——把它当做手测前的"看哪里"地图，不当做结论。
  ```

  **嵌入风格说明**：完整把 `/balance-review` 输出粘贴到 after-feel 段，是范例的"详尽形式"。日常 balance-tune 留痕时也可以**只摘取**最关键的 1-2 行指标变化（如 `TTK[rusher] 0.34s → 0.50s, +47%`），让 journal 保持轻量。详尽形式适合大幅或多维度调整；摘要形式适合单参数微调。
