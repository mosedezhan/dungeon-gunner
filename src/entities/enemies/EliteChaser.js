import { Chaser } from './Chaser.js';
import { ENEMY } from '../../config.js';

export class EliteChaser extends Chaser {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.cfg = ENEMY.elite_chaser;
    this.maxHp = this.cfg.hp;
    this.hp = this.cfg.hp;
    this.body.setCircle(this.cfg.radius, this.width / 2 - this.cfg.radius, this.height / 2 - this.cfg.radius);
    this.setScale(2.4);
    this.setTintFill(0x222222);
    this.berserk = false;
    this._berserkPulse = null;
    this._smokeTimer = null;

    this._leftEye = scene.add.image(-3, -4, 'elite_eye')
      .setTintFill(0xff0000).setDepth(6);
    this._rightEye = scene.add.image(3, -4, 'elite_eye')
      .setTintFill(0xff0000).setDepth(6);

    this._startSmoke();
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.berserk && this.hp > 0 && this.hp <= this.maxHp * this.cfg.berserkThreshold) {
      this.berserk = true;
      this._startBerserkVFX();
    }
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;

    this._leftEye.setPosition(this.x - 3 * this.scaleX, this.y - 4 * this.scaleY);
    this._rightEye.setPosition(this.x + 3 * this.scaleX, this.y - 4 * this.scaleY);
    this._leftEye.setScale(this.scaleX / 2.4);
    this._rightEye.setScale(this.scaleX / 2.4);

    if (this.berserk && time >= this.knockUntil) {
      this.setTintFill(this.cfg.berserkTint);
      const p = this.scene.player;
      if (p && !p.dead) {
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        this.setVelocity(Math.cos(a) * this.cfg.berserkSpeed, Math.sin(a) * this.cfg.berserkSpeed);
      }
    }
  }

  _startBerserkVFX() {
    this._berserkPulse = this.scene.tweens.add({
      targets: this,
      scaleX: 2.6, scaleY: 2.6,
      duration: 150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
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
    const ox = Phaser.Math.Between(-4, 4);
    const smoke = this.scene.add.image(this.x + ox, this.y - 6 * this.scaleY, 'elite_smoke')
      .setAlpha(0.45)
      .setDepth(4)
      .setScale(0.6);
    this.scene.tweens.add({
      targets: smoke,
      y: smoke.y - 20,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 300,
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
    if (this._berserkPulse) { this._berserkPulse.stop(); this._berserkPulse = null; }
    if (this._smokeTimer) { this._smokeTimer.remove(); this._smokeTimer = null; }
    if (this._leftEye) { this._leftEye.destroy(); this._leftEye = null; }
    if (this._rightEye) { this._rightEye.destroy(); this._rightEye = null; }
  }
}
