import { Enemy } from '../Enemy.js';
import { ENEMY } from '../../config.js';

export class Bomber extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'bomber_a', ENEMY.bomber);
    this.play('bomber_walk');
    this.state = 'idle';
    this.windUpStartAt = 0;
    this.lastExplodeEndAt = -Infinity;
    this._leapTarget = new Phaser.Math.Vector2();
    this._activeTweens = [];
    this._trailTimer = null;
  }

  takeDamage(amount) {
    if (this.state === 'leaping' || this.state === 'jumping') return;
    super.takeDamage(amount);
  }

  preUpdate(time, delta) {
    if (this.dead) return;

    const sf = this.scene.slowFactor ?? 1;
    if (this.state === 'jumping' || this.state === 'leaping') {
      for (const t of this._activeTweens) {
        if (t && t.isPlaying()) t.timeScale = sf;
      }
      return;
    }

    super.preUpdate(time, delta);
    if (this.dead) return;

    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    const cfg = this.cfg;

    switch (this.state) {
      case 'idle':
        if (time < this.knockUntil) return;
        this._chase(p);
        if (dist <= cfg.triggerRange && time - this.lastExplodeEndAt >= cfg.cooldownMs / sf) {
          this.state = 'windup';
          this.windUpStartAt = time;
          this.setTintFill(0xff4444);
        }
        break;

      case 'windup':
        this.setVelocity(0, 0);
        // Squash: compress vertically, widen horizontally
        this.setScale(2.4, 1.6);
        // Track player direction
        this.flipX = p.x < this.x;

        if (time - this.windUpStartAt >= cfg.windUpMs / sf) {
          this._startJump(p);
        }
        break;
    }
  }

  _chase(p) {
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    this.setVelocity(Math.cos(a) * this.cfg.speed, Math.sin(a) * this.cfg.speed);
    this.flipX = Math.cos(a) < 0;
  }

  _startJump(p) {
    this.state = 'jumping';
    this.clearTint();
    this.body.enable = false;

    const cfg = this.cfg;
    const baseY = this.y;
    const jumpHeight = 25;

    // Jump up vertically
    const jumpUp = this.scene.tweens.add({
      targets: this,
      y: baseY - jumpHeight,
      scaleX: 1.6,
      scaleY: 2.4,
      duration: cfg.jumpMs * 0.5,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // At peak: lock target = player current position, then fly
        this._leapTarget.set(p.x, p.y);
        this._startFly();
      },
    });
    this._activeTweens.push(jumpUp);
  }

  _startFly() {
    this.state = 'leaping';

    const cfg = this.cfg;
    const tx = this._leapTarget.x;
    const ty = this._leapTarget.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const flyDuration = Math.max(50, (dist / cfg.leapSpeed) * 1000);

    // Start spinning
    const spin = this.scene.tweens.add({
      targets: this,
      angle: this.angle + 720,
      duration: flyDuration,
      ease: 'Linear',
    });
    this._activeTweens.push(spin);

    // Trail: spawn afterimage every 60ms
    this._trailTimer = this.scene.time.addEvent({
      delay: 60,
      callback: () => this._spawnTrail(),
      loop: true,
    });

    // Fly to target at constant speed
    const fly = this.scene.tweens.add({
      targets: this,
      x: tx,
      y: ty,
      duration: flyDuration,
      ease: 'Linear',
      onComplete: () => {
        this._stopTrail();
        this._explode();
      },
    });
    this._activeTweens.push(fly);
  }

  _spawnTrail() {
    if (this.dead || !this.active) return;
    const ghost = this.scene.add.image(this.x, this.y, 'bomber_a')
      .setScale(this.scaleX, this.scaleY)
      .setRotation(this.rotation)
      .setAlpha(0.4)
      .setDepth(4)
      .setTintFill(0xff8844);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: this.scaleX * 0.5,
      scaleY: this.scaleY * 0.5,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  _stopTrail() {
    if (this._trailTimer) {
      this._trailTimer.remove();
      this._trailTimer = null;
    }
  }

  _stopAllTweens() {
    this._stopTrail();
    this._activeTweens.forEach(t => { if (t && t.isPlaying()) t.stop(); });
    this._activeTweens = [];
  }

  _explode() {
    if (this.dead) return;
    this.dead = true;
    this._stopTrail();

    const cfg = this.cfg;

    // AOE damage
    const p = this.scene.player;
    if (p && !p.dead) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      if (d <= cfg.blastRadius) {
        p.takeDamage(cfg.blastDamage, this.scene.time.now);
      }
    }

    // Explosion shockwave ring
    const ring = this.scene.add.image(this.x, this.y, 'slam_impact')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(20)
      .setScale(0.4)
      .setAlpha(1.0);
    const targetScale = (cfg.blastRadius * 2) / 48;
    this.scene.tweens.add({
      targets: ring,
      scale: targetScale,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    // White flash
    const flash = this.scene.add.circle(this.x, this.y, 20, 0xffffff, 0.8)
      .setDepth(21)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 3,
      duration: 120,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    this.scene.cameras.main.shake(180, 0.006);
    this.destroy();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this._stopAllTweens();
    this.clearTint();
    this.body.enable = false;
    this.scene.handleEnemyDeath?.(this);
    this.scene.tweens.add({
      targets: this,
      scale: 0.2, alpha: 0, angle: Phaser.Math.Between(-120, 120),
      duration: 260, ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
