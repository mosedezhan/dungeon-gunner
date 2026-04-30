## Why

`add-shockwave-skill` 把冲击波定位为纯控场技能，spec 明确规定击退**不**造成伤害。手测后的体感问题：花一次充能仅换来"清屏 + 击退"，与玩家平均 1-2 秒就能补射的火力相比代价偏高，技能在中后期沦为"按了等于没按"——尤其当击退把敌人推出有效射程后，反而拖慢清线。给冲击波增加一段范围伤害可以让它在低血杂兵堆中产生"清场 → 击杀掉落 → 回充"的正反馈闭环，与现有 SkillOrb 资源系统形成协同。

## What Changes

- **BREAKING**（spec 层）：撤销 `Shockwave Knocks Back Nearby Enemies` 的 "knockback MUST NOT deal damage" 约束。代码层完全增量，不破坏现有运行时。
- 在击退判定区内对每个敌人造成 `enemy.maxHp * SKILL.damagePercent` 的范围伤害（默认 40%）。
- 致死的敌人**不再被击退**，原地走 `Enemy.die()` 死亡 tween；非致死的敌人沿用现有击退逻辑。
- 致死走原死亡链路：`handleEnemyDeath` → XP orb + SkillOrb 掉率 + 击杀计数，零特殊处理。
- `config.SKILL` 新增 `damagePercent` 字段，作为本次唯一可调数值。

## Capabilities

### New Capabilities

<!-- 无新增 capability — 仅修改既有 active-skill-shockwave -->

### Modified Capabilities

- `active-skill-shockwave`: 撤销"knockback 不造成伤害"约束 + 新增"范围百分比伤害"需求。

## Impact

- **代码**：
  - `src/config.js`：`SKILL` 块新增 `damagePercent: 0.4`。
  - `src/scenes/GameScene.js`：`fireShockwave(x, y)` 在击退判定 if 内追加 `e.takeDamage(e.maxHp * SKILL.damagePercent)`，并把 `e.knockback(...)` 改为 `if (!e.dead) e.knockback(...)` 以避免对将死敌人施加击退。
- **资源**：无新纹理、无新音效、无新 UI。沿用 `Enemy.takeDamage` 的 60ms 白闪烁作为命中反馈，沿用现有 shockwave 环 + camera shake 作为主体特效。
- **数值平衡**：唯一新数值 `SKILL.damagePercent`，需在浏览器中手测调试（建议手测起步 0.4，可在 0.3–0.5 区间扫）。
- **依赖/API**：零新增依赖；`Enemy.takeDamage` 与 `Enemy.die` 接口不变。
- **前置清理（不在本 change 范围）**：归档 `add-shockwave-skill` 前应将 `PLAYER.skillChargesMax` 从当前 debug 残留的 `10` 改回 spec 规定的 `1`；该清理与本 change 无依赖关系。
