## Context

法师的冲击波技能通过 `GameScene.fireShockwave(x, y)` 实现：清除所有敌方子弹 + 120px 范围 20% maxHp 伤害 + 480 击退 + 扩散环 VFX。消耗 1 充能。

技能充能通过 SkillOrb 拾取积累（10% 掉率），默认上限可通过 `skillmax` 升级卡增加。`Player.triggerSkill()` 走 charge-based 路径（`skillCost ?? 1`）。

升级系统已支持分级卡（`maxLevel` + `levelStat`）和条件解锁（`requires`），战士的 bt_duration / bt_slow / time_stop 已验证此模式。

**约束条件：**
- 所有纹理必须 BootScene 程序化生成
- 升级卡仍通过 UpgradeScene 展示，不改 UI 结构
- 奥术风暴不替换冲击波，两者共存
- 冲击波期间 physics world 正常运行

## Goals / Non-Goals

**Goals:**
- 两张附加效果卡（冰霜新星 / 法力虹吸，各 2 级），为冲击波叠加不同行为层
- 解锁条件（总等级 ≥ 3）鼓励两条线路都投入但不要求双满
- 奥术风暴 5 次脉冲，继承升级卡效果，消耗 3 充能
- 每种效果有独立视觉签名（白/蓝/金/紫），玩家能清楚看到自己投了什么
- 首次解锁 100% 刷新，跳过后正常概率

**Non-Goals:**
- 战士/射手技能升级——其他迭代
- 技能树 UI——用普通升级卡随机刷出
- 冲击波基础数值增强（范围/伤害）——只做附加效果
- 音效——项目暂无音效系统
- 虹吸恢复玩家 HP——只做 XP 经济

## Decisions

### 1. 升级卡用 `maxLevel` + stats 计数器，复用战士验证过的模式

**选择**：和战士的 bt_duration / bt_slow 完全同构。

```
UPGRADES 条目：
{
  id: 'frost_nova', name: '冰霜新星', desc: '冲击波附带减速',
  classes: ['mage'], maxLevel: 2, levelStat: 'frostLevel',
  apply: p => { p.stats.frostLevel = (p.stats.frostLevel ?? 0) + 1; }
},
{
  id: 'mana_siphon', name: '法力虹吸', desc: '冲击波吸取经验',
  classes: ['mage'], maxLevel: 2, levelStat: 'siphonLevel',
  apply: p => { p.stats.siphonLevel = (p.stats.siphonLevel ?? 0) + 1; }
},
```

Player.stats 新增：
- `frostLevel` (0~2) — 冰霜新星层级
- `siphonLevel` (0~2) — 法力虹吸层级
- `hasArcaneStorm` (boolean) — 是否已解锁奥术风暴

**理由**：复用已验证的模式，`randomUpgrades()` 的 maxLevel 过滤 + requires 检测已就绪。

### 2. 冰霜新星：减速效果每级递增

**选择**：
```
冰霜新星（Frost Nova）：
  Lv 0: 无减速（未习得）
  Lv 1: 命中敌人 slowFactor = 0.5，持续 2 秒
  Lv 2: 命中敌人 slowFactor = 0.35，持续 3 秒
```

实现：`fireShockwave()` 中，命中敌人后检查 `player.stats.frostLevel`：
- 如果 > 0：设置敌人 `e.slowUntil = scene.time.now + duration`，在 Enemy.preUpdate 中乘以额外减速因子
- 视觉：敌人临时 `setTint(0x88ccff)`（蓝色调），减速结束后 `clearTint()`

**理由**：2 秒减速已足够战术价值（拉开距离），3 秒是明显增强但不至于破坏平衡。slowFactor 0.35 意味着敌人速度降到约 1/3，手感明显。

### 3. 法力虹吸：绿色光线 + 金色 XP 球视觉签名

**选择**：
```
法力虹吸（Mana Siphon）：
  Lv 1: 命中敌人额外掉落 1 个 XP 球（价值 = 敌人 xp 值 × 0.5）
  Lv 2: 命中敌人额外掉落 2 个 XP 球（价值 = 敌人 xp 值 × 0.75）
```

视觉流程：
1. 冲击波命中敌人
2. 敌人闪绿光（`setTint(0x44ff88)`，0.2 秒后恢复）
3. 绿色能量线（Graphics line）从敌人飞向玩家，持续 0.3 秒
4. 到达时在玩家位置生成金色 XP 球（`xp_orb_siphon` 纹理），自动吸附

