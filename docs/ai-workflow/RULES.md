# AI 工作流规则（RULES）

> 本文件是**给 AI 读的硬规则**。决策动机与权衡见 `docs/ai-workflow/NN-*.md`（ADR）。
> 开始任何变更前必须遵守本文件。

## 变更颗粒度策略

| 类型 | 流程 | 例 |
|---|---|---|
| 新实体 / 新系统 / 新机制 | OpenSpec change | Boss 战、商店、新技能 |
| 重构 / 抽象 | OpenSpec change | 抽共用组件 |
| 大 bug 修复（>1h） | OpenSpec change | 暂停态下逻辑仍执行 |
| 小 bug 修复（<1h） | 直接修，commit `fix:` | typo、偏移 |
| 纯数值微调（不改公式） | 直接改，commit 说明原因 | 调速度 220→180 |
| 结构性变化（改公式 / 加维度） | OpenSpec change | 曲线线性改指数 |

**每个 OpenSpec change 必须**：
- 工作量 ≤ 3 天
- 能独立验证
- ≤ 5 个 capability spec 改动

## 上下文卫生

1. **archive 即时性**：change 实现完成 + 验证通过 → 立即归档。已完成未归档 = 上下文负债。
2. **进行中变更上限**：`openspec/changes/` 下未归档 change **≤ 2 个**。达上限必须先归档或显式暂停一个。
3. **CLAUDE.md 分层加载**：根 CLAUDE.md 只放全局架构 + 工作流指针。子系统局部规则下沉到 `src/<subdir>/CLAUDE.md`。
4. **CLAUDE.md 归档同步**：归档变更时若引入新场景 / 新实体类 / 新顶层配置块 / 新跨文件约定，必须更新对应 CLAUDE.md。判断标准：**未来新会话不读它就上不了手，才进**。
5. **决策记录可追溯**：每引入一个新框架元素，必须在 `docs/ai-workflow/` 留 `NN-name.md` ADR。

## archive 执行步骤

```
1. tasks.md 所有 checkbox 完成
2. 验证通过
3. git commit 用 feat: / fix: / refactor: 前缀
4. 归档 change（移入 archive/ + 同步 spec + 同步 CLAUDE.md）
5. 确认 openspec/specs/ 下新增/更新 capability
```

## 决策记录命名

`docs/ai-workflow/NN-name.md`：
- `NN`：从 `00` 起递增
- `name`：kebab-case 短名
- 每篇包含：**背景与动机** / **决策与权衡** / **适用边界** / **后续观察项**

## 文档分工

| 文档 | 性质 | 谁来读 | 谁来写 |
|---|---|---|---|
| 根 `CLAUDE.md` | 项目架构 + 工作流指针 | AI 自动加载 | 人手写 |
| `src/<dir>/CLAUDE.md` | 子系统局部规则 | AI 进入该目录加载 | 人手写 |
| `docs/ai-workflow/RULES.md` | 工作流硬规则 | AI 按指针读 | 人手写 |
| `docs/ai-workflow/NN-*.md` | 决策叙事（ADR） | 人读 | 人手写 |
| `openspec/specs/<cap>/spec.md` | 能力规范 | AI 用作变更参考 | 归档时生成 |
| `openspec/changes/<name>/` | 进行中变更 | AI + 人 | `/openspec-propose` `/openspec-apply-change` |

## 破例规则

硬规则是**纪律**，不是**法律**。破例必须在该 change 的 `design.md` 说明理由。
