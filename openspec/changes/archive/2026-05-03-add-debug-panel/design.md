## Context

项目无测试框架，所有验证靠浏览器手测。游戏有 7 种敌人（Chaser/Rusher/Shooter/Giant/Bomber/EliteChaser/EliteShooter）、2 个职业（mage/warrior）、2 个技能（shockwave/bullet_time）。WaveManager 控制波次和刷怪。GameScene 持有所有物理组和 Player 实例。

**约束条件：**
- 调试面板是开发工具，不影响生产游戏逻辑
- 必须使用 Phaser 场景叠层（同 PauseScene 模式），不引入 DOM 层
- 不与现有快捷键冲突（ESC/P 用于暂停，Q 用于技能，WASD/箭头用于移动）
- 新增实体时的 registry 维护成本必须极低

## Goals / Non-Goals

**Goals:**
- F1 打开/关闭 debug 面板，暂停游戏
- 在鼠标位置即时生成任意已注册的敌人
- 即时添加技能充能、触发技能
- God Mode（玩家无敌）、Kill All（清场）
- 跳转到指定波次
- 集中注册表 `src/debug/registry.js` 维护可调试实体
- AI 工作流规则确保新实体自动同步 registry

**Non-Goals:**
- 精细的数值编辑器（改 config.js 即可）
- 性能分析面板
- 状态录制/回放
- DOM-based UI

## Decisions

### 1. Phaser 场景叠层，同 PauseScene 模式

**选择**：新建 `DebugScene`，F1 触发 `GameScene.pause()` + `scene.launch('DebugScene')`。关闭时 resume GameScene。

**理由**：
- 与 PauseScene/UpgradeScene 一致，维护成本最低
- 纯 Phaser，不引入 DOM↔Phaser 通信
- 半透明背景保持游戏画面可见（方便确认刷怪位置）

### 2. 触发键：F1

**选择**：F1 打开/关闭 debug 面板。

**理由**：
- 不与 ESC/P/Q/WASD/箭头冲突
- F1 在游戏开发中是传统的 debug/help 键
- F2-F12 留给未来扩展

### 3. 集中注册表 registry.js

**选择**：新建 `src/debug/registry.js`，导出 `DEBUG_SPAWNABLE` 对象，key 为显示名，value 为 Enemy 子类。

```js
import { Chaser } from '../entities/enemies/Chaser.js';
// ... 所有 enemy imports

export const DEBUG_SPAWNABLE = {
  '1:Chaser': Chaser,
  '2:Rusher': Rusher,
  // ...
};
```

**理由**：
- 新增敌人只需加一行 import + 一行注册
- DebugScene 遍历此对象生成菜单，无需硬编码
- 如果忘了注册，面板上缺一个按钮，手测时马上发现

### 4. 菜单布局：纯文字 + 快捷键

**选择**：DebugScene 用 Phaser Text 对象渲染菜单，每个选项一行文字，支持快捷键和鼠标点击。

```
╔═══════════════════════════════════╗
║        DEBUG PANEL                ║
║                                   ║
║  ── Spawn at Cursor ──            ║
║  [1] Chaser                       ║
║  [2] Rusher                       ║
║  [3] Shooter                      ║
║  [4] Giant                        ║
║  [5] Bomber                       ║
║  [6] Elite Chaser                 ║
║  [7] Elite Shooter                ║
║                                   ║
║  ── Actions ──                    ║
║  [Q] +1 Skill Charge              ║
║  [W] God Mode: OFF                ║
║  [E] Kill All Enemies             ║
║  [R] Skip to Wave 20              ║
║                                   ║
║  [ESC/F1] Close                   ║
╚═══════════════════════════════════╝
```

**理由**：
- Text 对象足够，不需要 Phaser UI 插件
- 数字键对应刷怪，字母键对应操作，直觉好
- 点击文字也能触发（用 `setInteractive()`）

### 5. 刷怪在鼠标位置

**选择**：spawn 时读取 `scene.input.activePointer` 的世界坐标，在该位置生成敌人。

**理由**：
- 鼠标位置是玩家最直觉的"我要这里出怪"
- 世界坐标（`pointer.worldX/worldY`）在摄像机移动后仍然正确

### 6. AI 工作流规则：新实体 → 更新 registry

**选择**：
- `src/entities/CLAUDE.md` 的"新增实体的 checklist"加第 7 步：注册到 `src/debug/registry.js`
- 根 `CLAUDE.md` 关键约定加一条：新增可交互实体必须更新 debug registry

**理由**：
- AI 在 `opsx:propose` 时读到 CLAUDE.md 的规则，会自动在 tasks 中加入 registry 更新步骤
- `opsx:apply` 执行时自然就改了
- 和现有的"新增敌人 → 改 WaveManager"模式一致

## Risks / Trade-offs

### Risk 1: F1 在部分浏览器中触发帮助页面

**Mitigation**: 在 keydown handler 中 `event.preventDefault()` 阻止默认行为。游戏中已用 ESC/P，阻止 F1 默认行为不会有副作用。

### Risk 2: registry.js 需要手动维护，可能忘记

**Mitigation**: CLAUDE.md 规则强制 + 手测时面板缺少按钮立刻暴露。如果完全自动化（遍历 ENEMY config），需要解决"config key → class 映射"问题，复杂度更高且不可靠。

### Trade-off: DebugScene 使用 PauseScene 的 pause 模式，无法在游戏运行时操作

这是有意为之——在游戏暂停状态下操作更安全，不会因为刷怪/跳波干扰正在运行的 AI。如果需要"实时刷怪"（边打边刷），可以在后续 change 中加一个"只刷怪不暂停"的快捷键。
