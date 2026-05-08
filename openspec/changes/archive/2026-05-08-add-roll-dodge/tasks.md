## Tasks

- [x] T1: `src/config.js` — 新增 `ROLL` 配置块（`durationMs: 250`, `speed: 600`, `cooldownMs: 1000`, `iframeTint: 0x88ccff`, `dustTint: 0xaaaaaa`, `afterimageIntervalMs: 50`, `afterimageDurationMs: 200`）

- [x] T2: `src/entities/Player.js` — 新增翻滚状态字段（`isRolling`, `lastRollAt`, `_rollVelX`, `_rollVelY`, `_afterimageTimer`），构造函数中初始化为默认值

- [x] T3: `src/entities/Player.js` — 新增 `tryRoll(time)` 方法：CD 检查 → 计算鼠标方向（贴脸 fallback `_aimAngle`）→ 设置 isRolling/速度/`invulnUntil` → 启动 afterimage timer → 设 iframe tint → 生成起跳扬尘 → 250ms 后调 `_endRoll`

- [x] T4: `src/entities/Player.js` — 新增 `_endRoll(time)` 方法：清 isRolling → 清 afterimage timer → clearTint → 生成落地扬尘 → 速度归零（让 update 恢复输入读取）

- [x] T5: `src/entities/Player.js` — `update(time, delta)` 开头加翻滚分支：若 `isRolling`，setVelocity(_rollVelX, _rollVelY) + 仅更新瞄准/武器位置（不读 WASD、不触发动画切换），return

- [x] T6: `src/entities/Player.js` — `tryAttack(time)` 开头加 `if (this.isRolling) return;` 拦截攻击

- [x] T7: `src/entities/Player.js` — `die()` 中清理 `_afterimageTimer?.remove()`，避免泄漏

- [x] T8: `src/scenes/GameScene.js` — `create()` 中加 `this.input.mouse.disableContextMenu()` 禁用浏览器右键菜单

- [x] T9: `src/scenes/GameScene.js` — `create()` 中注册 `this.input.on('pointerdown', (pointer) => { if (pointer.button === 2) this.player.tryRoll(this.time.now); })`，加场景 active + 玩家未死的 guard

- [x] T10: `src/scenes/GameScene.js` — `update()` 中攻击触发条件改为 `this.input.activePointer.leftButtonDown()`（替换 `isDown`）

- [x] T11: 浏览器手测：左键持续攻击正常 / 右键不再触发攻击 / 右键单击触发翻滚 / 1s CD 内右键无效 / 翻滚期间 WASD 锁住 / 翻滚期间敌人子弹无伤 / 翻滚穿越敌人无伤 / 落地撞敌人立即吃 contactDamage / 起跳/过程/落地 VFX 显示正常 / iframe 蓝色 tint 显示 / 翻滚撞世界边界停住但状态正常 / mage warrior 都能翻 / 暂停 ESC 后翻滚状态冻结 / DebugScene F1 后翻滚状态冻结

- [x] T12: 平衡感受复盘 — 翻滚距离 150px 是否足够脱险 / 1s CD 是否爽快 / mage 落点陷阱实战频率，记录到 `docs/balance-journal.md`

- [x] T13: 语法检查通过（config / Player / GameScene 三文件）+ 浏览器无 console error
