import { GAME } from '../config.js';
import { randomUpgrades } from '../systems/Upgrades.js';

export class UpgradeScene extends Phaser.Scene {
  constructor() { super('UpgradeScene'); }

  create(data) {
    this.remaining = data?.remaining ?? 1;

    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x000000, 0.65)
      .setOrigin(0).setInteractive();

    this.add.text(GAME.width / 2, 80, '升级', {
      fontFamily: 'Courier New', fontSize: '48px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#2a1a00', strokeThickness: 6,
    }).setOrigin(0.5);

    this.subTitle = this.add.text(GAME.width / 2, 128, '', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ccd',
    }).setOrigin(0.5);

    this.cardLayer = this.add.container(0, 0);
    this.input.keyboard.on('keydown-ONE',   () => this.pick(0));
    this.input.keyboard.on('keydown-TWO',   () => this.pick(1));
    this.input.keyboard.on('keydown-THREE', () => this.pick(2));

    this.showCards();
  }

  showCards() {
    this.cardLayer.removeAll(true);
    const player = this.scene.get('GameScene').player;
    this.picks = randomUpgrades(3, player);
    this.subTitle.setText(`选择升级  (1 / 2 / 3)   —   剩余 ${this.remaining} 张`);

    const cw = 220, ch = 240, gap = 24;
    const totalW = cw * 3 + gap * 2;
    const startX = (GAME.width - totalW) / 2;
    const y = GAME.height / 2 + 20;

    this.picks.forEach((u, i) => {
      const x = startX + i * (cw + gap) + cw / 2;
      const isUnlock = u.id === 'time_stop';
      const baseStroke = isUnlock ? 0xff66ff : 0x55bbff;
      const bg = this.add.rectangle(0, 0, cw, ch, isUnlock ? 0x2a0a3a : 0x1a1a2a)
        .setStrokeStyle(3, baseStroke);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => bg.setStrokeStyle(4, 0xffe14a));
      bg.on('pointerout',  () => bg.setStrokeStyle(3, baseStroke));
      bg.on('pointerdown', () => this.pick(i));

      const num = this.add.text(0, -ch / 2 + 22, `[${i + 1}]`, {
        fontFamily: 'Courier New', fontSize: '16px', color: '#888',
      }).setOrigin(0.5);
      const name = this.add.text(0, -30, u.name, {
        fontFamily: 'Courier New', fontSize: '22px', fontStyle: 'bold',
        color: isUnlock ? '#ff66ff' : '#ffe14a', align: 'center', wordWrap: { width: cw - 20 },
      }).setOrigin(0.5);
      const desc = this.add.text(0, 40, u.desc, {
        fontFamily: 'Courier New', fontSize: '16px', color: '#fff',
        align: 'center', wordWrap: { width: cw - 20 },
      }).setOrigin(0.5);

      const elements = [bg, num, name, desc];
      if (u.maxLevel && u.levelStat && u.id !== 'time_stop') {
        const cur = Number(player?.stats?.[u.levelStat] ?? 0);
        const lvlText = this.add.text(0, 0, `等级 ${cur + 1} / ${u.maxLevel}`, {
          fontFamily: 'Courier New', fontSize: '14px', color: '#aaccff',
        }).setOrigin(0.5);
        elements.push(lvlText);
      }

      const card = this.add.container(x, y, elements);
      this.tweens.add({
        targets: card, y: y - 8,
        duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.cardLayer.add(card);
    });
  }

  pick(i) {
    const up = this.picks?.[i];
    if (!up) return;
    const gs = this.scene.get('GameScene');
    up.apply(gs.player);
    this.remaining -= 1;
    if (this.remaining > 0) {
      this.showCards();
    } else {
      this.scene.resume('GameScene');
      this.scene.stop();
    }
  }
}
