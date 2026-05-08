---
name: pack-sprites
description: 把 assets/<id>/actions/{north,east,south,west}/frame_NNN.png 序列帧打包成 <id>_sheet.png 雪碧图 + sidecar JSON + 预览图。用于角色/怪物素材入库。仅做打包，不改 BootScene/Player。
---

打包角色/怪物的 4 方向序列帧为一张雪碧图，附 sidecar 元数据 JSON 和带方向标注的预览 PNG。代码层接入（BootScene 注册、Player 方向选择）由后续 change 手工完成，不在本 skill 范围内。

# 触发条件

用户输入 `/pack-sprites <id>`，例如 `/pack-sprites warrior` 或 `/pack-sprites mage --mirror east-as-west`。

参数原样传给 `tools/pack-sprites.mjs`。

# 输入约定

```
assets/<id>/
  actions/
    north/  frame_000.png frame_001.png ... frame_NNN.png
    east/   frame_000.png frame_001.png ...
    south/  frame_000.png frame_001.png ...
    west/   frame_000.png frame_001.png ...
```

硬约束：
- 4 方向必须齐全（缺方向 → 报错；用户可显式 `--mirror east-as-west` 镜像兜底）
- 每方向帧数必须一致
- 每帧像素尺寸必须一致
- 帧文件名必须匹配 `^frame_\d+\.png$`，按字符串排序

# 输出

```
assets/<id>/
  <id>_sheet.png      雪碧图，行序 [north, east, south, west]，列=帧序
  <id>_sheet.json     sidecar 元数据：frameWidth/frameHeight/framesPerDirection/rowOrder/sheet/mirrored
  <id>_preview.png    2× 缩放预览，黑色虚线网格，每行左上角标注方向（手测对齐用）
```

输出会**覆盖写**已存在文件。覆盖前若用户担心，可加 `--dry-run` 只看校验结果不写盘。

sidecar JSON schema（BootScene 后续接入读这个，不要硬编码）：
```json
{
  "id": "warrior",
  "frameWidth": 48,
  "frameHeight": 48,
  "framesPerDirection": 9,
  "rowOrder": ["north", "east", "south", "west"],
  "sheet": "assets/warrior/warrior_sheet.png",
  "mirrored": null
}
```

# 执行步骤

1. **确认 sharp 已安装**

   ```bash
   ls node_modules/sharp 2>&1
   ```

   如果不存在，先 `npm install`（项目 `package.json` 把 sharp 列在 devDependencies）。

2. **跑打包脚本**

   ```bash
   node tools/pack-sprites.mjs assets/<id> [--mirror <src>-as-<dst>] [--dry-run]
   ```

   或 `npm run pack-sprites -- assets/<id>`。

3. **报告结果**

   把脚本输出（每帧尺寸、sheet 尺寸、写出的三个文件路径）转给用户。

   提示用户在浏览器打开 `<id>_preview.png` 视觉检查：方向标注是否符合预期、镜像方向（若启用）是否合理、各方向是否对齐。

4. **不要改运行时代码**

   本 skill 不动 `src/` 任何文件。BootScene preload sheet、注册 4-dir anim、Player 按瞄准角度选行的接入工作，建议另开 OpenSpec change（如 `import-spritesheet-pipeline`）专门处理。

# 错误处理

- `缺方向: [west]（用 --mirror <src>-as-<missing> 显式兜底）` → 询问用户是否补素材或加 mirror 参数
- `各方向帧数不一致` → 报回详情，让用户检查素材
- `帧尺寸不一致` → 报回出错文件路径，让用户检查
- sharp 未安装 → 跑 `npm install`

# 不做的事

- 不修改 `src/scenes/BootScene.js`、`src/entities/Player.js`、`src/config.js`
- 不开 OpenSpec change（skill 自身是工作流工具）
- 运行时不依赖 sharp（仅开发期 CLI）
- 不删除原始 `actions/` 序列帧（保留作为修订源）
