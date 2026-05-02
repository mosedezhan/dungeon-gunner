## Context

`add-shockwave-skill` 引入了主动技能"冲击波"，spec 当前定位为"应急生存技"——清屏 + 击退，明文禁止伤害。手测后发现：

- 一次充能的代价（杀小怪刷掉率 / 升级抢一张 Resonance Core）与"清屏 + 击退"的回报不匹配；技能更多被当作"被围攻时按一下喘口气"而非主动控场。
- 击退把低血杂兵推出射程，反而拖慢清线节奏。
- 既有 SkillOrb 资源闭环没有被回报使用——按 Q 不产生击杀 → 不掉 SkillOrb → 没有正反馈。

代码层面，`fireShockwave(x, y)` 已经在距离判定的 if 里做了击退；`Enemy.takeDamage(amount)` 与 `Enemy.die() → handleEnemyDeath()` 链路在子弹路径上验证过——加入伤害是字面意义上的一行调用变更，零接口改动。

## Goals / Non-Goals

**Goals:**

- 给冲击波加范围伤害，让"花充能 → 清场杀怪 → 掉 SkillOrb"形成正反馈闭环。
- 唯一新数值入口：`SKILL.damagePercent`，全部调参集中在 `config.js`，便于平衡迭代。
- 复用既有 `Enemy.takeDamage` 路径，不引入新 VFX、新方法、新接口。
- spec 层用 `## MODIFIED Requirements` 撤销既有的 no-damage 约束 + `## ADDED Requirements` 新增伤害需求，OpenSpec delta 语义干净。

**Non-Goals:**

- **不做**升级卡（如 "Pulse Amplifier"）。本 change 只调一个数值，让 playtest 单变量验证；升级卡留作下一个 change 候选 `add-shockwave-upgrades`，与"半径 +X%"等一起捆绑。
- **不做**Boss 差异化。当前没 boss；boss 落地时再加 `boss.shockwaveDamageMul` 或免疫标志，通过另一个 change 处理。
- **不做**致死专属 VFX（如蓝色 tint）。沿用 `Enemy.takeDamage` 的 60ms 白闪 + 主体 shockwave 环 + camera shake，视觉信号已饱和。
- **不做** % currentHP 流派。固定比例使用 `maxHp` 简化心智模型与回放分析。
- **不修复** `PLAYER.skillChargesMax = 10` 这个 debug 残留——它属于 `add-shockwave-skill` 的归档前清理，与本 change 解耦。

## Decisions

### D1：伤害类型 = `enemy.maxHp * SKILL.damagePercent`，固定比例最大 HP

- **选择**：每只命中敌人扣 `maxHp * damagePercent` 点伤害，`damagePercent` 默认 `0.4`（40%）。
- **理由**：
  - **% maxHP** vs **固定值**：未来 boss / 高 HP 怪种引入时，固定值会显得弱；% 自动适配。
  - **% maxHP** vs **% currentHP**：currentHP 在同帧 takeDamage 中变化，多次结算会复合（伪指数衰减），mental model 复杂；maxHP 是常量，可读、可回放。
  - **数值起步 40%**：参考 chaser(20)/rusher(12)/shooter(30) HP 谱：
    - rusher 残 7.2 HP → 任意子弹 1 发补刀（base damage=10）
    - chaser 残 12 HP → 1-2 发补刀
    - shooter 残 18 HP → 2 发补刀
    - 体感为"软化但不清"，留给基础火力补完。
- **替代**：50% 半血砍一刀。否决：rusher 单次冲击波 + 一颗子弹即清，盖过基础火力的成就感。可在 playtest 后视手感调到 0.5。
- **替代**：固定 25 伤害。否决：起手会清掉 chaser，与"控场技升级为输出技"的渐进失衡不一致；且未来扩 ENEMY 数值时需手动 follow up。

### D2：伤害先于击退；致死则跳过击退

