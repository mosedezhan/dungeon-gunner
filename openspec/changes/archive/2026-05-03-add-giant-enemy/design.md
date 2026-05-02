## Context

游戏有三种敌人（Chaser / Rusher / Shooter），威胁方式均为持续接触型——玩家与敌人不接触就不会受伤。缺少"可读前摇 → 蓄力 → AOE"型威胁，无需观察和预判。

战士职业（近战 80px swingRange）已实现。巨人引入的 slam 机制（AOE 半径 ~70px）与战士攻击距离高度重叠，形成了有意义的职业难度差异——Mage 可远程风筝，Warrior 必须在危险区内"打一刀就跑"。Bullet Time 是战士应对巨人的关键 equalizer。

**约束条件：**
- 无外部美术资源，所有视觉必须 BootScene 程序化生成
- slam 的四拍状态机（wind-up / swing / impact / recovery）须设计为可复用模式，为未来 Boss 砸地技能预演
- 不可破坏现有敌人行为（Chaser / Rusher / Shooter / Enemy 基类）
- 巨人命名空间必须对齐 `src/entities/CLAUDE.md` 的四字段约定（id / texture_keys / anim_keys / config_block）

## Goals / Non-Goals

**Goals:**
- 巨人成为第四种敌人，以砸地 slam 为核心差异化机制
- slam 具有清晰的前摇（蓄力 + 地面警告圈），玩家可读、可躲避
- 蓄力期间巨人移速归零，给战士近战输出窗口
- slam VFX 组件（警告圈、冲击波、屏幕震动）可复用给未来 Boss
- 放大死亡特效，匹配巨人体量感
- 波次安排在 W4 首次出现（教学窗口），不与 Shooter（W5）抢注意力

**Non-Goals:**
- Boss 实现——本次只做普通敌人级巨人，Boss 是后续 change
- slam 击退玩家——探索阶段已决定纯伤害
- 巨人被近战打断蓄力——有趣的机制但留给后续 change
- 新增升级卡（如"对巨型敌人额外伤害"）——升级池扩展走单独 change

## Decisions

### 1. slam 状态机用四拍模型，状态存储在 Giant 实例字段上

**选择**：Giant 实例持有 `slamState` 字段（`'idle' | 'windup' | 'swing' | 'impact' | 'recovery'`），`preUpdate` 内部 switch-state 驱动。状态转换基于 `scene.time.now` 时间戳判定。

**时序设计**：

```
时间线:
  0         400ms       500ms       600ms       1000ms
  │───────────│───────────│───────────│───────────│
  │  windup   │   swing   │  impact   │ recovery  │
  │  举棒     │  快速下劈 │  AOE判定  │  呆立     │
  │  移速=0   │  移速=0   │  冲击波VFX│  移速=0   │
  │  警告圈   │           │  屏幕震动 │           │
  │  微颤     │           │           │           │
```

**理由**：
- 四拍结构（windup / swing / impact / recovery）可直接复用给 Boss——Boss 只需不同的数值参数（更大半径、更多阶段），节拍骨架不变
- 基于时间戳而非 tween 的状态转换更可靠——tween 在场景暂停 / bullet_time 下行为复杂，时间戳始终可用 `scene.time.now` 准确判定
- switch-state 比 tween 回调链更容易 debug——在 preUpdate 中可以随时 log 当前状态和剩余时间

### 2. 蓄力期间移速归零，不依赖 knockback 系统而是直接在 AI 中 setVelocity(0,0)

**选择**：wind-up / swing / recovery 三个阶段中，Giant 的 `preUpdate` 不执行追击逻辑，不调用 `setVelocity`（velocity 自然衰减为 0）。idle 状态下正常追击。

