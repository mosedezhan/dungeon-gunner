#!/usr/bin/env node
// pack-sprites — 把 assets/<id>/actions/{north,east,south,west}/frame_NNN.png
// 打包成 <id>_sheet.png + <id>_sheet.json + <id>_preview.png
//
// 用法:
//   node tools/pack-sprites.mjs <assetDir> [options]
//
// 选项:
//   --mirror <src>-as-<dst>   缺方向时显式镜像兜底（如 east-as-west）
//   --dry-run                 只校验不写盘
//
// 示例:
//   node tools/pack-sprites.mjs assets/warrior
//   node tools/pack-sprites.mjs assets/mage --mirror east-as-west

import { readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROW_ORDER = ['north', 'east', 'south', 'west'];

function parseArgs(argv) {
  const args = { mirror: null, dryRun: false };
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--mirror') args.mirror = argv[++i];
    else if (a === '-h' || a === '--help') { printUsage(); process.exit(0); }
    else if (a.startsWith('--')) throw new Error(`未知参数: ${a}`);
    else positional.push(a);
  }
  if (positional.length !== 1) {
    printUsage();
    throw new Error('需要且仅需要一个 assetDir 位置参数');
  }
  args.assetDir = positional[0];
  return args;
}

function printUsage() {
  console.log('用法: node tools/pack-sprites.mjs <assetDir> [--mirror <src>-as-<dst>] [--dry-run]');
}

function parseMirror(spec) {
  if (!spec) return null;
  const m = spec.match(/^(north|east|south|west)-as-(north|east|south|west)$/);
  if (!m) throw new Error(`--mirror 格式错误: "${spec}"（应如 east-as-west）`);
  if (m[1] === m[2]) throw new Error(`--mirror 源与目标不能相同: ${spec}`);
  return { source: m[1], target: m[2] };
}

async function listFrames(dir) {
  if (!existsSync(dir)) return null;
  const files = await readdir(dir);
  const frames = files
    .filter(f => /^frame_\d+\.png$/i.test(f))
    .sort();
  return frames.length ? frames.map(f => path.join(dir, f)) : null;
}

