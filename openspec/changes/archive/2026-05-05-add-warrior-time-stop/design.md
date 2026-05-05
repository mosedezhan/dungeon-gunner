## Context

战士的子弹时间技能通过 `GameScene.fireBulletTime()` 实现：设置 `scene.slowFactor`，Enemy 基类 `setVelocity()` 中乘以 slowFactor 实现减速。现有 vignette 纹理（`bullet_time_vignette`）提供蓝色暗角视觉。

升级系统通过 `UPGRADES[]` 扁平数组 + `randomUpgrades(count, classId)` 随机抽取。所有卡平级、不可重复。

**约束条件：**
- 所有纹理必须 BootScene 程序化生成（Plan B：预生成表盘 + 碎片纹理）
- 升级卡仍通过 UpgradeScene 展示，不改 UI 结构
- 时间暂停期间 physics world 仍在运行（只是 slowFactor=0），碰撞检测正常工作
- 秒针旋转用 tween 或 per-frame rotation 更新

## Goals / Non-Goals

**Goals:**
- 两张分级升级卡（延长时间 / 增强减速，各 3 级），让子弹时间随游戏变强
- 解锁条件（双满级 + skillChargesMax >= 3）创造清晰的追求目标
- 时间暂停 5 秒完全静止 + 无敌 + 白打，消耗 3 充能平衡强度
- JoJo 风钟表盘特效：灰度世界 + 秒针倒计时 + 碎裂飞散
- 首次解锁 100% 刷新，跳过后正常概率，不浪费升级机会

**Non-Goals:**
- 射手/法师技能升级——下个迭代
- 技能树 UI（选择线路的界面）——用普通升级卡随机刷出
- 时间暂停期间的特殊攻击/组合技——只改时间行为不改攻击
- 音效——项目暂无音效系统

## Decisions

### 1. 分级升级卡用 `maxLevel` + stats 计数器实现

**选择**：在 UPGRADES 条目中新增 `maxLevel` 字段（默认 Infinity），`apply` 函数从 `player.stats` 读取当前层级并递增。`randomUpgrades()` 过滤已满级的卡。

```
UPGRADES 条目示例：
{
  id: 'bt_duration', name: 'Time Dilation', desc: '+1s bullet time',
  classes: ['warrior'], maxLevel: 3,
  apply: p => { p.stats.btDurationLevel = (p.stats.btDurationLevel ?? 0) + 1; }
}
```

Player.stats 新增：
- `btDurationLevel` (0~3) — 延长时间层级
- `btSlowLevel` (0~3) — 增强减速层级
- `hasTimeStop` (boolean) — 是否已解锁时间暂停

**理由**：复用现有升级系统结构，不需要新的数据结构。stats 本身就是可变副本，升级直接修改。

### 2. 延长时间每级 +1 秒，增强减速每级降低 slowFactor（各 2 级）

**选择**：
```
延长时间（Time Dilation）：
  T0: 2500ms (基础)
  T1: 3500ms
  T2: 4500ms

增强减速（Gravity Well）：
  T0: slowFactor 0.30 (基础)
  T1: slowFactor 0.20
  T2: slowFactor 0.10
```

**理由**：每级提升幅度一致，玩家感受线性增强。从原 3 级砍到 2 级是为了降低解锁门槛（4 张前置卡而非 6 张）+ 配合时停冷却制让升级路径更轻盈。slowFactor 最低 0.10 而非更低——子弹时间不再追求"近乎冻结"，那是时间暂停的领域。

### 3. 子弹时间参数从 stats 动态计算，不再硬编码 BULLET_TIME

**选择**：`fireBulletTime()` 从 `player.stats` 读取实际参数，而非直接用 `BULLET_TIME` 常量。

```javascript
fireBulletTime() {
  const p = this.player;
  const lvl = p.stats.btSlowLevel ?? 0;
  const factors = [0.3, 0.2, 0.1, 0.05];
  const slowFactor = factors[Math.min(lvl, 3)];

  const durLvl = p.stats.btDurationLevel ?? 0;
  const durationMs = 2500 + durLvl * 1000;

  // ... 其余逻辑使用 slowFactor 和 durationMs
}
```

**理由**：不需要改 config 结构，升级效果直接反映在行为中。

### 4. 时间暂停走独立冷却分支，与 skillCharges 解耦

**选择**：`Player.triggerSkill()` 检查 `stats.hasTimeStop`：
- 如果已解锁：走冷却路径——检查 `time.now >= timeStopReadyAt`，触发后 `timeStopReadyAt = now + TIME_STOP.cooldownMs`（10s）。**不读写 skillCharges**。
- 如果未解锁：走原 charge 路径（`skillCost ?? 1`）。

GameScene.useSkill 根据 `stats.skillId ?? CLASSES[player.classId].skill` 分派：
- `bullet_time` → `fireBulletTime()`（原有）
- `time_stop` → `fireTimeStop()`（新增）

时间暂停卡的 apply 函数设置 `p.stats.hasTimeStop = true` + `p.stats.skillId = 'time_stop'`，不再设置 `skillCost`。

