import { Enemy } from '../Enemy.js';
import { ENEMY, WORLD } from '../../config.js';

export class Mimic extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'mimic_chest_a', ENEMY.mimic);
    this._spawnPoint = { x, y };
    this._state = 'wandering';
    this._bornAt = scene.time.now;
    this._fleeStartedAt = 0;

    this._wanderTarget = null;
    this._wanderPauseUntil = 0;

    this._zigzagOffset = 0;
    this._zigzagFlipAt = 0;
    this._vanished = false;

    this.play('mimic_wander');
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.dead && this._state === 'wandering') {
      this._enterFleeing(this.scene.time.now);
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead || this._vanished) return;

    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }

    const elapsed = time - this._bornAt;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);

    if (this._state === 'wandering') {
      if (elapsed >= this.cfg.wanderTimeMs) { this._vanish(); return; }
      if (dist <= this.cfg.triggerRange) { this._enterFleeing(time); return; }
      this._doWander(time);
    } else if (this._state === 'fleeing') {
      const fleeElapsed = time - this._fleeStartedAt;
      if (fleeElapsed >= this.cfg.fleeTimeMs) { this._vanish(); return; }
      this._doFlee(time, delta, p, fleeElapsed);
    }
  }

  _doWander(time) {
    if (time < this._wanderPauseUntil) {
      this.setVelocity(0, 0);
      return;
    }

    if (!this._wanderTarget ||
        Phaser.Math.Distance.Between(this.x, this.y, this._wanderTarget.x, this._wanderTarget.y) < 3) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * this.cfg.wanderRadius;
      this._wanderTarget = {
        x: Phaser.Math.Clamp(this._spawnPoint.x + Math.cos(angle) * r, 10, WORLD.width - 10),
        y: Phaser.Math.Clamp(this._spawnPoint.y + Math.sin(angle) * r, 10, WORLD.height - 10),
      };
      this._wanderPauseUntil = time + Phaser.Math.Between(this.cfg.wanderPauseMinMs, this.cfg.wanderPauseMaxMs);
      this.setVelocity(0, 0);
      return;
    }

    const a = Math.atan2(this._wanderTarget.y - this.y, this._wanderTarget.x - this.x);
    this.setVelocity(Math.cos(a) * this.cfg.wanderSpeed, Math.sin(a) * this.cfg.wanderSpeed);
  }

  _enterFleeing(time) {
    this._state = 'fleeing';
    this._fleeStartedAt = time;
    this._zigzagOffset = 0;
    this._zigzagFlipAt = time + this.cfg.zigzagIntervalMs;
    this.play('mimic_flee');
  }

  _doFlee(time, delta, player, fleeElapsed) {
    const fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);

    if (time >= this._zigzagFlipAt) {
      this._zigzagOffset = this._zigzagOffset === 0 ? this.cfg.zigzagSpread : -this._zigzagOffset;
      this._zigzagFlipAt = time + this.cfg.zigzagIntervalMs;
    }

    const angle = fleeAngle + this._zigzagOffset;
    const progress = fleeElapsed / this.cfg.fleeTimeMs;
    const speed = this.cfg.speed + this.cfg.panicAccel * progress * progress;

    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;

    const nx = this.x + vx * (delta / 1000);
    const ny = this.y + vy * (delta / 1000);
    const pad = 30;
    if (nx < pad || nx > WORLD.width - pad) vx = -vx * 0.5;
    if (ny < pad || ny > WORLD.height - pad) vy = -vy * 0.5;

    this.setVelocity(vx, vy);
    this.flipX = vx < 0;
  }

  _vanish() {
    if (this._vanished) return;
    this._vanished = true;
    this.body.enable = false;
    this.setVelocity(0, 0);

    for (let i = 0; i < 4; i++) {
      const chip = this.scene.add.image(this.x, this.y, 'mimic_chest_a')
        .setScale(1.5).setDepth(6).setTint(0x8a6a14);
      this.scene.tweens.add({
        targets: chip,
        x: this.x + Phaser.Math.Between(-30, 30),
        y: this.y + Phaser.Math.Between(-30, 30),
        alpha: 0, scale: 0.3, angle: Phaser.Math.Between(-90, 90),
        duration: 300, ease: 'Cubic.easeOut',
        onComplete: () => chip.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0, scale: 0.5, duration: 300, ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