**理由**：不只是"多掉几个球"——"从敌人身上吸取能量"的动画让玩家直接感知虹吸的存在。金色球和普通蓝色球视觉区分明显。

### 4. 解锁条件：总等级 ≥ 3，不要求双满

**选择**：
```javascript
requires: p => {
  const frost = p.stats.frostLevel ?? 0;
  const siphon = p.stats.siphonLevel ?? 0;
  return (frost + siphon) >= 3 && !p.stats.hasArcaneStorm;
}
```

可能的解锁组合：
- 霜 2 + 吸 1 → 强减速 + 弱虹吸 的奥术风暴
- 霜 1 + 吸 2 → 弱减速 + 强虹吸 的奥术风暴
- 霜 2 + 吸 2 → 双满（最强但需要 4 张前置卡）

**理由**：不要求双满（战士模式），而是"两条路都走但深度由随机性决定"。这和肉鸽的随机升级池天然匹配——你无法控制先出哪张卡。

### 5. 奥术风暴与冲击波共存，3 充能门槛

**选择**：`Player.triggerSkill()` 中判断：

```javascript
// 如果已解锁奥术风暴且充能 >= 3，释放奥术风暴
if (this.stats.hasArcaneStorm && this.skillCharges >= 3) {
  const fired = this.scene.useSkill?.(this);
  if (fired === false) return false;
  this.skillCharges -= 3;
  return true;
}
// 否则走普通冲击波（1 充能）
```

GameScene.useSkill 分派：
- 如果 `player.stats.hasArcaneStorm && player.skillCharges >= 3` → `fireArcaneStorm()`
- 否则 → `fireShockwave()`

**注意**：判断需要在 `useSkill` 和 `triggerSkill` 之间协调。triggerSkill 做充能检查，useSkill 做技能分派。triggerSkill 先检查充能再调用 useSkill，useSkill 内部根据条件选择 fireArcaneStorm 或 fireShockwave。triggerSkill 根据 useSkill 返回值决定扣 3 充能还是 1 充能。

简化方案：triggerSkill 不做复杂分支，直接调用 useSkill。useSkill 内部判断释放哪种技能并返回消耗的充能数（1 或 3），triggerSkill 根据返回值扣减。

或者更简单：triggerSkill 只在调用前检查充能 ≥ 1（通用门槛），useSkill 内部分派。如果释放的是奥术风暴，useSkill 内部扣 3 充能；如果是普通冲击波，triggerSkill 扣 1 充能。

**最终方案**：triggerSkill 保持当前模式（充能 ≥ cost → 调用 useSkill → 扣 cost），但 useSkill 返回实际消耗数：

```javascript
triggerSkill() {
  if (this.dead) return false;
  if (this.stats.hasTimeStop) { /* ... 战士时停路径 ... */ }

  const cost = this.stats.skillCost ?? 1;
  if (this.skillCharges < cost) return false;
  const result = this.scene.useSkill?.(this);
  if (result === false) return false;
  this.skillCharges -= (typeof result === 'number' ? result : cost);
  return true;
}
```

useSkill 返回值约定：
- `false` = 失败，不扣充能
- `true` / `undefined` = 使用默认 cost（1）
- `number` = 使用该数值作为实际消耗

**理由**：保留"攒大招 vs 多放小招"的战术取舍，不需要新按键。充能 ≥ 3 时 HUD 给出视觉提示。

### 6. 奥术风暴实现：5 次脉冲 + 继承升级卡效果

**选择**：
- 5 次脉冲，间隔 800ms，总持续时间 4 秒
- 每次脉冲范围递增：120 → 160 → 200 → 240 → 280 px
- 每次脉冲造成 15% maxHp 伤害 + 击退（比基础 20% 略低，因为打 5 次）
- 每次脉冲清除敌方子弹
- 如果 `frostLevel > 0`：每次脉冲对命中敌人施加冰霜减速（强度/持续时间由 frostLevel 决定）
- 如果 `siphonLevel > 0`：每次脉冲触发虹吸视觉效果 + 额外 XP 球

脉冲期间：
- 玩家可以移动（不冻结），但不能再次释放技能（防止重叠）
- 设置 `scene._arcaneStormActive = true` 标记，triggerSkill 中检查

