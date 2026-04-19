export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, cfg) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(2);
    this.setDepth(5);
    this.cfg = cfg;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.dead = false;
    this.body.setCircle(cfg.radius, this.width / 2 - cfg.radius, this.height / 2 - cfg.radius);
    this.body.setDamping(true).setDrag(0.0005);
    this.contactCooldown = 0;
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => { if (!this.dead && this.active) this.clearTint(); });
    if (this.hp <= 0) this.die();
  }

  knockback(fromX, fromY, power = 180) {
    const a = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(a) * power, Math.sin(a) * power);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
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
