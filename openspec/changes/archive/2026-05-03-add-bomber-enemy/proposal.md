## Why

游戏当前四种敌人（Chaser / Rusher / Shooter / Giant）的应对逻辑都是"越快击杀越好"——不存在"击杀决策"维度。引入自爆兵（Bomber），以"接近 → 蓄力 → 弹射跳向玩家 → 爆炸"为核心机制，创造全新威胁维度：**突袭型 AOE**。玩家必须判断是提前击杀（赚 XP）还是闪避（安全但亏 XP），这是当前敌人都不提供的决策压力。

灵感来源于 Enter the Gungeon 的自爆手雷兵。Bomber 在 windUp 期间持续跟踪玩家位置，起跳时锁定目标直线弹射，150ms 内到达后立即爆炸。弹射期间不可被击杀。被玩家提前击杀则不爆炸、正常掉落。

## What Changes

### 自爆兵敌人（Bomber）
- **新增 Enemy 子类** `src/entities/enemies/Bomber.js`
- **命名空间声明**：id `bomber`，texture_keys `[bomber_a, bomber_b]`，anim_keys `[bomber_walk, bomber_die]`，config_block `ENEMY.bomber`
- **AI 行为**：缓慢追击玩家，进入 `triggerRange`（~180px）后进入 windUp
- **三拍状态机**：windUp（300ms，持续跟踪玩家位置，蓄力闪红抖动）→ leap（150ms 直线弹射到锁定位置，不可被击杀）→ explode（AOE 伤害 + 爆炸 VFX，自身销毁）
- **双路径死亡**：被玩家击杀（HP <= 0）→ 正常死亡动画 + 掉 XP/SkillOrb；自爆 → 爆炸 VFX + 对玩家伤害 + 不掉落
- **弹射追踪**：windUp 期间持续更新目标为玩家当前位置，起跳瞬间锁定
- **低 HP（~18）**：鼓励快速击杀，战士基础伤害 18 刚好一刀秒（wave 6 无倍率时）

### 配置（`src/config.js`）
- `ENEMY.bomber` 配置块：hp、speed、contactDamage、radius、xp、blast 相关参数

### WaveManager 注册
- W6 首次出现，W8 加量，W9 再加（比 Giant 多但不过量）

### BootScene 纹理
- 自爆兵像素网格（小圆滚体，红橙色系）
- 自爆兵行走动画
- 爆炸 VFX 纹理（`bomber_explosion`，明亮闪光 + 冲击波）

### touches
- `src/config.js`（新增 ENEMY.bomber 块）
- `src/scenes/BootScene.js`（bomber 纹理 + 动画 + 爆炸 VFX 纹理）
- `src/systems/WaveManager.js`（mixForWave 注册）

## Capabilities

### New Capabilities

- `enemy-bomber`: 自爆兵行为规范，含三拍状态机（windUp / leap / explode）、持续追踪弹射、弹射期不可击杀、双路径死亡（击杀 vs 自爆）、爆炸 AOE、波次解锁节奏

### Modified Capabilities

- 无。Bomber 继承现有 Enemy 基类，不修改基类行为。

## Impact

### 受影响代码

- `src/config.js`：新增 `ENEMY.bomber` 配置块
- `src/scenes/BootScene.js`：bomber 像素网格纹理 + 动画 + 爆炸 VFX 纹理
- `src/systems/WaveManager.js`：`mixForWave()` 追加 W6/W8/W9 bomber 条目

### 新增文件

- `src/entities/enemies/Bomber.js`

### 破坏性变更

- 无。纯新增内容。

### 依赖

- 无外部依赖。纯 Phaser 内置 API。