- **选择**：
  ```js
  if (d < SKILL.knockbackRadius) {
    e.takeDamage(e.maxHp * SKILL.damagePercent);
    if (!e.dead) e.knockback(x, y, SKILL.knockbackForce);
  }
  ```
- **理由**：
  - 与现有子弹路径一致（`GameScene.js:91-92` 同样 damage 先、knockback 后），代码读起来同形。
  - 死掉的敌人不再被击退避免视觉打架——`Enemy.die()` 已自带"原地萎缩 + 旋转 + 淡出" tween，叠加击退飞行轨迹会让死亡动画位置抖动。
  - `Enemy.takeDamage` 内部走完 `if (hp<=0) die()`，会同步置 `this.dead = true`，`if (!e.dead)` 守卫干净生效。
- **替代**：把击退也施加到致死怪，让尸体飞出再播死亡 tween。否决：要重写 `die()` 接受"携带速度死亡"参数 + 延迟 disable body，工程量与"控场+输出"定位不成正比。

### D3：复用 `takeDamage` 全套副作用，不引入新方法

- **选择**：直接调 `Enemy.takeDamage(amount)`，让其触发：60ms 白闪、HP 扣减、`die()` 死亡链路。
- **理由**：
  - 视觉反馈不缺（环 + 抖屏 + 多敌同时白闪 + 飞出/死亡）。
  - 死亡链路免费：`die() → handleEnemyDeath()` 自动跑 XP orb 生成、SkillOrb 掉率 roll、击杀计数自增——闭环完整。
  - 不污染 Enemy 接口。新增 `takeShockwaveDamage()` 这种特化方法是过度设计。
- **替代**：直接 `e.hp -= amount`，绕过 takeDamage。否决：丢失白闪 + die() 自动调用，要手写。

### D4：本 change 不动 UPGRADES，不加升级卡

- **选择**：UPGRADES 数组不变，不引入 `Pulse Amplifier` 或类似伤害提升卡。
- **理由**：
  - RULES.md 颗粒度策略：每 change 独立 playtest。同时引入"伤害基础值"+"伤害升级卡"两个数值轴，playtest 时分不清是哪个的功劳。
  - 作为下一个 change（候选名 `add-shockwave-upgrades`），可与"半径 +X%"、"击退力度 +X%"、"充能恢复速度"等一起捆绑成"shockwave 升级三件套"，故事性更好。
- **替代**：在 Resonance Core 里加伤害提升副作用。否决：卡名 desc 是"+1 max charge"，伸进伤害是隐藏效果，玩家踩不到设计意图。

### D5：`SKILL.damagePercent` 命名与配置位置

- **选择**：在 `src/config.js` 的 `SKILL` 块加一个字段 `damagePercent: 0.4`，与 `knockbackRadius` / `vfxMaxScale` 等同级。
- **理由**：
  - `SKILL` 块是 `add-shockwave-skill` 既定的"冲击波专属命名空间"，新数值天然归此。
  - `damagePercent` 名字直译为"伤害比例"，与下一个 change 可能加的 `radiusPercent`、`forceMultiplier` 等同型。
- **替代**：放进 `PLAYER` 块（如 `shockwaveDamage`）。否决：玩家属性应是"我的角色能力"，技能系数属于技能自身。

### D6：spec 层用 MODIFIED + ADDED 组合，不用 REMOVED

- **选择**：既有 `Shockwave Knocks Back Nearby Enemies` 用 `## MODIFIED Requirements` 改写，新增 `Shockwave Deals Percentage AoE Damage` 用 `## ADDED Requirements`。不使用 `REMOVED`。
- **理由**：
  - 击退需求本身仍然存在（仍要击退活着的敌人），只是"不造成伤害"约束被撤销 + 增加"致死跳过击退"——属于行为修改，不是删除。
  - REMOVED 需要 `**Reason**` + `**Migration**`，但本 change 没有移除任何能力，硬塞 REMOVED 不符合语义。
  - MODIFIED 必须复制 ENTIRE requirement block 重写——已遵守。

