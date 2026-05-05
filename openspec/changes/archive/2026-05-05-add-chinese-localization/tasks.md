## Tasks

- [x] T1: config.js — 翻译 CLASSES（职业名称/描述）
- [x] T2: config.js — 翻译 UPGRADES（18 张升级卡名称/描述）
- [x] T3: MenuScene — 翻译标题、操作说明、开始提示
- [x] T4: ClassSelectScene — 翻译界面标题、职业描述、操作提示
- [x] T5: HUDScene — 翻译状态文本（WAVE、HP、Lv、kills、dmg 等）
- [x] T6: UpgradeScene — 翻译界面文本和等级显示
- [x] T7: PauseScene — 翻译暂停界面
- [x] T8: GameOverScene — 翻译结算界面
- [x] T9: DebugScene — 翻译调试面板
- [x] T10: registry.js — 翻译敌人名称
- [x] T11: 测试所有界面，修复中文排版问题

## 翻译对照表

### UPGRADES 升级卡

| id | 原名 | 新名 | 原描述 | 新描述 |
|----|------|------|--------|--------|
| damage | Sharper Edge | 锋芒 | +25% damage | +25% 伤害 |
| firerate | Faster Fingers | 迅捷连射 | +20% fire rate | +20% 射速 |
| movespeed | Swift Feet | 疾行 | +15% move speed | +15% 移动速度 |
| maxhp | Tough Hide | 坚毅之肤 | +20 max HP (& heal) | +20 最大生命值（并回复至满） |
| multishot | Triple Shot | 三连发 | +2 bullets spread | +2 发散射子弹 |
| pierce | Piercing Rounds | 贯穿弹 | +1 pierce | +1 穿透 |
| bspeed | Hot Load | 急速装填 | +30% bullet speed | +30% 子弹速度 |
| regen | Regeneration | 愈合 | +1 HP / sec | +1 生命值/秒 |
| skillmax | Resonance Core | 共振核心 | +1 max skill charge | +1 技能充能上限 |
| swingrange | Long Reach | 延伸打击 | +20% swing range | +20% 挥砍范围 |
| swingarc | Wide Sweep | 横扫阔斧 | +15° swing arc | +15° 挥砍角度 |
| attackspeed | Fervor | 狂热 | +20% swing speed | +20% 挥砍速度 |
| cleave | Cleaving Edge | 裂地斩 | +30% damage when hitting 2+ targets | 命中 2+ 目标时 +30% 伤害 |
| bt_duration | Time Dilation | 时光延展 | +1s bullet time duration | 子弹时间 +1 秒 |
| bt_slow | Gravity Well | 引力井 | Stronger bullet-time slow | 子弹时间减速增强 |
| time_stop | Za Warudo | 时停 | 5s TIME STOP — 15s cooldown | 5 秒时间停止 — 15 秒冷却 |

### CLASSES 职业

| id | 原名 | 新名 | 原描述 | 新描述 |
|----|------|------|--------|--------|
| mage | Mage | 法师 | 精通冲击波技能 | 精通冲击波技能 |
| warrior | Warrior | 战士 | 近战挥砍 / 子弹时间 | 近战挥砍 / 子弹时间 |

### 场景文本

#### MenuScene
- "DUNGEON GUNNER" → 「地牢枪手」（或保留原名）
- "a tiny top-down roguelite" → 「微型俯视角肉鸽」
- "WASD / Arrows  —  move" → 「WASD / 方向键 — 移动」
- "Mouse  —  aim    LMB  —  shoot" → 「鼠标 — 瞄准    左键 — 射击」
- "1 / 2 / 3  —  pick upgrade" → 「1 / 2 / 3 — 选择升级」
- "ESC / P  —  pause" → 「ESC / P — 暂停」
- "▶ Press SPACE or CLICK to start" → « 按空格或点击开始 »

#### ClassSelectScene
- "SELECT YOUR CLASS" → 「选择你的职业」
- "精通弹开技能" → 「精通冲击波技能」（更正：法师描述）
- "近战挥砍 / 子弹时间" → 「近战挥砍 / 子弹时间」（战士描述不变）
- "← →  Select    SPACE / CLICK  Confirm    ESC  Back" → 「← → 选择    空格 / 点击 确认    ESC 返回」

#### GameOverScene
- "YOU DIED" → 「你已死亡」（或「胜败乃兵家常事」梗）
- "Reached Wave {n}" → 「到达第 {n} 波」
- "Level {n}   —   {k} kills" → 「等级 {n}   —   击杀 {k}」
- "▶ SPACE / CLICK to retry" → « 按空格或点击重试」
- "ESC  for main menu" → 「ESC 返回主菜单」

#### PauseScene
- "PAUSED" → 「已暂停」
- "▶ [ESC]  Resume" → « [ESC] 继续」
- "[Q]  Main Menu" → 「[Q] 主菜单」

#### UpgradeScene
- "LEVEL UP" → 「升级」
- "choose an upgrade  (1 / 2 / 3)   —   {n} left" → 「选择升级  (1 / 2 / 3)   —   剩余 {n} 张」
- "Lv {n} / {m}" → 「等级 {n} / {m}」（保持原格式）

#### HUDScene
- "WAVE {n}   {s}s" → 「第 {n} 波   {s} 秒」
- "HP {h} / {m}" → 「生命 {h} / {m}」（或保持 HP）
- "Lv {n}   {xp} / {max} XP" → 「等级 {n}   {xp} / {max} 经验」
- "kills {n}" → 「击杀 {n}」
- "dmg {d}   {r}/s" → 「伤害 {d}   {r}/秒」
- "pierce {p}   x{m}" → 「穿透 {p}   x{m}」
- "skill {c}/{m}" → 「技能 {c}/{m}」
- "TIME STOP READY" → 「时停就绪」
- "time stop {s}s" → 「时停 {s} 秒」

#### DebugScene
- "DEBUG PANEL" → 「调试面板」
- "── Spawn at Cursor ──" → 「── 在光标处生成 ──」
- "── Actions ──" → 「── 操作 ──」
- "[W] God Mode: ON/OFF" → 「[W] 上帝模式: 开启/关闭」
- "[E] Kill All Enemies" → 「[E] 消灭所有敌人」
- "[Q] +1 Skill Charge" → 「[Q] +1 技能充能」
- "[R] Skip to Wave 20" → 「[R] 跳至第 20 波」
- "[T] Auto Spawn: ON/OFF" → 「[T] 自动生成: 开启/关闭」
- "[ESC / F1] Close" → 「[ESC / F1] 关闭」

#### registry.js
- "1: Chaser" → 「1: 追击者」
- "2: Rusher" → 「2: 冲锋者」
- "3: Shooter" → 「3: 射手」
- "4: Giant" → 「4: 巨人」
- "5: Bomber" → 「5: 自爆者」
- "6: Mimic" → 「6: 宝箱怪」
- "7: Elite Chaser" → 「7: 精英追击者」
- "8: Elite Shooter" → 「8: 精英射手」
- "9: Elite Giant" → 「9: 精英巨人」