**理由**：
- 比扩展 `Enemy.knockback` 增加 "immune" 字段更简单——knockback 是外部施加的力，slam 蓄力是自身行为，语义不同
- setVelocity(0,0) 在每帧 preUpdate 开头执行，不会被外部 knockback 覆盖（knockback 也在 preUpdate 中设置 velocity，但 slam 状态下 Giant 直接 return 跳过追击，下一帧又是 setVelocity(0,0)）
- **与 bullet_time 的交互**：bullet_time 重写了 `Enemy.setVelocity(x, y)` 使其按 slowFactor 缩放。`setVelocity(0, 0)` 缩放后仍是 (0, 0)，行为正确。

**替代方案**：
- 新增 `Enemy.immovable` 标志位，被 `knockback()` 检查：rejected，语义上巨人蓄力不是"不可移动"，而是"选择不动"，用 flag 会与未来"被特殊攻击打断"冲突
- 扩展 `knockUntil` 机制（设 `knockUntil = now + windUpMs`）：rejected，knockback 的语义是"被外力击退后的硬直"，巨人蓄力是主动行为，不应复用同一机制

### 3. AOE 伤害判定用距离检测而非 Physics overlap

**选择**：impact 瞬间，Giant 的代码计算 `Phaser.Math.Distance.Between(giant, player)`，若 ≤ `slamRadius` 则调用 `player.takeDamage(slamDamage)`。

**理由**：
- slam 是瞬时 AOE 判定（不是持续区域），用 overlap 需要"创建一个临时圆形 body → 下一帧 overlap 回调 → 移除"，增加复杂度
- 距离检测是 O(1)（只有 1 个玩家），overlap 需要物理引擎的碰撞矩阵遍历
- 与警告圈半径一致（同用 `slamRadius`），玩家看到的红圈就是精确的伤害范围

### 4. 地面警告圈用 Graphics 动态绘制 + tween 缩放，不做预生成纹理

**选择**：wind-up 开始时创建一个 `Phaser.GameObjects.Graphics` 圆形（半透明红色描边），以 tween 做脉冲效果（alpha 闪烁），impact 瞬间销毁。

**理由**：
- 警告圈半径在不同场景下可能不同（Giant vs 未来 Boss），Graphics 可以参数化绘制，不需要为每个半径预生成纹理
- 描边圆比填充圆视觉效果更好（不会遮挡地面）
- pulse alpha 闪烁（0.2 → 0.5 → 0.2 循环）传达紧迫感，同时保持可读性

**替代方案**：
- BootScene 预生成纹理（`slam_warning`）：可行，但需提前决定半径或生成多个尺寸。留给未来优化。
- 用 `Phaser.GameObjects.Ellipse`（Fill）：rejected，填充圆遮挡过多。

### 5. 冲击波 VFX 用 BootScene 预生成环形纹理 + 缩放 tween

**选择**：BootScene 中用 `Graphics.generateTexture('slam_impact', ...)` 生成一个环形纹理（白/黄色外发光环）。impact 瞬间在巨人脚下创建 sprite，以 tween 快速放大并淡出，约 300ms 后销毁。

**理由**：
- 环形纹理直观传达"冲击波扩散"——比圆形更贴合物理直觉
- 缩放 + 淡出的 tween 实现简单，视觉效果好
- 纹理可复用：Boss 的 slam 也可以用同一个纹理，只改 scale 参数

### 6. 放大死亡特效：更长持续时间 + 更大角度 + 更强屏幕震动

**选择**：Giant 重写 `die()` 方法（不调 `super.die()`），自定义死亡 tween：
- 持续时间 400ms（对比普通敌人 260ms）
- 随机角度 ±180°（对比 ±120°）
- 缩放到 0.3（对比 0.2）
- 叠加屏幕震动（200ms，intensity 0.005）

**理由**：
- 巨人比普通敌人大（radius 14-16 vs 8-9），死亡动画需要更长时间才能被视觉感知
- 屏幕震屏是对"巨大生物倒下"的自然反馈
- 不修改 `Enemy.die()` 基类——基类行为不变，其他敌人不受影响

### 7. 波次安排：W4 首现，W7 加量，W9+ 密集

