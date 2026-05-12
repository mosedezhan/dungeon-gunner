## 1. 素材准备

- [x] 1.1 拼接 chest spritesheet：将 `items and trap_animation/chest/chest_1~4.png` 水平拼接为 `assets/chest.png`
- [x] 1.2 拼接 chest_open spritesheet：将 `items and trap_animation/chest/chest_open_1~4.png` 水平拼接为 `assets/chest_open.png`
- [x] 1.3 拼接 flask_red spritesheet：将 `items and trap_animation/flasks/flasks_1_1~1_4.png` 水平拼接为 `assets/flask_red.png`
- [x] 1.4 BootScene preload：加载 chest / chest_open / flask_red spritesheet 并注册动画（chest_idle, chest_open, flask_red_idle）

## 2. Config 配置

- [x] 2.1 新增 `DROPS` 导出块到 config.js，包含 healthPotion（pickupRadius, magnetSpeed, healPercent, dropTable）和 chest（interactRadius, dropTable, rewards, rewardCount）

## 3. Player Buff 系统

- [x] 3.1 Player 新增 `buffs` Map 属性、`addBuff(type, durationMs, params)` 和 `removeBuff(type)` 方法
- [x] 3.2 Player.update() 中检查 buff 过期，还原 stats
- [x] 3.3 Player 新增 `heal(amount)` 方法（hp += amount, capped at maxHp）
- [x] 3.4 Buff 视觉反馈：damage_boost 红光、speed_boost 尘土、magnet_aura 蓝色光环

## 4. HealthPotion 实体

- [x] 4.1 创建 `src/entities/HealthPotion.js`，继承 Arcade.Sprite，实现 spawn/preUpdate/kill，磁力吸附逻辑
- [x] 4.2 GameScene.create() 新增 healthPotions 物理组（maxSize: 50）
- [x] 4.3 GameScene.create() 注册 overlap(player, healthPotions, onPickupHealthPotion)
- [x] 4.4 GameScene 实现 onPickupHealthPotion 回调：调用 player.heal()

## 5. Chest 实体

- [x] 5.1 创建 `src/entities/Chest.js`，继承 Arcade.Sprite，实现状态机（CLOSED/OPENING/REWARDED）、spawn/preUpdate/kill、互动提示标签
- [x] 5.2 GameScene.create() 新增 chests 物理组（maxSize: 20）
- [x] 5.3 GameScene.create() 注册 keydown-E 处理器，实现 getNearbyChest() 查找最近 CLOSED 宝箱
- [x] 5.4 GameScene 实现 onChestOpen(chest) 奖励分发：按 reward table 加权随机抽 2 个奖励并执行

## 6. 掉落逻辑集成

- [x] 6.1 修改 GameScene.handleEnemyDeath()：在现有 XP/SkillOrb 之后，按 DROPS.dropTable 概率掉落 HealthPotion 和 Chest
- [x] 6.2 实现按敌人类型查表逻辑：优先查具体类型 key，回退到 default

## 7. DebugScene 适配

- [x] 7.1 DebugScene Kill All 快捷键从 E 改为 X
- [x] 7.2 debug/registry.js 注册 HealthPotion 和 Chest 供 debug spawn

## 8. 验证

- [ ] 8.1 启动游戏，击杀普通敌人验证 HealthPotion 掉落和拾取回血
- [ ] 8.2 击杀敌人验证 Chest 掉落，走近按 E 开箱，确认奖励发放
- [ ] 8.3 击杀精英/Giant 验证高概率掉落宝箱和血瓶
- [ ] 8.4 验证 buff 视觉反馈（红光/尘土/蓝色光环）正确显示和过期消失
- [ ] 8.5 F1 打开 DebugScene 验证 X 键 Kill All 正常工作，E 键不再触发
