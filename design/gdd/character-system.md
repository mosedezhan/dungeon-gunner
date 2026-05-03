# 角色系统 GDD

## 1. 概述

定义玩家角色的职业选择机制和核心属性。玩家在游戏开始时选择战士或法师，不同职业拥有不同的攻击方式、基础属性和成长方向。

## 2. 玩家幻想

战士玩家想要"冲进敌群一刀扫一片"的力量感。法师玩家想要"站在远处安全输出"的掌控感。两个职业体验差异明显，不是数值差异。

## 3. 详细规则

### 职业选择
- 游戏开始时显示职业选择界面
- 展示战士和法师的图标、简介
- 选择后进入游戏，本局不可更换

### 基础属性

| 属性 | 说明 | 战士 | 法师 |
|------|------|------|------|
| maxHp | 最大生命值 | 150 | 80 |
| moveSpeed | 移动速度（px/s） | 160 | 180 |
| damage | 基础伤害 | 25 | 10 |
| attackType | 攻击类型 | 近战扇形 | 远程子弹 |
| attackRange | 攻击距离（px） | 80 | 全屏 |
| attackAngle | 攻击角度（仅战士） | 180° | 不适用 |
| fireRateMs | 攻击间隔（ms） | 400 | 280 |
| invulnMs | 受伤无敌帧（ms） | 400 | 400 |

### 共同机制
- 等级从 1 开始
- 升级时通过卡牌系统获得强化
- 受伤后有无敌帧
- 死亡触发 GameOver

### 攻击参数（数据驱动）

攻击系统完全数据化，卡牌通过修改这些参数生效。

#### 战士攻击参数

| 参数 | 默认值 | 说明 | 可被卡牌修改 |
|------|--------|------|------------|
| damage | 25 | 每次挥砍伤害 | 是（力量+5、猛击+6） |
| attackAngle | 180 | 挥砍扇形角度（°） | 是（猛击+15°，旋风斩→360°） |
| attackRange | 80 | 挥砍距离（px） | 是（战意+20px） |
| fireRateMs | 400 | 攻击间隔（ms） | 是（嗜血狂战按HP缩放） |
| knockback | 0 | 击退距离（px） | 可扩展 |
| leaveTrail | false | 挥砍是否留下地面效果 | 是（裂地斩→true） |
| trailDamage | 0 | 地面效果每秒伤害 | 是（裂地斩设置） |

#### 法师攻击参数

| 参数 | 默认值 | 说明 | 可被卡牌修改 |
|------|--------|------|------------|
| damage | 10 | 每颗子弹伤害 | 是（魔力+3） |
| bulletSpeed | 260 | 子弹速度（px/s） | 可扩展 |
| fireRateMs | 280 | 攻击间隔（ms） | 是（快速装填-30ms，连射-50ms） |
| bulletCount | 1 | 每次发射子弹数 | 是（弹幕风暴→3） |
| spreadAngle | 0 | 多子弹扇形角度（°） | 是（弹幕风暴设30°） |
| piercing | 0 | 可穿透敌人数 | 是（穿透弹→1） |
| bulletBehavior | 'straight' | 子弹行为 | 可扩展（预留追踪等） |
| explodeOnHit | false | 命中后是否爆炸 | 是（爆裂弹→true） |
| explosionRadius | 0 | 爆炸范围（px） | 是（爆裂弹设40） |
| explosionDamageRatio | 0 | 爆炸伤害比 | 是（爆裂弹设0.6） |
| splitOnHit | false | 命名后是否分裂 | 是（分裂弹→true） |
| splitCount | 0 | 分裂数量 | 是（分裂弹设2） |
| splitDamageRatio | 0 | 分裂弹伤害比 | 是（分裂弹设0.4） |

### 状态效果列表

角色可同时附带多种状态施加能力，每种独立判定。数据结构为数组，卡牌向数组中添加条目。

```
statusEffects: [
  { type: 'burn',  chance: 0.3, stacks: 1 },  // 灼烧之触
  { type: 'freeze', chance: 0.3 },              // 冰霜之触
  { type: 'bleed', chance: 0.3, stacks: 1 }     // 流血之触
]
```

默认状态：`[]`（空数组，无任何状态施加能力）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | string | 状态类型：burn / freeze / bleed / stun |
| chance | number | 每次命中触发概率（0-1） |
| stacks | number | 触发时施加的层数（默认 1） |

命中判定：攻击命中敌人时，遍历数组中每个条目，独立随机判定是否施加。

### 触发器列表

角色可同时注册多个触发器，同一事件触发时所有已注册触发器独立执行。数据结构为数组。

```
triggers: {
  onKill:   [ 'lifesteal', 'chainReaction', 'warFury' ],
  onHit:    [ 'shockHit', 'earthquake', 'burnSpread' ],
  onDamaged: [ 'counterAttack' ],
  onLowHp:  [ 'desperation' ],
  onStatusApply: []
}
```

