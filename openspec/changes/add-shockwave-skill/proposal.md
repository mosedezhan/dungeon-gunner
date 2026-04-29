## Why

当前玩家只有被动的"升级三选一"成长路径与持续射击的输出方式，缺少能在被多面子弹/敌人压迫时主动打开局面的应急手段。引入一个由 Q 键触发的主动技能（冲击波）可以提升关键时刻的玩家决策深度，并通过"小怪掉落 + 升级提升上限"的双轨获取方式，与现有 XP/升级循环自然咬合，丰富 Build 多样性。

## What Changes

- 新增主动技能"冲击波"：按 Q 触发，需消耗一次充能；触发时立即销毁屏幕上所有敌方子弹，并对玩家周围短距离内的敌人施加击退。
- 新增技能充能资源：玩家持有一个充能计数 `skillCharges`，初始上限 `skillChargesMax = 1`；上限可叠加，达到上限后掉落不再生效。
- 新增掉落物 SkillOrb：敌人 `die()` 时按小概率生成；玩家拾取后 `skillCharges += 1`（夹取到 `skillChargesMax`）。
- 新增升级卡（接入 `UPGRADES`）：在三选一中以一定权重出现，效果为 `skillChargesMax += 1`。
- 新增冲击波 VFX：从玩家位置 360° 向外辐射的环形波纹（音爆风格），通过 BootScene 程序化生成纹理，使用 Phaser Tween 缩放/淡出。
- HUDScene 增加技能状态显示：当前/最大充能数。

## Capabilities

### New Capabilities

- `active-skill-shockwave`: 主动技能"冲击波"的完整能力闭环 —— 触发输入、充能资源、掉落与拾取、升级上限提升、子弹清屏与近程击退、辐射型 VFX、HUD 展示。

### Modified Capabilities

<!-- 现有 specs/ 下仅有 `ai-workflow-foundation`，与本变更无关；不修改任何已存在的 capability 需求。 -->

## Impact

- **代码**：
  - `src/config.js`：新增 `SKILL`（充能上限、清屏半径、击退距离、掉落概率、VFX 参数）；扩展 `UPGRADES` 数组。
  - `src/scenes/BootScene.js`：新增 SkillOrb 纹理与冲击波环形纹理（程序化生成）。
  - `src/entities/Player.js`：在 `stats` 中加入 `skillCharges` / `skillChargesMax`；新增 `triggerSkill()`；监听 Q 键（在 GameScene 中布线）。
  - `src/scenes/GameScene.js`：新增 `skillOrbs` 物理组、Q 键绑定、与 `enemyBullets` 的清屏交互、近程敌人击退、`handleEnemyDeath` 中按概率生成 SkillOrb、`addSkillVfx()`。
  - 新增 `src/entities/SkillOrb.js`（参考 `XPOrb.js` 模式：脉冲 + 吸附）。
  - `src/scenes/HUDScene.js`：新增技能充能 UI。
- **资源**：仍坚持"无外部资源"约定，新纹理一律在 BootScene 中通过 `Graphics.generateTexture()` 生成。
- **平衡**：新增掉落概率与升级权重需要在浏览器中手动验证（项目无测试框架），调整集中在 `config.js`。
- **依赖/API**：无新增第三方依赖；纯 Phaser 3 物理与 Tween。
