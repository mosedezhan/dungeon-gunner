## 1. Config

- [x] 1.1 在 `src/config.js` 新增 `SKILL` 块：`pickupRadius`、`magnetSpeed`、`dropChance`、`knockbackRadius`、`knockbackForce`、`vfxMaxScale`、`vfxDurationMs`，并给一组默认值（dropChance ≈ 0.05，knockbackRadius ≈ 120，knockbackForce ≈ 260，vfxMaxScale ≈ 8，vfxDurationMs ≈ 500）
- [x] 1.2 在 `PLAYER` 块加入 `skillChargesMax: 1`
- [x] 1.3 在 `UPGRADES` 数组追加 `skillmax` 卡片：`Resonance Core`，apply 中 `p.stats.skillChargesMax += 1; p.skillCharges = Math.min(p.stats.skillChargesMax, p.skillCharges + 1);`

## 2. Textures (BootScene)

- [x] 2.1 在 `src/scenes/BootScene.js` 新增 `skill_orb` 纹理：橙红色发光球，与 XP 蓝色明显区分（中心高亮 + 外圈暖色，尺寸约 10×10）
- [x] 2.2 在 `BootScene` 新增 `shockwave` 环形纹理：透明中心 + 亮白外圈描边 + 半透明蓝色内圈，尺寸约 64×64（用 `Graphics.lineStyle/strokeCircle` 或 `fillCircle` 双层叠加）

## 3. Entity: SkillOrb

- [x] 3.1 新建 `src/entities/SkillOrb.js`，类结构参考 `XPOrb.js`：构造函数、`spawn(x, y)`、`preUpdate(time, delta)`、`kill()`
- [x] 3.2 `spawn` 中：`enableBody`、`setCircle(5)`、`setDepth(4)`、起一个 `pulseTween`（scale 1↔1.25 yoyo），并随机一个小初速度后 300ms 归零（与 XPOrb 风格一致）
- [x] 3.3 `preUpdate` 中先 `super.preUpdate` + `if (!this.active) return;`，然后在 `SKILL.pickupRadius` 内向 `scene.player` 加速吸附
- [x] 3.4 `kill` 中停 pulseTween 并 `disableBody(true, true)`

## 4. Player: Skill State + Trigger

- [x] 4.1 在 `Player` 构造函数中初始化 `this.skillCharges = 0;`（注意：`stats.skillChargesMax` 已通过 `{ ...PLAYER }` 复制进来）
- [x] 4.2 新增方法 `triggerSkill()`：当 `this.dead` 或 `this.skillCharges <= 0` 时返回 `false`；否则 `this.skillCharges -= 1;` 调 `this.scene.fireShockwave?.(this.x, this.y);` 并返回 `true`
- [x] 4.3 新增方法 `gainSkillCharge(n = 1)`：`this.skillCharges = Math.min(this.stats.skillChargesMax, this.skillCharges + n);` 返回是否实际增加（用于决定是否消耗球，但 D7 决定不消耗也吃球，所以本方法可只做夹取）

## 5. GameScene: Wiring

