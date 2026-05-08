## 方案概述

将 `assets/warrior2/` 的 32 帧外部 PNG 素材打包为 Phaser spritesheet，替换 warrior 职业的程序化纹理，引入 4 方向动画和攻击动画。

## 打包方案

### Spritesheet 布局

使用 `/pack-sprites` 将 warrior2 打包为一张 spritesheet。帧排列：

```
行 0 (south):  frame 0-7   → south 方向行走
行 1 (east):   frame 8-15  → east 方向行走
行 2 (north):  frame 16-23 → north 方向行走
行 3 (attack): frame 24-31 → 攻击动画（朝西）
```

单帧尺寸：128 × 131 px。总图尺寸：1024 × 524 px。

### 加载方式

BootScene `preload()` 中新增：
```js
this.load.spritesheet('warrior_sheet', 'assets/warrior2/warrior2_sheet.png', {
  frameWidth: 128,
  frameHeight: 131,
});
```

删除 4 行 `makeTex(this, 'warrior_...', ...)` 程序化纹理生成。

## 动画设计

### 帧 → 动画映射

spritesheet 的帧索引：
- south 行：帧 0-7
- east 行：帧 8-15
- north 行：帧 16-23
- attack 行：帧 24-31

### 动画注册

```js
// idle：复用行走帧，低帧率
this.anims.create({ key: 'warrior_south_idle', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 0, end: 7 }), frameRate: 3, repeat: -1 });
this.anims.create({ key: 'warrior_east_idle',  frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 8, end: 15 }), frameRate: 3, repeat: -1 });
this.anims.create({ key: 'warrior_north_idle', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 16, end: 23 }), frameRate: 3, repeat: -1 });

// run：正常帧率
this.anims.create({ key: 'warrior_south_run', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
this.anims.create({ key: 'warrior_east_run',  frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 8, end: 15 }), frameRate: 10, repeat: -1 });
this.anims.create({ key: 'warrior_north_run', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 16, end: 23 }), frameRate: 10, repeat: -1 });

// attack：单向（朝西），flipX 得朝东
this.anims.create({ key: 'warrior_attack', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 24, end: 31 }), frameRate: 12, repeat: 0 });
```

west 方向不单独注册动画，复用 east 动画 + `flipX = true`。

### 方向判定逻辑

Player `update()` 中新增方向判定（仅 warrior）：

```js
if (this.classId === 'warrior') {
  if (moving) {
    // 优先级：垂直分量主导时取上下，否则取左右
    if (Math.abs(vy) >= Math.abs(vx)) {
      this._facing = vy > 0 ? 'south' : 'north';
    } else {
      this._facing = vx > 0 ? 'east' : 'west';
    }
  }
  const dir = this._facing || 'south';
  const flipX = dir === 'west';
  this.flipX = flipX;
  const animDir = flipX ? 'east' : dir;
  const animKey = `${this.texturePrefix}_${animDir}_${moving ? 'run' : 'idle'}`;
  if (this.anims.currentAnim?.key !== animKey) this.play(animKey);
}
```

`_facing` 初始值 `'south'`，静止时保持最后一次朝向。

### 攻击动画集成

`_doSwing()` 中在开始挥砍时播放 attack 动画：

```js
_doSwing(time) {
  if (time - this.lastSwingAt < this.stats.attackRateMs) return;
  this.lastSwingAt = time;
  if (this.classId === 'warrior') {
    this.play('warrior_attack');
    // attack 帧朝西，朝东攻击时 flipX
    const aimAngle = this._aimAngle;
    this.flipX = Math.cos(aimAngle) > 0; // 鼠标在右边→朝东→flipX
  }
  this.scene.performSwing?.(this, this._aimAngle);
}
```

attack 动画 `repeat: 0`（播完自动停在最后一帧）。下次 `update()` 时方向逻辑会自动切回 idle/run。

### 翻滚幽灵

翻滚时需要取当前方向的帧作为幽灵。当前代码用 `texturePrefix + '_run_a'`（固定纹理 key）。改为：

```js
// 对于 warrior，用 spritesheet 的帧
if (this.classId === 'warrior') {
  // 取当前方向行走序列的第一帧（sprite.frame）
  ghostKey = 'warrior_sheet'; // 用 spritesheet key
  // _spawnAfterimage 中手动 setFrame(this.frame.name)
}
```

更简单的方案：幽灵直接克隆 `this.texture` + `this.frame`，而非通过固定 key。

## 尺寸与显示

当前 Player 构造中 `setScale(2)` 将 ~24×32 精灵放大到 ~48×64。warrior2 的 128×131 精灵需要更小的 scale：

```js
// warrior 用外部 spritesheet，需要缩放到合理的游戏内尺寸
// 目标：与当前 ~48×64 的视觉大小接近
// 128×131 × scale = ~48×64 → scale ≈ 0.5
```

具体 scale 值需要浏览器中目测调整。建议初始设 `setScale(0.5)`，同时调整物理碰撞体 `body.setSize()` / `body.setCircle()` 使之匹配。

## ClassSelectScene 适配

当前 warrior 卡片用 `cls.textureKey + '_idle_a'` 加纹理 + `sprite.play(animKey)` 播放。需改为：

```js
// warrior 用 spritesheet
if (cls.textureKey === 'warrior') {
  sprite = this.add.sprite(0, -10, 'warrior_sheet', 0).setScale(2); // south 帧 0
  sprite.play('warrior_south_idle');
} else {
  // 原逻辑
}
```

注意：ClassSelectScene 在 BootScene 之后运行，`warrior_sheet` 纹理已加载可用。

## 不做的事

- 不改 mage/player 的程序化纹理
- 不改物理碰撞逻辑（scale 调整可能需要微调碰撞体，但不改判定行为）
- 不加方向性攻击判定（attack 动画纯视觉）
- 不改 CLASSES 配置结构（方向逻辑硬编码在 Player 中）
