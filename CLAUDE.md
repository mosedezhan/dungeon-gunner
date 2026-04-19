# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

## 运行游戏

无构建步骤。Phaser 3 通过 `index.html` 中的 CDN 加载。需要本地静态服务器（ES 模块无法从 `file://` 协议加载）：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

也可使用 VS Code 的 Live Server 扩展。

项目没有测试框架、没有代码检查工具、没有打包器。所有改动通过浏览器手动验证。

## 架构

**基于 Phaser 3 的 ES 模块结构游戏。** 所有源码在 `src/` 目录下，以原生 ES 模块形式从 `index.html` 加载。

### 场景流转（在 `main.js` 中按顺序注册）

```
BootScene → MenuScene → GameScene（并行运行：HUDScene）
                          ├─ PauseScene（叠加层，暂停 GameScene）
                          ├─ UpgradeScene（叠加层，升级时暂停 GameScene）
                          └─ GameOverScene（死亡时替换所有场景）
```

- **BootScene** — 通过 `Graphics.generateTexture()` 程序化生成所有纹理和动画。无外部精灵图资源。每个角色/敌人/特效都定义为像素网格常量，绘制到纹理上。所有 Phaser 动画 key 在此处创建。
- **GameScene** — 主游戏循环。拥有所有物理组（`bullets`、`enemyBullets`、`xpOrbs`、`enemies`）、`Player` 实例和 `WaveManager`。所有碰撞/重叠回调在此处理。通过 `scene.launch('HUDScene')` 并行启动 HUD。
- **HUDScene** — 每帧通过 `this.scene.get('GameScene')` 直接读取游戏状态。提供 `showBanner(text)` 方法供 GameScene 在波次切换时调用（首波因 launch 异步需要延迟调用）。
- **UpgradeScene** — 接收 `{ remaining }` 数据。暂停 GameScene，展示 3 张随机升级卡片。选中的升级通过 `apply` 函数直接修改 `Player.stats`。
- **PauseScene** — 暂停 GameScene，按 ESC/P 恢复，按 Q 返回主菜单。
- **GameOverScene** — 通过 `scene.start()` 从 GameScene 接收 `{ wave, level, kills }` 数据。

### 实体模式

实体继承 `Phaser.Physics.Arcade.Sprite`，通过 `scene.add.existing(this)` + `scene.physics.add.existing(this)` 自注册。通过 `scene.physics.add.group({ classType, maxSize })` 进行对象池化。

- **Player** — 持有 `stats` 对象（`PLAYER` 配置的可变副本）。枪是独立的精灵，跟随鼠标旋转。`muzzle` 是每帧更新的 `Vector2`，作为子弹生成点。支持无敌帧和生命回复累积。
- **Enemy**（基类）— 由 `Chaser`、`Rusher`、`Shooter` 继承。各自从 `ENEMY` 配置块读取行为参数。敌人在 `preUpdate` 中执行 AI（追踪/走位/射击）。`Shooter` 使用场景的 `enemyBullets` 组发射子弹。
- **Bullet / EnemyBullet** — 发射后自动飞行的弹丸，有生命周期和出界回收。玩家子弹通过 `hitSet` 追踪穿透（同一敌人只命中一次）。
- **XPOrb** — 通过缓动实现脉冲动画，在 `XP.pickupRadius` 半径内被玩家吸引。

### 配置文件 (`src/config.js`)

所有可调参数的唯一来源：玩家属性、敌人定义、波次时间、XP 曲线、升级定义。`UPGRADES` 数组包含 `apply(p)` 函数，直接修改 `Player.stats`。调整游戏平衡时只需修改此文件。

### 关键约定

- **无需外部资源。** 所有精灵都是 BootScene 中程序化生成的像素艺术。纹理 key 是硬编码字符串，在场景/实体间交叉引用。
- **场景通信** 使用 Phaser 场景管理器（`scene.get()`、`scene.pause()`、`scene.launch()`、带数据的 `scene.start()`）。不使用事件总线。
- **`GameScene.handleEnemyDeath()`** 由 `Enemy.die()` 通过场景引用调用 — 这是生成 XP 球和追踪击杀数的钩子。
- **物理组** 使用 `runChildUpdate: true`，使池化实体在激活时自动调用 `preUpdate`。

## Git 与 GitHub

- 远程仓库：`https://github.com/mosedezhan/dungeon-gunner`
- 提交风格：使用 `feat:`、`fix:`、`refactor:` 约定式前缀
- 每次有意义的改动后推送
