import { Enemy } from '../Enemy.js';
import { ENEMY } from '../../config.js';

export class Shooter extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'shooter_a', ENEMY.shooter);
    this.play('shooter_walk');
    this.lastShotAt = scene.time.now + Phaser.Math.Between(300, 1200);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    const pref = this.cfg.preferredRange;
    let move = 0;
    if (dist > pref + 30) move = 1;
    else if (dist < pref - 40) move = -0.5;
    this.setVelocity(Math.cos(a) * this.cfg.speed * move, Math.sin(a) * this.cfg.speed * move);
    this.flipX = Math.cos(a) < 0;

    if (time - this.lastShotAt >= this.cfg.fireRateMs && dist < pref + 120) {
      this.lastShotAt = time;
      const b = this.scene.enemyBullets.get(this.x, this.y);
      if (b) b.fire(this.x, this.y, a, this.cfg.bulletSpeed, this.cfg.bulletDamage);
      this.scene.tweens.add({
        targets: this, scale: { from: 2.3, to: 2 }, duration: 160, ease: 'Cubic.easeOut',
      });
    }
  }
}
