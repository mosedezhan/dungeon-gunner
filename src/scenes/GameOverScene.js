import { GAME } from '../config.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data) {
    this.add.rectangle(0, 0, GAME.width, GAME.height, 0x000000, 0.82).setOrigin(0);

    const title = this.add.text(GAME.width / 2, GAME.height / 2 - 140, '你已死亡', {
      fontFamily: 'Courier New', fontSize: '64px', fontStyle: 'bold',
      color: '#ff4466', stroke: '#2a0008', strokeThickness: 6,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, y: title.y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const stats = `到达第 ${data?.wave ?? 1} 波\n等级 ${data?.level ?? 1}   —   击杀 ${data?.kills ?? 0}`;
    this.add.text(GAME.width / 2, GAME.height / 2 - 20, stats, {
      fontFamily: 'Courier New', fontSize: '22px', color: '#ddd', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5);

    const restart = this.add.text(GAME.width / 2, GAME.height / 2 + 80, '▶ 按空格或点击重试', {
      fontFamily: 'Courier New', fontSize: '22px', fontStyle: 'bold',
      color: '#fff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: restart, alpha: { from: 1, to: 0.4 }, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(GAME.width / 2, GAME.height / 2 + 120, 'ESC 返回主菜单', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#aaa',
    }).setOrigin(0.5);

    const retry = () => this.scene.start('GameScene');
    this.input.keyboard.once('keydown-SPACE', retry);
    this.input.once('pointerdown', retry);
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}
