---
description: 基于本次改动生成手测 checklist（弥补无测试套件），区分 golden path 与 edge case
argument-hint: "[base]  # 可选，对比基线，默认 HEAD（即未提交改动）"
---

# /playtest — 生成手测 checklist

项目无自动测试，所有验证靠浏览器手测。本命令基于 `git diff` 推导本次改动需要测什么。

## 执行步骤

1. **取 diff**：
   - 默认 `git diff HEAD`（包含所有未提交改动，含 staged）
   - 若提供 base 参数：`git diff <base>...HEAD`
2. **按修改文件类型分类**（参考下表）推导测试 checkpoint
3. **产出两类清单**：
   - **Golden path**：核心流程，必须通过
   - **Edge case**：边界场景，至少抽查
4. **附加启动指引**：`python -m http.server 8000` → http://localhost:8000

## 推导规则

| 修改路径 | Golden path 检查项 | Edge case 检查项 |
|---|---|---|
| `src/config.js` 数值改动 | 受影响实体的基础行为（敌人移动/玩家伤害/波次刷怪节奏） | 极值场景（满级 stats、第 10+ 波、HP 见底） |
| `src/scenes/GameScene.js` | 主循环跑通：移动、射击、击杀、捡 XP、升级 | 暂停/恢复、死亡场景切换 |
| `src/scenes/HUDScene.js` | 数值更新正确（HP/XP/wave/kills） | 第一波 banner 显示、升级时 HUD 不消失 |
| `src/scenes/UpgradeScene.js` | 3 张卡片可点选/键盘选择 | 多个升级排队（remaining > 1）、点击后正确返回 |
| `src/scenes/PauseScene.js` | ESC/P 暂停恢复 | Q 键回菜单、暂停在升级界面上不应触发 |
| `src/scenes/GameOverScene.js` | 死亡过渡正常 | 数据显示正确（wave/level/kills） |
| `src/entities/Player.js` | 移动/射击/受伤/无敌帧 | 满血时回血溢出、stats 升级即时生效 |
| `src/entities/Enemy.js` 或子类 | 该敌人的 AI 行为正常 | 大量同时存在时性能、出界回收、击退 |
| `src/entities/Bullet.js` / `EnemyBullet.js` | 飞行/命中/穿透 | lifetime 超时回收、出屏回收、池耗尽时 get 返回 null |
| `src/entities/XPOrb.js` | 拾取吸附 | 半径边缘抖动、玩家死亡时吸附停止 |
| `src/systems/WaveManager.js` | 各波刷怪数量 + 波间隔 | 波次切换的 banner、最后一波后行为 |
| `src/systems/Upgrades.js` | 升级生效 + UI 描述匹配 | 重复升级（如多次 +damage）、互斥升级 |
| `src/scenes/BootScene.js` 纹理/动画改动 | 所有引用该纹理的实体外观正常 | 动画 key 注册顺序、复用同一 key 的场景 |

## 输出格式

```markdown
## Playtest Checklist — <一句话改动概述>

### Golden Path（必通过）
- [ ] <检查项 1>
- [ ] <检查项 2>
- ...

### Edge Cases（抽查）
- [ ] <检查项 1>
- [ ] <检查项 2>
- ...

### 启动
1. `python -m http.server 8000`（在项目根目录）
2. 浏览器打开 http://localhost:8000
3. 完成 checklist 后回报通过/未通过项
```

## 使用边界

- 本命令只生成 checklist，不替代实际手测
- 不覆盖纯文档改动（`docs/` `*.md`）— 若 diff 仅含文档则提示无需 playtest
- 大改动（diff 超 300 行）应拆分 change 重做，不要堆在一份 checklist 里
