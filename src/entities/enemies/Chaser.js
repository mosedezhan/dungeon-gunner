import { Enemy } from '../Enemy.js';
import { ENEMY } from '../../config.js';

export class Chaser extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'chaser_a', ENEMY.chaser);
    this.play('chaser_walk');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    const p = this.scene.player;
    if (!p || p.dead) { this.setVelocity(0, 0); return; }
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    this.setVelocity(Math.cos(a) * this.cfg.speed, Math.sin(a) * this.cfg.speed);
    this.flipX = Math.cos(a) < 0;
  }
}
