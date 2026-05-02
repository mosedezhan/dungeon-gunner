## Context

`add-class-selection` 已完成（complete，待归档），框架支持双职业。法师走子弹路径完整可玩，战士仅 ClassSelectScene 上的占位卡片（`locked: true`）。

当前的攻击与升级逻辑都假设玩家是子弹型：
- `GameScene.update()` 中 `if (pointer.isDown) tryShoot()` 直接生成 Bullet
- `UPGRADES` 数组含 `multishot / pierce / bspeed / firerate` 四张纯子弹卡，对近战无意义
- `Player.triggerSkill()` 写死调 `scene.fireShockwave()`，`CLASSES.mage.skill = 'deflect'` 字段实际无人读取（隐性 bug，第二个职业进来必爆）

技能维度上，shockwave 是瞬时 AOE。子弹时间是首个**持续状态**类技能，且需要"世界慢、玩家不慢"的精确作用域，对 Phaser 全局 timeScale 的天然语义有冲突。

**约束条件：**
- 无外部美术资源，所有视觉必须 BootScene 程序化生成
- 不可破坏现有法师玩法（攻击、技能、可见升级卡集合）
- 单 change ≤ 3 天工作量、可独立 playtest 验证

## Goals / Non-Goals

**Goals:**
- 战士成为可玩职业：hold 鼠标挥砍 + 子弹时间 Q
- 挥砍特效"帅"——多层叠加（弧 + Hit-stop + 残影 + 微震 + 多命中触发屏闪）
- 子弹时间精确作用于 enemies / enemyBullets / shooter 节流，不污染玩家
- 升级池按职业过滤，战士有补足卡池量的近战专属卡
- 顺手把 `Player.triggerSkill` 的写死路径改为按 `CLASSES[classId].skill` 真分派

**Non-Goals:**
- 子弹时间的进化卡（强度、时长、附加效果）—— 用户明确单开后续 change
- 第三个或更多职业 —— 架构留扩展点（多态分派 + 配置驱动），但不实现
- 升级池架构泛化（如"按 tag 过滤"、"按数值范围筛选"等）—— 仅做 classes 字段过滤这一层
- 战士专属升级卡的进化层级 —— 4 张卡都做成一次性增量，不引入"卡之间互相组合"的元规则

## Decisions

### 1. 子弹时间走"手动作用域缩放"（方案 B），不走 Phaser 全局 timeScale

**选择**：在 `Enemy` 上**重写 `setVelocity(x, y)`**（自动按 `scene.slowFactor` 缩放所有速度赋值——AI 与 knockback 的 setVelocity 都被捕获）；在 `EnemyBullet` 中**保存基准 velocity**（`_baseVx / _baseVy` 在 `fire()` 时记录），`preUpdate` 每帧重设 `body.velocity = base * slowFactor`（这样 bullet 中途切换 slowFactor 也能即时响应）；在 `Shooter` 的射击节流间隔中按 `slowFactor` 反向放大间隔。`scene.slowFactor` 默认 1.0，`fireBulletTime()` 设为 0.3 持续 2.5s 后恢复。

**理由**：
- Phaser 的 `physics.world.timeScale` / `time.timeScale` / `tweens.timeScale` 都是**全局**的，会同时影响玩家、玩家子弹、UI tween、相机震屏。要"玩家不慢"必须做反向补偿，每个被影响面都要单独处理（player velocity / 攻击节流时间源 / animation rate / tween rate），任意一个漏补就会感知到不对劲。
- 手动缩放虽然要改三个文件，但每处改动都是**一行**且语义直接（"this entity moves at slowFactor of normal"），未来加进化卡（"slowFactor 0.3 → 0.2"、"持续 2.5s → 4s"、"对特定敌人不生效"）只需改 config 或加 if 分支，扩展面平。
- **Enemy 与 EnemyBullet 用了不同的实现路径**：原本设想统一在 `preUpdate` 每帧"velocity *= slowFactor"，实测发现会**复合衰减**——同一 velocity 每帧再乘 0.3，几帧后就接近零。Enemy 改为重写 `setVelocity` 单点拦截：AI 每帧 `setVelocity(speed, speed)` 都会被自动缩放为 `speed * slowFactor`；knockback 一次性 `setVelocity(impulse)` 也被自动缩放，再走 Phaser 标准 drag 衰减（衰减率与起始 velocity 无关，所以"小起步"自然产生"短距离击退"的视觉）。EnemyBullet 因为只在 `fire()` 时设置一次速度后就不再调用 `setVelocity`，必须保存基准值并在 `preUpdate` 每帧重新计算 `base * slowFactor`，否则技能开启前发射的子弹不会响应中途的 slowFactor 切换。

