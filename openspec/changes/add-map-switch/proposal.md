## Why

当前游戏地板是 BootScene 程序化生成的 32x32 深灰色瓦片，视觉单调。`assets/map/` 下已有两张 2048x2048 无缝可平铺的地牢风格像素纹理（map_1 暗色地牢、map_2 暖色遗迹），可以直接用来提升地面视觉品质。同时引入波次切换地图机制，在 W10 用淡白遮罩过渡到新地图，增加视觉新鲜感。

## What Changes

### 核心变更
- **加载外部地图纹理**：BootScene 通过 `preload()` 加载 `map_1.png` 和 `map_2.png`
- **替换地板渲染**：`GameScene.drawFloor()` 从程序化 32x32 纹理切换到 `map_1` tileSprite，缩放至 ~0.5 使地砖密度匹配角色比例
- **波次切换地图**：W10 开始时触发 `triggerMapTransition()`，通过淡白遮罩（200ms in + 200ms out）切换到 `map_2`，期间通过无敌帧保护玩家

### 配置调整
- `src/config.js` 的 `WORLD` 块新增 `mapSwitchWave: 10`、`mapTransitionDurationMs: 600`

## Capabilities

### New Capabilities
- 无新 capability

### Modified Capabilities
- `large-world`：地板渲染从程序化纹理改为外部 PNG tileSprite

## Impact

### 受影响代码
- `src/scenes/BootScene.js`：新增 `preload()` 加载两张 PNG
- `src/scenes/GameScene.js`：`drawFloor()` 改用外部纹理；新增 `triggerMapTransition()` 方法
- `src/systems/WaveManager.js`：`startWave()` 中检测 W10 触发地图切换
- `src/config.js`：`WORLD` 块新增地图切换配置

### 新增文件
- 无（使用现有 `assets/map/` 下的 PNG）

### 破坏性变更
- 无。tileSprite 替换程序化纹理是纯视觉变化，不影响物理/游戏逻辑

### 依赖
- 无外部依赖。两张 PNG 已在 `assets/map/` 下
- 破坏了 CLAUDE.md 中"无需外部资源"的硬规则——但项目已计划后续全面替换美术素材，这只是第一步。需同步更新 CLAUDE.md 的相关描述

### touches
- **GameScene 新增方法**：`triggerMapTransition()` — 淡白遮罩过渡 + 纹理切换
- **GameScene 修改方法**：`drawFloor()` — 纹理来源变更
- **WaveManager 修改方法**：`startWave()` — 新增 W10 检测逻辑