**选择**：
```
W4:  mix.push(Giant)     // 首次出现，教学窗口
W7:  mix.push(Giant)     // +Shooter 压力叠加
W9:  mix.push(Giant)     // 多 Giant
```

**理由**：
- W4 时场上只有 Chaser + Rusher（都是持续接触型），单独一个 Giant 让玩家专注学读招
- W5 引入 Shooter（错开新威胁），W7 时 Shooter 已被熟悉，Giant 再现 + Shooter 形成多线程压力
- W9+ 多 Giant：玩家此时有充足升级，可以应对

**替代方案**：
- W3 首现：rejected，玩家只有 1 级，slam 伤害（~20-25）几乎秒杀（base HP 100/120）
- W5 首现（和 Shooter 同波）：rejected，两种新威胁同时出现，认知负荷过高

## Risks / Trade-offs

### Risk 1: 巨人 HP 在后期波次倍率下过高，TTK 失控

**Mitigation**: W9 时 HP 倍率为 `1 + 8 × 0.15 = 2.2`，base HP 70 → 实际 154。Mage 基础伤害 10 × 多次升级后约 20，需要 ~8 发子弹。考虑到巨人移速极慢（35-40），玩家有充裕输出时间。TTK 偏高时优先调 `ENEMY.giant.hp`，不影响其他敌人。

### Risk 2: 战士在 W7（Giant + Shooter + Chasers）的压力过高

**Mitigation**: 战士有 Bullet Time 作为 equalizer（慢动作下可从容躲避 slam）。若实测压力仍过高，可后续增加"挥砍打断蓄力"机制，但不在本 change 范围。

### Risk 3: slam 警告圈在密集敌人中不够醒目

**Mitigation**: 警告圈使用红色（与其他敌人绿色/黄色/紫色的 tint 明显区分）+ 描边而非填充（不遮挡地面）。若不够醒目，可在 impact 前 100ms 加一次短震屏作为"即将命中"的额外提示。

### Risk 4: 巨人 sprite 较大（radius 14-16 × scale 2），可能被卡在世界边界或障碍物上

**Mitigation**: 当前无障碍物系统（纯开放世界），卡世界边界的风险与现有敌人相同。巨人物理体用 `body.setCircle()` 设置碰撞半径（~14px），sprite 视觉大小可超出碰撞体，不产生物理卡顿。

### Trade-off: Giant 重写 `die()` 而非复用基类

基类 `Enemy.die()` 调 `scene.handleEnemyDeath(this)` 触发 XP 球生成和击杀计数。Giant 的自定义 `die()` 必须保留这个调用。这是一个隐式依赖——未来若 `handleEnemyDeath` 签名变更，Giant 的 `die()` 需同步更新。可接受的原因：这是所有 Enemy 子类的共性依赖（不是 Giant 独有的问题），且 Giant 是目前唯一重写 `die()` 的子类，影响面可控。

## Open Questions

**Q1**: 巨人的像素网格要多大？当前敌人约 8×8 像素网格，巨人作为"高大"形象建议 12×16 还是 10×14？

**A1**: 待实现时在 BootScene 中实验。建议 10×14（宽 × 高），scale=2 后约 20×28px，视觉上明显大于普通敌人（16-18px）但不过分遮挡。

**Q2**: slam 的 cooldown（两次 slam 之间的最短间隔）应多长？

**A2**: 建议 3000ms。Giant 的移动速度很慢（35-40），大部分时间在走路。slam 只在贴近玩家时触发，cooldown 防止"贴脸连续砸"的挫败体验。3000ms 意味着玩家在 impact + recovery（共 ~800ms）后还有 ~2200ms 的安全输出窗口。

**Q3**: 巨人是否掉落 SkillOrb？掉率是否与普通敌人相同？

**A3**: 是，与普通敌人相同。`handleEnemyDeath` 统一处理 SkillOrb 掉落，Giant 不需要特殊逻辑。更高的 XP 奖励（5-6 vs 普通 1-3）已补偿其击杀难度。
