import { PLAYER, CLASSES, TIME_STOP, ROLL } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, classId = 'player') {
    const cls = CLASSES[classId];
    const texturePrefix = cls?.textureKey ?? 'player';
    const sheet = cls?.sheet;
    super(scene, x, y, sheet ?? texturePrefix + '_idle_a');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    if (sheet) {
      this.setFrame(0);
      this.setScale(cls.sheetScale ?? 0.5);
    } else {
      this.setScale(2);
    }
    this.setDepth(10);
    this.setCollideWorldBounds(true);

    // Circle body for fair contact collisions
    const r = 8;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);

    this.classId = classId;
    this.texturePrefix = texturePrefix;
    this._hasSheet = !!sheet;
    this._facing = 'south';
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
    this.buffs = new Map();

    this.isRolling = false;
    this.lastRollAt = -Infinity;
    this._rollVelX = 0;
    this._rollVelY = 0;
    this._afterimageTimer = null;

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

    this.play(sheet ? texturePrefix + '_south_idle' : texturePrefix + '_idle');
  }

  update(time, delta) {
    if (this.dead) return;

    if (this.isRolling) {
      this.setVelocity(this._rollVelX, this._rollVelY);
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
      this.flipX = this._hasSheet ? this._facing === 'west' : world.x < this.x;
      if (this.classId !== 'warrior') {
        const barrelLen = 24;
        this.muzzle.set(
          this.weapon.x + Math.cos(angle) * barrelLen,
          this.weapon.y + Math.sin(angle) * barrelLen
        );
      }
      return;
    }

    const k = this.keys, c = this.cursors;
    let vx = 0, vy = 0;
    if (k.A.isDown || c.left.isDown) vx -= 1;
    if (k.D.isDown || c.right.isDown) vx += 1;
    if (k.W.isDown || c.up.isDown) vy -= 1;
    if (k.S.isDown || c.down.isDown) vy += 1;

    const moving = vx !== 0 || vy !== 0;
    if (moving) {
      const inv = 1 / Math.hypot(vx, vy);
      this.setVelocity(vx * inv * this.stats.moveSpeed, vy * inv * this.stats.moveSpeed);
    } else {
      this.setVelocity(0, 0);
    }

    if (this._hasSheet) {
      if (moving) {
        if (Math.abs(vy) >= Math.abs(vx)) {
          this._facing = vy > 0 ? 'south' : 'north';
        } else {
          this._facing = vx > 0 ? 'east' : 'west';
        }
      }
      const dir = this._facing;
      const flipX = dir === 'west';
      this.flipX = flipX;
      const animDir = flipX ? 'east' : dir;
      const animKey = `${this.texturePrefix}_${animDir}_${moving ? 'run' : 'idle'}`;
      if (this.anims.currentAnim?.key !== animKey) this.play(animKey);
    } else {
      if (moving) {
        if (this.anims.currentAnim?.key !== this.texturePrefix + '_run') this.play(this.texturePrefix + '_run');
      } else {
        if (this.anims.currentAnim?.key !== this.texturePrefix + '_idle') this.play(this.texturePrefix + '_idle');
      }
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
    if (!this._hasSheet) this.flipX = world.x < this.x;

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

    // Buff expiry
    const now = this.scene.time.now;
    for (const [type, buff] of this.buffs) {
      if (now >= buff.expiresAt) this.removeBuff(type);
    }

    // Magnet aura follows player
    if (this._magnetAura) {
      this._magnetAura.x = this.x;
      this._magnetAura.y = this.y;
    }
  }

  tryAttack(time) {
    if (this.dead) return;
    if (this.isRolling) return;
    if (this.classId === 'warrior') this._doSwing(time);
    else this._doShoot(time);
  }

  _doShoot(time) {
    this.scene.tryShoot?.(time);
  }

  _doSwing(time) {
    if (time - this.lastSwingAt < this.stats.attackRateMs) return;
    this.lastSwingAt = time;
    if (this.classId === 'warrior') {
      this.play('warrior_attack');
      this.flipX = Math.cos(this._aimAngle) > 0;
    }
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
    this.isRolling = false;
    if (this._afterimageTimer) {
      this._afterimageTimer.remove();
      this._afterimageTimer = null;
    }
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

  heal(amount) {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  addBuff(type, durationMs, params = {}) {
    const now = this.scene.time.now;
    if (this.buffs.has(type)) {
      this.buffs.get(type).expiresAt = now + durationMs;
      return;
    }
    const entry = { expiresAt: now + durationMs, params };
    if (type === 'damage_boost') {
      entry.originalValue = this.stats.damage;
      this.stats.damage = Math.round(this.stats.damage * params.mult);
    } else if (type === 'speed_boost') {
      entry.originalValue = this.stats.moveSpeed;
      this.stats.moveSpeed = Math.round(this.stats.moveSpeed * params.mult);
    }
    this.buffs.set(type, entry);
    this._applyBuffVisual(type, true);
  }

  removeBuff(type) {
    const buff = this.buffs.get(type);
    if (!buff) return;
    if (type === 'damage_boost') this.stats.damage = buff.originalValue;
    else if (type === 'speed_boost') this.stats.moveSpeed = buff.originalValue;
    this._applyBuffVisual(type, false);
    this.buffs.delete(type);
  }

  _applyBuffVisual(type, active) {
    if (type === 'damage_boost') {
      if (active) this.setTint(0xff4444);
      else this.clearTint();
    } else if (type === 'speed_boost') {
      if (active) {
        this._speedDustTimer = this.scene.time.addEvent({
          delay: 80, loop: true,
          callback: () => {
            if (!this.active || this.dead) return;
            const d = this.scene.add.image(this.x, this.y + 8, 'slam_dust')
              .setScale(0.3).setAlpha(0.5).setDepth(8);
            this.scene.tweens.add({ targets: d, alpha: 0, duration: 200, onComplete: () => d.destroy() });
          },
        });
      } else if (this._speedDustTimer) {
        this._speedDustTimer.remove();
        this._speedDustTimer = null;
      }
    } else if (type === 'magnet_aura') {
      if (active) {
        this._magnetAura = this.scene.add.image(this.x, this.y, 'shockwave')
          .setBlendMode(Phaser.BlendModes.ADD).setTint(0x4488ff)
          .setAlpha(0.2).setDepth(3).setScale(5);
      } else if (this._magnetAura) {
        this._magnetAura.destroy();
        this._magnetAura = null;
      }
    }
  }

  tryRoll(time) {
    if (this.dead) return false;
    if (this.isRolling) return false;
    if (time - this.lastRollAt < ROLL.cooldownMs) return false;

    const p = this.scene.input.activePointer;
    const world = p.positionToCamera(this.scene.cameras.main);
    const dx = world.x - this.x;
    const dy = world.y - this.y;
    const angle = Math.hypot(dx, dy) < 1 ? this._aimAngle : Math.atan2(dy, dx);

    this.isRolling = true;
    this.lastRollAt = time;
    this._rollVelX = Math.cos(angle) * ROLL.speed;
    this._rollVelY = Math.sin(angle) * ROLL.speed;
    this.invulnUntil = Math.max(this.invulnUntil, time + ROLL.durationMs);
    this.setTintFill(ROLL.iframeTint);

    this._spawnRollDust();

    const cls = CLASSES[this.classId];
    const sheetKey = cls?.sheet;
    const ghostKey = sheetKey ?? this.texturePrefix + '_run_a';
    this._afterimageTimer = this.scene.time.addEvent({
      delay: ROLL.afterimageIntervalMs,
      loop: true,
      callback: () => this._spawnAfterimage(ghostKey, !!sheetKey),
    });

    this.scene.time.delayedCall(ROLL.durationMs, () => this._endRoll());
    return true;
  }

  _endRoll() {
    if (this.dead || !this.isRolling) return;
    this.isRolling = false;
    if (this._afterimageTimer) {
      this._afterimageTimer.remove();
      this._afterimageTimer = null;
    }
    this.clearTint();
    this._spawnRollDust();
    this.setVelocity(0, 0);
  }

  _spawnRollDust() {
    const dust = this.scene.add.image(this.x, this.y, 'shockwave')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(ROLL.dustTint)
      .setDepth(8)
      .setScale(0.3).setAlpha(0.6);
    this.scene.tweens.add({
      targets: dust, scale: 1.0, alpha: 0,
      duration: 180, ease: 'Cubic.easeOut',
      onComplete: () => dust.destroy(),
    });
  }

  _spawnAfterimage(key, usesSheet = false) {
    if (!this.scene || this.dead) return;
    const s = this.scaleX;
    const ghost = this.scene.add.image(this.x, this.y, key)
      .setScale(s).setDepth(9).setAlpha(0.5)
      .setFlipX(this.flipX);
    if (usesSheet) ghost.setFrame(this.frame.name);
    this.scene.tweens.add({
      targets: ghost, alpha: 0, scale: s * 0.85,
      duration: ROLL.afterimageDurationMs,
      onComplete: () => ghost.destroy(),
    });
  }
}
