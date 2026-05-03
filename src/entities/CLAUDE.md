# entities/ — 局部规则

根 `CLAUDE.md` 已说明实体继承结构。本文件只列写代码时的局部约定。

## 自注册与对象池

- **构造函数三件套**：`scene.add.existing(this)` + `scene.physics.add.existing(this)` + 设置 `setScale` / `setDepth`。缺一会出现"绘出来但没物理"或反之。
- **物理体形状**优先 `body.setCircle(radius, offsetX, offsetY)`，offset 让圆心对准精灵中心：`width/2 - radius`。
- **池化复用**通过 `scene.<group>.get(x, y)` 返回非活跃实例。**复活** Sprite 用 `enableBody(true, x, y, true, true)` + `setActive` + `setVisible` + `setPosition` + 重置内部状态（`hitSet.clear()`、`hp = maxHp` 等）。
- **kill** 一律 `this.disableBody(true, true)`，不要 `destroy()`，否则池失效。`destroy()` 仅在死亡动画结束的 `onComplete` 调用。

## preUpdate 中写 AI

- 池化实体（Bullet / Enemy 子类 / XPOrb）的 AI 写在 `preUpdate(time, delta)` 中，物理组用 `runChildUpdate: true` 自动调用。
- **第一行必须** `super.preUpdate(time, delta)`，否则动画/物理插值挂掉。
- **第二行 guard**：`if (!this.active) return;` 或 `if (this.dead) return;`。失活实例仍在内存里，preUpdate 仍会调。
- 出界回收：camera worldView ± margin 判断后 `this.kill()`（参考 `Bullet.preUpdate`）。

## Enemy 子类约定

- 继承 `Enemy`，构造函数传 `(scene, x, y, textureKey, ENEMY.<type>)`。配置必须从 `config.js` 的 `ENEMY` 块读取，不硬编码数值。
- `cfg` 在基类挂为 `this.cfg`，子类直接读 `this.cfg.speed` 等。
- 死亡钩子 `Enemy.die()` 调 `scene.handleEnemyDeath?.(this)` — 这是 GameScene 触发 XP 球生成与击杀计数的唯一入口，新增子类无需重写。

## Player 特殊性

- Player 不在物理组里，单实例，stats 是 `PLAYER` 配置的可变副本（升级会直接改 `this.stats`）。
- `muzzle` 是 `Vector2`，每帧由枪精灵旋转更新，作为子弹生成点 — 修改枪逻辑时不要忘了更新 muzzle。
- 无敌帧用时间戳 `invulUntil`，不是布尔。

## 新增实体的 checklist

1. 继承合适基类（多数情况是 `Phaser.Physics.Arcade.Sprite` 或 `Enemy`）
2. 构造函数三件套
3. 决定是否池化：池化加进 `GameScene.create()` 的 group + 实现 `kill()` / 复活逻辑
4. `preUpdate` 加 super + active guard
5. 在 `BootScene` 程序化生成纹理 + 注册动画 key
6. **双人协作模式下**：先开 OpenSpec change 固定 `id / texture_keys / anim_keys / config_block`（见下节）
7. 注册到 `src/debug/registry.js` 的 `DEBUG_SPAWNABLE` 对象

## Enemy 子类的命名空间约定（双人协作）

> 背景与原因见 `docs/ai-workflow/03-collaboration-rules.md` §1。

新敌人 / 精英 / Boss 必须先开 OpenSpec change，proposal 中固定四个字段：

| 字段 | 例 | 强约束 |
|---|---|---|
| `id` | `heavy` | kebab-case；全局唯一（含已归档 change） |
| `texture_keys` | `[heavy_a, heavy_b]` | 前缀必须等于 `id` |
| `anim_keys` | `[heavy_walk, heavy_die]` | 前缀必须等于 `id` |
| `config_block` | `ENEMY.heavy` | 块名等于 `id`（驼峰例外须在 spec 里显式说明） |

Phaser 的 texture / animation key 是全局字符串命名空间，同名后写**静默覆盖**前写——单人不痛，双人撞一次的调试成本极高。`id` 前缀对齐是把这条隐性风险变成 review 时一眼可查的显性规则。

未走 spec 的散件 PR 不合并；散件 commit 在归档其他 change 时被 `/opsx:archive` 检测到属于"无 spec 接入新内容"，会反对归档。
