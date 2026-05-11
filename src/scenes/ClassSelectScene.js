import { GAME, CLASSES } from '../config.js';

const CARD_W = 240;
const CARD_H = 320;
const CORNER_R = 12;

const CLASS_THEME = {
  mage: {
    border: 0x4488ff,
    borderLight: 0x88bbff,
    glow: 0x2266cc,
    accent: '#4488ff',
    bgTint: 0x0d1525,
    particleColor: [0x4488ff, 0x88ccff, 0xaaddff],
  },
  warrior: {
    border: 0xc8442a,
    borderLight: 0xee7755,
    glow: 0x882211,
    accent: '#c8442a',
    bgTint: 0x1f0d0a,
    particleColor: [0xc8442a, 0xee7744, 0xffaa66],
  },
};

export class ClassSelectScene extends Phaser.Scene {
  constructor() { super('ClassSelectScene'); }

  create() {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;

    // Background atmosphere
    const bg = this.add.rectangle(cx, cy, GAME.width, GAME.height, 0x0a0a14, 0.85);

    // Title
    this.add.text(cx, cy - 200, '选择你的职业', {
      fontFamily: 'Courier New', fontSize: '36px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#2a1a00', strokeThickness: 5,
    }).setOrigin(0.5);

    this.cards = [];
    this.selectedIndex = 0;
    this.glowTweens = [];

    const classes = Object.values(CLASSES);
    const cardSpacing = 300;
    const startX = cx - ((classes.length - 1) * cardSpacing) / 2;

    classes.forEach((cls, i) => {
      const x = startX + i * cardSpacing;
      const card = this.createClassCard(x, cy, cls);
      this.cards.push(card);
    });

    this.selectCard(0);

    this.add.text(cx, cy + 210, '← → 选择    空格 / 点击 确认    ESC 返回', {
      fontFamily: 'Courier New', fontSize: '16px', color: '#667',
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-LEFT', () => this.selectPrev());
    this.input.keyboard.on('keydown-RIGHT', () => this.selectNext());
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  createClassCard(x, y, cls) {
    const container = this.add.container(x, y);
    const theme = CLASS_THEME[cls.id] || CLASS_THEME.mage;
    const isLocked = cls.locked;

    // Outer glow layer (only visible when selected)
    const glowRect = this.add.rectangle(0, 0, CARD_W + 16, CARD_H + 16, theme.glow, 0)
      .setStrokeStyle(4, theme.border, 0);

    // Card background
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, isLocked ? 0x111118 : theme.bgTint)
      .setStrokeStyle(2, isLocked ? 0x222233 : theme.border);

    // Top accent bar
    const accentBar = this.add.rectangle(0, -CARD_H / 2 + 3, CARD_W - 4, 6, isLocked ? 0x222233 : theme.border);

    // Class name
    const name = this.add.text(0, -CARD_H / 2 + 32, cls.name, {
      fontFamily: 'Courier New', fontSize: '24px', fontStyle: 'bold',
      color: isLocked ? '#444' : theme.accent,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Sprite
    let sprite;
    if (cls.sheet) {
      sprite = this.add.sprite(0, -15, cls.sheet, 0).setScale(1.6);
      if (!isLocked) sprite.play(cls.textureKey + '_south_idle');
    } else {
      const spriteKey = cls.textureKey + '_idle_a';
      sprite = this.add.sprite(0, -15, spriteKey).setScale(3.5);
      if (!isLocked) {
        const animKey = cls.textureKey === 'mage' ? 'mage_idle' : 'player_idle';
        sprite.play(animKey);
      }
    }

    // Description
    const desc = this.add.text(0, CARD_H / 2 - 45, cls.description, {
      fontFamily: 'Courier New', fontSize: '15px',
      color: isLocked ? '#444' : '#bbb',
    }).setOrigin(0.5);

    // Decorative corner marks
    if (!isLocked) {
      const cm = 14;
      const cColor = theme.border;
      const hw = CARD_W / 2;
      const hh = CARD_H / 2;
      // top-left
      this.add.rectangle(-hw + cm / 2, -hh + cm / 2, cm, 2, cColor);
      this.add.rectangle(-hw + cm / 2, -hh + cm / 2, 2, cm, cColor);
      // top-right
      this.add.rectangle(hw - cm / 2, -hh + cm / 2, cm, 2, cColor);
      this.add.rectangle(hw - cm / 2, -hh + cm / 2, 2, cm, cColor);
      // bottom-left
      this.add.rectangle(-hw + cm / 2, hh - cm / 2, cm, 2, cColor);
      this.add.rectangle(-hw + cm / 2, hh - cm / 2, 2, cm, cColor);
      // bottom-right
      this.add.rectangle(hw - cm / 2, hh - cm / 2, cm, 2, cColor);
      this.add.rectangle(hw - cm / 2, hh - cm / 2, 2, cm, cColor);
    }

    container.add([glowRect, bg, accentBar, name, sprite, desc]);
    container.setData('class', cls);
    container.setData('theme', theme);
    container.setData('glowRect', glowRect);
    container.setData('bg', bg);

    if (!isLocked) {
      bg.setSize(CARD_W, CARD_H);
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

    this.glowTweens.forEach(t => t.stop());
    this.glowTweens = [];

    this.cards.forEach((card, i) => {
      const theme = card.getData('theme');
      const glowRect = card.getData('glowRect');
      const bg = card.getData('bg');
      const isSelected = i === index;
      const isLocked = card.getData('class').locked;

      // Scale animation
      this.tweens.add({
        targets: card,
        scale: isSelected ? 1.08 : 1,
        duration: 200,
        ease: 'Back.easeOut',
      });

      if (isSelected) {
        bg.setStrokeStyle(3, theme.borderLight);

        // Pulsing glow effect
        glowRect.setStrokeStyle(4, theme.border, 0.6);
        const pulse = this.tweens.add({
          targets: glowRect,
          alpha: { from: 0.3, to: 0.85 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.glowTweens.push(pulse);
      } else {
        glowRect.setStrokeStyle(4, theme.border, 0);
        glowRect.setAlpha(0);
        bg.setStrokeStyle(2, isLocked ? 0x222233 : theme.border);
      }
    });
  }

  selectPrev() {
    let idx = this.selectedIndex - 1;
    while (idx >= 0 && this.cards[idx].getData('class').locked) idx--;
    if (idx >= 0) this.selectCard(idx);
  }

  selectNext() {
    let idx = this.selectedIndex + 1;
    while (idx < this.cards.length && this.cards[idx].getData('class').locked) idx++;
    if (idx < this.cards.length) this.selectCard(idx);
  }

  confirmSelection() {
    const selected = this.cards[this.selectedIndex].getData('class');
    if (selected.locked) return;
    this.scene.start('GameScene', { class: selected.id });
  }
}
