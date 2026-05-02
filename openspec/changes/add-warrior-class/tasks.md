## 1. 配置与新增常量

- [x] 1.1 在 `src/config.js` 中把 `CLASSES.warrior` 的 `locked` 改为 `false`，新增 `skill: 'bullet_time'`、`textureKey: 'warrior'`、`baseStats: { maxHp: 120, moveSpeed: 200, damage: 18, attackRateMs: 380, swingRange: 80, swingArc: Math.PI / 2 }`
- [x] 1.2 在 `src/config.js` 中新增 `WARRIOR` 块（VFX 相关常量：swordTweenMs=120、slashDurationMs=200、afterimageCount=2、hitStopMs=40、hitShakeMs=50、hitShakeIntensity=0.003、burstThreshold=3、burstShakeMs=120、burstShakeIntensity=0.008、knockbackForce=160）
- [x] 1.3 在 `src/config.js` 中新增 `BULLET_TIME` 块（slowFactor=0.3、durationMs=2500、vignetteFadeInMs=150、vignetteFadeOutMs=300、vignetteAlpha=0.45）

## 2. 升级池按职业过滤

- [x] 2.1 给 `UPGRADES` 现有 9 张卡逐条添加 `classes` 字段：`damage / movespeed / maxhp / regen / skillmax` 用 `['mage', 'warrior']`；`firerate / multishot / pierce / bspeed` 用 `['mage']`
- [x] 2.2 在 `UPGRADES` 中新增 4 张战士专属卡：`swingrange`、`swingarc`、`attackspeed`、`cleave`，每张 `classes: ['warrior']`，`apply` 函数直接修改 `p.stats`
- [x] 2.3 修改 `src/scenes/UpgradeScene.js`：抽 3 张前用 `UPGRADES.filter(u => u.classes.includes(player.classId))` 缩小候选池
- [x] 2.4 验证：mage 抽卡候选池仍是 9 张（与改前一致），warrior 候选池为 9 张（5 通用 + 4 近战）

## 3. BootScene 程序化纹理与动画

- [x] 3.1 在 `src/scenes/BootScene.js` 新增 `WARRIOR_PALETTE`（红/橙色调，键名结构与 `MAGE_PALETTE` 对齐）
- [x] 3.2 用现有 `PLAYER_IDLE_A/B`、`PLAYER_RUN_A/B` 像素网格 + WARRIOR_PALETTE 生成 `warrior_idle_a/b`、`warrior_run_a/b` 4 张纹理
- [x] 3.3 注册 `warrior_idle` 与 `warrior_run` 两个动画 key（与 mage 动画结构对齐）
- [x] 3.4 程序化生成 `sword` 纹理（短粗剑形，原点对齐握把端）
- [x] 3.5 程序化生成 `slash` 弧形纹理（90° 扇形，亮青/白渐变，前沿亮、尾部淡）
- [x] 3.6 程序化生成 `bullet_time_vignette` 纹理（屏幕大小的蓝色径向半透明覆盖）

## 4. Player 多职业改造

- [x] 4.1 修改 `src/entities/Player.js` 构造函数：合并 `cls.baseStats` 到 `this.stats`（`{ ...PLAYER, ...(CLASSES[classId].baseStats ?? {}) }`）
- [x] 4.2 构造函数按 `classId === 'warrior'` 分支：创建 `sword` sprite 替代 `gun`；其余职业行为不变
- [x] 4.3 update() 中 sword 跟随鼠标方向旋转（与现有 gun 对齐鼠标的逻辑同模式）
- [x] 4.4 新增 `Player.tryAttack(time)` 多态方法：内部按 `this.classId` 分派到 `_doShoot()`（mage 现有逻辑）或 `_doSwing()`（warrior 新逻辑）；维持 mage 行为完全不变
- [x] 4.5 在 `tryAttack` 中实现挥砍节流（用 `attackRateMs` 而非 `fireRateMs`）；mage 路径继续用 `canShoot/markShot`
- [x] 4.6 修改 `Player.triggerSkill()`：保留 dead/charges 检查，把写死的 `scene.fireShockwave?.()` 改为 `this.scene.useSkill?.(this)`

## 5. 挥砍命中检测与 VFX

- [x] 5.1 在 `GameScene` 新增 `performSwing(player, angle)` 方法：遍历 `enemies`，距离 ≤ `swingRange` 且角差 ≤ `swingArc/2` 的入选；返回命中数组
- [x] 5.2 命中数组对每个敌人调 `takeDamage(damage)` + `knockback(player.x, player.y, knockbackForce)`，每次 swing 内每敌人最多被命中一次（用 Set 防重）
- [x] 5.3 `performSwing` 中读取 `player.stats.cleaveBonus`，命中数 ≥2 时 damage 乘 `(1 + cleaveBonus)`；未应用 Cleaving Edge 时 `cleaveBonus` 为 undefined/0，不加成
- [x] 5.4 在 sword sprite 上 tween rotation 从 `aim - swingArc/2` 到 `aim + swingArc/2`（120ms easeOut）
- [x] 5.5 生成 `slash` sprite 在玩家位置，旋转对齐 aim，scale 扩张 + alpha 淡出，完成后 destroy
- [x] 5.6 复制 sword sprite 2 帧作为残影，alpha 递减、镜像 swing 路径，tween 完成后 destroy

## 6. Hit-stop 与多目标 burst

