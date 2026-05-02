## Context

当前游戏直接从 MenuScene 进入 GameScene，无角色选择环节。玩家无法体验不同职业的差异化玩法。README 已规划战士和法师两个职业，法师的"弹开"技能已实现。

**约束条件：**
- 无外部美术资源，所有 UI 必须程序化生成
- 场景间通信使用 Phaser scene manager（scene.start 传参）
- BootScene 是唯一生成纹理的地方

## Goals / Non-Goals

**Goals:**
- 在 MenuScene 和 GameScene 之间插入 ClassSelectScene
- 提供法师（可选）和战士（占位）两张卡片
- 选择法师后正确传递职业参数到 GameScene
- 复用现有玩家纹理，为法师生成蓝色变体

**Non-Goals:**
- 实现战士职业的实际游戏机制（仅 UI 占位）
- 复杂的卡片动画/特效（基础悬停效果即可）
- 职业切换/预览功能

## Decisions

### 1. 场景架构：ClassSelectScene 作为独立场景

**选择：** 新增独立场景而非在 MenuScene 内嵌选人 UI

**理由：**
- 符合现有场景流转模式（BootScene → MenuScene → GameScene）
- 场景职责分离：MenuScene 负责启动/设置，ClassSelectScene 负责选人
- 未来扩展方便（可在此场景添加角色详情、技能预览等）

**替代方案：** 在 MenuScene 内嵌选人界面。 rejected 因为 MenuScene 已有 title/logo 展示逻辑，混入选人会复杂化。

### 2. 卡片布局：水平居中排列

**选择：** 两张卡片水平排列，画面中心对称

**布局：**
```
┌─────────────────────────────────────────────┐
│           DUNGEON GUNNER                    │
│                                             │
│   ┌──────────┐         ┌──────────┐         │
│   │  法师    │         │  战士    │         │
│   │ [立绘]   │         │ [立绘]   │         │
│   │  弹开    │         │ 敬请期待 │         │
│   │  [点击]  │         │  置灰    │         │
│   └──────────┘         └──────────┘         │
│                                             │
│         [按 SPACE 选择当前高亮]              │
└─────────────────────────────────────────────┘
```

**理由：**
- 简单直观，无需复杂滚动逻辑
- 只有两个职业，固定布局足够
- 键盘导航（左右键切换）+ 空格确认

### 3. 数据传递：scene.start 第二个参数

**选择：** 使用 Phaser 的 scene.start(data) 传递 `{ class: 'mage' }`

**理由：**
- Phaser 内置机制，无需额外状态管理
- GameScene.create() 可直接接收 data 参数
- 与现有模式一致（GameOverScene → MenuScene 也用此模式）

### 4. 纹理复用：在 BootScene 中为法师生成蓝色变体

**选择：** 复制现有 player 像素网格，替换主色调为蓝色

**实现：**
```js
// BootScene 中新增
const magePixels = PLAYER_PIXELS.map(row =>
  row.replace(/1/g, 'B') // 1=原色, B=蓝色
);
this.generateTexture('mage', magePixels, PALETTE_BLUE);
```

**理由：**
- 无需手绘新美术
- 保持像素风格一致
- 未来战士可用类似方式生成红色/绿色变体

### 5. 配置结构：CLASSES 块

**选择：** 在 config.js 中新增 CLASSES 配置块

```js
export const CLASSES = {
  mage: {
    id: 'mage',
    name: '法师',
    description: '精通弹开技能',
    textureKey: 'mage',
    skill: 'deflect', // 对应现有 SKILL 配置
    color: 0x4488ff,
  },
  warrior: {
    id: 'warrior',
    name: '战士',
    description: '敬请期待',
    textureKey: 'player', // 占位，复用现有
    locked: true,
  },
};
```

**理由：**
- 与现有配置风格一致（ENEMY、GAME、WORLD 等）
- 未来扩展职业只需添加配置项
- ClassSelectScene 读取配置生成 UI

## Risks / Trade-offs

### Risk 1: 法师蓝色纹理可能与现有子弹颜色混淆

**Mitigation:** 确保法师立绘的主蓝色与子弹蓝色有明显区分（使用不同亮度/饱和度）

### Risk 2: 战士占位符可能让用户误以为可玩

**Mitigation:** 明确标注"敬请期待"，卡片置灰，移除点击事件，键盘导航跳过

### Trade-off: 键盘导航 vs 纯鼠标

**决策：** 同时支持两者
- 鼠标：悬停高亮，点击选择
- 键盘：左右键切换，空格确认
- 原因：兼容不同用户习惯，符合现有游戏控制（WASD + 鼠标）

## Open Questions

**Q1:** 未来是否有三职业/四职业？水平布局是否需要调整？

**A1:** 暂不考虑。如扩展到 3+ 职业，可改用网格布局（2x2）或添加左右滚动。

**Q2:** 是否需要保存"上次选择的职业"？

**A2:** 暂不需要。每次启动默认选法师，简化实现。
