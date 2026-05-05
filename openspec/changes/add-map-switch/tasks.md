## 1. 加载地图纹理

- [x] 1.1 在 `src/scenes/BootScene.js` 新增 `preload()` 方法，加载 `assets/map/map_1.png`（key: `map_1`）和 `assets/map/map_2.png`（key: `map_2`）
- [ ] 1.2 浏览器验证：打开游戏控制台确认两张纹理加载成功（无 404）

## 2. 替换地板渲染

- [x] 2.1 在 `src/config.js` 的 `WORLD` 块新增 `tileScale: 0.5`
- [x] 2.2 修改 `src/scenes/GameScene.js` 的 `drawFloor()`：
  - 删除程序化 32x32 纹理生成代码
  - 改为 `this.add.tileSprite(WORLD.width/2, WORLD.height/2, WORLD.width, WORLD.height, 'map_1')`
  - 设置 `tileSprite.tileScaleX = WORLD.tileScale` 和 `tileSprite.tileScaleY = WORLD.tileScale`
  - 存储 tileSprite 引用到 `this.floorTile`
- [ ] 2.3 浏览器验证：开局地面显示 map_1 暗色地牢纹理，地砖密度合理

## 3. 实现波次地图切换

- [x] 3.1 在 `src/config.js` 的 `WORLD` 块新增 `mapSwitchWave: 10`、`mapTransitionDurationMs: 600`
- [x] 3.2 在 `src/scenes/GameScene.js` 新增 `triggerMapTransition()` 方法：
  - 设置 `player.invulnUntil = now + WORLD.mapTransitionDurationMs`
  - 创建白色矩形遮罩（screen-locked, depth 50），alpha 从 0→1 淡入 200ms
  - 遮罩满时：`this.floorTile.setTexture('map_2')`，然后 alpha 1→0 淡出 200ms
  - 淡出完成时销毁遮罩
- [x] 3.3 在 `src/systems/WaveManager.js` 的 `startWave(n)` 中，当 `n === WORLD.mapSwitchWave` 时调用 `this.scene.triggerMapTransition()`
- [ ] 3.4 浏览器验证：打到 W10 时地面切换到 map_2 暖色遗迹纹理，过渡期间玩家不受伤害

## 4. 微调与清理

- [ ] 4.1 浏览器验证：完整玩到 W12+，确认切换后地板渲染正常、无闪烁、无性能问题
- [ ] 4.2 根据 W10 切换效果微调 `WORLD.tileScale`（如 0.5 不理想则调为 0.4 或 0.6）

## 5. Commit & Archive

- [ ] 5.1 提交：`feat: add map tile textures with wave 10 transition`
- [ ] 5.2 推送：`git push`
- [ ] 5.3 调用 `/opsx:archive add-map-switch` 归档变更，同步更新 CLAUDE.md（移除"无需外部资源"硬规则，改为"精灵资源仍程序化生成，地图纹理使用外部 PNG"）
