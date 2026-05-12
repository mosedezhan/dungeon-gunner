import { XP } from '../config.js';

export class SiphonOrb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'xp_orb_siphon');
    this.value = 1;
  }

  spawn(x, y, value) {
    this.enableBody(true, x, y, true, true);
    this.value = value;
    this.body.setCircle(5, 0, 0);
    this.setDepth(4);
    this.setScale(1);
    this.pulseTween = this.scene.tweens.add({
      targets: this, scale: 1.3, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-40, 40));
    this.scene.time.delayedCall(200, () => { if (this.active) this.setVelocity(0, 0); });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const p = this.scene.player;
    if (!p || p.dead) return;
    const magnetBuff = p.buffs.get('magnet_aura');
    const radius = magnetBuff ? magnetBuff.params.radius : XP.pickupRadius;
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    if (d < radius) {
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      const s = XP.magnetSpeed * (1 + (1 - d / radius));
      this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
    }
  }

  kill() {
    if (this.pulseTween) { this.pulseTween.stop(); this.pulseTween = null; }
    this.setScale(1);
    this.disableBody(true, true);
  }
}
