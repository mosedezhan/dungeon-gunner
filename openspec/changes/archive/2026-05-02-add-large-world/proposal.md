## Why

当前游戏采用"屏幕即世界"架构——世界边界 = 屏幕边界（960×600）。这限制了关卡设计和战术深度：玩家无法通过走位拉开距离，敌人也缺乏"追击"和"包围"的空间。README 已规划"地图无边界"和"宝箱怪逃跑"等特性，这些都依赖更大的活动空间。

## What Changes

### 核心变更
- **镜头尺寸扩大**：`GAME.width/height` 从 960×600 改为 1280×720
- **新增 World 系统**：引入 `src/systems/World.js` 模块，封装世界边界、生成区域、出界判断等逻辑
- **世界尺寸扩大**：从单屏幕扩大为 3×5 倍（3840×3600）
- **相机跟随玩家**：相机平滑跟随玩家移动，`lerp=0.1`，限制在世界边界内
- **出界回收**：敌人/子弹飞出世界边界后消失（而非相机边界）

### 配置调整
- `src/config.js` 新增 `WORLD` 块定义世界尺寸
- `GAME` 块改为镜头尺寸（1280×720）

## Capabilities

### New Capabilities
- `large-world`: 大世界系统，包含世界边界、相机跟随、动态生成环、出界回收

### Modified Capabilities
- 无现有 spec 的 requirement 变更。这是纯新增能力。

## Impact

### 受影响代码
- `src/main.js`：Phaser config 使用新的 GAME 尺寸
- `src/config.js`：新增 WORLD 块
- `src/scenes/GameScene.js`：切换到 World 接口，设置相机跟随
- `src/scenes/BootScene.js`：无影响（像素生成与世界尺寸无关）
- `src/systems/WaveManager.js`：使用 World.getSpawnRing() 获取生成区域
- `src/entities/Bullet.js`：使用 World.isOutOfBounds() 判断出界
- `src/entities/EnemyBullet.js`：使用 World.isOutOfBounds() 判断出界
- UI 场景（HUDScene / UpgradeScene / PauseScene / GameOverScene / MenuScene）：无影响，它们使用屏幕坐标系

### 新增文件
- `src/systems/World.js`：世界系统模块

### 破坏性变更
- 无。当前游戏世界 = 屏幕，改为大世界 + 相机跟随后体验升级，不删除现有行为

### 依赖
- 无外部依赖。纯 Phaser 内置 API（camera、physics bounds）
