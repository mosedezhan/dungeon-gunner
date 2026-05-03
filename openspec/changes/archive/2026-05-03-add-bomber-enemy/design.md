## Context

游戏有四种敌人（Chaser / Rusher / Shooter / Giant），威胁类型覆盖持续接触、高速追击、远程弹幕、可读前摇 AOE。所有敌人的最优应对都是"尽快击杀"——缺少"击杀决策"维度。

战士职业（近战 swingRange=80px）已实现。Bomber 的 triggerRange（~180px）远大于战士攻击距离，战士每次近战输出都要进入 bomber 的触发范围，形成高风险博弈。Bullet Time 和提前击杀是战士的主要应对手段。

**约束条件：**
- 无外部美术资源，所有视觉必须 BootScene 程序化生成
- 弹射期间不可被击杀——用 body.enable=false 或 takeDamage 检查实现
- 不可破坏现有敌人行为
- 命名空间必须对齐 `src/entities/CLAUDE.md` 的四字段约定

## Goals / Non-Goals

**Goals:**
- Bomber 成为第五种敌人，以"蓄力 → 弹射 → 爆炸"突袭型 AOE 为核心差异化机制
- windUp 期间持续跟踪玩家位置，创造"读方向 + 假动作"对抗
- 被玩家击杀不爆炸（正常掉落），自爆则不掉落——创造击杀激励
- 低 HP（~18），鼓励快速击杀，战士 base damage 刚好一刀秒（W6 无倍率时）
- 红橙色系，填补色环空白

**Non-Goals:**
- 分裂变体（小炸弹分裂）——留给后续 change
- 抛物线弹道——直线弹射
- 新增升级卡——升级池扩展走单独 change

## Decisions

### 1. 三拍状态机（windUp / leap / explode），比 Giant 的四拍更短更急

**选择**：Bomber 实例持有 `state` 字段（`'idle' | 'windup' | 'leaping'`），`preUpdate` 内部 switch-state 驱动。

```
时间线:
  0         300ms         450ms
  │───────────│───────────│
  │  windUp   │   leap    │ explode
  │  跟踪玩家 │  弹射     │ 爆炸 + 销毁
  │  闪红抖动 │  不可击杀 │
```

**理由**：
- 比 Giant 的四拍更短（总共 450ms vs 1000ms），体现"突袭"感
- 没有 recovery 阶段——爆炸即销毁，一锤子买卖
- windUp 是唯一击杀窗口，300ms 比 Giant 的 400ms 更紧张

### 2. windUp 期间持续更新目标位置，起跳时锁定

**选择**：windUp 每帧记录玩家当前位置到 `_leapTarget`，状态切换到 `leaping` 时使用最后一个 `_leapTarget` 作为目标。

**理由**：
- 如果在 windUp 开始时锁定位置，玩家只要一开始就侧移就能轻松躲避——没有对抗感
- 持续跟踪意味着玩家需要在 windUp 最后一刻改变方向才能"假动作"骗过 bomber
- 实现简单：每帧 `this._leapTarget.set(player.x, player.y)`，leap 时读这个值

### 3. 弹射用 tween 移动，而非 velocity

**选择**：leap 开始时，创建 tween 将 bomber 的 position 从当前位置移动到 `_leapTarget`，持续 `leapDurationMs`（~150ms）。

**理由**：
- velocity 会受到 drag、slowFactor、knockback 的影响，导致弹射轨迹不可控
- tween 保证在精确时间内到达精确位置
- 弹射期间关闭 body.enable（不可被击杀、不触发接触伤害），tween 结束后触发爆炸

**替代方案**：
- 用 setVelocity 一次冲过去：rejected，受 drag 衰减影响，距离不精确

### 4. 弹射期间不可被击杀，用 body.enable=false

**选择**：leap 开始时 `this.body.enable = false`，爆炸时不再恢复（直接销毁）。

**理由**：
- 关闭 body 后，物理 overlap 回调不再触发，子弹碰撞和接触碰撞都自动失效
- 不需要修改 `takeDamage` 或碰撞回调——物理层面就隔绝了
- 与"弹射中无敌"的视觉直觉一致（bomber 在空中飞，子弹穿过很合理）

