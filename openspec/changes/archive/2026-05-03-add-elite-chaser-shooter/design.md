## Context

游戏有 5 种基础敌人，W10+ 缺少威胁升级。精英怪是基础敌人的增强版本，复用纹理、增加行为差异。首批实现 EliteChaser（狂暴）和 EliteShooter（三散射）。

**约束条件：**
- 精英复用基础纹理，不新建角色贴图——视觉区分靠 tint + 粒子 + 体型
- 不可破坏现有基础敌人行为
- 命名空间对齐 `src/entities/CLAUDE.md` 四字段约定（精英 id 加 `elite_` 前缀，纹理复用为基础例外，在 spec 中说明）

## Goals / Non-Goals

**Goals:**
- EliteChaser 在 HP ≤ 60% 时狂暴（速度提升到 Rusher 水平 ~140），加红色脉冲特效
- EliteShooter 发射 3 发扇形子弹（角度 -spread / 0 / +spread）
- 两者共享视觉层：黑身红眼、scale 2.4、持续黑烟粒子
- W10 起固定刷出，稀少但有存在感

**Non-Goals:**
- 其他精英变体（Elite Giant / Elite Bomber / Elite Rusher）——后续 change
- 精英掉落特殊道具——暂不实现
- 动态随机"升级为精英"机制——固定刷怪更可控

## Decisions

### 1. 子类继承而非装饰器

**选择**：`EliteChaser extends Chaser`，`EliteShooter extends Shooter`。

**理由**：
- 行为差异是局部的（Chaser 改速度逻辑，Shooter 改射击逻辑），子类只重写少量方法
- 装饰器模式需要修改基类接口，侵入性更大
- 与现有架构一致（所有敌人都是 Enemy 子类）

### 2. 狂暴机制：HP 阈值触发，不叠加

**选择**：EliteChaser 在 `takeDamage` 中检测 `this.hp <= this.maxHp * 0.6`，设置 `this.berserk = true`。狂暴后速度固定为 `cfg.berserkSpeed`（~140），不叠加，持续到死。

**理由**：
- "受伤加速"的可叠加版本会导致连续命中后速度失控
- 阈值触发是清晰的一刀切状态切换，玩家能学到"打到 60% 它就疯了"
- 固定速度到 Rusher 水平（~140）是已有参照，调参容易

### 3. 三散射：角度偏移

**选择**：EliteShooter 射击时循环 `[-spreadAngle, 0, +spreadAngle]` 发 3 颗子弹。

```
        · ← -12°
       /
shooter ── · ← 0°
       \
        · ← +12°
```

**理由**：
- 扇形散射是最直观的"火力增强"表达
- spreadAngle ~12° 在 preferredRange 距离内形成约 50px 宽的弹幕带，需要侧移但不太苛刻
- 实现简单：改一行 `fire()` 调用为三行循环

### 4. 共通视觉：tint + scale + tween 粒子

**选择**：
- **黑色 tint**：构造函数中 `this.setTintFill(0x222222)` 覆盖原色
- **红眼**：在 BootScene 生成精英红眼小纹理（`elite_eye`），构造函数叠加 2 个 eye sprite 作为子对象
- **scale 2.4**：比基础 2.0 大 20%
- **黑烟粒子**：tween 方案，每 ~200ms 在身体上方生成暗灰半透明小圆 sprite，向上漂移 + 淡出

**理由**：
- tint + scale 不需要新纹理，成本最低
- 红眼是精英的核心辨识特征，需要独立纹理（极小：4×2 像素网格）
- 黑烟粒子用 tween 方案（同 Bomber trail），不需要 Phaser 粒子系统

### 5. 波次安排：固定刷怪，非 mix 池

**选择**：WaveManager 新增 `_spawnElite(time)` 方法，在 update 中按固定间隔刷精英。

```
W10: 1 只精英（随机 Chaser/Shooter 精英）
W11-12: 1 只
W13+: 2 只
间隔: ~15000ms
```

**理由**：
- 进 mix 池会导致精英太常见或太稀少，取决于池大小
- 固定刷怪保证"每波必见精英"的节奏感
- 间隔 15s 让精英作为"mini-event"出现

### 6. 精英命名空间约定

| 字段 | EliteChaser | EliteShooter |
|---|---|---|
| `id` | `elite_chaser` | `elite_shooter` |
| `texture_keys` | 复用 `chaser_a` | 复用 `shooter_a` |
| `anim_keys` | 复用 `chaser_walk` | 复用 `shooter_walk` |
| `config_block` | `ENEMY.elite_chaser` | `ENEMY.elite_shooter` |

**纹理复用例外**：精英不新建角色纹理，id 前缀 `elite_` 与纹理前缀不对齐是设计意图——在 proposal 中显式声明。

## Risks / Trade-offs

### Risk 1: EliteChaser 狂暴后速度 140 + W10+ HP 倍率可能导致近战玩家难以处理

**Mitigation**: 狂暴发生在 HP ≤ 60% 时，战士可以在触发前就秒掉（elite chaser base HP ~40，战士 damage 18×2=36 近似一刀，加上 upgrade 后可一刀）。如果实测太难，可以调高狂暴阈值或降低速度。

### Risk 2: 黑烟粒子在大量敌人时可能影响性能

**Mitigation**: 每 200ms 一只精英才生成一个粒子 sprite，且 300ms 后自动 destroy。即使同时 2 只精英，粒子总数 ~6 个，影响可忽略。

### Risk 3: 红眼 sprite 作为子对象可能不随主体 tint 正确叠加

**Mitigation**: 红眼使用独立 sprite + setTintFill(0xff0000)，不依赖主体 tint。测试时验证视觉正确性。