视觉：
- 每次脉冲：紫色冲击环（颜色与白色基础环区分）+ camera shake
- 中央持续能量漩涡（texture `arcane_vortex`），从第 1 次脉冲出现到第 5 次脉冲后消失
- HUD 脉冲计数 "风暴 3/5"

**理由**：5 次脉冲 × 15% = 75% maxHp 总伤害，相当于对大范围敌人造成重创但不直接击杀（除非已受伤）。继承升级卡效果让投资有意义——双满的风暴每次脉冲都有减速 + 虹吸，体验明显比单线更强。

### 7. 纹理 BootScene 预生成

**选择**：BootScene 中用 Graphics 绘制：
- `xp_orb_siphon`：金色 XP 球（与普通蓝色 xp_orb 区分），稍大，有金色光晕
- `arcane_vortex`：紫色能量漩涡（64x64，中心亮/边缘暗，旋转动画用 tween 驱动）

**理由**：最少新增纹理。冰霜减速用敌人 tint 实现（不需要新纹理），虹吸光线用 Graphics line（运行时绘制）。

### 8. Enemy 减速机制：slowUntil 时间戳

**选择**：Enemy 基类新增 `slowUntil` 属性（默认 0）。Enemy 的 `preUpdate` 中检查：

```javascript
// 在已有的 velocity *= scene.slowFactor 之后
if (this.scene.time.now < this.slowUntil) {
  const frostFactor = [1, 0.5, 0.35][this.frostLevelApplied ?? 0];
  // 不直接用 frostFactor，而是在 shockwave 命中时设置 enemy.slowFactor = 0.5/0.35 + enemy.slowUntil
  body.velocity.scale(this.frostSlowFactor ?? 1);
}
```

实际上更简单的方案：在 `fireShockwave` 命中敌人时直接设置：

```javascript
if (frostLevel > 0) {
  e.frostSlowFactor = [1, 0.5, 0.35][frostLevel];
  e.frostSlowUntil = scene.time.now + [0, 2000, 3000][frostLevel];
  e.setTint(0x88ccff);
}
```

Enemy.preUpdate 中在 `velocity *= scene.slowFactor` 之后追加：
```javascript
if (this.scene.time.now < this.frostSlowUntil) {
  this.body.velocity.scale(this.frostSlowFactor);
} else if (this.frostSlowUntil > 0) {
  this.frostSlowUntil = 0;
  this.frostSlowFactor = 1;
  this.clearTint();
}
```

**理由**：独立于 bullet_time 的 slowFactor，两者叠加（先乘 slowFactor 再乘 frostSlowFactor）。bullet_time 结束后冰霜减速仍然持续。

## Risks / Trade-offs

### Risk 1: 奥术风暴 5 次脉冲 × 15% = 75% maxHp 可能过强

**Mitigation**: 总伤害 75% 不击杀满血敌人，但重伤后容易被普通攻击收割。范围递增意味着只有后面几次脉冲才能覆盖远距离敌人。实测后可调整单次伤害（如 12%）或脉冲次数（如 4 次）。

### Risk 2: 冲击波 + 奥术风暴共用 Q 键，误触浪费充能

**Mitigation**: 充能 ≥ 3 时 HUD 显示"奥术风暴就绪"提示，让玩家知道这次释放是大招。如果玩家想放小冲击波但充能已经 ≥ 3，需要先用掉一些充能——这本身是设计意图（战术取舍）。

### Risk 3: 冰霜减速和 bullet_time slowFactor 叠加可能过强

**Mitigation**: 两者乘法叠加（slowFactor × frostSlowFactor），bullet_time 0.3 × frost 0.35 = 0.105，敌人几乎静止。这是跨职业技能不存在的场景——法师没有 bullet_time，战士没有冰霜——所以不会发生。

### Risk 4: 法力虹吸的视觉复杂度（能量线 + 金色球）

**Mitigation**: 能量线用 Graphics 对象（简单 lineTo + fade tween），金色球复用 XPOrb 逻辑但用不同纹理。控制同屏数量——如果冲击波命中 5+ 敌人，虹吸效果只对最近 3 个播放完整动画，其余直接生成球。

### Trade-off: 充能 ≥ 3 时强制释放奥术风暴，玩家无法选择放小冲击波

如果充能 ≥ 3 且已解锁，Q 键只能放大招。这是有意为之——限制了灵活性但创造了"充能管理"的元游戏。玩家需要决定是攒大招还是多用小招。如果实测体验不好，可以改为"短按 Q = 冲击波，长按 Q = 奥术风暴"。
