export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_bullet');
    this.damage = 10;
    this.spawnedAt = 0;
  }

  fire(x, y, angle, speed, damage) {
    this.enableBody(true, x, y, true, true);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setRotation(angle);
    this.damage = damage;
    this.spawnedAt = this.scene.time.now;
    this.body.setCircle(3, 1, 1);
    this.setDepth(9);
  }

  kill() { this.disableBody(true, true); }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (time - this.spawnedAt > 3000) { this.kill(); return; }
    const cam = this.scene.cameras.main;
    const m = 40;
    if (this.x < cam.worldView.x - m || this.x > cam.worldView.right + m ||
        this.y < cam.worldView.y - m || this.y > cam.worldView.bottom + m) this.kill();
  }
}
