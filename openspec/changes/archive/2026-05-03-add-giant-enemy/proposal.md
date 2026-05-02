## Why

游戏当前三种敌人（Chaser / Rusher / Shooter）的威胁方式都是"持续接触"型——玩家只要不在敌人身边就不会受伤。缺少"可读前摇 → 蓄力 → AOE"型威胁，玩家无需观察和预判，后期体验偏单调。

引入巨人（Giant）敌人，以砸地（Slam）为核心机制：蓄力时移速归零 + 地面警告圈 → 落棒 AOE 纯伤害 → 硬直恢复。这是游戏里第一个"可读前摇"威胁，也是未来 Boss 砸地技能的预演——slam 的四拍节拍（wind-up → swing → impact → recovery）和 VFX 组件（警告圈、冲击波、屏幕震动）可直接复用给 Boss。

巨人为上古卷轴风格：高大瘦长的人形生物，持粗棒，大地色皮肤 + 毛皮色调。

## What Changes

### 巨人敌人（Giant）
- **新增 Enemy 子类** `src/entities/enemies/Giant.js`
- **命名空间声明**：id `giant`，texture_keys `[giant_a, giant_b]`，anim_keys `[giant_walk, giant_die]`，config_block `ENEMY.giant`
- **AI 行为**：缓慢追击玩家，进入 `slamTriggerRange`（~110px）后进入蓄力状态
- **砸地四拍**：wind-up（举棒、移速归零、显示地面警告圈）→ swing（快速下劈）→ impact（AOE 伤害判定 + 冲击波 VFX + 屏幕震动）→ recovery（硬直、不可移动）
- **蓄力时移速归零**——给战士近战输出窗口，让 Mage 也更容易观察
- **纯伤害**：slam 不击退玩家
- **地面警告圈**：wind-up 期间显示半透明红色圆形，半径 = `slamRadius`
- **放大死亡特效**：比普通敌人更长的死亡动画（缩放 + 旋转 + 持续时间），匹配体量感

### 配置（`src/config.js`）
- `ENEMY.giant` 配置块：hp、speed、contactDamage、radius、xp、tint、slam 参数（windUpMs、slamRadius、slamDamage、recoveryMs、cooldownMs、triggerRange）
- 波次安排：W4 首次出现（单独教学），W7 再现（+Shooter 压力叠加），W9+ 多 Giant

### WaveManager 注册
- `mixForWave()` 在 W4 加入 Giant，W7 加第二份 Giant，W9 加第三份

### BootScene 纹理
- 巨人像素网格（高瘦人形，大地色调，持棒）
- 巨人行走动画（`giant_walk`）
- 巨人死亡动画（`giant_die`，比普通敌人更长更夸张）
- 砸地警告圈纹理（`slam_warning`）
- 砸地冲击波纹理（`slam_impact`）

### touches
- `src/config.js`（新增 ENEMY.giant 块）
- `src/scenes/BootScene.js`（巨人纹理 + 动画 + slam VFX 纹理）
- `src/systems/WaveManager.js`（mixForWave 注册）
- `src/scenes/GameScene.js`（enemies 组添加 Giant classType，slam 相关 overlap/collision 无需新增——Giant 的 slam 是通过遍历 enemies 组手动距离检测）

## Capabilities

### New Capabilities

- `enemy-giant`: 巨人敌人行为规范，含砸地四拍状态机（wind-up / swing / impact / recovery）、蓄力时移速归零、地面警告圈 VFX、AOE 纯伤害判定、放大死亡特效、波次解锁节奏

### Modified Capabilities

- 无。Giant 继承现有 Enemy 基类，不修改基类行为。WaveManager 仅追加 mix 条目。

## Impact

### 受影响代码

- `src/config.js`：新增 `ENEMY.giant` 配置块
- `src/scenes/BootScene.js`：巨人像素网格纹理 + 动画 + slam VFX 纹理（warning circle + impact shockwave）
- `src/systems/WaveManager.js`：`mixForWave()` 追加 W4/W7/W9 巨人条目
- `src/scenes/GameScene.js`：`enemies` 组需 import Giant（classType 仍为 Enemy，Giant 通过 WaveManager 的 `new Giant()` 手动加入组）

### 新增文件

- `src/entities/enemies/Giant.js`

### 破坏性变更

- 无。纯新增内容。

### 依赖

- 无外部依赖。纯 Phaser 内置 API（physics distance check、Graphics generateTexture、tweens、camera shake）。
