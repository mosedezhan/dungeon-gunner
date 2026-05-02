import { GAME } from '../config.js';

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x000000, 0.65)
      .setOrigin(0).setInteractive();

    const title = this.add.text(GAME.width / 2, GAME.height / 2 - 80, 'PAUSED', {
      fontFamily: 'Courier New', fontSize: '56px', fontStyle: 'bold',
      color: '#88eeff', stroke: '#002033', strokeThickness: 6,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: title, y: title.y - 4,
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const resume = this.add.text(GAME.width / 2, GAME.height / 2 + 10, '▶ [ESC]  Resume', {
      fontFamily: 'Courier New', fontSize: '22px', fontStyle: 'bold',
      color: '#fff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resume.on('pointerover', () => resume.setColor('#ffe14a'));
    resume.on('pointerout',  () => resume.setColor('#ffffff'));
    resume.on('pointerdown', () => this.resumeGame());

    const quit = this.add.text(GAME.width / 2, GAME.height / 2 + 60, '[Q]  Main Menu', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#aac',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quit.on('pointerover', () => quit.setColor('#ff6a6a'));
    quit.on('pointerout',  () => quit.setColor('#aaaacc'));
    quit.on('pointerdown', () => this.quitToMenu());

    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.on('keydown-P',   () => this.resumeGame());
    this.input.keyboard.on('keydown-Q',   () => this.quitToMenu());
  }

  resumeGame() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  quitToMenu() {
    this.scene.stop('GameScene');
    this.scene.stop('HUDScene');
    this.scene.stop('UpgradeScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
