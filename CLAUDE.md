# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 48 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## 技术栈

- **引擎**: Phaser 3 (HTML5 Canvas)
- **语言**: JavaScript (ES6 模块)
- **物理**: Arcade Physics
- **版本控制**: Git
- **构建**: 无构建步骤，CDN 加载 Phaser
- **资源管线**: 所有图形程序化生成，无外部资源

> **注意**: Phaser 3 非模板原生引擎。游戏代码路由到 gameplay-programmer。

## Project Structure

@.claude/docs/directory-structure.md

## 引擎版本参考

> Phaser 3 版本在 LLM 训练数据范围内，不需要额外引擎参考文档。

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## 协作协议

**用户驱动协作，非自主执行。**
每步遵循：**提问 → 选项 → 决策 → 草案 → 审批**

- 写文件前必须征得用户同意
- 多文件变更需整体审批
- 未经指示不提交代码

> **首次使用？** 运行 `/start` 开始引导流程。

## 编码标准

@.claude/docs/coding-standards.md

## AI 工作流规则

@docs/ai-workflow/RULES.md

## 上下文管理

@.claude/docs/context-management.md