**替代方案**：
- 方案 A（全局 timeScale + 玩家反补偿）：rejected。反补偿点散且脆，玩家攻击节流必须切到墙钟（`performance.now()`），与现有 `time.now` 体系混用。
- 方案 C（A + B 混合）：rejected。两套机制并存，复杂度叠加，没有等比的收益。

### 2. 攻击多态走"Player.tryAttack(time) 内部分派"，不走"GameScene 内 if classId"

**选择**：`Player.tryAttack(time)` 内部按 `this.classId` 分派到子弹生成或挥砍。GameScene 的 `update()` 只调 `this.player.tryAttack(this.time.now)`，不感知职业。

**理由**：
- GameScene 已经是物理组、overlap、跨场景钩子的集中地（见 `src/scenes/CLAUDE.md` 关于 GameScene 是"高频共享改动面"的提示），再往里塞职业分支会让它继续膨胀。
- Player 本来就持有 `classId`，分派归它最自然；后续第三个职业进来时只在 Player 里加一个 case，不污染 GameScene。
- 子弹路径仍可委托给 `GameScene.spawnBullets(...)` 这类辅助方法（保留现有子弹生成代码不动），挥砍路径同理 `GameScene.performSwing(...)`。Player 只做调度，不做物理细节。

**替代方案**：
- GameScene 内 `if classId` 分派：rejected，让 GameScene 持有职业知识，破坏关注分离。
- Strategy 对象（`CLASSES.warrior.attack = (scene, p) => ...`）：rejected，3 行代码的事不值得引入策略模式抽象层。

### 3. 技能派发走"GameScene.useSkill(player) + CLASSES[classId].skill 字符串映射"

**选择**：`Player.triggerSkill()` 改为 `this.scene.useSkill?.(this)`；`GameScene.useSkill(player)` 内部 switch `CLASSES[player.classId].skill` 字符串，分派到 `fireShockwave` 或 `fireBulletTime`。

**理由**：
- 现状是 hardcode `scene.fireShockwave`，第二个职业必然冲突。
- 字符串 ID 映射够用：当前两个 skill，未来加第三个就在 switch 加一个 case，零抽象成本。
- 把派发集中在 GameScene 而非 Player：技能本质上要操作物理组、相机、tween 这些 scene 资源，归 scene 比 Player 内部反向访问 scene 更顺。

**替代方案**：
- `CLASSES.<id>.skill` 改为函数：rejected，把 scene 资源访问下放到 config，违反"config 只放数据"的约定。
- 维持当前 hardcode、用 if classId 分支：等同于方案 A 的延后版，有第二个职业的当下就该修。

### 4. 升级池过滤走"UPGRADES 每条加 classes 字段 + UpgradeScene 抽前过滤"

**选择**：每张升级卡声明 `classes: ['mage', 'warrior']`（数组），UpgradeScene 在抽 3 张前用 `UPGRADES.filter(u => u.classes.includes(player.classId))` 缩小候选池。

**理由**：
- 字段化优于硬编码"if classId === 'mage' 包含 X"。新增职业或卡都只改数据。
- 数组形式比单一字段更灵活（"通用卡"用 `['mage', 'warrior']` 直观），未来加 'all' 简写也容易。
- 过滤发生在 UpgradeScene 而非配置：抽卡逻辑天然在 UpgradeScene，不要把过滤分散到多处。

**替代方案**：
- 拆 `MAGE_UPGRADES` / `WARRIOR_UPGRADES` 数组：rejected，通用卡（damage / movespeed / regen 等）会重复定义，维护双份。
- 重映射语义（multishot → "每次攻击多挥一刀"）：rejected，硬把弹幕语义塞到近战上，文案怪、平衡数据不可比。

### 5. 战士不显示 gun，显示 sword（构造时硬分支）

**选择**：`Player` 构造函数按 `classId === 'warrior'` 分支，创建 `sword` sprite 替代 `gun` sprite。`muzzle` 字段对 warrior 仍计算（指向剑尖），子弹路径不调它即可。

**理由**：
- 视觉是职业最直观的辨识，战士拿枪的画面错误。
- 一个分支即可（不引入"装备系统"抽象）。

### 6. Hit-stop 实现走 `time.timeScale = 0` + delayedCall 恢复

**选择**：命中至少 1 个敌人时，`scene.time.timeScale = 0`，`scene.physics.world.isPaused = true`，40ms 后恢复。**只在没有 bullet_time 激活时使用**——若 bullet_time 期间命中，跳过 Hit-stop（避免与 slowFactor 叠加导致体感卡死）。

