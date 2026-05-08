## Tasks

### T1: 打包 warrior2 素材为 spritesheet
- [x] 用脚本将 `assets/warrior2/` 打包为 `warrior2_sheet.png` + sidecar JSON
- [x] 验证输出：4 行 × 8 列，单帧 128×131，总图 1024×524

### T2: BootScene 加载 spritesheet + 注册动画
- [x] `preload()`: 新增 `this.load.spritesheet('warrior_sheet', ...)` 加载 PNG
- [x] `create()`: 删除 4 行 warrior 程序化纹理生成（`warrior_idle_a/b`、`warrior_run_a/b`）
- [x] `create()`: 删除旧 `warrior_idle` / `warrior_run` 的 `anims.create`
- [x] `create()`: 新增 7 个动画注册（south/east/north 各 idle+run + attack）

### T3: Player 方向系统 + 动画切换
- [x] Player 构造：warrior 的初始纹理从 `warrior_idle_a` 改为 `warrior_sheet` 帧 0；新增 `_facing = 'south'`；调整 `setScale(0.5)`
- [x] `update()` 非翻滚分支：warrior 方向判断逻辑（vx/vy → south/east/north/west）+ 动画选择 + flipX
- [x] `update()` 翻滚分支：warrior 的 `flipX` 改为基于 `_facing`
- [x] 翻滚幽灵：`_spawnAfterimage` 中 warrior 分支用 `warrior_sheet` + `setFrame(this.frame.name)`
- [x] `die()` / aim 分支 flipX：warrior 跳过通用 flipX（已在方向逻辑中处理）

### T4: 攻击动画集成
- [x] `_doSwing()`: warrior 开始挥砍时 `this.play('warrior_attack')` + flipX
- [x] attack 动画 repeat:0，播完后 update() 方向逻辑自动切回 idle/run

### T5: ClassSelectScene 适配
- [x] `createClassCard()`: warrior 卡片从 `cls.textureKey + '_idle_a'` 改为 `warrior_sheet` 帧 0
- [x] warrior 卡片播放 `warrior_south_idle`，scale=1.5
- [x] 其他职业保持原逻辑不变

### T6: 手测 + 调参
- 启动游戏，选 warrior，完整游戏流程：
  - 移动方向与精灵朝向一致（4 方向）
  - idle/run/attack 动画流畅
  - 翻滚时幽灵效果正常
  - 碰撞判定合理（物理体与视觉匹配）
  - 升级界面 warrior 显示正常
  - 死亡动画正常
  - 选人界面正常
- 调整 scale / 碰撞体大小直到视觉合理
