import { SKILL } from '../config.js';

export class SkillOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'skill_orb');
  }

  spawn(x, y) {
    this.enableBody(true, x, y, true, true);
    this.body.setCircle(5, 0, 0);
    this.setDepth(4);
    this.setScale(1);
    this.setAlpha(1);
    this.pulseTween = this.scene.tweens.add({
      targets: this, scale: 1.25, duration: 480, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-60, 60));
    this.scene.time.delayedCall(300, () => { if (this.active) this.setVelocity(0, 0); });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const p = this.scene.player;
    if (!p || p.dead) return;
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    if (d < SKILL.pickupRadius) {
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      const s = SKILL.magnetSpeed * (1 + (1 - d / SKILL.pickupRadius));
      this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
    }
  }

  kill() {
    if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }
    this.setScale(1);
    this.disableBody(true, true);
  }
}
