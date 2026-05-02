import { Enemy } from '../Enemy.js';
import { ENEMY } from '../../config.js';

export class Giant extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'giant_a', ENEMY.giant);
    this.setScale(3);
    const r = ENEMY.giant.radius;
    this.body.setCircle(r, this.width / 2 - r, this.height / 2 - r);
    this.play('giant_walk');
    this.slamState = 'idle';
    this.slamStartAt = 0;
    this.lastSlamEndAt = -Infinity;
    this._warningCircle = null;
  }

  knockback(fromX, fromY, power, durationMs) {
    if (this.slamState !== 'idle') return;
    super.knockback(fromX, fromY, power, durationMs);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    if (this.slamState === 'idle' && time < this.knockUntil) return;

    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    const cfg = this.cfg;
    const sf = this.scene.slowFactor ?? 1;

    switch (this.slamState) {
      case 'idle':
        this._chase(p);
        if (dist <= cfg.slamTriggerRange && time - this.lastSlamEndAt >= cfg.slamCooldownMs / sf) {
          this.slamState = 'windup';
          this.slamStartAt = time;
          this._createWarningCircle();
        }
        break;

      case 'windup':
        this.setVelocity(0, 0);
        this._updateWarningCircle();
        if (time - this.slamStartAt >= cfg.windUpMs / sf) {
          this.slamState = 'swing';
          this.slamStartAt = time;
          this._destroyWarningCircle();
        }
        break;

      case 'swing':
        this.setVelocity(0, 0);
        if (time - this.slamStartAt >= cfg.swingMs / sf) {
          this.slamState = 'impact';
          this.slamStartAt = time;
          this._doImpact(time);
        }
        break;

      case 'impact':
        this.setVelocity(0, 0);
        if (time - this.slamStartAt >= cfg.impactMs / sf) {
          this.slamState = 'recovery';
          this.slamStartAt = time;
        }
        break;

      case 'recovery':
        this.setVelocity(0, 0);
        if (time - this.slamStartAt >= cfg.recoveryMs / sf) {
          this.slamState = 'idle';
          this.lastSlamEndAt = time;
        }
        break;
    }
  }

  _chase(p) {
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    this.setVelocity(Math.cos(a) * this.cfg.speed, Math.sin(a) * this.cfg.speed);
    this.flipX = Math.cos(a) < 0;
  }

  _createWarningCircle() {
    if (this._warningCircle) return;
    const g = this.scene.add.graphics().setDepth(4);
    this._warningCircle = g;
    this._warningPulse = 0;
    this._updateWarningCircle();
  }

  _updateWarningCircle() {
    if (!this._warningCircle) return;
    const g = this._warningCircle;
    g.clear();
    this._warningPulse += 0.08;
    const alpha = 0.3 + Math.sin(this._warningPulse) * 0.2;
    g.lineStyle(2, 0xff3333, alpha);
    g.strokeCircle(this.x, this.y, this.cfg.slamRadius);
    g.fillStyle(0xff2222, alpha * 0.12);
    g.fillCircle(this.x, this.y, this.cfg.slamRadius);
    g.lineStyle(1, 0xff6644, alpha * 0.6);
    g.strokeCircle(this.x, this.y, this.cfg.slamRadius * 0.7);
  }

  _destroyWarningCircle() {
    if (this._warningCircle) {
      this._warningCircle.destroy();
      this._warningCircle = null;
    }
  }

  _doImpact(time) {
    const p = this.scene.player;
    if (p && !p.dead) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      if (d <= this.cfg.slamRadius) {
        p.takeDamage(this.cfg.slamDamage, time);
      }
    }

    // Shockwave ring VFX
    const ring = this.scene.add.image(this.x, this.y, 'slam_impact')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(20)
      .setScale(0.3)
      .setAlpha(0.9);
    const targetScale = (this.cfg.slamRadius * 2) / 48;
    this.scene.tweens.add({
      targets: ring,
      scale: targetScale,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Dust particles scattered within slam radius
    const dustCount = 8;
    for (let i = 0; i < dustCount; i++) {
      const angle = (i / dustCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const dist = this.cfg.slamRadius * (0.3 + Math.random() * 0.6);
      const dx = this.x + Math.cos(angle) * dist;
      const dy = this.y + Math.sin(angle) * dist;
      const dust = this.scene.add.image(dx, dy, 'slam_dust')
        .setDepth(3)
        .setScale(0.8 + Math.random() * 1.2)
        .setAlpha(0.6 + Math.random() * 0.3);
      this.scene.tweens.add({
        targets: dust,
        alpha: 0,
        scaleX: dust.scaleX * 2,
        scaleY: dust.scaleY * 2,
        y: dy - 15 - Math.random() * 25,
        duration: 350 + Math.random() * 250,
        ease: 'Cubic.easeOut',
        onComplete: () => dust.destroy(),
      });
    }

    this.scene.cameras.main.shake(250, 0.006);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this._destroyWarningCircle();
    this.body.enable = false;
    this.scene.handleEnemyDeath?.(this);
    this.scene.cameras.main.shake(250, 0.007);
    this.scene.tweens.add({
      targets: this,
      scale: 0.3, alpha: 0, angle: Phaser.Math.Between(-180, 180),
      duration: 500, ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
