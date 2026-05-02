## Context

项目是基于 Phaser 3 的纯 ES 模块小游戏，无构建/打包/测试，所有纹理在 `BootScene` 中通过 `Graphics.generateTexture()` 程序化产出。Player 数值持有 `stats` 对象（`PLAYER` 配置的可变副本），升级直接 `apply(p)` 修改 `p.stats`。GameScene 持有所有物理组与碰撞回调；HUDScene 与 GameScene 并行运行，**只读**地读取 GameScene 状态（`HUDScene.update`），由 GameScene 反向调用 HUDScene 的 banner 方法。

新功能（冲击波主动技能）需要做四件事：键位输入、消耗充能、对场上敌方子弹和近距敌人施加效果、生成 360° 辐射 VFX；外加一条获取/上限提升的循环（小怪掉落 + 升级三选一）。

## Goals / Non-Goals

**Goals:**

- 在不破坏现有"升级三选一 / 子弹清屏 / 池化实体"模式的前提下，加入主动技能层。
- 所有新数值入口集中在 `src/config.js` 的新 `SKILL` 块，便于平衡。
- 复用现有模式：`SkillOrb` 沿用 `XPOrb` 的池化 + 脉冲 + 吸附；冲击波 VFX 使用 BootScene 程序化纹理 + Tween。
- HUD 增加充能显示，与现有 stats 文本同区域，零额外场景。
- 保持"无外部资源"约定。

**Non-Goals:**

- **不做**多种主动技能/技能选择器。本次只引入"冲击波"一个技能；为未来扩展留出 `SKILL` 命名空间，但本次不做抽象层。
- **不做**冷却时间。技能受"充能数"限制即可，不再叠加 cooldown 防止冲突复杂化。
- **不做**对 Boss/特殊敌人的差异化处理（当前没有 boss）。
- **不做**键位重映射 UI。Q 键固定。
- **不做**音效（项目当前无音频系统）。

## Decisions

### D1：充能资源放在 `Player.stats` 而不是单独管理器

- **选择**：在 `Player.stats` 中加 `skillChargesMax`；在 `Player` 实例上加 `skillCharges`（当前值，不在 stats 里因为不是"配置"）。
- **理由**：升级系统是 `apply(p) => p.stats.X *= Y` 的形式，把 `skillChargesMax` 放进 `stats` 后升级卡可以直接 `p.stats.skillChargesMax += 1`，零样板。`skillCharges` 是运行时变量（拾取/消耗会变），与 `hp` 同级别放在实例上而不是 stats。
- **替代**：抽 `SkillSystem` 类。否决：当前只有一个技能，引入抽象层是过度设计；可在第二个技能落地时再重构。

### D2：技能效果在 GameScene 中实现，不在 Player 中

- **选择**：`Player.triggerSkill()` 只做"消耗充能 + 通知场景"，真正的"清屏 + 击退 + VFX"由 `GameScene.fireShockwave(x, y)` 完成。
- **理由**：清屏要遍历 `enemyBullets` 组、击退要遍历 `enemies` 组、VFX 要 `scene.add` —— 全部资源都在 GameScene 上。Player 不持有这些组的引用，硬要让 Player 做就要反向访问 `this.scene.enemyBullets`，破坏封装。
- **替代**：把整段逻辑放进 Player。否决，理由同上。

### D3：Q 键绑定写在 GameScene，不在 Player

- **选择**：在 `GameScene.create()` 中 `this.input.keyboard.on('keydown-Q', ...)` 调用 `this.player.triggerSkill()`。
- **理由**：与现有 ESC/P 暂停键风格一致（见 `scenes/CLAUDE.md` "键盘绑定写在 create()"）。Player 已有 WASD 是因为需要每帧轮询持续按住的状态；技能是单次触发，事件回调更合适。
- **替代**：在 Player 中 addKey + isDown 轮询。否决，会重复触发，需要额外去抖。

### D4：清屏作用于 `enemyBullets`，不作用于敌人