async function main() {
  const args = parseArgs(process.argv);
  const mirror = parseMirror(args.mirror);
  const assetDir = path.resolve(args.assetDir);
  const id = path.basename(assetDir);
  const actionsDir = path.join(assetDir, 'actions');

  if (!existsSync(actionsDir)) {
    throw new Error(`找不到 actions 目录: ${actionsDir}`);
  }

  console.log(`打包 ${id}（${assetDir}）`);

  // 1. 收集每个方向的帧
  const dirFrames = {};
  for (const dir of ROW_ORDER) {
    dirFrames[dir] = await listFrames(path.join(actionsDir, dir));
  }

  // 2. mirror 兜底（必须在校验前应用）
  let mirroredTarget = null;
  if (mirror) {
    if (dirFrames[mirror.target]) {
      throw new Error(`--mirror ${mirror.source}-as-${mirror.target}: ${mirror.target} 方向已有帧，不应 mirror`);
    }
    if (!dirFrames[mirror.source]) {
      throw new Error(`--mirror ${mirror.source}-as-${mirror.target}: 源方向 ${mirror.source} 没有帧可镜像`);
    }
    dirFrames[mirror.target] = dirFrames[mirror.source];
    mirroredTarget = mirror.target;
    console.log(`  镜像 ${mirror.source} → ${mirror.target}（水平翻转）`);
  }

  // 3. 校验 4 方向齐全
  const missing = ROW_ORDER.filter(d => !dirFrames[d]);
  if (missing.length) {
    throw new Error(`缺方向: [${missing.join(', ')}]（用 --mirror <src>-as-<missing> 显式兜底）`);
  }

  // 4. 校验帧数一致
  const counts = ROW_ORDER.map(d => dirFrames[d].length);
  if (new Set(counts).size !== 1) {
    const detail = ROW_ORDER.map((d, i) => `${d}=${counts[i]}`).join(', ');
    throw new Error(`各方向帧数不一致: ${detail}`);
  }
  const framesPerDirection = counts[0];

  // 5. 校验帧尺寸一致
  const firstMeta = await sharp(dirFrames[ROW_ORDER[0]][0]).metadata();
  const frameWidth = firstMeta.width;
  const frameHeight = firstMeta.height;
  for (const dir of ROW_ORDER) {
    if (mirroredTarget === dir) continue; // 同源，不重复检查
    for (const f of dirFrames[dir]) {
      const meta = await sharp(f).metadata();
      if (meta.width !== frameWidth || meta.height !== frameHeight) {
        throw new Error(`帧尺寸不一致: ${f} = ${meta.width}×${meta.height}，期望 ${frameWidth}×${frameHeight}`);
      }
    }
  }

  const sheetWidth = frameWidth * framesPerDirection;
  const sheetHeight = frameHeight * ROW_ORDER.length;

  console.log(`  每帧: ${frameWidth}×${frameHeight}`);
  console.log(`  帧/方向: ${framesPerDirection}`);
  console.log(`  sheet: ${sheetWidth}×${sheetHeight}（4 行 × ${framesPerDirection} 列）`);

  if (args.dryRun) {
    console.log('  --dry-run，跳过写盘');
    return;
  }

  // 6. 合成 sheet
  const composites = [];
  for (let row = 0; row < ROW_ORDER.length; row++) {
    const dir = ROW_ORDER[row];
    const isMirror = mirroredTarget === dir;
    for (let col = 0; col < framesPerDirection; col++) {
      const framePath = dirFrames[dir][col];
      const pipeline = sharp(framePath);
      const buf = await (isMirror ? pipeline.flop() : pipeline).toBuffer();
      composites.push({
        input: buf,
        left: col * frameWidth,
        top: row * frameHeight,
      });
    }
  }

  const sheetPath = path.join(assetDir, `${id}_sheet.png`);
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(sheetPath);
  console.log(`  → ${path.relative(process.cwd(), sheetPath)}`);

  // 7. sidecar JSON
  const meta = {
    id,
    frameWidth,
    frameHeight,
    framesPerDirection,
    rowOrder: ROW_ORDER,
    sheet: path.relative(process.cwd(), sheetPath).replace(/\\/g, '/'),
    mirrored: mirror ? { source: mirror.source, target: mirror.target } : null,
  };
  const jsonPath = path.join(assetDir, `${id}_sheet.json`);
  await writeFile(jsonPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
  console.log(`  → ${path.relative(process.cwd(), jsonPath)}`);

  // 8. preview PNG: 2× nearest-neighbor 缩放 + SVG 网格 + 方向标注
  await writePreview({
    assetDir, id, sheetPath, frameWidth, frameHeight,
    framesPerDirection, sheetWidth, sheetHeight,
  });
}

async function writePreview({
  assetDir, id, sheetPath, frameWidth, frameHeight,
  framesPerDirection, sheetWidth, sheetHeight,
}) {
  const SCALE = 2;
  const w = sheetWidth * SCALE;
  const h = sheetHeight * SCALE;

  const baseBuf = await sharp(sheetPath)
    .resize(w, h, { kernel: 'nearest' })
    .png()
    .toBuffer();

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">`;
  // 网格（虚线）
  svg += `<g stroke="#000" stroke-width="1" stroke-dasharray="3,2" fill="none" opacity="0.7">`;
  for (let c = 0; c <= framesPerDirection; c++) {
    const x = c * frameWidth * SCALE;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`;
  }
  for (let r = 0; r <= ROW_ORDER.length; r++) {
    const y = r * frameHeight * SCALE;
    svg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`;
  }
  svg += `</g>`;
  // 方向标注（带白描边）
  for (let r = 0; r < ROW_ORDER.length; r++) {
    const y = r * frameHeight * SCALE + 16;
    svg += `<text x="4" y="${y}" font-family="monospace" font-size="14" font-weight="bold" `
      + `fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${ROW_ORDER[r]}</text>`;
  }
  svg += `</svg>`;

  const previewPath = path.join(assetDir, `${id}_preview.png`);
  await sharp(baseBuf)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toFile(previewPath);
  console.log(`  → ${path.relative(process.cwd(), previewPath)}`);
}

main().catch(e => {
  console.error(`错误: ${e.message}`);
  process.exit(1);
});
