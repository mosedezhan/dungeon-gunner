## 1. Prerequisites

- [x] 1.1 确认 `add-shockwave-skill` 已归档：`openspec list --json` 应**不**包含 `add-shockwave-skill`
- [x] 1.2 确认主 spec 已同步：`openspec/specs/active-skill-shockwave/spec.md` 存在且包含 `Requirement: Shockwave Knocks Back Nearby Enemies` 完整原文
- [x] 1.3 跑 `openspec validate add-shockwave-damage` 校验 MODIFIED 头与主 spec 文本完全匹配（白空格忽略）

## 2. Config

- [x] 2.1 `src/config.js` 的 `SKILL` 块新增字段：`damagePercent: 0.4,`（位置紧邻 `knockbackRadius` / `knockbackForce`，便于以后按"伤害-击退"语义聚类）

## 3. GameScene.fireShockwave 修改

- [x] 3.1 在 `src/scenes/GameScene.js` 的 `fireShockwave(x, y)` 中，定位现有的 `if (d < SKILL.knockbackRadius) e.knockback(...)` 一行
- [x] 3.2 改写为先 damage 后 knockback、致死跳过击退：
  ```js
  if (d < SKILL.knockbackRadius) {
    e.takeDamage(e.maxHp * SKILL.damagePercent);
    if (!e.dead) e.knockback(x, y, SKILL.knockbackForce);
  }
  ```
- [x] 3.3 保持 `if (e.dead) return;` 在循环顶部不变（既有守卫，避免对已死敌人重复处理）

## 4. Manual Verification (Browser)

- [ ] 4.1 `python -m http.server 8000`，打开 `http://localhost:8000`
- [ ] 4.2 **基础伤害验证**：临时把 `SKILL.dropChance` 调高方便看死亡链路；触发一次冲击波后观察：
  - rusher（HP 12）残约 7 HP，1 颗子弹（damage=10）即清
  - chaser（HP 20）残约 12 HP，1-2 颗子弹清
  - shooter（HP 30）残约 18 HP，2 颗子弹清
- [ ] 4.3 **致死链路**：临时调 `damagePercent: 1.0`，触发冲击波 → 半径内全死 → 每只都掉 XP / SkillOrb（按 `dropChance` roll）；HP 条不残留浮影；尸体原地播死亡 tween，**不**飞出
- [ ] 4.4 **致死跳击退视觉**：在 `damagePercent: 1.0` 下确认死的敌人原地萎缩，不与击退轨迹打架
- [ ] 4.5 **maxHp 而非 currentHp**：故意先用子弹打掉 chaser 一半 HP（10），再触发冲击波——它应再扣 8 HP 而不是 4 HP（验证用 `enemy.maxHp`）
- [ ] 4.6 **二次冲击波伤害穿硬直**：消耗 2 个充能连按 Q 两次，第二次仍能对硬直中的敌人施加伤害（白闪 + HP 扣减）
- [ ] 4.7 **玩家子弹未受影响**：触发冲击波时屏幕上有玩家子弹飞行，触发后玩家子弹应继续正常飞行/命中
- [ ] 4.8 **数值扫档**：分别试 `damagePercent: 0.3 / 0.4 / 0.5`，每档玩 1-2 波感受清场难度，记下首选值
- [ ] 4.9 把 `dropChance` 与 `damagePercent` 调回选定的平衡值（默认 0.1 / 0.4）

## 5. Balance Journal

- [ ] 5.1 调用 `/balance-tune SKILL.damagePercent <chosen-value>` 写入 `docs/balance-journal.md`，附 why（基于 4.8 的体感）+ after-feel
- [ ] 5.2 若 4.8 决定起步值就保持 0.4，依然写一条 journal 条目记录"已 playtest 验证 0.3/0.5 边界，定为 0.4"

## 6. Spec Sync Sanity

- [x] 6.1 实施完成后再跑一次 `openspec validate add-shockwave-damage` 确认无新增的 spec 不一致
- [ ] 6.2 提交：`feat: shockwave 范围伤害（modified active-skill-shockwave）`
