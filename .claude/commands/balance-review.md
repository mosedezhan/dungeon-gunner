---
description: 对 src/config.js 的平衡参数变化做静态推算评审（玩家 DPS / 敌人 EHP / TTK / 技能 uptime 等指标的调前→调后对照 + 风险点 + 手测重点）
argument-hint: "[<参数路径> <旧值>→<新值>]  # 留空则评审 git diff src/config.js；带参数则跑 what-if（不会改 config）"
---

# /balance-review — 平衡静态评审

调用 `balance-review` 子代理（见 `.claude/agents/balance-review.md`），对 `src/config.js` 的平衡变化做**静态分析**——只算公式、不跑游戏、**不修改任何文件**。

定位：补 `/balance-tune` 留 after-feel（定性）的另一面——给量化锚点。两者解耦，可单独使用。

## 执行步骤

1. **解析参数**（来自 `$ARGUMENTS`）：
   - **空**：进入 **diff 模式**（默认）。
   - **格式 `<param-path> <old>→<new>`**：进入 **what-if 模式**。`<param-path>` 是点分路径（如 `ENEMY.rusher.hp`、`PLAYER.fireRateMs`、`SKILL.damagePercent`），`<old>→<new>` 是数值对（中间是中文/英文箭头均可）。
   - **格式不匹配**：报错并展示用法。

2. **diff 模式**：
   1. 跑 `git diff src/config.js`。
   2. 若输出为空：报"无可评审的改动；请先修改 `src/config.js`，或改用 what-if 模式（带参数调用）"。停。
   3. 若非空：把 diff 内容连同 `src/config.js` 当前内容一起喂给 `balance-review` 子代理（用 Agent 工具，`subagent_type: "balance-review"`）。

3. **what-if 模式**：
   1. 解析 `<param-path>`、`<old>`、`<new>`。
   2. 读 `src/config.js`，确认 `<param-path>` 当前值与 `<old>` 一致。**不一致**：警告"当前值是 X，与你给的 old=Y 不符。继续 (y/n)?"——避免用户基于过时假设做评审。
   3. **不修改 config.js**。把假设性参数当作 prompt 上下文喂给子代理（"假设 X 从 a 改为 b，其他不变"）。

4. **展示子代理输出**：原样转发给用户（子代理已强制四段输出结构）。

5. **可选**：若用户想把评审结果嵌入 balance-journal，提示"运行 `/balance-tune <param> <new>` 完成调参 + journal 留痕；本次评审输出可手工复制到 after-feel 段做对照"。**不**自动调用 `/balance-tune`。

## 安全保证

- **不修改任何文件**：本命令只读 `src/config.js` 和 `git diff`，无 Write / Edit 调用。
- **不写 balance-journal**：留痕仍走 `/balance-tune`。
- **不给具体数值建议**：子代理输出的"风险点"是定性方向，不会出现"应该调到 X.X"。终审决策是用户的事。
- **不读游戏代码**：子代理被硬约束不读 `src/scenes/` / `src/entities/`。本命令也不主动加载这些文件。

## 使用范例

### 范例 1：diff 模式（最常用）

刚改完 `src/config.js`，未提交，想看预测：

```
/balance-review
```

→ 子代理读 diff，对每个改动字段算指标对照，输出表格 + 风险点 + 手测重点。

### 范例 2：单参数 what-if（"如果调到 X 会怎样"）

还没动 config，先看潜在影响：

```
/balance-review ENEMY.rusher.hp 12→18
```

→ 子代理把假设套用到当前 config，估算调后状态。`config.js` 不变。

### 范例 3：连续多轮 what-if（探索）

每轮独立调用，互不干扰（子代理无跨轮记忆）：

```
/balance-review ENEMY.rusher.hp 12→18
# 看完不满意
/balance-review ENEMY.rusher.hp 12→15
# 试另一个维度
/balance-review PLAYER.fireRateMs 280→260
```

## 与 `/balance-tune` 的协作

推荐流程（非强制）：

```
/balance-review <param> <old>→<new>   # 看预测
... 决定动手
（手改 config.js，或 /balance-tune 一并改 + 留痕）
浏览器手测
/balance-tune <param> <final-value>   # 留痕，after-feel 可引用上面的指标对照表
```

但你也可以反过来——先调先测，再回头跑 `/balance-review` 复盘"指标说会变难，体感是不是真变难了"。

## 边界与拒绝

- **拒绝评审 UPGRADES 改动**：`UPGRADES` 是 `apply` 函数数组，本命令不分析其语义。若 diff 命中 `UPGRADES`，子代理会显式标注"UPGRADES 改动不在本评审范围"。
- **拒绝评审非 config 改动**：diff 模式只看 `src/config.js` 一个文件。其他文件改动忽略。
- **拒绝写盘**：即使用户在调用时要求"评审完顺便改 config"，必须拒绝并提示用 `/balance-tune` 或手改。
- **结构性变化提示**：若 diff 引入**新字段**（白名单外），子代理输出 `WARNING: 未识别字段` 并跳过受影响指标。这种情况通常意味着是结构性平衡变化，应走 OpenSpec change（参考 `docs/ai-workflow/RULES.md` 颗粒度策略）。
