## Why

游戏当前 5 种敌人（Chaser / Rusher / Shooter / Giant / Bomber）均为固定行为，玩家在掌握每种敌人的应对后难度曲线趋于平坦。W10+ 缺少新的威胁维度来维持紧张感。

引入精英怪概念——普通敌人的增强版本，复用基础贴图但通过视觉特效（黑身红眼 + 暗色烟雾 + 体型增大 20%）和行为差异区分。首批实现两种：

1. **Elite Chaser（狂暴近战）** — HP 降到 60% 后触发狂暴，速度飙升到 Rusher 水平，加红色脉冲特效。核心体验：打它会让它变凶，制造"击杀时机"决策。
2. **Elite Shooter（三散射手）** — 发射 3 发扇形子弹。核心体验：不能正面站，必须侧移。

## What Changes

### Elite Chaser
- **新增 Enemy 子类** `src/entities/enemies/EliteChaser.js`，继承 `Chaser`
- **命名空间声明**：id `elite_chaser`，复用纹理 `chaser_a`（精英共享基础纹理，不新建），anim 复用 `chaser_walk`，config_block `ENEMY.elite_chaser`
- **狂暴机制**：HP ≤ 60% maxHp 时触发 `berserk` 标志，速度从 base 提升至 Rusher 水平（~140），持续到死亡
- **视觉**：setScale(2.4)（比普通 +20%），黑色 body tint + 红眼，持续黑烟粒子，狂暴后叠加红色脉冲

### Elite Shooter
- **新增 Enemy 子类** `src/entities/enemies/EliteShooter.js`，继承 `Shooter`
- **命名空间声明**：id `elite_shooter`，复用纹理 `shooter_a`，anim 复用 `shooter_walk`，config_block `ENEMY.elite_shooter`
- **三散射**：射击时发射 3 颗子弹（角度 -spread, 0, +spread）
- **视觉**：setScale(2.4)，黑色 body tint + 红眼，持续黑烟粒子

### 共通视觉层
- **黑身红眼**：精英统一主色调——黑色 tint + 红色眼睛标记
- **黑烟粒子**：每 N ms 在身体上方生成暗灰半透明小圆，向上飘散消失（tween 方案，同 Bomber trail 模式）
- **体型**：scale 2.4（基类默认 2.0，+20%）

### 配置（`src/config.js`）
- `ENEMY.elite_chaser` 配置块：基于 chaser 增强（更高 HP、更高 contactDamage、更多 xp、berserkSpeed）
- `ENEMY.elite_shooter` 配置块：基于 shooter 增强（更高 HP、更多 xp、spreadAngle）

### 波次安排
- W10 起出现，固定刷（非随机 mix 池）
- W10: 1 只精英，W13+: 2 只
- Elite Chaser 和 Elite Shooter 交替或随机选取

### touches
- `src/config.js`（新增 ENEMY.elite_chaser + ENEMY.elite_shooter）
- `src/scenes/BootScene.js`（精英红眼纹理 + 黑烟粒子纹理）
- `src/systems/WaveManager.js`（固定精英刷怪逻辑）
- `src/entities/enemies/EliteChaser.js`（新建）
- `src/entities/enemies/EliteShooter.js`（新建）

## Capabilities

### New Capabilities

- `enemy-elite`: 精英怪通用视觉层（黑身红眼 + 黑烟粒子 + 大体型）+ 两种具体实现（EliteChaser 狂暴 + EliteShooter 三散射）+ 波次出场节奏

### Modified Capabilities

- 无。EliteChaser 继承 Chaser、EliteShooter 继承 Shooter，不修改基类行为。

## Impact

### 受影响代码
- `src/config.js`：新增 2 个配置块
- `src/scenes/BootScene.js`：精英红眼纹理 + 黑烟粒子纹理
- `src/systems/WaveManager.js`：新增固定精英刷怪逻辑

### 新增文件
- `src/entities/enemies/EliteChaser.js`
- `src/entities/enemies/EliteShooter.js`

### 破坏性变更
- 无。纯新增内容。

### 依赖
- 无外部依赖。纯 Phaser 内置 API。
