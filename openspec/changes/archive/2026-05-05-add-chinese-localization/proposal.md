## Why

游戏目前所有 UI 文本均为英文，对中文用户不友好。项目定位是中文项目（CLAUDE.md、AI 工作流文档均为中文），但游戏内文本仍是硬编码英文，造成体验割裂。不需要保留英文切换功能，直接全量替换为中文即可。

## What Changes

### 全量汉化范围

**场景 UI 文本：**
- `MenuScene` — 标题「DUNGEON GUNNER」、操作说明、开始提示
- `ClassSelectScene` — 「SELECT YOUR CLASS」、职业名称/描述、操作提示
- `GameOverScene` — 「YOU DIED」、统计数据、重试提示
- `PauseScene` — 「PAUSED」、Resume / Main Menu
- `UpgradeScene` — 「LEVEL UP」、卡片 UI、「choose an upgrade」、等级显示
- `HUDScene` — 「WAVE」、「HP」、「Lv」、「kills」、「dmg」等状态文本
- `DebugScene` — 「DEBUG PANEL」、按钮提示

**配置数据文本：**
- `CLASSES` — 职业名称、描述（mage → 法师、warrior → 战士）
- `UPGRADES` — 升级卡名称、描述（18 张卡，西幻翻译风）

**调试注册表：**
- `DEBUG_SPAWNABLE` — 敌人名称列表

### 翻译风格

- **西幻风**：升级卡名称采用 D&D / 魔兽世界风格的翻译
  - "Sharper Edge" → 「利刃」/「锋芒」
  - "Time Dilation" → 「时光延展」
  - "Za Warudo" → 「时停」（保留 JoJo 致敬的简洁感）
- **保留游戏术语**："WAVE" → 「波次」或保留 "WAVE"（待定）
- **UI 文本简洁**：按钮、提示语保持简短有力

### touches

- `src/scenes/*.js` — 所有场景文件的硬编码英文文本
- `src/config.js` — `CLASSES` 和 `UPGRADES` 的 name/desc 字段
- `src/debug/registry.js` — `DEBUG_SPAWNABLE` 的键名

## Capabilities

- `zh-cn-localization` — 中文本地化（全游戏 UI + 配置数据）

## Impact

### 受影响代码

- 7 个场景文件：MenuScene、ClassSelectScene、GameOverScene、PauseScene、UpgradeScene、HUDScene、DebugScene
- 1 个配置文件：config.js（CLASSES、UPGRADES 块）
- 1 个调试文件：registry.js

### 新增文件

- 无

### 破坏性变更

- 无。纯文本替换，不改变逻辑。

### 依赖

- 无外部依赖。纯字符串替换工作。
