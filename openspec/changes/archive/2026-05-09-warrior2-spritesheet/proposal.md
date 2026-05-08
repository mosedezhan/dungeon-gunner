## Why

当前 warrior（战士）使用 BootScene 程序化生成的极小像素精灵（~24x32，2 帧抖动模拟动画）。视觉效果粗糙，与其他敌人的程序化精灵缺乏辨识度。

`assets/warrior2/` 目录已有一套完整的 32 帧外部像素画素材（4 方向 × 8 帧行走 + 8 帧攻击），128×131 尺寸，经典西幻骑士风格。将这套素材打包为 spritesheet 并应用到 warrior 职业，可以大幅提升视觉品质，同时为战士引入 4 方向动画和攻击动画。

## What Changes

### 雪碧图打包

将 `assets/warrior2/` 下的 32 帧 PNG（south 0-7, east 8-15, north 16-23, attack 24-31）打包成一张 spritesheet PNG + sidecar JSON。用 `/pack-sprites` 技能完成。

### 纹理加载方式切换

BootScene 的 warrior 纹理从程序化 `generateTexture()` 切换为 `load.spritesheet()` 加载外部 spritesheet PNG。删除 4 个 warrior 程序化纹理（`warrior_idle_a/b`、`warrior_run_a/b`）。

### 4 方向动画系统

warrior 动画从无方向的 `warrior_idle` / `warrior_run` 扩展为方向化：
- `warrior_south_idle` / `warrior_south_run`（面朝下）
- `warrior_east_idle` / `warrior_east_run`（面朝右，west = flipX）
- `warrior_north_idle` / `warrior_north_run`（面朝上）
- `warrior_attack`（攻击动画，8 帧，通过 flipX 控制朝向）

idle 动画复用行走帧，以低帧率（rate=3）播放，模拟原地轻微晃动。

### 玩家朝向跟随移动方向

Player `update()` 中根据 `vx/vy` 判断移动方向，选择对应方向的动画。静止时保持上一次朝向。

### 选人界面

ClassSelectScene 的 warrior 卡片从程序化纹理改为 spritesheet south 方向帧，播放 `warrior_south_idle` 动画。

### touches

- `assets/warrior2/` → spritesheet（打包产出）
- `src/scenes/BootScene.js`（preload 加载 spritesheet；删除 warrior 程序化纹理；重写 warrior 动画注册）
- `src/entities/Player.js`（update 加方向选择；play 改方向化 key；翻滚幽灵 key 适配；_doSwing 播放 attack 动画）
- `src/scenes/ClassSelectScene.js`（warrior 卡片用新纹理）

## Capabilities

### Modified Capabilities

- warrior 视觉表现：从程序化 2 帧精灵升级为外部 32 帧 spritesheet，支持 4 方向动画 + 攻击动画
- Player 方向系统：warrior 的精灵朝向跟随移动方向（而非像其他职业一样无方向性）

## Impact

### 受影响代码

- `src/scenes/BootScene.js`：preload + warrior 纹理/动画部分
- `src/entities/Player.js`：update 方向逻辑 + play key + 翻滚幽灵 + attack 动画
- `src/scenes/ClassSelectScene.js`：warrior 卡片显示

### 新增文件

- spritesheet PNG + sidecar JSON（由 /pack-sprites 产出）

### 破坏性变更

- 无。其他职业（player/mage）的程序化纹理和动画不受影响。

### 依赖

- 无外部依赖。纯 Phaser spritesheet API。

### 不在范围内

- warrior 以外职业的 spritesheet 替换（mage/player 保持程序化）
- 方向性攻击判定（攻击范围仍由程序化 slash 碰撞体决定，attack 动画仅视觉）
- 新 warrior 的物理体/碰撞体尺寸调整（可能需要后续手感微调）
