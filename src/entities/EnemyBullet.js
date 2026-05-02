export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy_bullet');
    this.damage = 10;
    this.spawnedAt = 0;
  }

  fire(x, y, angle, speed, damage) {
    this.enableBody(true, x, y, true, true);
    this._baseVx = Math.cos(angle) * speed;
    this._baseVy = Math.sin(angle) * speed;
    const sf = this.scene.slowFactor ?? 1;
    this.setVelocity(this._baseVx * sf, this._baseVy * sf);
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
    const sf = this.scene.slowFactor ?? 1;
    this.setVelocity(this._baseVx * sf, this._baseVy * sf);
    if (time - this.spawnedAt > 3000) { this.kill(); return; }
    if (this.scene.world.isOutOfBounds(this.x, this.y, 40)) this.kill();
  }
}
