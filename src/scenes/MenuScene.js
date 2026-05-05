import { GAME } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;

    // Title
    const title = this.add.text(cx, cy - 120, 'DUNGEON GUNNER', {
      fontFamily: 'Courier New', fontSize: '56px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#2a1a00', strokeThickness: 6,
    }).setOrigin(0.5);

    this.tweens.add({ targets: title, y: cy - 115, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(cx, cy - 50, '微型俯视角肉鸽', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#9aa',
    }).setOrigin(0.5);

    // Decorative player
    const demo = this.add.sprite(cx, cy + 30, 'player_idle_a').setScale(3);
    demo.play('player_idle');
    const gun = this.add.sprite(cx + 20, cy + 36, 'gun').setScale(3);
    this.tweens.add({ targets: gun, angle: { from: -15, to: 15 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Controls
    this.add.text(cx, cy + 110, 'WASD / 方向键 — 移动', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#cfd',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 135, '鼠标 — 瞄准    左键 — 射击', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#cfd',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 160, '1 / 2 / 3 — 选择升级', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#cfd',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 180, 'ESC / P — 暂停', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#99b',
    }).setOrigin(0.5);

    // Start prompt
    const prompt = this.add.text(cx, cy + 210, '▶ 按空格或点击开始', {
      fontFamily: 'Courier New', fontSize: '22px', fontStyle: 'bold',
      color: '#fff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: { from: 1, to: 0.4 }, duration: 700, yoyo: true, repeat: -1 });

    const start = () => this.scene.start('ClassSelectScene');
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