- **选择**：清屏只销毁 `scene.enemyBullets` 组里所有 active 的实例，不销毁敌人。
- **理由**：用户原话"清理全屏子弹"+"将身体周围的小怪短距离击退"，二者作用对象明确分离。否则就是"清屏 + AOE 伤害"，破坏定位（应急生存技 ≠ 输出技）。
- **击退实现**：遍历 `scene.enemies.getChildren()`，距离 < `SKILL.knockbackRadius` 的敌人调用 `enemy.knockback(player.x, player.y, SKILL.knockbackForce)`（已有方法）。

### D5：冲击波 VFX = 单张环形纹理 + Tween 缩放/淡出

- **选择**：在 BootScene 生成一个 `shockwave` 圆环纹理（亮白外圈 + 半透明蓝色内圈，中心透明）。触发时 `scene.add.image(x, y, 'shockwave')`，用 Tween 把 scale 从 0.2 拉到 `SKILL.vfxMaxScale`，alpha 从 1 → 0，`onComplete: destroy`。
- **理由**：项目所有特效（muzzle flash、bullet trail）都是这种模式，零学习成本，与"音爆 360° 辐射"视觉一致。
- **替代**：粒子发射器 / 多帧动画。否决：粒子需要程序化构建 ParticleEmitter 配置，多帧动画又得画多张纹理；当前模式视觉够用且最省。

### D6：SkillOrb 复用 XPOrb 模式

- **选择**：新建 `src/entities/SkillOrb.js`，结构与 `XPOrb` 同（`spawn()` / `preUpdate()` 吸附 / `kill()` disableBody），但纹理用新的 `skill_orb`（橙红色发光球，与 XP 蓝色明显区分），并使用独立的 `SKILL.pickupRadius` / `SKILL.magnetSpeed`（可与 XP 同值，但独立配置）。
- **理由**：与 `entities/CLAUDE.md` 的"池化复用 / preUpdate 写 AI / 出界回收"完全契合。颜色明显区分让玩家一眼分辨。
- **替代**：扩展 XPOrb 加 type 字段。否决，违反单一职责，且 XP 经过升级会改变价值，技能球价值固定（+1 充能），合并反而逻辑分支增多。

### D7：拾取在已达上限时丢弃球而不是不掉

- **选择**：`onPickupSkillOrb` 中：若 `player.skillCharges >= player.stats.skillChargesMax`，仍调 `orb.kill()` 让球消失，但**不增加充能**。
- **理由**：保留"球已被拾起"的视觉反馈避免玩家以为没碰到；不增加充能保留游戏平衡性约束。是否再保留地上由设计取舍——选丢弃以避免画面被堆满球。
- **替代 A**：满充能时跳过拾取（球留地上）。可行但容易堆积。
- **替代 B**：满充能时不掉落（在 `handleEnemyDeath` 早返回）。更省，但玩家看到敌人死后没掉以为概率没触发，反而困惑——而当前选择会让玩家看到球闪烁后消失，明确表达"已满"。后续可加一个"满"提示文字。

### D8：升级卡注入

- **选择**：在 `UPGRADES` 中追加：

  ```js
  { id: 'skillmax', name: 'Resonance Core', desc: '+1 max skill charge',
    apply: p => { p.stats.skillChargesMax += 1; p.skillCharges += 1; } }
  ```

  拿到升级时顺便补 1 充能（避免上限提升后还要先去刷小怪掉落球才能用）。

- **理由**：`UPGRADES` 数组里所有卡片都是无条件出现的，新卡进数组即被随机抽到，无需修改 UpgradeScene 的选卡逻辑。
- **替代**：让 skillmax 卡只在 `skillChargesMax < N` 时出现。可考虑加上限保护（避免无限叠到 99），实现里可通过 `apply` 做夹取或在选卡时做过滤——本次留作 Open Question。

### D10：击退硬直窗口（修复既有问题）

