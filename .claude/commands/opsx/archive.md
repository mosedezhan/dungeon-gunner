---
name: "OPSX: Archive"
description: Archive a completed change in the experimental workflow
category: Workflow
tags: [workflow, archive, experimental]
---

Archive a completed change in the experimental workflow.

**Input**: Optionally specify a change name after `/opsx:archive` (e.g., `/opsx:archive add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Prompt user for confirmation to continue
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Prompt user for confirmation to continue
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   If user chooses sync, use Task tool (subagent_type: "general-purpose", prompt: "Use Skill tool to invoke openspec-sync-specs for change '<name>'. Delta spec analysis: <include the analyzed delta spec summary>"). Proceed to archive regardless of choice.

5. **Perform the archive**

   Create the archive directory if it doesn't exist:
   ```bash
   mkdir -p openspec/changes/archive
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move the change directory to archive

   ```bash
   mv openspec/changes/<name> openspec/changes/archive/YYYY-MM-DD-<name>
   ```

5.5. **Propose CLAUDE.md sync (project context refresh)**

   After the archive move succeeds, evaluate whether the archived change introduced any project-level facts that future Claude sessions need to know without having to read the archive directory. If yes, propose an edit to the root `CLAUDE.md` (or the nearest subsystem `src/<dir>/CLAUDE.md`).

   **Read inputs:**
   - `openspec/changes/archive/YYYY-MM-DD-<name>/proposal.md`
   - `openspec/changes/archive/YYYY-MM-DD-<name>/design.md` (if exists)
   - `openspec/changes/archive/YYYY-MM-DD-<name>/specs/**/*.md`
   - Current root `CLAUDE.md` and any `src/**/CLAUDE.md`

   **Promotion-worthy categories (eligible for CLAUDE.md):**
   - 新场景 / 新 Entity 类 / 新物理组 → 更新「场景流转」或「实体模式」
   - 新顶层 `config.js` 块（如 `SKILL`、`SHOP`） → 更新「配置文件」
   - 新跨文件约定 / 新场景间通信钩子 → 更新「关键约定」

   **Skip categories (do NOT promote):**
   - bug 修复 / refactor / 平衡数值微调
   - 单个新升级卡 / 单个新敌人变体（除非引入了新机制类别）
   - 实现细节 / 任务列表 / ADR 决策（archive 目录已经保留）

   **判断标准：未来新会话不读它就上不了手，才进 CLAUDE.md。**

   **Action:**
   1. If nothing qualifies: report "CLAUDE.md sync: nothing to promote" and continue.
   2. If something qualifies:
      - Output a proposed edit (unified diff or before/after of the affected section)
      - Use **AskUserQuestion** to confirm with options: "Apply", "Skip", "Edit and apply"
      - If "Apply": use Edit tool to write
      - If "Skip": report "CLAUDE.md sync: skipped by user"
      - If "Edit and apply": ask user to supply revised text, then write

   This step MUST NOT block or roll back the archive — the archive already succeeded in Step 5. Failures in this step are reported as warnings, not errors.

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status (synced / sync skipped / no delta specs)
   - CLAUDE.md sync status (updated / nothing to promote / skipped)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs
**CLAUDE.md:** ✓ Updated (or "Nothing to promote")

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** No delta specs
**CLAUDE.md:** ✓ Updated (or "Nothing to promote")

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** Sync skipped (user chose to skip)
**CLAUDE.md:** Skipped (user chose to skip)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)
- CLAUDE.md sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** openspec/changes/archive/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use the Skill tool to invoke `openspec-sync-specs` (agent-driven)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- Always run Step 5.5 (CLAUDE.md sync) after a successful archive move; failures here are warnings, not errors — the archive itself stays intact
