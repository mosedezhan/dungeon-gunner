## Context

当前敌人死亡掉落系统仅有 XPOrb（100%）和 SkillOrb（10%）两种，掉落逻辑硬编码在 `GameScene.handleEnemyDeath()` 中。所有掉落物使用相同的模式：`Phaser.Physics.Arcade.Sprite` + 物理组对象池 + 磁力吸附 + overlap 拾取。

敌人配置在 `ENEMY` 块中按类型定义（chaser/rusher/shooter/giant/bomber/mimic/elite_*），但当前掉落不区分敌人类型。

素材库 `items and trap_animation/` 中已有 chest（8帧：4关闭+4开启）和 flasks（4种颜色×4帧）的动画素材，可直接使用。

Player HP 数值很大（法师 100000，战士 120000），血瓶回复需用百分比。

## Goals / Non-Goals

**Goals:**
- 新增血瓶和宝箱两种掉落物，丰富战斗奖励反馈
- 宝箱通过 E 键互动开启，引入新的拾取模式
- 宝箱奖励表驱动，每次开箱随机发放 2 个奖励
- 临时 buff 系统（伤害/速度/磁力），为 Player 提供短时增益
- 按敌人类型差异化掉落概率（精英/Giant 掉好东西概率高）
- 宝箱实体解耦奖励逻辑，为后续宝箱流扩展留钩子

**Non-Goals:**
- 宝箱品质 tiers（普通/稀有/传说）— 后续宝箱流 change
- 诅咒事件、选择型奖励、连锁宝箱 — 后续宝箱流 change
- 金币/经济系统 — 不在本 scope
- 绿瓶/蓝瓶/金瓶（flasks_2/3/4）— 本次只用红色药水，其余留后续
- 掉落物之间的互相转化或合成

## Decisions

### D1: 掉落物复用现有实体模式

血瓶（HealthPotion）完全复用 XPOrb 的模式（磁力吸附 + overlap 自动拾取）。宝箱（Chest）引入新模式：无吸附 + E 键互动 + 状态机（CLOSED → OPENING → REWARDED → kill）。

**替代方案**：让所有掉落物都走 E 键互动。否决理由：血瓶/XP 球这类高频掉落如果都要按 E 拾取，会严重打断战斗节奏。

### D2: 宝箱互动不锁玩家

按 E 触发开箱后，玩家可以继续移动和攻击。宝箱播放开箱动画是宝箱自身的行为，不影响玩家输入。

**替代方案**：开箱时短暂锁定玩家（类似开锁动画）。否决理由：在密集战斗中被迫站定 400ms 会让玩家不愿意开箱。

### D3: 掉落概率表嵌入 config.js DROPS 块

每个掉落物类型有 `dropTable` 子对象，key 为敌人类型名（default/elite/giant/bomber/mimic），value 为掉落概率。`handleEnemyDeath` 中查表决定掉什么。

**替代方案**：在 ENEMY 配置的每个敌人类型里加 `drops: []` 数组。否决理由：多个敌人类型共享同一套掉落物配置，DROPS 块集中管理更清晰。

### D4: 临时 buff 通过 Player.stats 覆写实现

buff 生效时直接修改 `player.stats` 中的对应值（乘法叠加），记录原始值用于还原。同一类型 buff 刷新持续时间但不叠加。

**替代方案**：在伤害/移动计算处检查 `player.buffs` Map 做乘法。否决理由：散布在各处的 buff 检查难以维护，直接改 stats 集中在 buff 管理。

### D5: 宝箱奖励通过 GameScene.onChestOpen() 分发

Chest 实体在开箱动画结束后调用 `scene.onChestOpen(chest)`，由 GameScene 负责查奖励表、发奖励。这是宝箱流的扩展点——后续只需改此函数即可增加品质 tiers、诅咒、选择型奖励等。

### D6: DebugScene Kill All 从 E 改为 X

E 键在正常游戏中有宝箱互动功能。DebugScene 开启时 GameScene 暂停，理论上不冲突，但为防止边界情况（暂停/恢复时序）和用户认知混淆，将 debug 的 Kill All 移到 X 键。

### D7: 素材处理方式

从 `items and trap_animation/chest/` 和 `items and trap_animation/flasks/` 将单帧 PNG 拼接为水平 spritesheet 放入 `assets/` 目录（chest.png = chest_1~4 水平拼接，chest_open.png = chest_open_1~4 水平拼接，flask_red.png = flasks_1_1~1_4 水平拼接）。BootScene 中用 `load.spritesheet()` 加载。

## Risks / Trade-offs

- **[屏幕掉落物密度]** → 同时有 XP + Skill + HealthPotion + Chest 掉落，可能视觉杂乱。缓解：Chest 掉率低（2%），HealthPotion 中等（5%），且血瓶和宝箱尺寸/颜色与 XP 球明显不同。
- **[buff 叠加复杂度]** → 后续如果有多来源的同类 buff（升级卡 + 宝箱），需要明确叠加规则。缓解：当前同类 buff 只刷新时间不叠加，后续可在 buff 系统中扩展叠加策略。
- **[E 键时机]** → 玩家在移动中按 E 开箱，如果同时有多个宝箱在范围内，需决定开哪个。缓解：取最近的一个。
- **[handleEnemyDeath 扩展]** → 原本只掉 XP + SkillOrb，现在要查 2 个额外的掉落表。性能影响可忽略（只是 Math.random 判断）。
