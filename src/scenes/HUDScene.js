import { GAME } from '../config.js';

export class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    this.gameScene = this.scene.get('GameScene');

    // XP bar (top)
    const xpW = 440;
    this.add.rectangle(GAME.width / 2, 22, xpW + 4, 14, 0x000000, 0.55)
      .setOrigin(0.5).setStrokeStyle(2, 0x445566);
    this.xpFill = this.add.rectangle(GAME.width / 2 - xpW / 2, 22, 0, 10, 0x55bbff).setOrigin(0, 0.5);
    this.xpText = this.add.text(GAME.width / 2, 22, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Wave label
    this.waveText = this.add.text(12, 10, '', {
      fontFamily: 'Courier New', fontSize: '18px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#000', strokeThickness: 3,
    });

    // Stats (top-right)
    this.statsText = this.add.text(GAME.width - 12, 10, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#cdd', align: 'right', lineSpacing: 4,
    }).setOrigin(1, 0);

    // HP bar (bottom-left)
    const hpW = 240;
    this.add.rectangle(20, GAME.height - 24, hpW + 4, 18, 0x000000, 0.55)
      .setOrigin(0, 0.5).setStrokeStyle(2, 0x663344);
    this.hpFill = this.add.rectangle(22, GAME.height - 24, hpW, 14, 0xdd3a3a).setOrigin(0, 0.5);
    this.hpText = this.add.text(22 + hpW / 2, GAME.height - 24, '', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#fff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Banner text for wave transitions
    this.banner = this.add.text(GAME.width / 2, 110, '', {
      fontFamily: 'Courier New', fontSize: '38px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
  }

  showBanner(text) {
    if (!this.banner) return; // create() hasn't run yet
    this.banner.setText(text).setAlpha(1).setScale(1.4);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 0, scale: 1, duration: 1400, ease: 'Cubic.easeOut' });
  }

  update() {
    const gs = this.gameScene;
    if (!gs || !gs.player || !gs.waveManager) return;
    if (!this.hpFill) return;
    const p = gs.player;

    const hpFrac = Math.max(0, p.hp) / p.stats.maxHp;
    this.hpFill.width = 240 * hpFrac;
    this.hpText.setText(`HP ${Math.max(0, Math.round(p.hp))} / ${p.stats.maxHp}`);

    const xpFrac = Math.min(1, p.xp / p.xpToNext);
    this.xpFill.width = 440 * xpFrac;
    this.xpText.setText(`Lv ${p.level}   ${p.xp} / ${p.xpToNext} XP`);

    const w = gs.waveManager;
    const secLeft = Math.ceil(w.timeLeftMs / 1000);
    this.waveText.setText(`WAVE ${w.wave}   ${secLeft}s`);

    const dmg = Math.round(p.stats.damage);
    const rate = (1000 / p.stats.fireRateMs).toFixed(1);
    this.statsText.setText(`kills ${gs.kills}\ndmg ${dmg}   ${rate}/s\npierce ${p.stats.pierce}   x${p.stats.multishot}`);
  }
}
