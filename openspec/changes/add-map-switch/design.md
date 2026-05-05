## Context

当前地板渲染流程：
1. `GameScene.drawFloor()` 用 `Graphics.generateTexture()` 程序化生成 32x32 深灰色瓦片 `floor_tile`
2. `add.tileSprite()` 铺满 3840x3600 世界

两张可用地图纹理：
- `assets/map/map_1.png` — 2048x2048px, ~5.5MB, 暗色地牢风格（深紫/蓝底，绿色荧光，骷髅装饰）
- `assets/map/map_2.png` — 2048x2048px, ~3.7MB, 暖色遗迹风格（米黄/土色，苔藓，金色花纹）
- 两者都是无缝可平铺纹理

性能分析：
- 2048x2048 RGBA 纹理 = 16MB VRAM/张，所有 WebGL 1/2 设备安全
- tileSprite 渲染开销与纹理大小无关（单次 draw call + UV 偏移）
- 两张同时驻留 = 32MB VRAM，对桌面设备无影响

## Goals / Non-Goals

**Goals:**
1. 加载并应用 map_1 作为初始地板纹理，替代程序化 floor_tile
2. W10 开始时通过淡白遮罩过渡切换到 map_2
3. 过渡期间通过无敌帧保护玩家（不暂停物理）
4. tileSprite 缩放使地砖密度匹配角色比例

**Non-Goals:**
1. 不实现无限地图/无边界漫游
2. 不实现多段地图切换（只做 W10 一次切换）
3. 不修改物理世界边界或相机行为
4. 不优化纹理内存（不做运行时卸载旧纹理）

## Decisions

### D1: BootScene preload 两张 PNG

**决策**：在 BootScene 的 `preload()` 中同时加载两张 PNG。

**理由**：
- 实现简单，不需要运行时动态加载
- 总共 ~9.5MB，本地服务器加载几乎瞬间
- 避免在 W10 切换时出现加载延迟

**替代方案**：W9 结束时才动态加载 map_2，节省开局 ~3.7MB 加载量。但增加复杂度且收益极小。

### D2: tileSprite 缩放至 ~0.5

**决策**：`tileSprite.tileScaleX = 0.5, tileScaleY = 0.5`，使 2048 纹理在世界中重复约 4x4 次。

**理由**：
- 当前角色 ~24x32px，32x32 程序化瓦片是 1:1 比例
- 2048 纹理不缩放时，单块地砖面积比角色大得多，视觉失衡
- 缩放 0.5 后每块纹理区域约 960x900px，地砖密度接近现有观感
- 实际值需浏览器中微调

### D3: 淡白遮罩过渡 + 无敌帧

**决策**：W10 开始时：
1. 设置 `player.invulnUntil = now + 600ms`
2. 创建白色矩形遮罩（screen-locked），淡入 200ms
3. 遮罩满时调用 `tileSprite.setTexture('map_2')`
4. 淡出遮罩 200ms
5. 总保护窗口 600ms（400ms 动画 + 200ms 余量）

**理由**：
- 不暂停物理——敌人照常移动，游戏体感流畅
- 无敌帧是已有机制（`player.invulnUntil`），不需要新系统
- 600ms 足够覆盖过渡动画，对玩家几乎无感

**替代方案**：

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|
| 暂停物理 | 绝对安全 | 敌人冻结 400ms，手感像卡顿 | ❌ |
| 无敌帧 | 无感过渡 | 理论上极短窗口可被击中 | ✅ 已有机制 |
| 暂停 + 遮罩 | 双重保护 | 过度工程 | ❌ |

### D4: WaveManager.startWave() 触发切换

**决策**：在 `WaveManager.startWave(n)` 中检测 `n === WORLD.mapSwitchWave`，调用 `scene.triggerMapTransition()`。

**理由**：
- `startWave()` 是波次开始的唯一点，不存在遗漏
- 切换在敌人开始生成之前（`nextSpawnAt = now + 500`），给过渡留出时间窗口
- 不需要新建事件系统

### D5: 配置放在 WORLD 块

**决策**：在 `config.js` 的 `WORLD` 块新增 `mapSwitchWave: 10` 和 `mapTransitionDurationMs: 600`。

**理由**：
- 地图是世界级别的属性，WORLD 块是自然归属
- 不新建 MAP 块——当前只有两个参数，不值得独立块
- 后续如需更多地图参数（多段切换、随机选图等），再提升为独立块

## Risks / Trade-offs

### R1: 纹理比例失调

**风险**：tileScale 0.5 可能与角色比例仍不匹配，需要浏览器中实际验证。

**缓解**：先以 0.5 为起点，根据实际效果在 config.js 中微调。tileScaleX/Y 是运行时可调参数。

### R2: CLAUDE.md "无需外部资源" 规则变更

**风险**：引入外部 PNG 纹理打破了 CLAUDE.md 中的"无需外部资源"硬规则。

**缓解**：用户已确认后续会全面替换美术素材。archive 时同步更新 CLAUDE.md 相关描述。

### R3: WebGL 纹理加载失败

**风险**：极少数设备可能不支持 2048 纹理。

**缓解**：WebGL 1 规范要求最低支持 2048，WebGL 2 要求 4096。2015 年后的所有设备都支持 2048。风险可忽略。

## Open Questions

无。
