## Why

`add-class-selection` 已铺好双职业框架，但战士目前只是占位卡片（`locked: true`）。同时升级池假设玩家必然射子弹，含 `multishot / pierce / bspeed / firerate` 四张纯子弹卡——一旦战士可玩，这些卡对战士毫无意义。本次把战士从占位变为可玩近战职业，并解决"升级池只服务于子弹型玩家"的隐藏耦合，为后续职业扩展（武器进化、第三个职业）打通必经之路。

## What Changes

### 战士职业
- **解锁战士卡片**：`CLASSES.warrior.locked = false`
- **近战攻击**：hold 鼠标左键 → 按 `attackRateMs` 节流持续触发 90° 弧形挥砍，弧心 = 鼠标方向，半径 = `swingRange`，弧内所有未死敌人吃伤害+击退
- **挥砍 VFX**：sword sprite 弧线 tween + 程序化弧形 slash 纹理扩张淡出 + Hit-stop（命中冻结 ~40ms）+ 残影拖尾 + 命中触发的微震屏 + 多目标命中（≥3）触发屏幕闪白
- **战士纹理**：复用 PLAYER 像素网格 + 红/橙 palette 变体（`warrior_idle_a/b`、`warrior_run_a/b`）；动画 key `warrior_idle` / `warrior_run`
- **武器视觉切换**：战士显示 `sword` sprite 替代 `gun`（按 `classId` 在 Player 构造时分支）

### 子弹时间技能（战士 Q）
- **不变量**：世界 30% 速度、玩家 100% 速度，2.5 秒持续，消耗 1 charge
- **实现路径**：`scene.slowFactor` 字段，`Enemy.preUpdate` / `EnemyBullet.preUpdate` / `Shooter` 射击节流按 `slowFactor` 缩放（手动作用域，避开 Phaser 全局 timeScale 与玩家的相互污染）
- **视觉**：屏幕蓝色 vignette 半透明覆盖层淡入淡出
- **后续**：进化卡（强度提升 / 持续延长 / 额外效果）走单独 change，本次只搭基础

### 升级池按职业过滤
- `UPGRADES` 每条新增 `classes: ['mage', 'warrior']` 字段
- **战士专属新增 4 张**：`swingrange`（+20% 范围）、`swingarc`（+15° 弧度）、`attackspeed`（-17% 冷却）、`cleave`（命中 ≥2 个目标时额外 +30% 伤害）
- **战士不可见**：`firerate` / `multishot` / `pierce` / `bspeed`
- **两职业通用**：`damage` / `movespeed` / `maxhp` / `regen` / `skillmax`
- `UpgradeScene` 抽卡前按 `player.classId` 过滤候选池

### 顺手修复的隐性问题
- `Player.triggerSkill()` 当前写死调 `scene.fireShockwave()`，`CLASSES.mage.skill` 字段实际无人读取——本次引入 `GameScene.useSkill(player)` 按 `CLASSES[classId].skill` 真正派发，让该字段生效

### 攻击多态
- 把 `GameScene.tryShoot()` 从 GameScene 调用改为 `Player.tryAttack(time)` 多态分派；`tryShoot` 的子弹生成逻辑保留作为 mage 路径，warrior 走 `performSwing` 路径

## Capabilities

### New Capabilities

- `class-warrior`: 战士职业行为规范，含 hold-to-swing 攻击、90° 弧命中检测、Hit-stop 与多目标 VFX 升级、武器视觉、stats 表面（`attackRateMs / swingRange / swingArc`）、攻击多态分派、升级池按职业过滤规则与 4 张近战专属卡
- `active-skill-bullet-time`: 子弹时间技能规范，含"世界慢/玩家不慢"不变量、`slowFactor` 作用面、`Enemy / EnemyBullet / Shooter` 的缩放契约、duration / cost、vignette VFX

### Modified Capabilities

- 无。`class-selection` 的行为契约（"读 CLASSES 配置展示卡片，locked 状态决定是否可选"）不变，warrior 解锁是纯配置修改

## Impact

### 受影响代码

- `src/config.js`：`CLASSES.warrior` 解锁 + 增加 `baseStats / skill`；`UPGRADES` 加 `classes` 字段 + 4 张近战卡；新增子弹时间与挥砍相关常量（持续、`slowFactor`、Hit-stop 时长、slash VFX 时长等）
- `src/scenes/BootScene.js`：4 张 warrior 纹理 + 2 个 warrior 动画 + sword 纹理 + slash 弧形纹理 + bullet_time vignette 纹理
- `src/scenes/GameScene.js`：
  - `update()` 攻击调用改为 `player.tryAttack(time)`
  - 新增 `useSkill(player)` 按 classId 派发
  - 新增 `fireBulletTime()`（启动/恢复 `slowFactor` + vignette tween + 时长结束自动恢复）
  - 新增 `scene.slowFactor` 字段（默认 1.0）
  - 新增 `performSwing(player, angle)` 命中循环（被 `Player.tryAttack` 委派调用）
- `src/scenes/UpgradeScene.js`：抽卡前按 `player.classId` 过滤 UPGRADES 候选池
- `src/entities/Player.js`：构造按 classId 决定 gun/sword + stats 合并 `cls.baseStats` + `tryAttack(time)` 多态 + `triggerSkill` 改调 `scene.useSkill`
- `src/entities/Enemy.js`：`preUpdate` 中按 `scene.slowFactor` 重缩放当前 velocity
- `src/entities/EnemyBullet.js`：`preUpdate` 中按 `scene.slowFactor` 重缩放当前 velocity
- `src/entities/Shooter.js`：射击节流间隔按 `slowFactor` 反向缩放（间隔 = `fireRateMs / slowFactor`）

### 新增文件

- 无新增源码文件（所有改动落在现有文件 + BootScene 内的程序化纹理）

### 破坏性变更

- 无。法师玩法行为完全不变（攻击路径走相同子弹逻辑、技能仍为 shockwave、升级池可见集合不变）

### 依赖

- 无外部依赖。纯 Phaser 内置 API（physics velocity 缩放、tween、camera shake）
