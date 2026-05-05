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
                          ├─ DebugScene（叠加层，F1 触发，暂停 GameScene，开发调试用）
                          └─ GameOverScene（死亡时替换所有场景）
```

- **BootScene** — 通过 `Graphics.generateTexture()` 程序化生成所有纹理和动画。无外部精灵图资源。每个角色/敌人/特效都定义为像素网格常量，绘制到纹理上。所有 Phaser 动画 key 在此处创建。
- **GameScene** — 主游戏循环。拥有所有物理组（`bullets`、`enemyBullets`、`xpOrbs`、`enemies`、`skillOrbs`）、`Player` 实例和 `WaveManager`。所有碰撞/重叠回调在此处理。通过 `scene.launch('HUDScene')` 并行启动 HUD。URL 加 `?debug` 参数可跳过菜单直接进入并停止自动刷怪。
- **DebugScene** — F1 触发的开发调试叠层。暂停 GameScene，提供即时刷怪（数字键 1-9，在玩家周围生成）、技能充能（Q）、God Mode（W）、Kill All（E）、跳波（R）、停止自动刷怪（T）。可 spawn 实体列表集中在 `src/debug/registry.js`。
- **HUDScene** — 每帧通过 `this.scene.get('GameScene')` 直接读取游戏状态。提供 `showBanner(text)` 方法供 GameScene 在波次切换时调用（首波因 launch 异步需要延迟调用）。
- **UpgradeScene** — 接收 `{ remaining }` 数据。暂停 GameScene，展示 3 张随机升级卡片。选中的升级通过 `apply` 函数直接修改 `Player.stats`。
- **PauseScene** — 暂停 GameScene，按 ESC/P 恢复，按 Q 返回主菜单。
- **GameOverScene** — 通过 `scene.start()` 从 GameScene 接收 `{ wave, level, kills }` 数据。

### 实体模式

实体继承 `Phaser.Physics.Arcade.Sprite`，通过 `scene.add.existing(this)` + `scene.physics.add.existing(this)` 自注册。通过 `scene.physics.add.group({ classType, maxSize })` 进行对象池化。

- **Player** — 持有 `stats` 对象（`PLAYER` 配置的可变副本）。枪是独立的精灵，跟随鼠标旋转。`muzzle` 是每帧更新的 `Vector2`，作为子弹生成点。支持无敌帧和生命回复累积。持有主动技能充能（`skillCharges` / `stats.skillChargesMax`），按 Q 触发 `triggerSkill()`。
- **Enemy**（基类）— 由 `Chaser`、`Rusher`、`Shooter`、`Giant`、`Bomber`、`Mimic`、`EliteChaser`、`EliteShooter`、`EliteGiant` 继承。各自从 `ENEMY` 配置块读取行为参数。敌人在 `preUpdate` 中执行 AI（追踪/走位/射击）。`Shooter` 使用场景的 `enemyBullets` 组发射子弹。`Giant` 使用四拍状态机（windup / swing / impact / recovery）驱动砸地 AOE，各阶段时长按 `scene.slowFactor` 缩放（与 Shooter 射击节流同模式）；重写 `knockback()` 在蓄力期间免疫击退，重写 `die()` 播放放大死亡特效。`Bomber` 使用三拍状态机（windup / jumping / leaping）驱动弹射爆炸：windUp 期间持续跟踪玩家，起跳后锁定目标直线飞行，飞行期间不可被击杀；通过 `tween.timeScale` 同步 `scene.slowFactor` 实现子弹时间减速。`Mimic` 是逃跑型敌人：伪装成宝箱在可见区域徘徊（与所有敌人不同——不在屏幕外刷出），玩家靠近或攻击时触发逃跑（恐慌加速 + 锯齿路线），双计时器超时消失；击杀保底 XP + 25% 升级 / 75% 满充能；W4+ 由 WaveManager 独立 `maybeSpawnMimic()` 刷出（非 mix 池）。精英怪（`EliteChaser` / `EliteShooter` / `EliteGiant`）复用基础纹理，通过黑身红眼 + 黑烟粒子 + 20% 体型增大区分；W10 起由 WaveManager 固定刷出（非 mix 池）。`EliteChaser` 继承 `Chaser`，HP≤60% 触发狂暴（速度提升至 Rusher 水平）。`EliteShooter` 继承 `Enemy` 内联 Shooter 行为，射击时发 3 发扇形子弹。`EliteGiant` 继承 `Giant`，在 idle 与 windup 之间插入 dash 状态——中距离时向玩家持续追踪冲刺 2 秒，冲完衔接砸地；冲刺期间生成地面烟尘粒子。
- **Bullet / EnemyBullet** — 发射后自动飞行的弹丸，有生命周期和出界回收。玩家子弹通过 `hitSet` 追踪穿透（同一敌人只命中一次）。
- **XPOrb** — 通过缓动实现脉冲动画，在 `XP.pickupRadius` 半径内被玩家吸引。
- **SkillOrb** — 与 XPOrb 同模式（脉冲 + 吸附），拾取后增加 `Player.skillCharges`，由敌人死亡按 `SKILL.dropChance` 概率掉落。

### 配置文件 (`src/config.js`)

所有可调参数的唯一来源：玩家属性、敌人定义、波次时间、XP 曲线、`SKILL` 主动技能参数、升级定义。`UPGRADES` 数组包含 `apply(p)` 函数，直接修改 `Player.stats`。调整游戏平衡时只需修改此文件。

### 关键约定

- **无需外部资源。** 所有精灵都是 BootScene 中程序化生成的像素艺术。纹理 key 是硬编码字符串，在场景/实体间交叉引用。
- **场景通信** 使用 Phaser 场景管理器（`scene.get()`、`scene.pause()`、`scene.launch()`、带数据的 `scene.start()`）。不使用事件总线。
- **`GameScene.handleEnemyDeath()`** 由 `Enemy.die()` 通过场景引用调用 — 这是生成 XP 球和追踪击杀数的钩子。
- **主动技能钩子** — `Player.triggerSkill()` 消耗充能后调 `this.scene.useSkill?.(this)`；`GameScene.useSkill(player)` 按 `CLASSES[classId].skill` 字符串分派到具体实现（shockwave / bullet_time）。
- **物理组** 使用 `runChildUpdate: true`，使池化实体在激活时自动调用 `preUpdate`。
- **Debug 面板** — `DebugScene`（F1 触发）提供运行时调试：即时刷怪、技能充能、God Mode、Kill All、跳波。可 spawn 的实体集中在 `src/debug/registry.js` 注册。**新增 Enemy 子类时必须同步更新此文件**（见 `src/entities/CLAUDE.md` checklist）。

## 美术方向

**经典西幻像素风**。所有新增视觉资产对齐该方向，调色板与 sprite 命名约定见 `docs/art-direction.md`。

- **ID 与 fiction 分离**：现有敌人 gameplay 原型 id（`chaser` / `rusher` / `shooter`）作为代码层标识保留，fiction 名仅渲染层差异（goblin / goblin-scout / skeleton-archer）。新增敌人遵循同模式：id 描述 gameplay 角色，fiction 是视觉皮肤。命名约束见 `docs/ai-workflow/03-collaboration-rules.md` §1。
- **玩家默认弓箭手（archer）**。职业系统是独立 change，未引入前不做职业选择 UI。

## Git 与 GitHub

- 远程仓库：`https://github.com/mosedezhan/dungeon-gunner`
- 提交风格：使用 `feat:`、`fix:`、`refactor:` 约定式前缀
- 每次有意义的改动后推送

## AI 工作流规则

本项目工作流硬规则见 `docs/ai-workflow/RULES.md`，开始任何变更前必须遵守（颗粒度策略、archive 即时性、进行中变更上限等）。
决策叙事见 `docs/ai-workflow/NN-*.md`（ADR 风格），记录"为什么这么做"。
新会话推荐先跑 `/onboard` 加载项目状态。

归档变更时（`/opsx:archive`），命令会自动评估本文件是否需要同步——若变更引入新场景 / 新 Entity 类 / 新顶层 `config.js` 块 / 新跨文件约定，会输出 diff 让你确认。判断标准见 `docs/ai-workflow/01-claude-md-sync-on-archive.md`。
