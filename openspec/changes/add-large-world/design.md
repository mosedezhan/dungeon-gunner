## Context

当前游戏采用"屏幕即世界"架构：`GAME.width/height` (960×600) 同时作为 Phaser 游戏配置、物理世界边界、地板绘制范围和敌人生成边界。这种架构代码简单但限制了玩法扩展：

1. 玩家无法通过走位拉开距离——世界太小，走几步就撞墙
2. 敌人缺乏"追击"和"包围"的空间——生成位置和玩家距离固定
3. README 规划的特性（宝箱怪逃跑、重装兵冲锋等）依赖更大的活动空间
4. 双人协作模式下，大世界是"地图改造"工作的接口骨架（见 `docs/ai-workflow/03-collaboration-rules.md` §3）

### 当前耦合点

| 文件 | 耦合方式 | 影响 |
|---|---|---|
| `src/config.js` | `GAME.width/height` | Phaser 配置、世界边界共用 |
| `src/scenes/GameScene.js` | `physics.world.setBounds(0,0,GAME.width,GAME.height)` | 世界边界 |
| `src/scenes/GameScene.js` | `drawFloor()` 铺满 GAME.width/height | 地板范围 |
| `src/systems/WaveManager.js` | `cam.worldView.width/height` | 生成区域计算 |
| `src/entities/Bullet.js` | `cam.worldView` 边界检查 | 出界回收 |
| `src/entities/EnemyBullet.js` | `cam.worldView` 边界检查 | 出界回收 |

### 约束

- 无外部资源依赖（项目硬规则）
- 无构建步骤、无打包器
- Phaser 3 通过 CDN 加载
- 保持现有 UI 场景不变（使用屏幕坐标系）

## Goals / Non-Goals

**Goals:**

1. 将世界从单屏幕扩大为 3×5 倍（3840×3600），提供足够的战术空间
2. 实现相机平滑跟随玩家（lerp=0.1），限制在世界边界内
3. 引入 World 系统作为接口骨架，支持未来地图扩展
4. 敌人/子弹基于世界边界（而非相机边界）进行出界回收
5. 镜头尺寸从 960×600 扩大到 1280×720

**Non-Goals:**

1. 不改变现有 UI 场景（HUDScene / UpgradeScene / PauseScene / GameOverScene / MenuScene）
2. 不引入外部 tilemap/图片资源（地板仍用程序化生成）
3. 不实现动态地图加载/分块（Phase 5 可选，不在本次范围）
4. 不改变敌人 AI 行为（追击逻辑不变，只是有更多空间）

## Decisions

### D1: World 模块作为接口骨架

**决策**：新增 `src/systems/World.js` 模块，封装世界边界、生成环、出界判断等逻辑。所有涉及世界尺寸的代码通过 World 接口访问，而非直接读取常量。

**理由**：

- 支持双人协作：地图侧和敌人侧可以独立迭代，不互相阻塞
- 降低耦合：未来修改世界逻辑（如动态边界、分块加载）只需改 World 模块
- 符合 ADR §3 的"跨系统改造先合并接口骨架"模式

**替代方案**：

| 方案 | 优点 | 缺点 | 结论 |
|---|---|---|---|---|
| 直接改 GAME 常量 | 简单 | 每处都要判断"是屏幕还是世界" | ❌ 易出错 |
| World 模块接口 | 清晰分离 | 多一层抽象 | ✅ 采用 |

### D2: 世界尺寸 3×5 倍（3840×3600）

**决策**：世界 = 镜头 × 3（宽）× 5（高）。

**理由**：

- 固定倍数而非固定像素，便于后期调整镜头尺寸时世界自动缩放
- 3×5 足够大：玩家需要约 10-15 秒跑完全图，有战术空间但不至于稀释战斗密度
- 是 32 的倍数（tile size），铺网格干净

**替代方案**：

| 尺寸 | 评价 | 结论 |
|---|---|---|
| 2×2 (2560×1440) | 太小，跑几步就撞墙 | ❌ |
| 3×5 (3840×3600) | 平衡战术空间和战斗密度 | ✅ 采用 |
| 6×10 (7680×7200) | 过大，稀释敌人密度，需重新平衡波次 | ❌ |
| 动态增长 | 好玩但工程量大 | Phase 5 可选 |

### D3: 相机平滑跟随（lerp=0.1）+ 边界限制

**决策**：`cam.startFollow(player, true, 0.1, 0.1)` + `cam.setBounds(0, 0, WORLD.width, WORLD.height)`。

**理由**：

- lerp=0.1 提供平滑感，避免"生硬粘着"导致的视觉疲劳
- setBounds 防止相机移出世界边界后出现黑屏
- 是 Phaser 标准模式，稳定性高

**替代方案**：