- [x] 6.1 `performSwing` 命中数 ≥1 且 `scene.slowFactor === 1.0` 时触发 Hit-stop：`scene.time.timeScale = 0` + `scene.physics.world.isPaused = true`，`scene.time.delayedCall(hitStopMs, ...)` 恢复（实现注：因为 `time.timeScale=0` 会冻结 `delayedCall`，恢复改用浏览器原生 `setTimeout` 调度——见 `_triggerHitStop`）
- [x] 6.2 命中数 ≥1 且非 burst 时触发常规震屏（50ms 0.003）
- [x] 6.3 命中数 ≥3 时触发 burst：1 帧白色全屏 overlay（rectangle setScrollFactor(0)，下一帧 destroy） + 强震屏（120ms 0.008）替代常规震屏

## 7. 子弹时间技能

- [x] 7.1 在 `GameScene.create()` 中初始化 `this.slowFactor = 1.0`
- [x] 7.2 新增 `GameScene.fireBulletTime()`：若 `slowFactor < 1.0` 直接 return（避免 re-trigger 续期）；否则把 `slowFactor` 设为配置值，`time.delayedCall(durationMs, ...)` 恢复为 1.0
- [x] 7.3 在 `fireBulletTime` 中创建 vignette overlay sprite，`setScrollFactor(0)`、合适 depth，alpha 0 → peakAlpha 淡入；duration 接近结束时 alpha 淡出；`slowFactor` 恢复后 destroy
- [x] 7.4 新增 `GameScene.useSkill(player)`：读 `CLASSES[player.classId].skill`，分派到 `fireShockwave(player.x, player.y)` 或 `fireBulletTime()`
- [x] 7.5 改 `GameScene.update()` 末尾的 `if (pointer.isDown) this.tryShoot()` 为 `if (pointer.isDown) this.player.tryAttack(this.time.now)`

## 8. Enemy / EnemyBullet / Shooter 接受 slowFactor

- [x] 8.1 `Enemy.setVelocity` 重写为按 `scene.slowFactor` 缩放再调 super（实现路径调整：原计划是 `preUpdate` 每帧重缩放，但实测发现重复缩放会**复合衰减**——同一 velocity 每帧再乘 0.3，几帧后接近零。改为单点拦截 setVelocity 即可覆盖 AI 持续设速 + knockback 一次性 setVelocity，drag 在低起始速度上自然衰减。design.md 与 active-skill-bullet-time 的 spec 已同步更新）
- [x] 8.2 修改 `src/entities/EnemyBullet.js` 的 `fire()`：保存基准 `_baseVx / _baseVy`；`preUpdate` 每帧重设 `body.velocity = base * slowFactor`（这条仍走 preUpdate，因为 bullet 只在 fire 时设一次速度，需要响应中途的 slowFactor 切换）
- [x] 8.3 修改 `src/entities/enemies/Shooter.js` 的射击节流判断：把"距上次射击 ≥ fireRateMs" 改为 "≥ fireRateMs / scene.slowFactor"，让 slowFactor=0.3 时 shooter 射击间隔自然变 3.33×

## 9. 验证（手测，无测试框架）

- [x] 9.1 启动游戏，从主菜单进入选人界面，确认战士卡片可点击且不再置灰
- [x] 9.2 选择战士进入游戏，确认显示战士纹理（红/橙色调）+ sword（不显示 gun）
- [x] 9.3 hold 鼠标左键，确认按 attackRateMs 节流持续挥砍；松开停止
- [x] 9.4 让多个敌人靠近，确认只有 90° 弧内 + 范围内的敌人受伤；弧外/范围外不受影响；同一 swing 内每敌人只被命中一次
- [x] 9.5 确认挥砍 VFX 完整：sword 弧线 tween + slash 弧形扩张 + 残影拖尾
- [x] 9.6 命中至少 1 个敌人时确认 Hit-stop（短促冻结感）
- [x] 9.7 命中 ≥3 个敌人时确认屏幕白闪 + 强震屏
- [x] 9.8 拾取技能球后按 Q 触发子弹时间，确认敌人/敌方子弹明显变慢，自身移动与挥砍速度无变化
- [x] 9.9 子弹时间下让 shooter 射击，确认射击间隔明显变长（不只是子弹变慢）
- [x] 9.10 子弹时间持续 ~2.5s 后自动恢复，vignette 淡出，所有速度回正
- [x] 9.11 子弹时间激活期间再次按 Q（若有充能）确认无效（不续期、不消耗充能）
- [x] 9.12 子弹时间下挥砍命中确认 Hit-stop 被跳过（不卡顿）
- [x] 9.13 战士升级时确认 3 张候选卡均在 `[damage, movespeed, maxhp, regen, skillmax, swingrange, swingarc, attackspeed, cleave]` 集合内；不出现 `firerate / multishot / pierce / bspeed`
- [x] 9.14 选 Long Reach、Wide Sweep、Fervor、Cleaving Edge 各一次，确认数值生效（挥砍范围/弧度/频率/多目标伤害）
- [x] 9.15 切回法师玩一局，确认子弹路径、Q 触发 shockwave、升级池 9 张可见，与改前完全一致

## 10. 平衡复盘与归档准备

- [x] 10.1 跑 `/balance-review`（如脚本可用）或手测前 3 波 TTK；偏差 ≥30% 时优先调 `damage` 与 `attackRateMs`
- [x] 10.2 在 `docs/balance-journal.md` 追加一条战士初始数值的 baseline 与手测后的 after-feel
- [ ] 10.3 commit 用 `feat:` 前缀（如 `feat: add warrior class with bullet-time skill and per-class upgrade pool`）
- [ ] 10.4 跑 `/opsx:archive add-warrior-class` 归档；同时确认是否需要先归档已完成的 `add-class-selection`
- [ ] 10.5 确认归档后 `openspec/specs/class-warrior/` 与 `openspec/specs/active-skill-bullet-time/` 已生成
