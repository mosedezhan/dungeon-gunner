# 01 — 归档时同步 CLAUDE.md

## 背景与动机

OpenSpec 工作流把"为什么这么改"沉淀在 `openspec/changes/archive/` 下，但新会话主要靠根 `CLAUDE.md` 加载项目上下文。随着 archive 累积，CLAUDE.md 与代码现状会逐渐脱节。

## 决策与权衡

归档操作时自动跑一步 CLAUDE.md 同步评估——读 archive 里的 artifacts，对比当前 CLAUDE.md，若有"促销值得"的事实就输出 diff 让用户确认。

**仅同步高层、稳定的事实**：新场景、新实体类、新物理组、新顶层配置块、新跨文件约定。判断标准：**未来新会话不读它就上不了手，才进 CLAUDE.md。**

**不进**：bug 修复 / refactor / 平衡数值微调 / 单个变体。

输出 diff 而非直写，由用户确认。失败不回滚归档。

## 适用边界

仅适用于归档那一刻。日常 commit / 中间实现不触发。

## 后续观察项

- 用户选 "Skip" 的频率，若 > 50% 说明过滤规则太宽
- CLAUDE.md 是否仍 ≤ 200 行
