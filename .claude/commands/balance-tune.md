---
description: 调整 src/config.js 单个数值并自动追加 balance-journal 条目（why + after-feel 必填）
argument-hint: "<参数路径> <新值>  # 例：ENEMY.rusher.speed 180"
---

# /balance-tune — 调参 + 留痕

纯数值平衡不走 OpenSpec（参考 [`docs/ai-workflow/00-context-strategy.md`](../../docs/ai-workflow/00-context-strategy.md)），但必须在 [`docs/balance-journal.md`](../../docs/balance-journal.md) 留痕。本命令统一这一动作。

## 执行步骤

1. **解析参数**：从 `$ARGUMENTS` 取出参数路径与新值
   - 参数路径：点分（如 `ENEMY.rusher.speed`、`PLAYER.startingHp`）
   - 新值：数字或字面量
2. **定位旧值**：读 `src/config.js`，按路径找到对应键的当前值
3. **修改**：将旧值替换为新值（注意保留行格式与可能的注释）
4. **询问 why**（必填，1-2 句话）：
   > "为什么调？（例：第 4 波 Rusher 太硬，玩家走位空间被锁）"
5. **询问 after-feel**（必填，1-2 句话）：
   > "调完手测体感如何？（例：节奏松了，第 8 波重新紧张）"
6. **追加 journal 条目**到 `docs/balance-journal.md` 末尾，格式：
   ```
   ## YYYY-MM-DD <短标题>

   - **改动**：<参数路径>: <旧值> → <新值>
   - **why**：<用户输入>
   - **after-feel**：<用户输入>
   ```
   - 日期取系统当前日期（不要硬编码）
   - 短标题由 AI 基于 why 概括（≤ 12 字）
7. **输出汇总**：展示 diff（config.js 改动行 + journal 新增条目），让用户确认

## 一次会话多条调整的合并

如果用户连续调多个参数（共享同一个 why），可以共用一个 journal 条目：

- 先以单条形式追加
- 后续 `/balance-tune` 检测最近一条是否 same-day & same-purpose，提示用户：
  > "最近 5 分钟内已记录一条调整，要合并到同一条目吗？(y/n)"
- 用户选 y 则在已有条目的"改动"下追加一行

## 边界与拒绝条件

- **拒绝结构性变化**：如果改动需要新增字段、改公式、加维度，必须**拒绝执行**并提示用户走 OpenSpec change。例：将 `XP.curve` 从线性改成指数公式。
- **拒绝跨文件改动**：本命令仅修改 `src/config.js`。其他文件改动必须独立处理。
- **拒绝缺 why/after-feel**：用户必须提供两者，不允许跳过。
- **拒绝路径不存在**：读 config.js 找不到对应键时报错，不创建新键。

## 使用边界

- 本命令是**已完成手测**之后的留痕动作（after-feel 才能填）
- 若调参后还没手测，先用 `/playtest` 生成清单，测完再回来跑 `/balance-tune`
- 大幅同时调整 5+ 数值更可能是结构性平衡，建议改走 OpenSpec change
