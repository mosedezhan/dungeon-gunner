## Why

项目无测试框架，所有验证靠浏览器手测。当前测试新敌人（如精英怪、Bomber）需要硬撑到 W5-10 才能遇到，每次平衡微调都要完整跑一遍。缺少即时验证手段，开发效率低。

需要一个运行时 debug 面板，能在游戏内即时刷怪、添加技能充能、切换状态，以便快速验证敌人行为和技能效果。

## What Changes

### DebugScene（新建）
- **Phaser 场景叠层**，同 PauseScene 模式（launch + pause GameScene）
- 按 **F1** 键触发（不与 ESC/P/Q/WASD 冲突）
- 半透明深色背景 + 文字菜单
- 快捷键操作，也支持点击文字按钮

### 功能列表
- **刷怪面板**：按数字键 1-9 在鼠标位置生成对应敌人
- **技能操作**：添加技能充能、直接触发技能
- **状态开关**：无敌模式（God Mode）、杀死所有敌人
- **波次控制**：直接跳转到指定波次

### src/debug/registry.js（新建）
- 集中注册所有可 spawn 的实体类
- DebugScene 从此文件读取生成菜单
- **未来新增敌人/精英/Boss 时必须同步更新此文件**

### AI 工作流规则
- 更新 `src/entities/CLAUDE.md` checklist：新增实体 → 更新 registry.js
- 更新根 `CLAUDE.md` 关键约定

### touches
- `src/scenes/DebugScene.js`（新建）
- `src/debug/registry.js`（新建）
- `src/main.js`（注册 DebugScene）
- `src/scenes/GameScene.js`（F1 键绑定 + pauseGame guard）
- `src/entities/CLAUDE.md`（新增实体 checklist 加 registry 步骤）
- `CLAUDE.md`（关键约定加 debug registry 规则）

## Capabilities

### New Capabilities

- `debug-panel`: 运行时调试面板，支持即时刷怪、技能充能、状态切换、波次跳转。通过集中注册表维护可调试实体列表。

### Modified Capabilities

- 无现有 capability 被修改。

## Impact

### 受影响代码
- `src/main.js`：场景注册列表增加 DebugScene
- `src/scenes/GameScene.js`：新增 F1 输入绑定 + pauseGame guard 更新
- `src/entities/CLAUDE.md`：新增实体 checklist 更新
- `CLAUDE.md`：关键约定更新

### 新增文件
- `src/scenes/DebugScene.js`
- `src/debug/registry.js`

### 破坏性变更
- 无。纯新增开发工具，不影响生产游戏逻辑。

### 依赖
- 无外部依赖。纯 Phaser 内置 API。
