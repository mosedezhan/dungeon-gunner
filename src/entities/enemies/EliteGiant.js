import { Giant } from './Giant.js';
import { ENEMY } from '../../config.js';

export class EliteGiant extends Giant {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.cfg = ENEMY.elite_giant;
    this.maxHp = this.cfg.hp;
    this.hp = this.cfg.hp;
    this.body.setCircle(this.cfg.radius, this.width / 2 - this.cfg.radius, this.height / 2 - this.cfg.radius);
    this.setScale(3.6);
    this.setTintFill(0x222222);

    this._dashing = false;
    this._dashStartAt = 0;
    this._dashAngle = 0;
    this._lastDashEndAt = -Infinity;
    this._dashTrailTimer = null;

    this._leftEye = scene.add.image(-4, -6, 'elite_eye')
      .setTintFill(0xff0000).setDepth(6);
    this._rightEye = scene.add.image(4, -6, 'elite_eye')
      .setTintFill(0xff0000).setDepth(6);

    this._startSmoke();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;

    // Update eye positions
    this._leftEye.setPosition(this.x - 4 * (this.scaleX / 3.6), this.y - 6 * (this.scaleY / 3.6));
    this._rightEye.setPosition(this.x + 4 * (this.scaleX / 3.6), this.y - 6 * (this.scaleY / 3.6));
    this._leftEye.setScale(this.scaleX / 3.6);
    this._rightEye.setScale(this.scaleX / 3.6);

    const sf = this.scene.slowFactor ?? 1;

    // Handle dash state — track player each frame
    if (this._dashing) {
      const p = this.scene.player;
      if (p && !p.dead) {
        this._dashAngle = Math.atan2(p.y - this.y, p.x - this.x);
      }
      this.setVelocity(
        Math.cos(this._dashAngle) * this.cfg.dashSpeed,
        Math.sin(this._dashAngle) * this.cfg.dashSpeed,
      );
      if (time - this._dashStartAt >= this.cfg.dashDurationMs / sf) {
        this._dashing = false;
        this.setVelocity(0, 0);
        this._lastDashEndAt = time;
        this._stopDashTrail();
        // Transition to windup
        this.slamState = 'windup';
        this.slamStartAt = time;
        this._createWarningCircle();
      }
      return;
    }

    // Insert dash trigger into idle state
    if (this.slamState === 'idle' && time >= this.knockUntil) {
      const p = this.scene.player;
      if (p && !p.dead) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
        if (dist <= this.cfg.dashTriggerRange && dist > this.cfg.slamTriggerRange
            && time - this._lastDashEndAt >= this.cfg.dashCooldownMs / sf) {
          this._startDash(time, p);
        }
      }
    }
  }

  _startDash(time, player) {
    this._dashing = true;
    this._dashStartAt = time;
    this._dashAngle = Math.atan2(player.y - this.y, player.x - this.x);
    this.slamState = 'idle'; // prevent base class windup trigger during dash
    this._destroyWarningCircle();
    this._startDashTrail();
  }

  _startDashTrail() {
    this._dashTrailTimer = this.scene.time.addEvent({
      delay: 60,
      callback: () => this._spawnDashDust(),
      loop: true,
    });
  }

  _stopDashTrail() {
    if (this._dashTrailTimer) {
      this._dashTrailTimer.remove();
      this._dashTrailTimer = null;
    }
  }

  _spawnDashDust() {
    if (this.dead || !this.active) return;
    // Spawn 2-3 dust puffs behind and around the elite giant
    const count = Phaser.Math.Between(2, 3);
    for (let i = 0; i < count; i++) {
      const ox = Phaser.Math.Between(-12, 12);
      const oy = Phaser.Math.Between(-4, 8);
      const dust = this.scene.add.image(this.x + ox, this.y + oy, 'elite_smoke')
        .setTint(0x8a7a6a)
        .setAlpha(0.6)
        .setDepth(2)
        .setScale(0.8 + Math.random() * 0.6);
      this.scene.tweens.add({
        targets: dust,
        y: dust.y - 15 - Math.random() * 20,
        alpha: 0,
        scaleX: dust.scaleX * 1.8,
        scaleY: dust.scaleY * 1.8,
        duration: 400 + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }

  _startSmoke() {
    this._smokeTimer = this.scene.time.addEvent({
      delay: 200,
      callback: () => this._spawnSmoke(),
      loop: true,
    });
  }

  _spawnSmoke() {
    if (this.dead || !this.active) return;
    const ox = Phaser.Math.Between(-5, 5);
    const smoke = this.scene.add.image(this.x + ox, this.y - 8 * (this.scaleY / 3.6), 'elite_smoke')
      .setAlpha(0.45)
      .setDepth(4)
      .setScale(0.7);
    this.scene.tweens.add({
      targets: smoke,
      y: smoke.y - 25,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => smoke.destroy(),
    });
  }

  die() {
    if (this.dead) return;
    this._stopVFX();
    super.die();
  }

  _stopVFX() {
    this._stopDashTrail();
    if (this._smokeTimer) { this._smokeTimer.remove(); this._smokeTimer = null; }
    if (this._leftEye) { this._leftEye.destroy(); this._leftEye = null; }
    if (this._rightEye) { this._rightEye.destroy(); this._rightEye = null; }
  }
}
