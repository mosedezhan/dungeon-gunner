## 1. Phase 1: 接口骨架

- [x] 1.1 创建 `src/systems/World.js` 模块，导出 `WORLD` 常量（width=960, height=600，暂时等于 GAME）
- [x] 1.2 在 `World.js` 中实现 `World` 类，包含方法：`getBounds()` / `getSpawnRing(camera)` / `isOutOfBounds(x,y,margin)` / `getVisibleTileRange()` / `setupPhysicsWorld()`
- [x] 1.3 骨架实现：所有方法暂时等价于当前行为（如 `setupPhysicsWorld()` 仍调用 `physics.world.setBounds(0,0,GAME.width,GAME.height)`）
- [x] 1.4 在 `src/config.js` 新增 `WORLD` 块：`export const WORLD = { width: 960, height: 600 };`
- [x] 1.5 `src/scenes/GameScene.js` 改用 `world.setupPhysicsWorld()` 替代直接 `setBounds`
- [x] 1.6 `src/systems/WaveManager.js` 改用 `world.getSpawnRing()` 替代 `cam.worldView` 直接计算
- [x] 1.7 `src/entities/Bullet.js` 改用 `world.isOutOfBounds()` 替代 `cam.worldView` 边界检查
- [x] 1.8 `src/entities/EnemyBullet.js` 改用 `world.isOutOfBounds()` 替代 `cam.worldView` 边界检查
- [ ] 1.9 浏览器验证：游戏行为与当前完全一致（无功能变化，只是调用路径变了）

## 2. Phase 2: 相机跟随

- [x] 2.1 在 `src/scenes/GameScene.create()` 中，`this.player` 创建后添加：`this.cameras.main.startFollow(this.player, true, 0.1, 0.1)`
- [x] 2.2 在 `src/scenes/GameScene.create()` 中，添加相机边界限制：`this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height)`
- [ ] 2.3 可选：在 `src/config.js` 添加 `CAMERA` 块（lerpX=0.1, lerpY=0.1），让参数可调
- [ ] 2.4 浏览器验证：相机平滑跟随玩家移动，不出边界

## 3. Phase 3: 世界扩大

- [x] 3.1 在 `src/config.js` 修改 `GAME` 块：`width: 1280, height: 720`
- [x] 3.2 在 `src/config.js` 修改 `WORLD` 块：`width: 3840, height: 3600`（3×5 倍）
- [x] 3.3 在 `src/scenes/GameScene.create()` 中，将 `drawFloor()` 改为 tileSprite 模式：
  - 生成 32×32 基础纹理到 `floor_tile` key
  - 用 `this.add.tileSprite(WORLD.width/2, WORLD.height/2, WORLD.width, WORLD.height, 'floor_tile')` 一次性铺满
- [x] 3.4 在 `src/systems/World.js` 的 `getSpawnRing()` 中实现边界相交逻辑：
  - 计算相机外四边的候选区域
  - 与世界边界 (0,0,WORLD.width,WORLD.height) 取交集
  - 返回安全的生成区域
- [x] 3.5 在 `src/scenes/GameScene.create()` 中，将玩家初始位置改为世界中心：`new Player(this, WORLD.width/2, WORLD.height/2)`
- [ ] 3.6 浏览器验证：玩家可在大世界移动，敌人在边界外正确生成且不出世界

## 4. Phase 4: 出界回收

- [x] 4.1 验证 `src/entities/Bullet.js` 的 `preUpdate()` 中已调用 `world.isOutOfBounds()`
- [x] 4.2 验证 `src/entities/EnemyBullet.js` 的 `preUpdate()` 中已调用 `world.isOutOfBounds()`
- [ ] 4.3 浏览器验证：子弹飞出世界边界后正确回收（不 crash，不 leak）
- [ ] 4.4 浏览器验证：敌人走到世界边界后不再前进（物理边界约束生效）
- [ ] 4.5 可选：如需"敌人出界消失"（而非物理阻挡），在 `Enemy.preUpdate()` 加 `world.isOutOfBounds()` 判断后调用 `die()`

## 5. 浏览器手测（全流程验证）

- [ ] 5.1 启动游戏：`python -m http.server 8000`，打开 `http://localhost:8000`
- [ ] 5.2 验证镜头尺寸：浏览器 canvas 为 1280×720
- [ ] 5.3 验证相机跟随：玩家移动时相机平滑跟随，不出边界
- [ ] 5.4 验证世界边界：玩家走到 3840×3600 边界时停止，相机不显示黑边
- [ ] 5.5 验证敌人生成：敌人在相机外、世界内生成，玩家贴边时不会在世界外生成
- [ ] 5.6 验证子弹回收：子弹飞出世界边界后消失，不 crash
- [ ] 5.7 验证性能：满屏敌人时帧率保持稳定（≥30 FPS）
- [ ] 5.8 完整玩 2-3 波：确认游戏体验正常，无内存泄漏

## 6. Commit & Archive

- [ ] 6.1 提交：`feat: add large world system with camera follow`
- [ ] 6.2 推送：`git push`
- [ ] 6.3 调用 `/opsx:archive add-large-world` 归档变更
