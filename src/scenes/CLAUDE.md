# scenes/ — 局部规则

根 `CLAUDE.md` 已说明场景注册顺序与流转图。本文件只列写代码时的局部约定。

## 数据流约定

- **HUDScene 读 GameScene 状态**：`this.gameScene = this.scene.get('GameScene')` 在 `create()` 缓存引用，`update()` 每帧读 `gs.player` / `gs.waveManager` / `gs.kills`。HUDScene 永远不调用 GameScene 方法，只读。
- **GameScene 调 HUDScene 方法**用安全链：`this.scene.get('HUDScene')?.showBanner?.(text)`。HUDScene 由 `scene.launch` 异步启动，第一波 banner 必须用 `time.delayedCall(60, show)` 延迟，否则 `create()` 还没跑。参考 `GameScene.onWaveStart`。
- **数据传 UpgradeScene**：`scene.launch('UpgradeScene', { remaining: count })`，`create(data)` 中读 `data?.remaining ?? 1`。
- **数据传 GameOverScene**：用 `scene.start`（不是 launch），传 `{ wave, level, kills }`，会替换所有场景。

## 暂停/叠加层

- **PauseScene / UpgradeScene 都是 launch + pause 组合**：`this.scene.pause(); this.scene.launch('PauseScene')`。GameOverScene 是硬切（`scene.start`），不是叠加。
- **`pauseGame()` 必须 guard**：玩家死亡时拒绝；UpgradeScene 已激活时拒绝（避免暂停盖在升级界面上）。新增任何叠加层都要补 guard。
- **退出叠加层**：在叠加层内 `this.scene.resume('GameScene'); this.scene.stop()`。顺序不能反——先 stop 自己会丢上下文。

## 输入与碰撞回调

- **键盘绑定**写在 `create()`，一律走 `this.input.keyboard.on('keydown-XXX', ...)`，不用 `addKey + isDown`（除非要持续检测）。
- **碰撞回调**（`onBulletHitEnemy` 等）首行必须 guard：`if (!bullet.active || enemy.dead) return;`。物理引擎可能在帧内对失活对象触发回调。

## 新增场景的 checklist

1. 在 `main.js` 的 `scene` 数组按合适位置注册
2. 决定模式：硬切（`scene.start`）/ 叠加（`launch` + `pause`）/ 后台（`launch` 不 pause）
3. 如果是叠加，在 `GameScene.pauseGame()` 加 guard 防互冲
4. 数据传递用 `create(data)`，不要用全局/单例
5. **双人协作模式下**：若 change 改动 `GameScene.create()` 或加跨场景方法，先在 proposal `touches` 字段声明（见下节）

## GameScene 改动的 touches 声明（双人协作）

> 背景与原因见 `docs/ai-workflow/03-collaboration-rules.md` §1。

`GameScene` 是物理组、overlap 注册、跨场景钩子（`fireShockwave` 类）的集中地，是双人模式下的高频共享改动面。修改前必须在所属 OpenSpec change 的 proposal `touches` 字段声明：

- **新增 group**：group 名 + `classType` + `maxSize`
- **新增 overlap**：参与的 group / Sprite 对（如 `bullets × enemies`）
- **新增跨场景方法**：方法签名（如 `fireShockwave(x, y)`）
- **新增输入键**：键 + 触发条件（避免和 ESC/P/Q 撞）

声明的目的**不是事后审计**，是让另一个人在并行周期内 review proposals 时**提前看见冲突域**——若两份 proposal 同周期都声明改 `GameScene.create()` 加 group，必须协调先后顺序或合并为一个 change。