**理由**：原方案"消耗 3 充能"用 skillCharges 做平衡阀，但需要玩家额外把 max 拉到 3 才能用——多了一道无关解锁条件。改为 10s 实时冷却后：
- 解锁条件简化（只看 BT 两线），与机制更一致
- 强度由 cooldown 控制，不依赖 SkillOrb 掉落概率（运气波动）
- HUD 同步：解锁后隐藏 charge 行，显示冷却倒计时

### 5. 解锁条件检测在 randomUpgrades 中完成

**选择**：`randomUpgrades()` 接收 `player` 引用（而非仅 classId），在生成池后检查：
1. 过滤已满级的卡（`maxLevel` 检查）
2. 检查是否满足时间暂停解锁条件（`btDurationLevel >= 2 && btSlowLevel >= 2 && !hasTimeStop`）
3. 如果满足且未曾展示过（`!stats.timeStopShown`），100% 注入时间暂停卡（替换池中最后一张）
4. 注入后置 `timeStopShown = true`；后续即使再次满足条件，也只走正常概率

**理由**：集中在一处处理，不需要改 UpgradeScene。`timeStopShown` 标记避免"玩家跳过后每级强制刷新"的 UX 暴政。

### 6. 时间暂停实现：slowFactor = 0 + 无敌 + 灰度

**选择**：
- `slowFactor = 0`：敌人/子弹 velocity 全部归零（Enemy.setVelocity 乘以 0）
- 玩家无敌：设置 `player.invulUntil = now + 5000`
- 灰度：遍历 `enemies.getChildren()` 和 `enemyBullets.getChildren()` 设置 `setTint(0x555555)`，叠加全屏灰色覆盖层
- 恢复时遍历 `clearTint()` + 移除覆盖层

**注意**：slowFactor=0 时 Enemy 的 `preUpdate` 中 `setVelocity` 会设 0，但敌人的 AI 逻辑仍在运行（只是速度为 0）。这不影响功能——敌人尝试移动但速度为 0。恢复时 slowFactor 回到 1，敌人立刻恢复。

### 7. 钟表盘纹理 BootScene 预生成（Plan B）

**选择**：BootScene 中用 Graphics 绘制：
- `time_stop_clock`：圆形表盘 + 12 刻度 + 数字标记（XII, III, VI, IX），像素风格
- `time_stop_hand`：细长秒针纹理（独立精灵，rotation 驱动）
- `time_stop_shard_0` ~ `time_stop_shard_5`：6 块碎片纹理（三角形/扇形，深紫色）

运行时：
- 表盘 sprite（右上角，scrollFactor(0)）+ 秒针 sprite
- 秒针 rotation 用 tween 或 per-frame 更新
- 碎裂时 destroy 表盘 + 生成 6 个碎片 sprite 各自 tween 飞散

**理由**：预生成纹理保证像素风格一致性，运行时只需 sprite + tween，性能开销极小。

### 8. 灰度覆盖层：半透明矩形 + 敌人逐个 tint

**选择**：
- 全屏 `rectangle(0, 0, 1280, 720, 0x1a0a2a, 0.3)`，scrollFactor(0)，depth 44（在 vignette 层 45 之下）
- 敌人 `setTint(0x555555)` + 敌人子弹 `setTint(0x444444)`
- 玩家保持原色，在灰色世界中突出

**理由**：不需要 postFX pipeline，兼容性最好。逐个 tint 可以精确控制。

## Risks / Trade-offs

### Risk 1: slowFactor=0 时物理引擎行为

**Mitigation**: slowFactor=0 只影响 Enemy 的 setVelocity（乘以 0），物理引擎本身继续运行。碰撞检测仍然工作，子弹 still collide。测试时需确认敌人 AI 中没有依赖速度值的逻辑。

### Risk 2: 时间暂停 5 秒白打可能导致 Boss/精英敌人被秒杀

**Mitigation**: 这是设计意图——需要两条升级线满级（4 张前置卡）+ 跳过其他升级机会才能解锁。冷却制让单波最多触发一次，单局 5~6 次的高光时刻，强度受 `cooldownMs` 控制。如果实测太强，可调高 `TIME_STOP.cooldownMs`（如 15s）或缩短 `durationMs`。

### Risk 3: 分级卡占用升级池，可能让玩家感到"又是这张卡"

**Mitigation**: 两张分级卡各 2 级，总共 4 张。加上时间暂停卡 1 张 = 5 张新增。现有 warrior 池约 6 张，扩充到 ~11 张。出现概率 ~5/11 ≈ 45% 是技能相关卡，可接受。

### Risk 4: 解锁后 SkillOrb 对战士失效

**Mitigation**: 时间暂停脱离 charge 系统后，战士拾取 SkillOrb 没有任何收益。HUD 同步隐藏 charge 行避免误导。未来可考虑：解锁后 SkillOrb 改为加速冷却（如 -1s），但当前迭代不做。

### Trade-off: 时间暂停替换子弹时间，不可回退

一旦选择时间暂停卡，玩家失去子弹时间。这是永久选择，增加决策重量。但考虑到解锁需要 4 张前置卡 + 时间暂停明显是上位替代，决策成本不高。
