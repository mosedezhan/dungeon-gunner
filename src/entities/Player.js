import { PLAYER, CLASSES, TIME_STOP } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, classId = 'player') {
    const cls = CLASSES[classId];
    const texturePrefix = cls?.textureKey ?? 'player';
    super(scene, x, y, texturePrefix + '_idle_a');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(2);
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    // Circle body for fair contact collisions
    const r = 8;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.classId = classId;
    this.texturePrefix = texturePrefix;
    this.stats = { ...PLAYER, ...(cls?.baseStats ?? {}) };
    this.hp = this.stats.maxHp;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 5 + this.level * 5;
    this.kills = 0;
    this.invulnUntil = 0;
    this.lastShotAt = -9999;
    this.lastSwingAt = -9999;
    this.regenAccum = 0;
    this.dead = false;
    this.skillCharges = 0;
    this.timeStopReadyAt = 0;

    const weaponKey = classId === 'warrior' ? 'sword' : 'gun';
    this.weapon = scene.add.sprite(x, y, weaponKey).setOrigin(0.15, 0.5).setDepth(11).setScale(2);
    this.gun = this.weapon;
    this.muzzle = new Phaser.Math.Vector2();
    this._weaponRestOffset = 0;
    this._aimAngle = 0;
    this._swingActive = false;

    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.cursors = scene.input.keyboard.createCursorKeys();

    this.play(this.texturePrefix + '_idle');
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
      if (this.anims.currentAnim?.key !== this.texturePrefix + '_run') this.play(this.texturePrefix + '_run');
    } else {
      this.setVelocity(0, 0);
      if (this.anims.currentAnim?.key !== this.texturePrefix + '_idle') this.play(this.texturePrefix + '_idle');
    }

    // Aim
    const p = this.scene.input.activePointer;
    const world = p.positionToCamera(this.scene.cameras.main);
    const angle = Math.atan2(world.y - this.y, world.x - this.x);
    this._aimAngle = angle;

    const offsetY = 6;
    this.weapon.x = this.x - Math.cos(angle) * this._weaponRestOffset;
    this.weapon.y = this.y + offsetY - Math.sin(angle) * this._weaponRestOffset;
    if (!this._swingActive) {
      this.weapon.rotation = angle;
      this.weapon.setFlipY(Math.abs(angle) > Math.PI / 2);
    }
    this.flipX = world.x < this.x;

    this._weaponRestOffset *= Math.pow(0.0005, delta / 1000);

    if (this.classId !== 'warrior') {
      const barrelLen = 24;
      this.muzzle.set(
        this.weapon.x + Math.cos(angle) * barrelLen,
        this.weapon.y + Math.sin(angle) * barrelLen
      );
    }

    if (this.stats.regen > 0 && this.hp < this.stats.maxHp) {
      this.regenAccum += (delta / 1000) * this.stats.regen;
      if (this.regenAccum >= 1) {
        const heal = Math.floor(this.regenAccum);
        this.hp = Math.min(this.stats.maxHp, this.hp + heal);
        this.regenAccum -= heal;
      }
    }
  }

  tryAttack(time) {
    if (this.dead) return;
    if (this.classId === 'warrior') this._doSwing(time);
    else this._doShoot(time);
  }

  _doShoot(time) {
    this.scene.tryShoot?.(time);
  }

  _doSwing(time) {
    if (time - this.lastSwingAt < this.stats.attackRateMs) return;
    this.lastSwingAt = time;
    this.scene.performSwing?.(this, this._aimAngle);
  }

  canShoot(time) {
    return !this.dead && time - this.lastShotAt >= this.stats.fireRateMs;
  }

  markShot(time) {
    this.lastShotAt = time;
    this._weaponRestOffset = 4;
  }

  aimAngle() {
    return this._aimAngle;
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
      targets: [this, this.weapon],
      alpha: 0, scale: 0.5, angle: 90, duration: 600, ease: 'Cubic.easeIn',
      onComplete: () => this.scene.onPlayerDead?.(),
    });
  }

  triggerSkill() {
    if (this.dead) return false;

    // Time Stop is on a real-time cooldown, decoupled from skillCharges.
    if (this.stats.hasTimeStop) {
      const now = this.scene.time.now;
      if (now < this.timeStopReadyAt) return false;
      const fired = this.scene.useSkill?.(this);
      if (fired === false) return false;
      this.timeStopReadyAt = now + TIME_STOP.cooldownMs;
      return true;
    }

    const cost = this.stats.skillCost ?? 1;
    if (this.skillCharges < cost) return false;
    const fired = this.scene.useSkill?.(this);
    if (fired === false) return false;
    this.skillCharges -= (typeof fired === 'number' ? fired : cost);
    return true;
  }

  gainSkillCharge(n = 1) {
    const before = this.skillCharges;
    this.skillCharges = Math.min(this.stats.skillChargesMax, this.skillCharges + n);
    return this.skillCharges > before;
  }
}
