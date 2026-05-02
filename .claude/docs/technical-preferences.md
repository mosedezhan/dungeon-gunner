# 技术偏好

## 引擎与语言

- **引擎**: Phaser 3 (HTML5 Canvas)
- **语言**: JavaScript (ES6 模块)
- **渲染**: Canvas 2D, pixelArt 模式
- **物理**: Arcade Physics

## 输入与平台

- **目标平台**: Web（浏览器）
- **输入方式**: 键盘 + 鼠标
- **主要输入**: 键盘/鼠标
- **手柄支持**: 无
- **触屏支持**: 无
- **平台说明**: 需要本地静态服务器运行（ES 模块不支持 file:// 协议）

## 命名规范

- **类名**: PascalCase（如 `GameScene`、`Player`、`WaveManager`）
- **变量**: camelCase（如 `moveSpeed`、`fireRateMs`）
- **常量**: UPPER_SNAKE_CASE（如 `PLAYER`、`ENEMY`、`XP`）
- **文件名**: PascalCase（如 `GameScene.js`、`Player.js`）
- **配置块**: UPPER_SNAKE_CASE（如 `PLAYER`、`ENEMY`、`WAVE`、`SKILL`、`XP`）

## 性能预算

- **目标帧率**: 60fps
- **帧预算**: 16.6ms
- **绘制调用**: 最少（程序化精灵，无精灵图）
- **内存上限**: 浏览器管理

## 测试

- **框架**: 无（浏览器手动测试）
- **最低覆盖率**: 不适用
- **必需测试**: 通过 `/playtest` 生成手动测试清单

## 禁止模式

- 场景/实体代码中禁止硬编码游戏数值 — 所有数值来自配置文件
- 禁止依赖外部美术资源 — 所有图形程序化生成

## 允许的库 / 插件

- **Phaser 3**（CDN 加载）

## 架构决策日志

- [尚无 ADR — 使用 /architecture-decision 创建]

## 引擎专家

- **主要**: gameplay-programmer（Phaser 3 非模板原生支持的引擎）
- **语言/代码专家**: gameplay-programmer
- **着色器专家**: 不适用（Canvas 2D）
- **UI 专家**: ui-programmer
- **其他专家**: 无
- **路由说明**: Phaser 3 没有专用专家。所有游戏代码路由到 gameplay-programmer。UI 代码路由到 ui-programmer。

### 文件扩展名路由

| 文件扩展名 / 类型 | 路由到的专家 |
|-----------------------|---------------------|
| 游戏代码（.js 文件） | gameplay-programmer |
| 样式文件（.css） | ui-programmer |
| HTML 入口（.html） | ui-programmer |
| 配置/数据文件（.js 配置） | gameplay-programmer |
| 通用架构评审 | gameplay-programmer |
