---
description: 新会话热身：探测项目上下文，输出 ≤ 200 字状态总结
argument-hint: "[N]  # archive 读取数量，默认 3"
---

# /onboard — 新会话热身

## 执行步骤

1. **读根 CLAUDE.md**
2. **读最近 N 个 archive**（默认 3）：`openspec/changes/archive/` 下最新的 N 个，每个只读 `proposal.md`
3. **读进行中变更**：`openspec/changes/` 下除 `archive/` 外的目录
4. **读 ai-workflow 决策记录**：`docs/ai-workflow/NN-*.md` 标题
5. **产出 ≤ 200 字总结**

## 输出格式

```
## Project Onboarding

**阶段**：<一句话>
**进行中**：<change 名 N/M tasks，或 "无">
**最近归档**：<N 个 change 名>
**决策记录**：<数量 + 最新一篇标题>

**建议起点**：<1-2 句话>
```

## 边界

- 只读操作，不修改任何文件
- 总结硬上限 200 字
- 目录不存在则跳过并报告
