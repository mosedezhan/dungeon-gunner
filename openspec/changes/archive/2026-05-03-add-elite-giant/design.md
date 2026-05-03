## Context

Giant 使用四拍状态机（idle → windup → swing → impact → recovery），idle 阶段缓慢追踪玩家，进入 slamTriggerRange 后站定蓄力。精英版本的核心差异是在蓄力前加入不可打断的冲刺。

**约束条件：**
- 继承 `Giant`，复用其四拍状态机的 windup/swing/impact/recovery 阶段
- 冲刺是新增的中间状态，不破坏现有状态机流转
- 精英视觉层（黑身红眼 + 黑烟 + 大体型）复用已有 `elite_eye` / `elite_smoke` 纹理
- 命名空间对齐 `src/entities/CLAUDE.md` 四字段约定

## Goals / Non-Goals

**Goals:**
- EliteGiant 在中距离时向玩家冲刺，冲完直接衔接砸地
- 冲刺不可打断（类似 Bomber 的 leap），给玩家紧迫感
- 共享精英视觉层

**Non-Goals:**
- 修改普通 Giant 行为
- 冲刺过程中造成伤害（冲完才砸地）
- 多段砸地或其他复杂变体

## Decisions

### 1. 继承 Giant，新增 dash 状态

**选择**：`EliteGiant extends Giant`，重写 `preUpdate`，在 idle 阶段插入 dash 逻辑。

**状态机变化：**

```
普通 Giant:
  idle → windup → swing → impact → recovery → idle

精英 Giant:
  idle → dash → windup → swing → impact → recovery → idle
         ↑
  距离 ≤ dashTriggerRange 且 dash 冷却完成
```

**理由：**
- 只需新增一个 `dash` 状态，windup → recovery 完全复用基类
- dash 结束后设 `this.slamState = 'windup'` 并调用 `this._createWarningCircle()`，无缝衔接

### 2. 冲刺实现：velocity + 定时器

**选择**：dash 状态期间用 `setVelocity` 向玩家方向高速移动，持续 `dashDurationMs` 后停下并进入 windup。

```
dash 触发:
  1. 记录目标角度 = atan2(player.y - this.y, player.x - this.x)
  2. setVelocity(cos(angle) * dashSpeed, sin(angle) * dashSpeed)
  3. dashEndAt = time + dashDurationMs

dash 结束:
  1. setVelocity(0, 0)
  2. slamState = 'windup'
  3. slamStartAt = time
  4. _createWarningCircle()
```

**理由：**
- velocity 方案与 Giant 其他状态的移动方式一致
- 冲刺期间免疫击退（基类 `knockback()` 在非 idle 时已经 return，dash 继承此行为）
- dashDurationMs 控制冲刺距离：dashSpeed × dashDurationMs / 1000

### 3. 冲刺参数

| 参数 | 值 | 说明 |
|---|---|---|
| dashTriggerRange | 220 | 比普通 Giant 的 slamTriggerRange(130) 远，提前触发冲刺 |
| dashSpeed | 280 | 约 Giant 移速(38) 的 7.4 倍，明显快但不是瞬移 |
| dashDurationMs | 350 | 冲刺持续 ~0.35s，实际冲刺距离 ~98px |
| dashCooldownMs | 3000 | 与普通 Giant 的 slamCooldownMs 一致 |

**理由：**
- 冲刺距离 ~98px 足以从 dashTriggerRange(220) 进入 slamRadius(90) 附近
- 350ms 让玩家有短暂反应时间（看到精英冲过来），但不至于轻松走开
- 冷却 3s 确保不会连续冲刺

### 4. Bullet Time 兼容

dash 阶段的持续时间按 `scene.slowFactor` 缩放：
```javascript
if (time - this.dashStartAt >= cfg.dashDurationMs / sf)
```
velocity 由 `Enemy.setVelocity` 的 `slowFactor` 缩放自动处理。

### 5. 冲刺视觉反馈

冲刺时加一个简单的拖影效果——每 50ms 生成一个半透明残影 sprite，快速淡出。与 Bomber 的 trail 同模式。

### 6. 共通精英视觉层

- **黑色 tint**：`this.setTintFill(0x222222)`
- **红眼**：复用 `elite_eye` 纹理，2 个 eye sprite 跟随主体位置
- **scale 3.6**：普通 Giant scale=3.0，+20%
- **黑烟粒子**：复用 `elite_smoke` 纹理，每 200ms 生成一个

### 7. 命名空间

| 字段 | 值 |
|---|---|
| `id` | `elite_giant` |
| `texture_keys` | 复用 `giant_a` |
| `anim_keys` | 复用 `giant_walk` |
| `config_block` | `ENEMY.elite_giant` |

## Risks / Trade-offs

### Risk 1: 冲刺 + 砸地连招可能导致近战玩家难以躲避

**Mitigation**: 冲刺距离有限（~98px），且冲刺方向锁定（不追踪），玩家可以向侧面闪避。EliteGiant HP 较高，战士可以利用多次击退打断 idle 阶段阻止冲刺触发。

### Risk 2: EliteGiant scale 3.6 + dash 速度可能导致碰撞体偏移

**Mitigation**: 构造函数重设 `body.setCircle` 确保物理体正确。

### Risk 3: 重写 preUpdate 可能遗漏基类的某个状态处理

**Mitigation**: dash 状态只在 idle 条件分支中插入，windup/swing/impact/recovery 直接走基类 super.preUpdate()。
