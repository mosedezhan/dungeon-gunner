import { BULLET } from '../config.js';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    this.damage = 10;
    this.pierceLeft = 0;
    this.spawnedAt = 0;
    this.hitSet = new Set();
  }

  fire(x, y, angle, speed, damage, pierce) {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setPosition(x, y);
    this.setRotation(angle);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.body.setCircle(BULLET.radius, 4 - BULLET.radius, 4 - BULLET.radius);
    this.damage = damage;
    this.pierceLeft = pierce;
    this.hitSet.clear();
    this.spawnedAt = this.scene.time.now;
    this.setDepth(9);
  }

  onHit(enemy) {
    if (this.hitSet.has(enemy)) return false;
    this.hitSet.add(enemy);
    if (this.pierceLeft <= 0) {
      this.kill();
      return true;
    }
    this.pierceLeft--;
    return true;
  }

  kill() {
    this.disableBody(true, true);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (time - this.spawnedAt > BULLET.lifetimeMs) { this.kill(); return; }
    const cam = this.scene.cameras.main;
    const m = 40;
    if (this.x < cam.worldView.x - m || this.x > cam.worldView.right + m ||
        this.y < cam.worldView.y - m || this.y > cam.worldView.bottom + m) {
      this.kill();
    }
  }
}