- **背景**：playtest 时发现冲击波击退几乎无视觉效果。根因：`Enemy.knockback()` 用 `setVelocity` 设置速度，但 `Chaser/Rusher/Shooter.preUpdate` 每帧无条件用追击速度覆盖，下一帧（~16ms）就抢回去了。子弹击退看起来"有效"是因为命中通常同时杀死小怪——AOE 击退场景下敌人不死，问题暴露。
- **选择**：给 `Enemy` 加 `knockUntil` 时间戳；`knockback()` 接受 `durationMs` 参数（默认 220ms），调用时同时记录 `knockUntil = scene.time.now + durationMs`。三个子类的 `preUpdate` 在 super 之后加 `if (time < this.knockUntil) return;` 守卫，让物理引擎用 body damping 自然演化击退速度。
- **力度调校**：`SKILL.knockbackForce` 从 260 提到 480，以匹配 `body.setDrag(0.0005)` 的快速衰减（damping=true 下每秒保留 0.05% 的速度）。220ms 硬直 + 480 初速 ≈ 50 px 视觉位移，达到"短距离击退"定位。
- **副作用**：子弹击退也获益（默认 220ms 硬直），命中怪不死时手感变好。属于既有 bug 的顺带修复，不视为破坏性改动。
- **替代**：用 `setAcceleration` 反向脉冲。否决：与 setDamping(true) 物理模型混用容易出现奇怪轨迹，时间窗口方案更可控。

### D9：HUD 显示位置与样式

- **选择**：在 `HUDScene` 现有 `statsText`（top-right）追加一行 `skill X/Y`，与 dmg / pierce 等同区域。无需新建独立 UI。
- **理由**：充能数是低频变化的小数字，与现有 stats 同质；放 top-right 不挤占战斗视野。
- **替代**：HP 条旁边加"技能图标 + 充能点亮/熄灭"。视觉更好但代码量大且需要新的纹理；可在二期再做。

## Risks / Trade-offs

- **Q 键冲突**：当前未占用 Q，安全。如果将来加冲刺，需重新分配。**Mitigation**：在键位说明中（README/HUD）记录 Q = skill。
- **技能上限无封顶**：D8 决定了上限可叠加无穷次。极端 build 下玩家可能囤几十次充能。**Mitigation**：通过掉落概率（默认低）天然限速；如有需要在 `config.js` 加 `SKILL.maxCap` 并在 apply 中夹取。
- **VFX 与画面糊作一团**：冲击波最终半径若过大会盖住玩家。**Mitigation**：`SKILL.vfxMaxScale` 调到约等于"清屏视觉范围 + 击退半径 + 一点点"，并使用半透明渐隐。
- **池化 SkillOrb 容量**：`maxSize: 100` 应足够（小怪数量 × 掉率 << 100），与 `xpOrbs: 400` 不同尺度。**Mitigation**：超出 maxSize 时 `group.get()` 返回 null，调用方 if (orb) 守卫——已是项目惯例。
- **拾取重叠**：玩家同帧同时碰到 XP 球和 Skill 球，两个 overlap 回调先后触发，互不影响。**已验证**：项目现有 XP overlap 在升级触发暂停后还会在帧尾被调一次，但 `orb.active` 守卫会处理——SkillOrb 同样需要 `if (!orb.active) return;`。

## Migration Plan

不涉及存档/网络/兼容；纯加法功能。开发 → 在浏览器手测 4 个关键路径：
1. Q 键在 `skillCharges = 0` 时无效果。
2. 击杀小怪 N 次后看到 SkillOrb 掉落（可临时把概率改高验证）。
3. 拾取后 HUD 充能数 +1，Q 触发后清屏 + 击退 + 冲击波动画。
4. 升级卡能抽到 "Resonance Core"，应用后 max +1 且补 1 充能。

## Open Questions

- **是否给 skillmax 升级卡设上限**？例如 max = 5 后该卡不再出现。倾向：保留无限叠加，靠掉落概率和升级抽卡随机性自平衡，二期再调。
- **掉率是否随波次缩放**？例如后期波次小怪多，固定低概率即可，不做动态调整。
- **是否对 EnemyBullet 清屏时给一点 XP 或分数**？倾向不给，技能定位是生存而非收益。
