# 03 — 双人协作的代码层约定

> 本 ADR 仅讨论**代码层**协作（文件、命名空间、模块接口）。Git 层（分支策略、PR 模板）与人际层（同步频率、review 节奏）暂不在范围内。

## 背景与动机

项目从"单人 + AI"扩展为"双人 + AI"，且两位开发者对 Phaser 3 都不够熟。README 列出的近期工作量较大（5+ 种小怪、4+ 种精英、2 个 Boss、地图无边界化、宝箱与稀有度系统），高频并发改动不可避免。

当前代码结构里有三类隐性碰撞点，单人开发不痛，双人会立刻显形：

1. **merge 磁铁文件**：`src/scenes/BootScene.js`（每个角色的像素网格 + 动画注册都在此）、`src/config.js`（所有数值唯一来源）、`src/systems/WaveManager.js`（spawn 列表硬编码）、`src/scenes/GameScene.js`（物理组与 overlap 注册集中地）。任意"加一个敌人"的变更都要触碰前三个文件。
2. **Phaser 全局命名空间无类型保护**：texture key、animation key、scene key 都是全局字符串，同名后写覆盖前写，运行时不报错。两人独立写各自的敌人，命名约定不一致就会发生静默覆盖。
3. **隐含的世界尺寸假设**：`GAME.width / height` 当前在 5+ 处被等同于"屏幕尺寸"和"世界尺寸"（`physics.world.setBounds`、`drawFloor`、`WaveManager.spawn` 用 `cam.worldView`、`Bullet.preUpdate` 出界判定）。地图改造（README 要求"行走无边界"）会同时撕开这些假设——若敌人开发者不知道地图开发者改了哪一层，就会出现"逃跑型敌人逃出新边界被静默回收"这类难定位的 bug。

不立约定，可预期的具体后果：BootScene 周冲突 ≥ 2 次、texture key 至少撞一次、敌人侧与地图侧并行推进时各自跑通但合并后不能玩。

## 决策与权衡

### 1. 每个新增内容型变更（敌人 / Boss / 升级 / 主动技能 / 地图特性）必须走 OpenSpec change，且 proposal 中必须固定四个命名空间字段

```yaml
id:            heavy                    # kebab-case，全局唯一
texture_keys:  [heavy_a, heavy_b]       # 前缀 = id，BootScene 与子类引用
anim_keys:     [heavy_walk, heavy_die]  # 前缀 = id
config_block:  ENEMY.heavy              # config.js 中的位置
touches:                                # 接入工作量声明
  - BootScene.js  (texture + anim)
  - WaveManager.mixForWave (spawn 注册)
  - GameScene.create (若需新物理组 / overlap)
```

`touches` 字段是关键：它把"每个新内容都要改的几个共享文件"显式列出来，让 AI 与 review 者一眼判断会和谁的工作冲突。

**不接受的替代方案**：
- "随手开发，命名靠默契" —— 两人对 Phaser 都不熟时默契不存在；texture key 撞一次的调试成本远高于 spec 里写一行的成本。
- "用 lint / 自动校验拦截" —— 项目硬规则是"无构建步骤、无依赖"。引入校验链先违反更高优先级的约定。

### 2. 同一个新内容由两人协作时，采用"骨架接入 → 行为完善"串行模式

不切"视觉 vs 逻辑"水平。具体做法：

| 阶段 | 谁做 | 改动文件 |
|---|---|---|
| 骨架 PR（< 半天） | 一人 | `BootScene.js` 加占位贴图 + 动画 key、`config.js` 加 stub 块（数值可粗）、`WaveManager.mixForWave` 加入 spawn、`enemies/<Foo>.js` 仅继承 + 空 preUpdate |
| 行为完善 PR | 另一人 | **仅** `enemies/<Foo>.js` 与 `config.js` 内对应块 |

第二阶段几乎零冲突域。代价是骨架阶段无法并行，但相比"两人都改 BootScene + WaveManager 然后 rebase"，节省的时间远多于这点串行成本。

**例外**：若两人各做**不同**新内容（一人重装兵、一人爆破兵），可并行。各自 PR 末尾向 BootScene / WaveManager 追加几行，rebase 即可——append-only 区域几乎不真冲突。

### 3. 跨系统改造（地图无边界化、相机跟随、Boss 战流程等）必须先合并"接口骨架"，再两人各自基于骨架推进

地图无边界化为典型例子。骨架 PR 内容：

- 新增 `src/systems/World.js` 模块，暴露 `getSpawnRing(player)` / `shouldDespawn(entity)` / `getCameraBounds()` 等签名
- 实现可以是空壳（`getSpawnRing` 仍按当前 `cam.worldView` 行为返回，`shouldDespawn` 永远返回 false）
- `WaveManager.spawn`、`Enemy.preUpdate`、`GameScene.create` 切换到调用 `World.*`
- 行为完全等同改造前