### 5. 双路径死亡：击杀 vs 自爆

**选择**：
- **被击杀**（`takeDamage` → HP <= 0 → `die()`）：正常死亡动画（缩放淡出）+ `handleEnemyDeath`（掉 XP/SkillOrb）。不爆炸。
- **自爆**（leap tween `onComplete` → `_explode()`）：爆炸 VFX + 距离检测玩家伤害 + `destroy()`。不调 `handleEnemyDeath`（不掉落）。

**理由**：
- 自爆 = 亏 XP → 强激励玩家提前击杀
- 不掉 SkillOrb 避免玩家故意引诱自爆来刷技能充能
- 击杀掉 XP + 不爆炸 = 奖励精准操作

### 6. 爆炸 VFX：复用 slam_impact 纹理 + 额外白色闪光

**选择**：爆炸时创建 `slam_impact` sprite（已有纹理）+ 一个短暂白色圆形闪光（用 Graphics 动态绘制）。

**理由**：
- 不需要新增纹理——`slam_impact` 已在 Giant change 中创建
- 白色闪光（1-2 帧）传达"爆炸"的瞬时感，与 Giant 的冲击波有视觉区分
- 减少纹理数量，BootScene 改动最小化

### 7. 波次安排：W6 首现，W8 加量，W9 再加

**选择**：
```
W6: mix.push(Bomber)   // 首次出现，教学窗口
W8: mix.push(Bomber)   // 加量
W9: mix.push(Bomber)   // 密集期
```

**理由**：
- W6 时 Giant（W5）已被熟悉，bomber 引入新威胁（突袭型）不与 Giant 抢注意力
- bomber HP 低（18），W6 无倍率时一刀即死，教学友好
- W8 加量时 HP 倍率 2.05，18 → 37 HP，战士需要 2 刀——压力自然上升

## Risks / Trade-offs

### Risk 1: 弹射 tween 期间场景暂停（UpgradeScene / PauseScene）会导致 tween 也暂停

**Mitigation**: tween 跟随 scene 的时间系统，暂停时自然冻结。恢复后继续弹射，行为正确。

### Risk 2: 如果玩家站在原地不动，bomber 的弹射必中

**Mitigation**: 这是设计意图——bomber 惩罚"站着不动"。当前其他敌人（Chaser/Rusher）也惩罚站着不动，但 bomber 的惩罚更突然更重（25 伤 AOE）。玩家需要在 windUp 的 300ms 内移动。

### Risk 3: 多个 bomber 同时 windUp + 弹射，形成无法躲避的覆盖

**Mitigation**: spawn 频率较低（W6/W8/W9 各一档），同屏 bomber 数量有限。WaveManager 的随机抽取也降低了连续 bomber 的概率。若实测出现无解覆盖，可增加 bomber 之间的 windUp 错开机制，但不在本 change 范围。

### Risk 4: bomber HP=18 与战士 damage=18 刚好一刀，但 wave 倍率很快打破这个平衡

**Mitigation**: W6 无倍率时一刀秒是教学体验。W7+ 需要 upgrade 支撑（damage+25% 等），这是自然的难度曲线。如果战士觉得后期 bomber 太难处理，可在后续 change 增加"挥砍打断 windUp"机制。

### Trade-off: leap 用 tween 而非 velocity，与 Enemy 基类的 setVelocity/slowFactor 模式不同

Enemy 基类重写了 `setVelocity` 以支持 bullet_time slowFactor。bomber 的 leap 不走 velocity，不受 slowFactor 影响——弹射速度始终一样。这是有意为之：leap 已经很快（150ms），如果再被 slowFactor 拉长到 500ms，突袭感就消失了。bullet_time 对 bomber 的价值在于延长 windUp（300ms → ~1000ms），给战士更多反应时间，而非减慢弹射本身。

windUp 的时长判定按 slowFactor 缩放（与 Giant 相同模式）：`cfg.windUpMs / slowFactor`。leap 的 tween duration 不缩放。
