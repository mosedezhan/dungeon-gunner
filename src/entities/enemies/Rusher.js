import { Enemy } from '../Enemy.js';
import { ENEMY } from '../../config.js';

export class Rusher extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'rusher_a', ENEMY.rusher);
    this.play('rusher_walk');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    // Slight jitter for menace
    const jit = Math.sin(time / 120 + this.x) * 0.25;
    this.setVelocity(Math.cos(a + jit) * this.cfg.speed, Math.sin(a + jit) * this.cfg.speed);
    this.flipX = Math.cos(a) < 0;
  }
}