- [x] 5.1 在 `GameScene.create` 创建 `this.skillOrbs = this.physics.add.group({ classType: SkillOrb, runChildUpdate: true, maxSize: 100 });`
- [x] 5.2 添加 overlap：`this.physics.add.overlap(this.player, this.skillOrbs, this.onPickupSkillOrb, null, this);`
- [x] 5.3 实现 `onPickupSkillOrb(player, orb)`：guard `if (!orb.active || player.dead) return;` → `orb.kill();` → `player.gainSkillCharge(1);`
- [x] 5.4 在 `create` 中绑 Q 键：`this.input.keyboard.on('keydown-Q', () => this.player.triggerSkill());`（暂停场景下 Phaser 不分发输入，无需手动 guard 暂停状态；但仍建议保留 `if (!this.scene.isActive() || this.player.dead) return;` 防御）
- [x] 5.5 修改 `handleEnemyDeath(enemy)`：在现有 XP orb spawn 之后，`if (Math.random() < SKILL.dropChance) { const o = this.skillOrbs.get(enemy.x, enemy.y); if (o) o.spawn(enemy.x, enemy.y); }`
- [x] 5.6 实现 `fireShockwave(x, y)`：(a) 遍历 `this.enemyBullets.getChildren()`，对 `b.active` 调 `b.kill()`；(b) 遍历 `this.enemies.getChildren()`，对 `e` 距离 `(x,y) < SKILL.knockbackRadius` 且 `!e.dead` 的调 `e.knockback(x, y, SKILL.knockbackForce);`；(c) 调 `this._spawnShockwaveVfx(x, y);`；(d) 加一个 `this.cameras.main.shake(120, 0.004)` 增加冲击感
- [x] 5.7 实现 `_spawnShockwaveVfx(x, y)`：`const ring = this.add.image(x, y, 'shockwave').setBlendMode(Phaser.BlendModes.ADD).setDepth(20).setScale(0.2);` → Tween 到 `scale: SKILL.vfxMaxScale, alpha: 0, duration: SKILL.vfxDurationMs, ease: 'Cubic.easeOut', onComplete: () => ring.destroy();`

## 6. HUDScene

- [x] 6.1 在 `HUDScene.update` 的 `statsText.setText(...)` 模板中追加一行 `skill ${p.skillCharges}/${p.stats.skillChargesMax}`
- [x] 6.2 验证 HUD 在升级抽到 `skillmax` 后立即反映新上限（无需新增代码，仅在手测中确认）

## 8. Knockback Stun Window (Playtest Fix)

- [x] 8.1 `Enemy.constructor` 加 `this.knockUntil = 0;`
- [x] 8.2 `Enemy.knockback(fromX, fromY, power = 180, durationMs = 220)`：保留 setVelocity，并设置 `this.knockUntil = scene.time.now + durationMs;`
- [x] 8.3 `Chaser.preUpdate` 在 `super` 之后、AI 计算之前加 `if (time < this.knockUntil) return;`
- [x] 8.4 `Rusher.preUpdate` 同上加击退守卫
- [x] 8.5 `Shooter.preUpdate` 加击退守卫：硬直窗口内不抢速度但保留 flipX；超出窗口走原 AI（避免射手在击退中开火朝奇怪方向）
- [x] 8.6 `config.SKILL.knockbackForce` 从 260 调到 480 以匹配 `body.setDrag(0.0005)` 的衰减

## 7. Manual Verification (Browser)

- [x] 7.1 启动本地服务（`python -m http.server 8000`），打开 `http://localhost:8000`
- [x] 7.2 启动游戏后 HUD 显示 `skill 0/1`；按 Q 无任何反应（无消耗、无 VFX）
- [x] 7.3 临时把 `SKILL.dropChance` 调到 `1.0` 验证：每个敌人死亡都掉 SkillOrb；颜色与 XP 球明显不同；走近后被吸附，碰到后 HUD 变为 `skill 1/1`
- [x] 7.4 满充能时再吃一个 SkillOrb：HUD 仍显示 `skill 1/1`，球被消耗（不在地上堆积）
- [x] 7.5 按 Q：屏幕上所有敌方子弹消失；玩家附近敌人被向外推开；中心冒出环形冲击波动画并淡出；HUD 回到 `skill 0/1`
- [x] 7.6 升级抽到 `Resonance Core`：HUD 立即变为 `skill 1/2`（max+1，当前+1）
- [x] 7.7 暂停场景下按 Q：无效果；游戏结束后按 Q：无效果
- [x] 7.8 把 `SKILL.dropChance` 改回平衡值（建议 0.05），刷一波确认掉率体感合理
- [x] 7.9 死亡 + 重开：`skillCharges` 回到 0，`skillChargesMax` 回到 1（验证不残留状态）
