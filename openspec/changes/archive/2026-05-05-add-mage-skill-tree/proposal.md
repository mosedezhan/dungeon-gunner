## Why

法师的冲击波（shockwave）技能目前是一个固定参数的一次性效果（120px 范围、20% maxHp 伤害、480 击退），没有成长空间。每次释放体验完全一致，缺乏长期追求。

引入附加效果型升级卡 + 终极大招共存机制：通过两张可重复升级的卡片（冰霜新星：减速 / 法力虹吸：XP 吸取）为冲击波叠加不同行为层，两者总等级 ≥ 3 时解锁「奥术风暴」——5 次递增范围的冲击波脉冲，继承两张升级卡的效果。与战士的"替换"模式不同，奥术风暴与基础冲击波共存，消耗 3 充能触发，保留了"多放小招 vs 攒大招"的战术取舍。

## What Changes

### 附加效果型升级卡（混入现有 UPGRADES 池）

- **冰霜新星（Frost Nova）**：2 级，冲击波命中的敌人被减速 N 秒，每级减速效果递增（slowFactor 0.5 → 0.35），classes: mage
- **法力虹吸（Mana Siphon）**：2 级，冲击波命中时从敌人身上吸取 XP——绿色能量线 + 金色 XP 球飞向玩家，每级额外 XP 量递增，classes: mage

### 终极大招：奥术风暴（Arcane Storm）

- **解锁条件**：冰霜新星等级 + 法力虹吸等级 ≥ 3（如 霜2+吸1、霜1+吸2、霜2+吸2）
- **首次出现**：满足条件时 100% 刷新奥术风暴卡；跳过后混入普通升级池正常概率刷新
- **资源模型**：与基础冲击波共存，消耗 3 充能触发。当充能 ≥ 3 且已解锁时，Q 键释放奥术风暴；否则释放普通冲击波
- **技能效果**：5 次冲击波脉冲，范围逐次递增（120→160→200→240→280），每次间隔 0.8 秒。每次脉冲继承冰霜新星和法力虹吸的效果
- **视觉**：每次脉冲产生紫色冲击环 + 屏幕中央持续能量漩涡动画 + 脉冲计数 UI

### 视觉签名

每种效果有独立颜色，同时触发互不混淆：

- 基础冲击波：白色扩散环
- 冰霜新星：蓝色冰晶扩散 + 敌人变蓝/减速
- 法力虹吸：绿色光线从敌人 → 玩家 + 金色 XP 球飞回 + 敌人闪绿光
- 奥术风暴：紫色脉冲环 + 能量漩涡

### 升级系统改动

- `UPGRADES[]` 新增分级卡：`maxLevel` + `levelStat`，和战士同模式
- `randomUpgrades()` 的 `requires` 机制复用，检查冰霜 + 虹吸总等级
- `Player.stats` 新增追踪字段：`frostLevel` / `siphonLevel` / `hasArcaneStorm`
- `fireShockwave()` 增强为读取 stats 中的附加效果层
- `handleEnemyDeath()` 中的 XP 生成逻辑需支持虹吸额外掉落

### touches

- `src/config.js`（新增 UPGRADES 条目 + ARCANE_STORM 配置块 + 虹吸 XP 参数）
- `src/scenes/BootScene.js`（能量漩涡纹理 + 虹吸光线粒子纹理）
- `src/scenes/GameScene.js`（fireShockwave 增强附加效果 + fireArcaneStorm 脉冲逻辑 + 虹吸 VFX）
- `src/systems/Upgrades.js`（解锁条件检测 + 奥术风暴卡注入）
- `src/entities/Player.js`（triggerSkill 分支：充能 ≥ 3 时释放奥术风暴）
- `src/scenes/HUDScene.js`（充能满时显示奥术风暴就绪提示）

## Capabilities

### New Capabilities

- `mage-skill-tree`: 法师技能升级体系，含冰霜新星/法力虹吸附加效果卡、奥术风暴终极大招、共存式充能消耗模型

### Modified Capabilities

- 升级系统：复用分级卡 + 条件解锁机制（已有 maxLevel/requires 模式）
- 冲击波技能：从固定效果增强为可叠加附加效果层的模块化技能

## Impact

### 受影响代码

- `src/config.js`：新增 ARCANE_STORM 配置块 + 2 张分级 UPGRADES 卡 + 1 张奥术风暴卡
- `src/scenes/BootScene.js`：漩涡纹理 + 虹吸粒子纹理生成
- `src/scenes/GameScene.js`：fireShockwave 增强附加效果 + fireArcaneStorm 新方法
- `src/systems/Upgrades.js`：奥术风暴解锁检测 + 卡注入
- `src/entities/Player.js`：triggerSkill 中判断充能门槛
- `src/scenes/HUDScene.js`：充能 ≥ 3 时奥术风暴就绪提示

### 新增文件

- 无（所有改动在现有文件中）

### 破坏性变更

- 无。基础冲击波行为不变，附加效果和解锁大招是增量扩展。

### 依赖

- 无外部依赖。纯 Phaser 内置 API。
