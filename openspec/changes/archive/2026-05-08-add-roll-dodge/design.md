## Context

`Player` 当前移动通过 `update()` 中读 WASD/方向键 → 归一化 → `setVelocity(dir * moveSpeed)`。攻击通过 `GameScene.update()` 第 640 行的：

```js
if (this.input.activePointer.isDown) this.player.tryAttack(this.time.now);
```

`activePointer.isDown` 对**任何鼠标键**都为 true——也就是说当前按右键也会开火。这条是引入翻滚前必须修复的隐性冲突。

无敌帧机制已存在：`Player.takeDamage()` 检查 `time < this.invulnUntil` 来跳过伤害。`takeDamage` 不区分"为什么无敌"，所以翻滚的无敌可以直接复用——只要在翻滚期间把 `invulnUntil` 顶到落地时间即可。

碰撞回调 `onPlayerTouchEnemy`（GameScene:129）走 `player.takeDamage()`，也会被无敌帧自动屏蔽——翻滚穿过敌人不掉血。落地时无敌帧刚结束，重叠回调若仍触发就会真实结算伤害。

**约束条件：**
- 视觉资产全部程序化或复用现有纹理（不新增 PNG）
- 不破坏现有 Q 主动技能、子弹时间、时停、奥术风暴的状态机
- 翻滚期间 physics world 正常运行（不设 `time.timeScale = 0`）
- 输入响应延迟必须低于 1 帧（玩家按下右键到翻滚启动 ≤ 16ms）

## Goals / Non-Goals

**Goals:**
- 右键即时触发，1s 固定 CD
- 鼠标方向决定翻滚向量（鼠标贴脸时用最近的 aim 角度）
- 翻滚期间 250ms 完全无敌，落地的那一帧无敌结束
- 落地撞敌人 = 立即吃 `contactDamage`（纯风险机制）
- 翻滚期间锁输入（不能 WASD 改向、不能攻击、不能再次翻滚）
- 视觉 3 层：起跳/落地扬尘 + 过程残影 + 玩家本体淡蓝 tint
- 与 Q 主动技能完全独立（不共享充能、UI、CD、状态）

**Non-Goals:**
- 翻滚不打敌人（不附带任何攻击效果）
- 翻滚不进升级树（基础动作，不可升级）
- 翻滚不消耗任何资源（充能、HP、XP 都不变）
- 不做翻滚音效（项目无音效系统）
- 不做翻滚专用美术（先零美术验证手感）
- 不做翻滚 HUD CD 指示（手感稳定后再加）
- 翻滚不能取消攻击动画（warrior swing tween 仍跑完，但翻滚位移立即生效）

## Decisions

### 1. 触发时机用 `pointerdown` 事件而非 `rightButtonDown()` 轮询

**选择**：在 `GameScene.create()` 注册 `this.input.on('pointerdown', ...)`，回调中判断 `pointer.button === 2` 触发翻滚。

**理由**：
- 翻滚是边沿触发（按下瞬间触发一次），用事件比每帧轮询 `rightButtonDown()` 更符合语义
- 不会出现"按住右键 = 连续翻滚"的歧义（事件只在按下瞬间触发一次）
- 与现有 `keydown-Q` / `keydown-ESC` 事件风格一致

**替代方案**：每帧轮询 `pointer.rightButtonDown()` + 边沿检测——多一个 `_rightWasDown` 状态字段，没必要。

### 2. 攻击改用 `leftButtonDown()` 而非保留 `isDown`

**选择**：`GameScene.update()` 中改为 `if (this.input.activePointer.leftButtonDown()) this.player.tryAttack(...)`。

**理由**：右键已被翻滚占用，按右键不应开火。`leftButtonDown()` 是 Phaser 原生 API，零额外状态。

**破坏性**：玩家若习惯用右键开火，行为会变。这是必要的牺牲（右键被新功能占用）。

### 3. 静止时朝鼠标方向（无方向歧义）

**选择**：`tryRoll()` 中重新计算翻滚方向：

```js
const angle = Math.atan2(world.y - this.y, world.x - this.x);
this._rollVelX = Math.cos(angle) * ROLL.speed;
this._rollVelY = Math.sin(angle) * ROLL.speed;
```

**鼠标贴脸 fallback**：若鼠标到玩家距离 < 1px（极端情况），使用 `this._aimAngle`（上一帧的瞄准角度，永远有值）。

