# AI 工作流规则（RULES）

> 本文件是**给 AI 读的硬规则**。决策动机与权衡见 `docs/ai-workflow/NN-*.md`（ADR）。
> 开始任何变更前必须遵守本文件。

## 变更颗粒度策略

| 类型 | 流程 | 例 |
|---|---|---|
| 新敌人 / 新升级 / 新场景 / 新系统 | OpenSpec change | Boss 战、商店、新升级槽 |
| 重构 / 抽象 | OpenSpec change | 抽 BulletEmitter |
| 大 bug 修复（>1h） | OpenSpec change | 暂停态下子弹仍移动 |
| 小 bug 修复（<1h） | 直接修，commit `fix:` | typo、单 sprite 偏移 |
| 纯数值平衡（不改公式） | `docs/balance-journal.md` | 调 Rusher 速度 220→180 |
| 结构性平衡（改公式 / 加维度） | OpenSpec change | XP 曲线线性改指数 |

**每个 OpenSpec change 必须**：
- 工作量 ≤ 3 天
- 能独立 playtest 验证
- ≤ 5 个 capability spec 改动

## 上下文卫生

1. **archive 即时性**：change 实现完成 + playtest 通过 → 立即归档。已完成未归档 = 上下文负债。
2. **进行中变更上限**：`openspec/changes/` 下未归档 change **≤ 2 个**。达上限必须先归档或显式暂停一个，不得简单累加。
3. **CLAUDE.md 分层加载**：根 CLAUDE.md 只放全局架构 + 工作流指针。子系统局部规则下沉到 `src/<subdir>/CLAUDE.md`。新增分层须留 ADR。
4. **决策记录可追溯**：每引入一个新 AI 框架元素（命令 / 分层 / 工作流 / 约定），必须在 `docs/ai-workflow/` 留 `NN-name.md` ADR。

## archive 执行步骤

```
1. tasks.md 所有 checkbox 完成
2. 浏览器手测通过（参考 /playtest 输出 checklist）
3. git commit 用 feat: / fix: / refactor: 前缀
4. /opsx:archive <change-name>
5. 确认 openspec/specs/ 下新增/更新 capability，changes/ 原目录已移入 archive/
```

## 决策记录命名

`docs/ai-workflow/NN-name.md`：
- `NN`：从 `00` 起递增，按引入时间
- `name`：kebab-case 短名
- 每篇必须包含四节：**背景与动机** / **决策与权衡** / **适用边界** / **后续观察项**

## 文档分工

| 文档 | 性质 | 谁来读 | 谁来写 |
|---|---|---|---|
| 根 `CLAUDE.md` | 项目整体架构 + 工作流指针 | AI 自动加载 | 人手写 |
| `src/<dir>/CLAUDE.md` | 子系统局部规则 | AI 进入该目录加载 | 人手写 |
| `docs/ai-workflow/RULES.md` | 工作流硬规则 | AI 按指针读 | 人手写 |
| `docs/ai-workflow/NN-*.md` | 决策叙事（ADR） | 人读，AI 按需查 | 人手写 |
| `docs/balance-journal.md` | 调参留痕 | AI 查参考、人 review | `/balance-tune` 自动追加 |
| `openspec/specs/<cap>/spec.md` | 能力规范 | AI 用作变更参考 | `/opsx:archive` 自动生成 |
| `openspec/changes/<name>/` | 进行中变更 | AI + 人 | `/opsx:propose` `/opsx:apply` |

## 破例规则

本文件的硬规则是**纪律**，不是**法律**。极少数情况可破例（如重大重构超 3 天），但**破例必须在该 change 的 `design.md` 显式说明理由**。