**理由**：
- Hit-stop 短暂（40ms），用全局 timeScale 不会污染感知。
- 与子弹时间互斥可避免叠加，规则简单。

**替代方案**：
- 把所有敌人的 velocity 临时缓存归零再恢复：等价但代码量大且要保存状态。

### 7. 多目标命中（≥3）触发额外 VFX

**选择**：`performSwing` 命中循环结束后统计命中数 `hits.size`，≥3 时叠加屏幕白闪 1 帧 + 强震屏（120ms 0.008，对比常规 50ms 0.003）。

**理由**：
- 提供"扫开一片"的反馈感，与 `cleave` 升级卡的"≥2 个目标 +30% 伤害"形成正反馈循环。
- 阈值选 3 而非 2：让 `cleave` 卡的 2 个目标加成保持稀有感，屏闪用更高门槛区分。

## Risks / Trade-offs

### Risk 1: 子弹时间下击退 velocity 被 slowFactor 反复缩放，二次击退体感弱

**Mitigation**: `Enemy.preUpdate` 每帧按 `slowFactor` 重缩放当前 velocity 而非"乘一次"，所以击退发生瞬间用全速 setVelocity，下一帧 preUpdate 才被缩放——视觉上是"敌人开始飞、然后立刻进入慢动作飞"，符合直觉。要避免的是在 setVelocity 时就乘 slowFactor，那样击退本身会被低估。

### Risk 2: Shooter 的 `lastShotAt` 时间戳是用 `time.now` 还是墙钟，影响子弹时间下射击节奏

**Mitigation**: Shooter 现有逻辑用 `scene.time.now` 时间戳判断"距上次射击是否够 fireRateMs"。slowFactor 只缩放 velocity，不缩放 `time.now`——所以默认行为是 shooter 仍按真实时间射击，子弹只是飞得慢。这不符合"射击节奏也变慢"的直觉，需要主动改：`if (time - lastShotAt >= fireRateMs / slowFactor)`，让间隔被反向放大。

### Risk 3: 战士初始数值（120 HP / 200 速度 / 18 伤 / 380ms 节流 / 80 范围）未经过手测

**Mitigation**: 这些是估算起点，proposal 不锁死。实现完成后跑 `/playtest`，前 3 波若 TTK 偏差 ≥ 30% 就调。优先调 `damage` 与 `attackRateMs`，因为 `swingRange / swingArc` 改动影响命中模式不仅是 DPS。

### Risk 4: Hit-stop 与子弹时间共存的体感

**Mitigation**: 已在 Decision 6 中决定互斥——bullet_time 激活期间挥砍命中不触发 Hit-stop。这放弃了子弹时间下挥砍的"双重慢"质感，但避免实测可能很糟的卡顿感。若手测后发现单层 Hit-stop 在子弹时间下其实可接受，再放开此约束。

### Risk 5: 升级池过滤后战士可见卡数量偏少

**Mitigation**: 当前 mage 可见 9 张（5 通用 + 4 子弹专属），warrior 可见 9 张（5 通用 + 4 近战专属），数量对齐。`skillmax` 对两职业都生效（增加技能上限）。若实测战士抽到重复率偏高，可在后续 change 加更多近战卡。

### Trade-off: GameScene 引入 useSkill / fireBulletTime / performSwing / slowFactor 字段，方法集明显膨胀

GameScene 已经是物理组与 overlap 注册的中心，再加 4 个公开成员推高复杂度。但拆出 SkillManager / CombatManager 系统模块属于"为未来抽象"，违反 CLAUDE.md "Don't add features beyond what the task requires" 的指导。本次保留 GameScene 内联，若第三个职业引入第三种攻击/技能再讨论抽象。

## Open Questions

**Q1**: 子弹时间下，已经被击退、velocity 还在衰减的敌人是否要触发"击退轨迹缩放"动画？

**A1**: 不。preUpdate 每帧重缩放当前 velocity 自然处理（因 velocity 减小，缩放后位移更小），无需额外动画处理。

**Q2**: 战士挥砍是否对玩家子弹（bullets 组）造成任何影响？比如挥开来袭子弹？

**A2**: 不在本 change 范围。挥砍只与 enemies 组交互。"挥砍可挡敌方子弹"是有趣的进化卡候选，留给后续。

**Q3**: 战士的 sword sprite 在 idle/run 时是否也跟随鼠标方向？还是只在挥砍瞬间显示？

**A3**: 跟随鼠标方向，常显（与 mage 的 gun 一致）。挥砍是叠加在常态显示之上的旋转 tween。
