## Why

当前游戏直接进入游戏，缺少角色选择环节。玩家体验单一，且无法为不同职业设计差异化玩法（战士 vs 法师）。README 已规划战士和法师两个职业，需要先搭建选人界面框架，为后续职业差异化内容铺垫。

## What Changes

### 核心变更
- **新增 ClassSelectScene**：在 MenuScene 和 GameScene 之间插入角色选择场景
- **法师卡片**：蓝色立绘 + "精通弹开技能"描述 + 可选状态
- **战士卡片**：置灰 + "敬请期待" + 不可选状态
- **场景流转变更**：`MenuScene → ClassSelectScene → GameScene`
- **数据传递**：ClassSelectScene 通过 `scene.start('GameScene', { class: 'mage' })` 传递所选职业

### 配置调整
- `src/config.js` 新增 `CLASSES` 块定义职业配置（法师先实现，战士作为占位符）

## Capabilities

### New Capabilities
- `class-selection`: 职业选择系统，包含角色卡片展示、选择交互、数据传递

### Modified Capabilities
- 无。这是纯新增功能。

## Impact

### 受影响代码
- `src/scenes/MenuScene.js`：修改启动逻辑，从直接启动 GameScene 改为启动 ClassSelectScene
- `src/scenes/ClassSelectScene.js`：新增场景，包含角色卡片和选择逻辑
- `src/scenes/GameScene.js`：修改 `create(data)` 接收职业参数，根据职业初始化 Player
- `src/config.js`：新增 `CLASSES` 块
- `src/scenes/BootScene.js`：为法师生成蓝色版本的像素网格（复用现有 player 网格，改色调）
- `src/main.js`：注册 ClassSelectScene

### 新增文件
- `src/scenes/ClassSelectScene.js`

### 破坏性变更
- 无。MenuScene 的"按 SPACE 启动"变为"进入选人界面"，体验升级不降级。

### 依赖
- 无外部依赖。纯 Phaser 场景流转和基础 UI。
