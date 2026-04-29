---
description: 新会话热身：读项目根 CLAUDE.md + 最近 N 个 archive + 当前进行中变更，输出 ≤ 200 字状态总结
argument-hint: "[N]  # 可选，archive 读取数量，默认 3"
---

# /onboard — 新会话热身

本命令用于新会话快速理解项目当前状态，避免每次重新解释历史决策。

## 执行步骤

1. **读根 CLAUDE.md**：`E:\WebstormProjects\dungeon-gunner\CLAUDE.md` — 项目架构与约定
2. **读最近 N 个 archive**（默认 N=3，可通过参数覆盖）：
   - 列 `openspec/changes/archive/` 下最新的 N 个目录（按修改时间）
   - 每个目录读 `proposal.md`（不读 design/specs/tasks，只看 Why + What Changes）
3. **读当前进行中变更**：
   - 列 `openspec/changes/` 下除 `archive/` 外的所有目录
   - 每个目录读 `proposal.md` 的 Why 节 + `tasks.md` 的进度（已完成/总数）
4. **列 ai-workflow 决策记录**：
   - 列 `docs/ai-workflow/` 下所有 `NN-name.md` 的标题（不读全文）
5. **读 balance-journal 末尾 3 条**：`docs/balance-journal.md`
6. **产出 ≤ 200 字总结**，必须覆盖：
   - 项目处于什么阶段（基建 / 稳定迭代 / 大重构）
   - 当前进行中的 change 是什么 + 进度
   - 最近一次平衡调整的方向（如有）
   - 建议本会话从哪里入手

## 输出格式

```
## Project Onboarding

**阶段**：<一句话>
**进行中**：<change 名 N/M tasks，或 "无"> 
**最近归档**：<3 个 change 名，逗号分隔>
**最近平衡**：<journal 最后一条标题，或 "无">
**框架决策**：<ai-workflow/ 目录下决策数量 + 最新一篇标题>

**建议起点**：<1-2 句话>
```

## 使用边界

- 本命令是只读操作，不修改任何文件
- 总结字数硬上限 200 字，超过即视为失败（说明读太多无关内容）
- N 默认 3，过大（>5）会让总结失焦，过小（<2）信息不足

## 后续观察项（写入 docs/ai-workflow/ 时记录）

- N=3 是否合适？
- 是否需要把"未关闭的 TODO"也加入读取范围？
- 总结里是否需要包含 git 当前分支与最近 commit？
