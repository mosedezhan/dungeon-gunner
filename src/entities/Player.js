import { PLAYER } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle_a');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(2);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    // Circle body for fair contact collisions
    const r = 8;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.stats = { ...PLAYER };
    this.hp = this.stats.maxHp;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 5 + this.level * 5;
    this.kills = 0;
    this.invulnUntil = 0;
    this.lastShotAt = -9999;
    this.regenAccum = 0;
    this.dead = false;

    this.gun = scene.add.sprite(x, y, 'gun').setOrigin(0.15, 0.5).setDepth(11).setScale(2);
    this.muzzle = new Phaser.Math.Vector2();
    this._gunRestOffset = 0;

    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.cursors = scene.input.keyboard.createCursorKeys();

    this.play('player_idle');
  }

  update(time, delta) {
    if (this.dead) return;

    const k = this.keys, c = this.cursors;
    let vx = 0, vy = 0;
    if (k.A.isDown || c.left.isDown)  vx -= 1;
    if (k.D.isDown || c.right.isDown) vx += 1;
    if (k.W.isDown || c.up.isDown)    vy -= 1;
    if (k.S.isDown || c.down.isDown)  vy += 1;

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const inv = 1 / Math.hypot(vx, vy);
      this.setVelocity(vx * inv * this.stats.moveSpeed, vy * inv * this.stats.moveSpeed);
      if (this.anims.currentAnim?.key !== 'player_run') this.play('player_run');
    } else {
      this.setVelocity(0, 0);
      if (this.anims.currentAnim?.key !== 'player_idle') this.play('player_idle');
    }

    // Aim
    const p = this.scene.input.activePointer;
    const world = p.positionToCamera(this.scene.cameras.main);
    const angle = Math.atan2(world.y - this.y, world.x - this.x);

    const gunOffsetY = 6;
    this.gun.x = this.x - Math.cos(angle) * this._gunRestOffset;
    this.gun.y = this.y + gunOffsetY - Math.sin(angle) * this._gunRestOffset;
    this.gun.rotation = angle;
    // Flip gun vertically when aiming left so grip stays on bottom
    this.gun.setFlipY(Math.abs(angle) > Math.PI / 2);
    this.flipX = world.x < this.x;

    // Gun recoil recover
    this._gunRestOffset *= Math.pow(0.0005, delta / 1000);

    const barrelLen = 24;
    this.muzzle.set(
      this.gun.x + Math.cos(angle) * barrelLen,
      this.gun.y + Math.sin(angle) * barrelLen
    );

    // Regen
    if (this.stats.regen > 0 && this.hp < this.stats.maxHp) {
      this.regenAccum += (delta / 1000) * this.stats.regen;
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.hp = Math.min(this.stats.maxHp, this.hp + heal);
        this.regenAccum -= heal;
      }
    }
  }

  canShoot(time) {
    return !this.dead && time - this.lastShotAt >= this.stats.fireRateMs;
  }

  markShot(time) {
    this.lastShotAt = time;
    this._gunRestOffset = 4;
  }

  aimAngle() {
    return this.gun.rotation;
  }

  takeDamage(amount, time) {
    if (this.dead || time < this.invulnUntil) return false;
    this.hp -= amount;
    this.invulnUntil = time + this.stats.invulnMs;
    this.scene.cameras.main.shake(120, 0.006);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => { if (!this.dead) this.clearTint(); });
    if (this.hp <= 0) this.die();
    return true;
  }

  addXP(amount) {
    this.xp += amount;
    const leveled = [];
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = 5 + this.level * 5;
      leveled.push(this.level);
    }
    return leveled;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.scene.tweens.add({
      targets: [this, this.gun],
      alpha: 0, scale: 0.5, angle: 90, duration: 600, ease: 'Cubic.easeIn',
      onComplete: () => this.scene.onPlayerDead?.(),
    });
  }
}
