## Why

游戏当前六种基础/精英敌人的最优应对都是"尽快击杀"——不存在"要不要追"的决策维度。引入宝箱怪（Mimic），以"伪装成宝箱 → 玩家靠近触发逃跑 → 限时击杀获得高价值掉落"为核心机制，创造全新博弈维度：**追击风险 vs 奖励诱惑**。玩家需要在清怪安全与追击收益之间做出实时决策。

灵感来源于 Enter the Gungeon 的钥匙兵（Keybullet）。Mimic 以宝箱形态出现在可见区域内小范围徘徊，玩家靠近时暴露真身逃跑，10 秒内不击杀则消失。击杀保底给 XP，25% 概率触发升级选择，75% 概率充满技能充能。

## What Changes

### 宝箱怪敌人（Mimic）
- **新增 Enemy 子类** `src/entities/enemies/Mimic.js`
- **命名空间声明**：id `mimic`，texture_keys `[mimic_chest, mimic_revealed]`，anim_keys `[mimic_wander, mimic_flee, mimic_vanish]`，config_block `ENEMY.mimic`
- **双阶段 AI**：Wandering（原地小范围徘徊，伪装成宝箱，15 秒超时消失）→ Fleeing（玩家进入 triggerRange 时触发，远离玩家逃跑，10 秒超时消失）
- **独特刷出方式**：刷在玩家可见区域内（距玩家 250~400px），有金光闪烁提示，W4 起每波 15% 概率在波次第 3~6 秒刷出
- **无接触伤害**：逃跑型敌人，不惩罚追它的玩家
- **恐慌加速**：逃跑速度随时间递增（120 → 160），制造紧迫感

### 掉落机制
- **100% XP 球**（8 XP，与 Shooter 同级）
- **25% 额外触发 UpgradeScene**（弹出升级选择）
- **75% 额外充满技能充能**（直接设置 skillCharges = skillChargesMax）

### 配置（`src/config.js`）
- `ENEMY.mimic` 配置块：hp、speed、contactDamage、radius、xp、wander/flee 相关参数

### WaveManager 注册
- W4+ 每波 15% 概率，新增 `maybeSpawnMimic()` 方法

### BootScene 纹理
- 宝箱伪装态像素网格（棕金色宝箱）
- 暴露态像素网格（打开的宝箱 + 红眼 + 小短腿）
- 徘徊/逃跑/消失动画

### touches
- `src/config.js`（新增 ENEMY.mimic 块）
- `src/scenes/BootScene.js`（mimic 纹理 + 动画）
- `src/scenes/GameScene.js`（handleEnemyDeath 识别 mimic 掉落）
- `src/systems/WaveManager.js`（maybeSpawnMimic）
- `src/debug/registry.js`（注册 9: Mimic）

## Capabilities

### New Capabilities

- `enemy-mimic`: 宝箱怪行为规范，含双阶段状态机（Wandering / Fleeing）、触发范围检测、恐慌加速逃跑、双计时器超时消失、保底 XP + 25% 升级 / 75% 充能掉落、可见区域刷出

### Modified Capabilities

- 无。Mimic 继承现有 Enemy 基类，不修改基类行为。

## Impact

### 受影响代码

- `src/config.js`：新增 `ENEMY.mimic` 配置块
- `src/scenes/BootScene.js`：mimic 像素网格纹理 + 动画
- `src/scenes/GameScene.js`：`handleEnemyDeath` 新增 mimic 掉落分支
- `src/systems/WaveManager.js`：新增 `maybeSpawnMimic()` 方法
- `src/debug/registry.js`：注册 Mimic

### 新增文件

- `src/entities/enemies/Mimic.js`

### 破坏性变更

- 无。纯新增内容。

### 依赖

- 无外部依赖。纯 Phaser 内置 API。
