## Why

当前两个职业（mage / warrior）都缺少**主动位移工具**。玩家被冲脸或被远程压制时，唯一的应对方式是普通移动（180/200 px/s）+ Q 主动技能。Q 技能依赖充能 / 已被现有技能树占用语义（冲击波、子弹时间、时停、奥术风暴），不适合再叠加"短位移 + 短无敌"的轻量逃生功能。

加入翻滚（roll-dodge）作为**两职业共享的基础动作**：右键即时触发 / 1 秒内置 CD / 翻滚期间无敌 / 落点撞敌人会立即吃伤。它和 Q 主动技能完全独立——不消耗充能、不进升级树、不替换任何已有功能——而是给"位移"这条玩家维度补一个层级。

落点伤害是**有意的风险机制**：翻滚不是无脑无敌按钮，玩家必须判断鼠标方向上是否会撞到敌人。这与"瞄准 = 鼠标"的现有交互天然耦合——翻滚前需要先转视线，强化"思考再行动"的玩法。

## What Changes

### 翻滚行为

- **触发**：右键按下（鼠标 button 2）
- **方向**：玩家位置 → 鼠标位置的归一化向量（鼠标贴脸时 fallback 到 `player._aimAngle`）
- **持续**：250ms / 距离约 150px（速度 = 600 px/s，固定不受 moveSpeed 影响）
- **CD**：固定 1 秒（不入升级树，不受任何升级影响）
- **无敌帧**：翻滚开始 → 翻滚结束的整个 250ms，玩家 `invulnUntil` 强制覆盖至落地时刻
- **落地伤害**：翻滚结束帧若与任意敌人 body 重叠，立即受 `enemy.cfg.contactDamage` 伤害（走现有 `takeDamage` 路径），无敌帧已结束所以会真实结算
- **输入锁定**：翻滚期间忽略 WASD，不能触发攻击（左键），不能再次翻滚

### 输入系统改造

- 左键：触发攻击（`tryAttack`）— 当前用 `activePointer.isDown` 对所有按键都触发，必须改为 `pointer.leftButtonDown()`
- 右键：触发翻滚 — 通过 `pointerdown` 事件 + `event.button === 2` 监听
- `this.input.mouse.disableContextMenu()` — 禁用浏览器右键菜单

### 视觉反馈（零美术，全程序化）

- **起跳扬尘**：复用 `shockwave` 纹理 + `setTint(0xaaaaaa)`，scale 0.3→1.0 / alpha 0.6→0 / 180ms
- **过程残影**：每 50ms 克隆一个玩家精灵（用当前 `texturePrefix + '_run_a'`），alpha 0.5→0 + scale 1→0.85，200ms tween
- **iframe 提示**：玩家本体 `setTint(0x88ccff)`（淡蓝），区别 hurt 的白闪、frost 的强蓝
- **落地扬尘**：同起跳但 scale 略小

### 配置块

`src/config.js` 新增 `ROLL` 配置块：
```js
export const ROLL = {
  durationMs: 250,
  speed: 600,
  cooldownMs: 1000,
  iframeTint: 0x88ccff,
  dustTint: 0xaaaaaa,
  afterimageIntervalMs: 50,
  afterimageDurationMs: 200,
};
```

### touches

- `src/config.js`（新增 `ROLL` 配置块）
- `src/scenes/GameScene.js`（`create()` 输入改造：`disableContextMenu` + 右键 `pointerdown` 监听 + `tryAttack` 改 `leftButtonDown()`；新增 `onRollLand(player)` 跨场景方法；新增 `_spawnRollDust(x, y)` / `_spawnRollAfterimage(player)` 辅助）
- `src/entities/Player.js`（新增 `tryRoll(time)` / `isRolling` / `lastRollAt` / `_rollVelX` / `_rollVelY`；`update()` 中 rolling 期间跳过输入处理；新增 `_endRoll(time)`）

## Capabilities

### New Capabilities

- `roll-dodge`: 两职业共享的右键翻滚动作，1s 内置 CD + 250ms 无敌位移 + 落点风险机制 + 鼠标方向决定 + 输入锁定。

### Modified Capabilities

- 输入系统：从"任何鼠标键 = 攻击"细化为"左键攻击 / 右键翻滚"。

## Impact

### 受影响代码

- `src/config.js`：新增 `ROLL` 配置块
- `src/scenes/GameScene.js`：`create()` 输入绑定改造、`update()` 攻击触发条件改 `leftButtonDown()`、新增 `onRollLand` / dust / afterimage 辅助方法
- `src/entities/Player.js`：新增翻滚状态机和 `tryRoll`、`update` 中 rolling 分支

### 新增文件

- 无（所有改动在现有文件中）

### 破坏性变更

- **输入语义**：原本"按住任意鼠标键 = 持续攻击"，改为"按住左键 = 持续攻击"。如果玩家习惯用右键开火，需要重学。这是设计意图（右键被翻滚占用），不属于 bug。

### 依赖

- 无外部依赖。纯 Phaser 内置 API。

### 不在范围内

- 翻滚相关的升级卡（"翻滚 CD -0.2s" / "+1 翻滚次数"）— 后续迭代
- 翻滚音效 — 项目暂无音效系统
- 翻滚专用 PNG 美术（`roll_dust.png`）— 待手感打磨完确认手感稳定后再决定，本 change 不登记 `art-assets-list.md`
- HUD 翻滚 CD 指示 — 后续迭代（手感稳定后看玩家是否需要）
