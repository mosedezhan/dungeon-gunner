import { GAME, CLASSES } from '../config.js';

export class ClassSelectScene extends Phaser.Scene {
  constructor() { super('ClassSelectScene'); }

  create() {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;

    // Title
    this.add.text(cx, cy - 180, 'SELECT YOUR CLASS', {
      fontFamily: 'Courier New', fontSize: '32px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#2a1a00', strokeThickness: 4,
    }).setOrigin(0.5);

    // Card container
    this.cards = [];
    this.selectedIndex = 0;

    // Create class cards
    const classes = Object.values(CLASSES);
    const cardSpacing = 220;
    const startX = cx - ((classes.length - 1) * cardSpacing) / 2;

    classes.forEach((cls, i) => {
      const x = startX + i * cardSpacing;
      const card = this.createClassCard(x, cy, cls);
      this.cards.push(card);
    });

    // Highlight default (mage)
    this.selectCard(0);

    // Controls hint
    this.add.text(cx, cy + 180, '← →  Select    SPACE / CLICK  Confirm    ESC  Back', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#9aa',
    }).setOrigin(0.5);

    // Input handling
    this.input.keyboard.on('keydown-LEFT', () => this.selectPrev());
    this.input.keyboard.on('keydown-RIGHT', () => this.selectNext());
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  createClassCard(x, y, cls) {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.rectangle(0, 0, 180, 220, cls.locked ? 0x1a1a2a : 0x2a2a3a)
      .setStrokeStyle(2, cls.locked ? 0x333344 : 0x4488ff);

    // Class name
    const name = this.add.text(0, -85, cls.name, {
      fontFamily: 'Courier New', fontSize: '20px', fontStyle: 'bold',
      color: cls.locked ? '#555' : '#fff',
    }).setOrigin(0.5);

    // Sprite (idle animation)
    const spriteKey = cls.textureKey + '_idle_a';
    const sprite = this.add.sprite(0, -10, spriteKey).setScale(4);
    if (!cls.locked) {
      const animKey = cls.textureKey === 'mage' ? 'mage_idle' : 'player_idle';
      sprite.play(animKey);
    }

    // Description
    const desc = this.add.text(0, 75, cls.description, {
      fontFamily: 'Courier New', fontSize: '14px',
      color: cls.locked ? '#555' : '#aaa',
    }).setOrigin(0.5);

    container.add([bg, name, sprite, desc]);
    container.setData('class', cls);

    // Click handler (only for unlocked classes)
    if (!cls.locked) {
      bg.setSize(180, 220);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        const idx = this.cards.indexOf(container);
        if (idx !== -1) this.selectCard(idx);
      });
      bg.on('pointerdown', () => {
        this.selectCard(this.cards.indexOf(container));
        this.confirmSelection();
      });
    }

    return container;
  }

  selectCard(index) {
    if (index < 0 || index >= this.cards.length) return;
    const cls = this.cards[index].getData('class');
    if (cls.locked) return;

    this.selectedIndex = index;

    // Update visual highlights
    this.cards.forEach((card, i) => {
      const bg = card.first;
      const scale = i === index ? 1.05 : 1;
      const borderColor = i === index ? 0x66ccff : (card.getData('class').locked ? 0x333344 : 0x4488ff);

      this.tweens.add({
        targets: card,
        scale: scale,
        duration: 150,
        ease: 'Quad.easeOut',
      });

      bg.setStrokeStyle(2, borderColor);
    });
  }

  selectPrev() {
    let idx = this.selectedIndex - 1;
    while (idx >= 0 && this.cards[idx].getData('class').locked) {
      idx--;
    }
    if (idx >= 0) this.selectCard(idx);
  }

  selectNext() {
    let idx = this.selectedIndex + 1;
    while (idx < this.cards.length && this.cards[idx].getData('class').locked) {
      idx++;
    }
    if (idx < this.cards.length) this.selectCard(idx);
  }

  confirmSelection() {
    const selected = this.cards[this.selectedIndex].getData('class');
    if (selected.locked) return;
    this.scene.start('GameScene', { class: selected.id });
  }
}
