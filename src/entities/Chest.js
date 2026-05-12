import { DROPS } from '../config.js';

const CLOSED = 0, OPENING = 1, REWARDED = 2;

export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'chest');
    this._state = CLOSED;
    this._prompt = null;
  }

  spawn(x, y) {
    this.enableBody(true, x, y, true, true);
    this.body.setCircle(7, 1, 1);
    this.body.setImmovable(true);
    this.setDepth(4);
    this.setScale(1.5);
    this._state = CLOSED;
    this.play('chest_idle');
  }

  get state() { return this._state; }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    if (this._state !== CLOSED) return;

    const p = this.scene.player;
    if (!p || p.dead) { this._hidePrompt(); return; }

    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    if (d < DROPS.chest.interactRadius) {
      this._showPrompt();
    } else {
      this._hidePrompt();
    }
  }

  _showPrompt() {
    if (this._prompt) return;
    this._prompt = this.scene.add.text(this.x, this.y - 18, '[E]', {
      font: '12px monospace', fill: '#ffcc44',
    }).setOrigin(0.5).setDepth(30);
  }

  _hidePrompt() {
    if (!this._prompt) return;
    this._prompt.destroy();
    this._prompt = null;
  }

  open() {
    if (this._state !== CLOSED) return;
    this._state = OPENING;
    this._hidePrompt();
    this.play('chest_open_anim');
    this.once('animationcomplete', () => {
      this._state = REWARDED;
      this.scene.onChestOpen?.(this);
      this.kill();
    });
  }

  kill() {
    this._hidePrompt();
    this._state = CLOSED;
    this.disableBody(true, true);
  }
}
