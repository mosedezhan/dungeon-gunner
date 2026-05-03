# 战士攻击系统 GDD

## 1. 概述

定义战士的近战扇形挥砍攻击机制。战士朝鼠标方向挥砍，对攻击范围内所有敌人造成伤害。所有攻击参数数据驱动，卡牌通过修改参数改变攻击行为（角度、范围、频率等）。

## 2. 玩家幻想

按住鼠标，战士朝着光标方向一刀扫过去，面前一片敌人同时受伤。拿到旋风斩后变成 360° 旋风，身边没有死角。拿到裂地斩后每刀留下火焰地面，走哪烧哪。攻击反馈爽快——挥砍有视觉弧线，命中敌人有击中特效。

## 3. 详细规则

### 基础攻击行为

- 按住鼠标左键时按 fireRateMs 间隔自动挥砍
- 每次挥砍朝当前鼠标方向（attackAngle）
- 挥砍为瞬间判定，无持续时间（不是持续碰撞）
- 每次挥砍对范围内所有敌人各造成一次 damage

### 扇形判定

- 挥砍判定区域：以角色为中心，attackRange 为半径，attackAngle 为张角的扇形
- 扇形中心轴 = attackDirection（角色到鼠标方向）
- 扇形左边界 = attackDirection - attackAngle/2
- 扇形右边界 = attackDirection + attackAngle/2
- 敌人中心点在扇形内 = 命中

### 命中判定公式
```
对每个敌人：
1. distance = 敌人中心到角色中心的距离
2. 如果 distance > attackRange → 未命中
3. angleToEnemy = atan2(enemy.y - player.y, enemy.x - player.x)
4. angleDiff = abs(normalizeAngle(angleToEnemy - attackDirection))
5. 如果 angleDiff <= attackAngle / 2 → 命中
```

### 命中后处理（按顺序）

1. 对敌人造成 damage 点伤害（考虑流血增伤等）
2. 遍历 statusEffects 数组，独立判定施加状态
3. 如果 leaveTrail == true，在挥砍位置生成地面效果
4. 遍历 triggers.onHit，执行所有命中触发器
5. 如果敌人死亡：遍历 triggers.onKill，执行所有击杀触发器

### 攻击参数（默认值）

| 参数 | 默认值 | 说明 |
|------|--------|------|
| damage | 25 | 每次挥砍伤害 |
| attackAngle | 180° | 挥砍扇形张角 |
| attackRange | 80px | 挥砍判定距离 |
| fireRateMs | 400ms | 攻击间隔 |
| knockback | 0 | 击退距离 |

### 攻击参数修改示例（卡牌影响）

| 卡牌 | 修改 |
|------|------|
| 力量 | damage +5 |
| 猛击 | damage +6, attackAngle +15° |
| 旋风斩 | attackAngle → 360° |
| 战意（触发时） | attackRange +20px（3 秒） |
| 嗜血狂战 | fireRateMs 按 HP 缩放减少 |
| 裂地斩 | leaveTrail → true, trailDamage → 8/s |

### 地面效果（裂地斩）

- leaveTrail 为 true 时，每次挥砍在角色前方生成地面效果
- 地面效果为圆形区域，半径 30px，持续 3 秒
- 区域内敌人每秒受到 trailDamage 点伤害
- 多个地面效果可重叠，伤害独立计算
- 地面效果位置 = 角色中心 + attackDirection × attackRange × 0.5

### 击退（预留）

- knockback > 0 时，命中敌人沿角色到敌人方向被推开
- 当前无卡牌设置击退，参数预留

## 4. 公式

### 扇形判定
```
function isInArc(playerPos, enemyPos, direction, range, angle):
    dx = enemyPos.x - playerPos.x
    dy = enemyPos.y - playerPos.y
    distance = sqrt(dx² + dy²)

    if distance > range:
        return false

    angleToEnemy = atan2(dy, dx)
    angleDiff = angleToEnemy - direction
    angleDiff = atan2(sin(angleDiff), cos(angleDiff))  // 归一化到 [-π, π]

    return abs(angleDiff) <= angle / 2

变量：
- playerPos: 角色中心坐标
- enemyPos: 敌人中心坐标
- direction: 攻击方向（弧度）
- range: attackRange（px）
- angle: attackAngle（弧度）
```

### DPS 计算
```
dps = damage × (1000 / fireRateMs)

示例（默认值）：
- 25 × (1000 / 400) = 62.5 DPS

卡牌影响示例：
- 力量×3 + 猛击: damage = 25+15+6 = 46
- 50% HP 嗜血狂战: fireRateMs = 300ms
- DPS = 46 × (1000/300) = 153.3
```

### 地面效果伤害
```
trailRadius = 30px
trailDuration = 3s
trailDamagePerSecond = trailDamage（默认 0，裂地斩设为 8）

单个地面效果总伤害 = trailDamage × trailDuration = 8 × 3 = 24
```

## 5. 边缘情况

- **多个敌人在同一位置**：各自独立判定命中，各自受伤
- **敌人在扇形边缘**：判定使用敌人中心点，非碰撞体积
- **挥砍瞬间敌人移出范围**：判定在挥砍瞬间快照，已移出的不命中
- **攻击间隔内移动**：移动不影响挥砍判定，攻击继续按间隔触发
- **360° 挥砍（旋风斩）**：angleDiff 判定始终 <= 180°，所有在距离内的敌人都命中
- **fireRateMs 降到极低**：嗜血狂战最低 fireRateMs = 400 × 0.6 = 240ms，不会无限快
- **地面效果重叠**：多个火焰区域伤害独立计算，同一敌人可受多个区域伤害
- **卡牌动态修改 attackRange**：战意的 +20px 是临时 buff（3 秒），到期后恢复
- **受伤时挥砍**：无敌帧不影响攻击，受伤期间仍可挥砍

## 6. 依赖

### 上游依赖
- **角色系统**：提供攻击参数（damage, attackAngle, attackRange, fireRateMs 等）
- **移动与输入**：提供攻击方向（attackDirection）和攻击触发信号
- **卡牌系统**：运行时修改攻击参数

### 下游依赖
- **敌人系统**：敌人接收伤害和状态效果
- **掉落物系统**：敌人死亡时触发掉落
- **HUD**：挥砍视觉效果、命中反馈

## 7. 可调参数

| 参数 | 默认值 | 安全范围 | 影响方面 |
|------|--------|---------|---------|
| damage | 25 | 10-50 | 单次伤害 |
| attackAngle | 180° | 90-360° | 打击面 |
| attackRange | 80px | 40-150 | 输出距离 |
| fireRateMs | 400ms | 200-800 | 攻击频率 |
| 地面效果半径 | 30px | 20-60 | 裂地斩覆盖 |
| 地面效果持续时间 | 3s | 2-5 | 裂地斩持续 |
| 地面效果每秒伤害 | 8 | 4-15 | 裂地斩伤害 |

## 8. 验收标准

- [ ] 按住鼠标时按 fireRateMs 间隔自动挥砍
- [ ] 挥砍朝鼠标方向，判定为扇形区域
- [ ] 扇形内所有敌人各受一次 damage 伤害
- [ ] 默认 180° 扇形，半径 80px
- [ ] 命中时遍历 statusEffects 独立判定状态施加
- [ ] 击杀敌人时遍历 onKill 触发器
- [ ] 旋风斩卡牌将 attackAngle 改为 360°
- [ ] 裂地斩卡牌使挥砍留下地面火焰区域
- [ ] 战意卡牌击杀后临时增加 attackRange
- [ ] 嗜血狂战卡牌按 HP 缩放减少 fireRateMs