**理由**：
- 玩家完全静止时也能翻滚（不需要先按 WASD）
- 鼠标方向 = 玩家关注方向，符合直觉
- mage 玩家瞄着敌人 → 翻滚方向 = 敌人方向 → 落点撞 → 吃伤。这是设计意图（"先转视线"是技术深度），见 proposal §A 权衡

### 4. 翻滚期间锁输入：早返回模式

**选择**：`Player.update()` 第一行加：

```js
if (this.isRolling) {
  this.setVelocity(this._rollVelX, this._rollVelY);
  // 仍要更新 weapon position / aimAngle（让武器跟随）
  this._updateAim(time, delta);
  return;
}
```

**理由**：
- 锁 WASD（输入读取被 skip）
- 锁攻击：`tryAttack` 中加 `if (this.isRolling) return;`，左键按下也不会发射
- 锁翻滚：`tryRoll` 开头检查 `if (this.isRolling) return false;`
- 翻滚速度直接覆盖到 setVelocity，不受 `scene.slowFactor` 影响（玩家不被时停/子弹时间减速）— 这是基础动作的一致性
- 武器仍跟随玩家 + 朝鼠标转，让翻滚结束时玩家无缝衔接攻击

**关于 slowFactor**：现在 `Player.setVelocity` 没有 slowFactor 处理（只有 Enemy 有）。所以翻滚速度天然不被时停影响，符合"翻滚是基础动作"的定位。

### 5. 无敌帧通过 `invulnUntil` 顶值实现

**选择**：`tryRoll(time)` 中：

```js
this.invulnUntil = Math.max(this.invulnUntil, time + ROLL.durationMs);
```

**理由**：
- 复用现有机制，零新代码路径
- `Math.max` 确保不会缩短已有的无敌（如刚被打过 400ms 无敌，翻滚 250ms 不会把它砍短）
- 落地时刻 `time + ROLL.durationMs` 后，自然进入"无敌结束"——若 overlap 仍触发，takeDamage 真实结算

### 6. 落地伤害靠"无敌窗口与翻滚时长对齐"自然触发

**选择**：不写专门的 "landing damage" 路径。翻滚结束时 `_endRoll()` 只做：清状态 + 复位、生成落地扬尘、重新允许输入。

**敌人重叠的伤害结算靠现有的 `onPlayerTouchEnemy`** 自然触发——玩家落地时若与敌人 body 重叠，下一物理帧 overlap 回调照常调用 `player.takeDamage(enemy.cfg.contactDamage, time)`。此时无敌帧已结束（`time >= invulnUntil`），伤害真实结算。

**风险**：如果 `_endRoll` 的 `delayedCall` 触发时间 vs Phaser 物理帧触发时间错位（例如 `delayedCall` 在第 N 帧结束、overlap 回调在第 N+1 帧才跑），可能落地后 1 帧才结算。这 1 帧（~16ms）内若玩家在敌人 body 内但无敌已结束，会正确结算。可接受。

**替代方案**（拒绝）：手动 `enemies.getChildren().forEach` 检查重叠 + 显式调 `takeDamage`。复杂度高，与现有 overlap 路径重复，被否决。

### 7. 翻滚期间 takeDamage 的特殊路径无需

**说明**：翻滚的无敌靠 `invulnUntil`，takeDamage 现有逻辑已经能正确拒绝伤害。不需要额外加 `if (this.isRolling) return false`——保留 `invulnUntil` 单一来源，避免双判断引入不一致。

### 8. 视觉 3 层 — 实现细节

**起跳扬尘**（`tryRoll` 中）：
```js
const dust = scene.add.image(this.x, this.y, 'shockwave')
  .setBlendMode(Phaser.BlendModes.ADD)
  .setTint(ROLL.dustTint)
  .setDepth(8)
  .setScale(0.3).setAlpha(0.6);
scene.tweens.add({
  targets: dust, scale: 1.0, alpha: 0,
  duration: 180, ease: 'Cubic.easeOut',
  onComplete: () => dust.destroy(),
});
```

**过程残影**（用 `time.addEvent` 间隔触发）：
```js
const ghostKey = this.texturePrefix + '_run_a';
this._afterimageTimer = scene.time.addEvent({
  delay: ROLL.afterimageIntervalMs,
  loop: true,
  callback: () => {
    const ghost = scene.add.image(this.x, this.y, ghostKey)
      .setScale(2).setDepth(9).setAlpha(0.5)
      .setFlipX(this.flipX);
    scene.tweens.add({
      targets: ghost, alpha: 0, scale: 1.7,
      duration: ROLL.afterimageDurationMs,
      onComplete: () => ghost.destroy(),
    });
  },
});
```

