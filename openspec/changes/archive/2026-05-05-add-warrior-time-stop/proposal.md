## Why

战士的子弹时间（Bullet Time）技能目前是一个固定参数的一次性效果（2.5 秒，减速到 30%），没有成长空间。玩家获得技能充能后体验始终一致，缺乏长期追求。

引入分级技能升级卡 + 终极大招解锁机制：通过两张可重复升级的卡片（延长时间 / 增强减速）让技能随游戏进程变强，两者满级 + 充能上限 >= 3 时解锁「时间暂停」（Za Warudo），将技能升级为 5 秒完全时间停止——敌人静止、玩家无敌、世界变灰、钟表盘倒计时碎裂特效。

灵感来源于 JoJo 的奇妙冒险中 DIO 的 The World 能力。时间暂停提供"5 秒白打"的高爽感时刻，但消耗 3 格充能的使用成本确保平衡性。

## What Changes

### 分级升级卡（混入现有 UPGRADES 池）

- **延长时间（Time Dilation）**：2 级，每级 +1 秒持续时间（2.5s → 3.5s → 4.5s），classes: warrior
- **增强减速（Gravity Well）**：2 级，每级降低 slowFactor（0.3 → 0.2 → 0.1），classes: warrior

### 终极大招：时间暂停（Za Warudo）

- **解锁条件**：延长时间 T2 + 增强减速 T2（共 4 张前置卡）
- **首次出现**：满足条件时 100% 刷新时间暂停卡；如果跳过，混入普通升级池正常概率刷新
- **触发模型**：解锁后**脱离 skillCharges 体系**，改为 15 秒实时冷却（手测后从 10s 调高，避免节奏太密）。按 Q 不消耗充能，仅检查冷却。
- **技能效果**：5 秒完全时间暂停 → 敌人/子弹完全静止 → 玩家无敌 → 正常攻击频率
- **解锁后替换子弹时间**，不可共存。SkillOrb 仍会掉落但对战士无意义（HUD 同步隐藏 charge 行）

### 时间暂停特效（重点）

- **触发瞬间**：紫色冲击波 + 全屏白闪 + camera shake
- **世界灰度化**：所有敌人/子弹灰色 tint + 半透明灰色/紫色覆盖层，玩家保持彩色
- **钟表盘**：BootScene 预生成纹理（表盘 + 碎片），屏幕右上角显示，秒针 5 秒走一圈，颜色从金色→橙色→红色渐变
- **结束碎裂**：秒针到位 → 表盘碎裂成 6~8 块碎片飞散 + 灰度褪去 + 白闪 + camera shake

### 升级系统改动

- `UPGRADES[]` 新增分级卡：每张卡有 `maxLevel` 字段，apply 函数读取 `player.stats` 中的层级计数器
- `randomUpgrades()` 需要过滤已满级的升级卡
- 需要 `Player.stats` 新增追踪字段：`bulletTimeDurationLevel` / `bulletTimeSlowLevel` / `hasTimeStop`
- 升级系统需要检测解锁条件并注入时间暂停卡

### touches

- `src/config.js`（新增 UPGRADES 条目 + TIME_STOP 配置块）
- `src/scenes/BootScene.js`（表盘 + 碎片纹理）
- `src/scenes/GameScene.js`（fireTimeStop 方法 + useSkill 分支）
- `src/systems/Upgrades.js`（过滤满级卡 + 解锁检测 + 注入时间暂停卡）
- `src/entities/Player.js`（技能使用逻辑：time_stop 走 10s 冷却分支，不消耗 charges）
- `src/scenes/HUDScene.js`（解锁后 charge 行替换为冷却显示）

## Capabilities

### New Capabilities

- `warrior-time-stop`: 战士时间暂停技能，含分级升级路径、解锁条件检测、Za Warudo 效果（完全时间停止 + 钟表盘倒计时 + 碎裂特效）

### Modified Capabilities

- 升级系统：支持分级升级卡（maxLevel）和条件解锁卡

## Impact

### 受影响代码

- `src/config.js`：新增 TIME_STOP 配置块 + 2 张分级 UPGRADES 卡 + 1 张时间暂停卡
- `src/scenes/BootScene.js`：表盘纹理 + 碎片纹理生成
- `src/scenes/GameScene.js`：新增 `fireTimeStop()` 方法，灰度控制，碎裂动画
- `src/systems/Upgrades.js`：分级卡过滤 + 解锁检测逻辑
- `src/entities/Player.js`：`triggerSkill()` 分支（时间暂停消耗 3 充能）

### 新增文件

- 无（所有改动在现有文件中）

### 破坏性变更

- 无。子弹时间行为不变，时间暂停是解锁后的替换。

### 依赖

- 无外部依赖。纯 Phaser 内置 API。