默认触发器：所有事件均为空数组。

| 触发器事件 | 触发时机 | 卡牌示例 |
|-----------|---------|---------|
| onKill | 玩家击杀敌人 | 嗜血（回血）、连锁反应（冲击波）、战意（+range） |
| onHit | 玩家攻击命中敌人 | 震荡打击（眩晕）、震地（减速）、灼烧蔓延（传播） |
| onDamaged | 玩家受到伤害 | 反击（周围 AOE 伤害） |
| onLowHp | 玩家 HP 低于 30% | 绝境爆发（伤害×1.8、移速+40%） |
| onStatusApply | 对敌人施加状态效果 | 预留扩展 |

### 防御参数

| 参数 | 默认值（共用） | 说明 | 可被卡牌修改 |
|------|--------------|------|------------|
| damageReduction | 0 | 受伤减少量（最低 1 点伤害） | 是（坚韧-3，不死狂战随HP缩放） |
| invulnMs | 400 | 受伤后无敌帧（ms） | 否 |
| immortalUsed | false | 不死本能是否已使用 | 是（不死本能→true，每局 1 次） |

### 状态效果与触发器协作

详见卡牌系统 GDD。核心流程：

1. 攻击命中 → 遍历 statusEffects 数组，独立判定施加状态
2. 施加状态时 → 检查 onStatusApply 触发器
3. 冰冻替换灼烧时 → 检查热胀冷缩联动
4. 击杀敌人时 → 遍历 onKill 触发器数组，全部执行
5. 命中敌人时 → 遍历 onHit 触发器数组，全部执行

## 4. 公式

### 受伤计算
```
actualDamage = max(1, incomingDamage - damageReduction)
player.hp -= actualDamage

if player.hp <= 0:
    if immortalUsed == false and hasImmortalInstinct:
        player.hp = 1
        immortalUsed = true
        // 触发不死本能 5 秒强化
    else:
        player.die()
```

### 触发器执行流程
```
onAttackHit(enemy):
    foreach status in statusEffects:
        if random() < status.chance:
            applyStatus(enemy, status.type, status.stacks)
            executeTriggers('onStatusApply', enemy)
    executeTriggers('onHit', enemy)

onEnemyKill(enemy):
    executeTriggers('onKill', enemy)

onPlayerDamaged(damageSource):
    executeTriggers('onDamaged', damageSource)

// onLowHp 在每次受伤后检查
afterDamage():
    if player.hp / player.maxHp < 0.3:
        executeTriggers('onLowHp')
```

### 移动
```
velocity = normalize(inputDirection) × moveSpeed
```

8 方向移动，对角线已归一化。

## 5. 边缘情况

- **同时选择**：UI 保证只能选一个，不允许双选
- **切换职业**：本局不可切换，需重新开始
- **属性溢出**：升级卡牌可能让属性超过预期上限，暂不设硬上限
- **受伤时攻击**：无敌帧期间仍可攻击

## 6. 依赖

### 上游依赖
- **移动与输入**：控制角色移动

### 下游依赖
- **战士攻击 / 法师攻击**：各职业的具体攻击实现，使用数据驱动参数
- **卡牌系统**：升级时通过修改攻击参数（attackAngle、bulletCount 等）强化角色
- **状态效果系统**：角色攻击可附带状态施加（灼烧、冰冻、流血、眩晕）
- **触发器系统**：角色攻击可注册 onKill、onHit 等触发器
- **HUD**：显示当前血量、等级

## 7. 可调参数

| 参数 | 战士默认 | 法师默认 | 调整影响 |
|------|---------|---------|---------|
| maxHp | 150 | 80 | 职业生存能力 |
| moveSpeed | 160 | 180 | 走位手感 |
| damage | 25 | 10 | 单次伤害/秒伤 |
| fireRateMs | 400 | 280 | 攻击频率 |
| attackRange | 80 | ∞ | 输出距离 |
| attackAngle | 180° | — | 战士打击面 |
| invulnMs | 400 | 400 | 受伤保护窗口 |
| damageReduction | 0 | 0 | 防御成长起点 |

## 8. 验收标准

- [ ] 游戏开始时显示职业选择界面（战士/法师）
- [ ] 选择战士后，角色属性为战士配置
- [ ] 选择法师后，角色属性为法师配置
- [ ] 移动速度、血量、伤害等属性生效
- [ ] 受伤后有无敌帧（约 400ms）
- [ ] 血量归零触发死亡
- [ ] 受伤计算考虑 damageReduction（最低 1 点伤害）
- [ ] 攻击命中时遍历 statusEffects 数组，独立判定每种状态
- [ ] 同一事件触发时，所有已注册触发器独立执行
- [ ] onKill / onHit / onDamaged / onLowHp 触发器各在正确时机执行
