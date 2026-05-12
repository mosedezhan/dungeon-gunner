## Why

当前敌人死亡只掉落 XPOrb（100%）和 SkillOrb（10%），掉落物种类单一，缺乏战斗节奏中的"惊喜感"和策略性。引入血瓶、宝箱等新掉落物，以及宝箱 E 键互动机制和临时 buff 系统，能丰富战斗循环中的奖励反馈，为后续"宝箱流"（开箱事件链、品质系统等）打下扩展基础。

## What Changes

- 新增 **HealthPotion** 掉落实体（红色药水，磁力吸附，满血也捡，回复 20% maxHp）
- 新增 **Chest** 掉落实体（宝箱，E 键互动开启，不吸附，播放开箱动画后发放奖励）
- 新增 **DROPS** 配置块（config.js），集中管理所有掉落物的掉率、参数、奖励表
- 新增 **宝箱奖励表**：xp_burst / skill_charge / heal / damage_boost / speed_boost / magnet_aura，每次开箱随机抽 2 个
- 新增 **临时 Buff 系统**：Player 支持 addBuff(type, duration) 并在 update 中管理过期和 stats 还原
- 修改 **handleEnemyDeath**：使用概率表按敌人类型差异化掉落（精英/Giant 宝箱概率高，Bomber 低）
- 修改 **DebugScene**：Kill All 快捷键从 E 改为 X（为宝箱 E 键让路）
- 加载外部素材：chest spritesheet（idle + open 各 4 帧）、flask spritesheet（红色 4 帧）从 `items and trap_animation/` 导入

## Capabilities

### New Capabilities
- `health-potion`: 红色药水掉落实体，磁力吸附拾取，回复百分比生命值
- `chest-drop`: 宝箱掉落实体，E 键互动开启，奖励表驱动，为宝箱流留扩展钩子
- `player-buffs`: 临时增益系统，Player 可持有限时 buff（伤害/速度/磁力范围），自动过期还原

### Modified Capabilities
- `debug-panel`: Kill All 快捷键从 E 改为 X

## Impact

- **config.js**: 新增 `DROPS` 导出块（healthPotion / chest 配置）
- **GameScene**: 新增 2 个物理组（healthPotions / chests）、新增 overlap 回调、E 键绑定、`onChestOpen()` 奖励分发、`getNearbyChest()` 距离检测、`handleEnemyDeath()` 扩展掉落逻辑
- **Player**: 新增 `buffs` Map、`addBuff()`、`removeBuff()`、`heal()`、update 中 buff 过期检查
- **BootScene**: 加载 chest/flask spritesheet 并注册 idle + open 动画
- **DebugScene**: E → X 键重映射
- **debug/registry.js**: 注册 HealthPotion / Chest 供 debug spawn
- **素材**: 从 `items and trap_animation/chest/` 和 `items and trap_animation/flasks/` 复制到 `assets/` 目录并制作 spritesheet
