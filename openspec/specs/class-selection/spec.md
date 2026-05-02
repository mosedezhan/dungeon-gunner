# class-selection Specification

## Purpose

为玩家提供职业选择环节，在主菜单与游戏场景之间插入独立的 ClassSelectScene，展示所有职业卡片（含可选与占位状态），并把所选职业通过场景参数传递给 GameScene。

## Requirements

### Requirement: 显示职业选择界面

当玩家从主菜单选择开始游戏时，系统 SHALL 显示职业选择界面，包含所有可选和占位的职业卡片。

#### Scenario: 从主菜单进入选人界面
- **WHEN** 玩家在 MenuScene 按 SPACE 键
- **THEN** 系统启动 ClassSelectScene
- **AND** 显示两张职业卡片（法师、战士）

### Requirement: 展示职业卡片信息

每张职业卡片 SHALL 显示：职业名称、角色立绘、技能描述。

#### Scenario: 法师卡片显示完整信息
- **WHEN** ClassSelectScene 启动
- **THEN** 法师卡片显示：
  - 名称："法师"
  - 蓝色像素立绘（复用 player 纹理，色调改为蓝色）
  - 描述："精通弹开技能"

#### Scenario: 战士卡片显示占位信息
- **WHEN** ClassSelectScene 启动
- **THEN** 战士卡片显示：
  - 名称："战士"
  - 置灰的立绘
  - 描述："敬请期待"

### Requirement: 职业卡片交互状态

法师卡片 SHALL 可交互（高亮/点击），战士卡片 SHALL 置灰且不可选择。

#### Scenario: 鼠标悬停法师卡片高亮
- **WHEN** 鼠标悬停在法师卡片上
- **THEN** 卡片边框变亮
- **AND** 卡片轻微放大

#### Scenario: 鼠标悬停战士卡片无反应
- **WHEN** 鼠标悬停在战士卡片上
- **THEN** 卡片保持置灰状态
- **AND** 无高亮效果

### Requirement: 选择法师职业开始游戏

当玩家选择法师时，系统 SHALL 启动 GameScene 并传递职业参数。

#### Scenario: 点击法师卡片开始游戏
- **WHEN** 玩家点击法师卡片
- **THEN** 系统启动 GameScene
- **AND** 传递参数 `{ class: 'mage' }`
- **AND** GameScene 中 Player 使用法师纹理和属性

#### Scenario: 键盘选择法师开始游戏
- **WHEN** 玩家按 SPACE 键（默认选中法师）
- **THEN** 系统启动 GameScene
- **AND** 传递参数 `{ class: 'mage' }`

### Requirement: 战士职业不可选

战士卡片 SHALL 不响应点击，键盘导航 SHALL 跳过战士。

#### Scenario: 点击战士卡片无响应
- **WHEN** 玩家点击战士卡片
- **THEN** 无任何游戏状态变化
- **AND** 保持在 ClassSelectScene

### Requirement: 返回主菜单

玩家 SHALL 能够通过 ESC 键返回主菜单。

#### Scenario: 按 ESC 返回主菜单
- **WHEN** 玩家在 ClassSelectScene 按 ESC 键
- **THEN** 系统启动 MenuScene
- **AND** 丢弃当前选择