| 模式 | 评价 | 结论 |
|---|---|---|
| 锁定中心（lerp=1） | 太生硬，容易晕 | ❌ |
| 平滑跟随（lerp=0.1） | 舒适，主流方案 | ✅ 采用 |
| 预判跟随 | 工程量大，收益不明显 | ❌ |

### D4: 地板用 tileSprite 一次性铺满

**决策**：将当前 `drawFloor()` 的 32×32 网格生成一次纹理，然后用 `add.tileSprite()` 一次性铺满世界。

**理由**：

- 避免每帧动态铺 tile 的性能开销
- 避免一次性铺满 3840×3600 时的 10000+ 矩形对象
- 符合"无外部资源"约束（纹理仍程序化生成）

**替代方案**：

| 方案 | 评价 | 结论 |
|---|---|---|
| 一次性铺满矩形 | 10000+ 对象，性能差 | ❌ |
| 每帧动态铺可见 tile | 性能好但工程量大 | ❌ |
| tileSprite 缓存 | 性能好，实现简单 | ✅ 采用 |

### D5: 出界回收基于世界边界

**决策**：`World.isOutOfBounds(x, y)` 判断是否超出 (0, 0, WORLD.width, WORLD.height)，而非相机边界。

**理由**：

- 语义正确：世界外的实体应该消失，相机外的实体仍在"游戏内"
- 支持"大地图 + 相机跟随"的核心玩法
- 未来实现"宝箱怪逃跑"等特性时有明确的"逃出世界"语义

### D6: 分 Phase 实施

**决策**：按接口骨架 → 相机 → 世界扩大 → 出界回收的顺序分 Phase 实施。

**理由**：

- 每个 Phase 都可独立验证，降低风险
- Phase 1 接口骨架合并后，地图侧和敌人侧可并行工作
- 符合 ADR §3 的"跨系统改造"模式

**替代方案**：一次性全部改。风险高、难以定位问题。

## Risks / Trade-offs

### R1: 战斗密度稀释

**风险**：世界扩大 15 倍后，敌人密度降低，可能削弱战斗紧张感。

**缓解**：

- WaveManager 的生成间隔保持不变（敌人总数不变）
- 玩家通过走位可以主动"聚怪"，反而增加战术深度
- Phase 4 后验证体感，必要时调整 `WAVE.minSpawnMs`

### R2: 边界生成点溢出

**风险**：玩家贴世界边界时，`getSpawnRing()` 可能在边界外生成点 → 敌人立刻 despawn。

**缓解**：`getSpawnRing()` 实现时与 World 边界取交集，确保生成点永远在世界内。

### R3: 相机平滑导致的视觉延迟

**风险**：lerp=0.1 可能让部分玩家感到"迟钝"。

**缓解**：Phaser 的 0.1 是经过大量游戏验证的参数，主流选择。如玩家反馈，可在 config.js 暴露 `CAMERA.lerpX / lerpY` 可调。

### R4: UI 场景误用世界坐标

**风险**：HUDScene 等场景可能误用 `WORLD.width/height` 导致 UI 错位。

**缓解**：proposal 已明确 UI 场景使用屏幕坐标系（GAME），实施时 review 这几个文件，确保无 WORLD 引用。

## Migration Plan

### Phase 1: 接口骨架（≤ 半天）

1. 新增 `src/systems/World.js`（签名完整，实现等价于当前行为）
2. `src/config.js` 新增 `WORLD` 块（暂时 = GAME）
3. `src/scenes/GameScene.js` 切换到 `world.setupPhysicsWorld()`
4. `src/systems/WaveManager.js` 切换到 `world.getSpawnRing()`
5. `src/entities/Bullet.js` 切换到 `world.isOutOfBounds()`
6. `src/entities/EnemyBullet.js` 切换到 `world.isOutOfBounds()`

**验证**：游戏行为与当前完全一致。

### Phase 2: 相机跟随（≤ 1 小时）

1. `src/scenes/GameScene.create()` 加相机跟随代码
2. `src/config.js` 加 `CAMERA.lerpX/Y` 配置（可选）

**验证**：相机平滑跟随玩家，不出边界。

### Phase 3: 世界扩大（≤ 半天）

1. `src/config.js` 的 `WORLD.width/height` 改为 3840×3600
2. `src/config.js` 的 `GAME.width/height` 改为 1280×720
3. `src/scenes/GameScene.drawFloor()` 改为 tileSprite 模式
4. `src/systems/World.js` 的 `getSpawnRing()` 实现边界相交逻辑

**验证**：玩家可在大世界移动，敌人在边界外正确生成。

### Phase 4: 出界回收（≤ 1 小时）

1. 确保 `World.isOutOfBounds()` 在所有实体 preUpdate 中被调用
2. 测试：敌人/子弹飞出世界边界后消失

**验证**：出界实体正确回收，不掉落 XP。

### Rollback

每个 Phase 独立 commit。如 Phase N 出问题，可 revert 到 Phase N-1 继续游戏。

## Open Questions

无。所有关键决策已在上文明确。