`_endRoll` 里 `this._afterimageTimer.remove()` 清理。

**iframe tint**：`tryRoll` 中 `this.setTintFill(ROLL.iframeTint)`，`_endRoll` 中 `this.clearTint()`。

**注意 hurt flash 冲突**：`takeDamage` 在翻滚期间被无敌挡掉，不会调 setTintFill(0xffffff)，所以蓝色 tint 不会被白色覆盖。落地后若立即吃伤，`takeDamage` 设白 → 80ms 后 clearTint，正常表现。

### 9. 翻滚被中断的边界

**死亡**：若翻滚中玩家死亡（不会发生因为无敌，但理论上 die() 可被外部强制调用）：`_endRoll` 内检查 `if (this.dead) return;`，afterimage timer 在 die() 中也要清。

**场景暂停**：`scene.pause()` 会冻结整个场景的 time 系统，`delayedCall` 也跟着暂停——翻滚状态被冻在暂停瞬间，恢复后继续。这正是想要的行为（暂停 = 完全冻结）。

**世界边界**：`setCollideWorldBounds(true)` 已存在，翻滚撞墙会停在边界上但状态机仍走完 250ms。落地时若边界外没有敌人，自然不吃伤。

## Risks / Trade-offs

### Risk 1：玩家右键习惯被破坏

**Mitigation**：玩家几乎不会按住右键当攻击键（左键是默认习惯）。但若有，需要在游戏内 UI 或菜单标注"左键攻击 / 右键翻滚"。本 change 不做 UI 文案，依赖玩家 ~30 秒摸索学会。

### Risk 2：mage 落点伤害陷阱

**Mitigation**：在 design 中显式记录这是设计意图（proposal §A），不是 bug。若实际游玩反馈"太苛刻"，未来 change 可以改成"翻滚朝鼠标反方向"或"职业差异化"，本 change 先保持纯粹。

### Risk 3：1s CD 是否够爽快

**Mitigation**：1s CD 在同类游戏（Hades / Risk of Rain 2）属于偏严格的档位（这两款 0.5~1s）。如果实测觉得短，可调到 800ms；觉得长，引入升级卡 "Roll Mastery" 减 CD。本 change 先用 1000ms 标尺，归档前 playtest 确认手感。

### Risk 4：afterimage timer 累积泄漏

**Mitigation**：`_endRoll` 必须 `this._afterimageTimer?.remove()`。死亡 / 场景切换路径也要清。`Player.die()` 中加 `this._afterimageTimer?.remove()`。

### Risk 5：输入冲突——翻滚瞬间右键未抬起就左键攻击

**说明**：
- 玩家按右键 → 翻滚启动 → 250ms 期间 isRolling = true → 左键按下也被 `tryAttack` 早返回挡住
- 翻滚结束后右键仍按住 → `pointerdown` 事件不会再触发（事件是边沿）→ 不会再翻
- 左键持续按住 → `update()` 中 `leftButtonDown()` 持续 true → 翻滚结束立即恢复攻击节奏

无冲突。

### Trade-off：翻滚不能取消 warrior 的 swing 动画

**选择**：翻滚启动会触发位移 + 无敌，但 `_swingActive` 不会被强制设 false（让 swordTween 自然跑完）。视觉上 warrior 会"边翻边挥剑"——可能略怪但不影响 gameplay。

**理由**：动画状态强制清理引入复杂度（需要 kill tween + 手动复位 weapon rotation），收益有限（视觉边际）。先接受，归档前观察是否需要。

## 与现有系统的隔离

| 系统 | 翻滚是否影响 | 备注 |
|---|---|---|
| 子弹时间（warrior） | 否 | slowFactor 不影响 Player.setVelocity |
| 时停（warrior） | 否 | 同上 |
| 冲击波（mage） | 否 | Q 键独立，可和翻滚同帧释放 |
| 奥术风暴（mage） | 否 | 同上 |
| 升级卡 | 否 | 翻滚不读 stats，不被升级影响 |
| 调试面板 F1 | 否 | DebugScene 暂停 GameScene，翻滚冻在原地 |
| 暂停 ESC/P | 否 | 同上 |
| Mimic 拾取奖励 | 否 | 翻滚不影响 Mimic AI |

**唯一耦合点**：`invulnUntil`。翻滚和 takeDamage 共用这个时间戳，落地伤害靠它失效结算。这是设计意图，不是耦合 bug。