骨架合并后：地图侧把空壳填实，敌人侧基于稳定签名做 README 要求的"逃出范围消失"等行为。两人不再共享 `GAME.width/height` 等同性这类隐性假设，而是共享一组明确的函数签名。

**拒绝的替代**：
- "地图侧一口气全做完再合" —— 周期长、阻塞敌人侧、合并 diff 难审；且 README 要求的多个敌人特性（爆破兵分裂、宝箱怪逃跑）都依赖"出界 despawn 语义"，必然踩坑。
- "敌人侧不管，等地图改完再适配" —— 同上，强行串行化两条独立工作线。

### 4. 集中魔法数字到 `config.js`，把"不集中"作为冲突信号

当前散落各处的 depth（floor=-10 / enemy=5 / muzzle=12 / vfx=20）与 group maxSize（200 / 400 / 100）是双人改动时的隐性冲突源——两人都加新视觉层、都凭直觉选 depth=15 的事会发生。

不要求现在就一次性集中（YAGNI），但**触发条件**：一旦某个 ADR 周期内出现 ≥ 1 次因 depth 或 maxSize 引起的视觉/性能问题，立即开 change 把它们集中。

### 5. BootScene 拆分预案（不立即执行）

`BootScene.js` 是最大的 merge 磁铁。理想终态：每个角色的像素 + 调色板 + 动画注册搬到 `src/assets/<id>.js`，BootScene 只 import 并调用。

**触发条件**：连续 3 次 PR 合并因 BootScene 产生需要人工调解的冲突，开一个 `refactor-bootscene-split` change 执行拆分。

提前不拆的理由：拆分本身是个不小的重构，当前两人都不熟 Phaser，让 BootScene 先承担"集中样板"的教学价值。等真痛了再拆。

### 6. 把约定写进 `src/<dir>/CLAUDE.md`，让 AI 在生成时帮忙守纪律

两人都不熟 Phaser ≈ 两人都重度依赖 AI 写代码。最高杠杆的做法不是"两人记住约定"，而是把约定塞进 AI 一定会读到的位置：

- `src/entities/CLAUDE.md` 增补"新敌人 checklist"末尾：必须在 OpenSpec change 中固定 `id / texture_keys / anim_keys / config_block` 四字段，且 key 前缀必须等于 id。
- `src/scenes/CLAUDE.md` 增补"GameScene 改动前必读"：新增 group / overlap 必须先在 OpenSpec change 的 `touches` 字段声明。

由 AI 在生成阶段就提示"你这个 key 前缀不符合 id"，比合并时人肉发现冲突便宜两个数量级。

## 适用边界

**适用**：

- 双人（含 AI 协作的双人）代码层协作。
- 新增内容型变更（敌人 / Boss / 升级 / 主动技能 / 地图特性）。
- 跨系统改造（地图、相机、世界边界、存档、商店）。

**不适用**：

- 单人 solo 工作 —— 流程仍可用，但 1/2/3 项的收益边际较小。
- 数值平衡微调 —— 走 `docs/balance-journal.md`（参考 `RULES.md` 颗粒度策略）。
- 美术资源管线 —— 当前所有视觉是程序化纹理；若未来引入图片素材，是另一套独立的资源命名 / 加载约定，本 ADR 不覆盖。
- Git 工作流（分支策略、PR 模板、CI 等）—— 显式不在范围内。

## 后续观察项

- **`touches` 字段的预测准确率**：在前 5 个新敌人 change 中，proposal 声明的 `touches` 是否覆盖了实际改动文件。若漏报频繁（> 30%），说明该字段定义太抽象，需要在模板里给更具体的勾选项。
- **骨架 PR 的实际工作量**：是否能稳定在半天内完成。若多次超过 1 天，说明"骨架"被混入了过多逻辑——回看是否有人把 AI 行为写进了骨架阶段。
- **BootScene 冲突频次**：连续 3 次需要人工调解的合并冲突 → 触发"决策与权衡 §5"的拆分。
- **Texture / anim key 撞车次数**：撞过一次就要回看 OpenSpec change 模板与 `src/entities/CLAUDE.md` 的提示是否漏字段或措辞太弱。
- **地图骨架的接口稳定性**：地图骨架合并后两周内，签名（`getSpawnRing` / `shouldDespawn` / `getCameraBounds`）改动次数。若 ≥ 2 次，说明骨架阶段的接口设计不充分，下一次跨系统改造前需要更长的设计期。
- **AI 守纪律的命中率**：在双人模式下，AI 在生成阶段提示命名空间问题的频次 vs 实际撞车的频次。若撞车仍频发，说明 CLAUDE.md 局部规则没有起到拦截作用，需要重写措辞。
- **是否需要把双人模式硬规则升级进 `RULES.md`**：当前 RULES.md 是单人语境。若以上观察项稳定运行 1-2 个月并验证有效，把"决策与权衡 §1 / §2 / §3"的核心约束作为新条目写入 RULES.md（本 ADR 仍保留作为决策叙事）。