## Risks / Trade-offs

- **Risk: spec stacking 顺序**：`add-shockwave-damage` 的 MODIFIED 块需要 `add-shockwave-skill` 的 delta 在归档时已落到 `openspec/specs/active-skill-shockwave/spec.md`。
  → **Mitigation**：归档顺序必须是 `add-shockwave-skill` 先归档（含 sync 主 spec）→ `add-shockwave-damage` 后归档。在本 change 的 `tasks.md` 起首加一条前置依赖检查任务（"确认 add-shockwave-skill 已归档并主 spec 已同步"），实施前必跑 `openspec validate add-shockwave-damage` 校验 MODIFIED 头匹配。

- **Risk: 数值起步 0.4 的体感判断错误**：手测 1-2 波后可能感觉过弱（应该 0.5）或过强（应该 0.3）。
  → **Mitigation**：`tasks.md` 的手测段明确扫 0.3 / 0.4 / 0.5 三档对照，最终值通过 `/balance-tune` 工具记入 balance-journal（why + after-feel）。

- **Risk: 闭环过强**（清场→掉 SkillOrb→更多充能→更多清场）。
  → **Mitigation**：`SKILL.dropChance` 当前为 0.1（10%），即使全场清场期望仅 1 个球。若闭环过强，先调 `dropChance` 而非 `damagePercent`，保持伤害体感稳定。

- **Risk: 致死的敌人 dead = true 触发后，在第二帧才被 destroy**。期间若另一个 shockwave 命中，会被 `if (e.dead) return` 跳过——正确行为，但需手测确认无视觉残留（如尸体仍在 enemies 组里被遍历但跳过）。
  → **Mitigation**：`fireShockwave` 已有 `if (e.dead) return` 守卫，无需新增防御。

- **Trade-off: 致死跳过击退会丢一点视觉爽点**（"敌人被打飞着死"）。
  → **接受**：本 change 不做"携带速度死亡"。视觉饱和度已够，下一个 polish change 可单独考虑（候选名 `polish-shockwave-death-vfx`）。

## Migration Plan

不涉及存档/网络/兼容；纯 in-place 行为修改。开发流程：

1. 等 `add-shockwave-skill` 归档完成（含主 spec 同步），验证 `openspec/specs/active-skill-shockwave/spec.md` 含目标 requirement。
2. 改 `src/config.js` 加 `damagePercent`。
3. 改 `src/scenes/GameScene.js:fireShockwave` 一行 + 一个 if 守卫。
4. 浏览器手测：
   - rusher / chaser / shooter 各自被冲击波后 HP 残留是否符合 D1 演算。
   - 致死的敌人是否原地死亡（不飞出）。
   - 致死敌人是否照常掉 XP / SkillOrb（用 `dropChance: 1.0` 临时验证）。
   - 二次 shockwave 仍能伤害硬直中的敌人。
5. 数值定调后跑 `/balance-tune` 写入 balance-journal。

回滚策略：单 commit 复原；改动仅集中在 `SKILL.damagePercent` + `fireShockwave` 两处。

## Open Questions

- **damagePercent 终值**：起步 0.4，手测后可能落在 0.3–0.5。决策标准：rusher 单触发后是否仍需要至少一颗子弹补刀（应该需要）；chaser 单触发后是否能 1-2 发清掉（合理范围）。
- **未来升级卡**：`add-shockwave-upgrades` 是否合理整合 `damageMul` + `radiusMul` + `forceMul`？三者通常配合成长，单卡反而稀薄。倾向：捆绑 2-3 个轴线为一个卡，但留作下一 change 决。
- **Boss 落地时的差异化**：等 boss change 立项后再决，本 change 不预留接口（YAGNI）。
- **致死专属 VFX**（如蓝色 tint）：当前不做。若后续玩家反馈"分不清谁是被冲击波杀的"，再起 polish change。
