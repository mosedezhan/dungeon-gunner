## Why

Giant 的砸地 AOE 是当前威胁度最高的攻击之一，但玩家一旦掌握"看到红圈走开"的节奏后几乎没有被击中的风险。精英 Giant 需要在砸地前增加**冲刺**环节，让玩家来不及走位躲避，制造更紧张的战斗体验。

## What Changes

### Elite Giant（冲刺重装兵）
- **新增 Enemy 子类** `src/entities/enemies/EliteGiant.js`，继承 `Giant`
- **命名空间声明**：id `elite_giant`，复用纹理 `giant_a`，anim 复用 `giant_walk`，config_block `ENEMY.elite_giant`
- **冲刺机制**：idle 追踪阶段，当进入中距离范围（~200px）时触发一次不可打断的短距冲刺（~150px），冲完直接衔接 windup → 砸地，不回到 idle
- **视觉**：精英通用模板——scale 3.6（比普通 Giant 的 3.0 大 20%），黑色 body tint + 红眼 + 持续黑烟粒子

### 配置（`src/config.js`）
- `ENEMY.elite_giant` 配置块：基于 giant 增强（更高 HP、更高 contactDamage、更多 xp、冲刺参数）

### 触摸
- `src/config.js`（新增 ENEMY.elite_giant）
- `src/entities/enemies/EliteGiant.js`（新建）
- `src/systems/WaveManager.js`（将 EliteGiant 加入精英刷怪池）
- `src/debug/registry.js`（注册到 debug 面板）

## Capabilities

### New Capabilities

- `enemy-elite-giant`: 精英重装兵——冲刺 + 砸地连招，精英通用视觉层

### Modified Capabilities

- 无。EliteGiant 继承 Giant，不修改基类行为。

## Impact

### 受影响代码
- `src/config.js`：新增 1 个配置块
- `src/systems/WaveManager.js`：精英池新增 EliteGiant
- `src/debug/registry.js`：新增 1 条注册

### 新增文件
- `src/entities/enemies/EliteGiant.js`

### 破坏性变更
- 无。纯新增内容。

### 依赖
- 无外部依赖。纯 Phaser 内置 API。
