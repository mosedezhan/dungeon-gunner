import { DEBUG_SPAWNABLE } from '../debug/registry.js';

const STYLE = {
  font: '16px monospace',
  fill: '#cccccc',
};
const STYLE_HEAD = {
  font: '20px monospace',
  fill: '#ffffff',
};
const STYLE_SECTION = {
  font: '14px monospace',
  fill: '#888888',
};
const STYLE_HIGHLIGHT = {
  font: '16px monospace',
  fill: '#ffcc44',
};

export class DebugScene extends Phaser.Scene {
  constructor() { super('DebugScene'); }

  create() {
    const gs = this.scene.get('GameScene');
    if (!gs) return;

    this.gs = gs;
    this.godMode = false;
    this._menuItems = [];

    // Semi-transparent overlay
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.75)
      .setOrigin(0).setScrollFactor(0).setDepth(0);

    const panelX = GAME_W / 2;
    let y = 60;

    // Title
    this.add.text(panelX, y, 'DEBUG PANEL', STYLE_HEAD)
      .setOrigin(0.5).setScrollFactor(0).setDepth(1);
    y += 40;

    // Spawn section
    this.add.text(panelX, y, '── Spawn at Cursor ──', STYLE_SECTION)
      .setOrigin(0.5).setScrollFactor(0).setDepth(1);
    y += 30;

    for (const [label, cls] of Object.entries(DEBUG_SPAWNABLE)) {
      this._addButton(panelX, y, label, () => this._spawn(cls));
      y += 28;
    }

    y += 15;
    this.add.text(panelX, y, '── Actions ──', STYLE_SECTION)
      .setOrigin(0.5).setScrollFactor(0).setDepth(1);
    y += 30;

    this._godText = this._addButton(panelX, y, '[W] God Mode: OFF', () => this._toggleGod());
    y += 28;

    this._addButton(panelX, y, '[E] Kill All Enemies', () => this._killAll());
    y += 28;

    this._addButton(panelX, y, '[Q] +1 Skill Charge', () => this._addCharge());
    y += 28;

    this._addButton(panelX, y, '[R] Skip to Wave 20', () => this._skipWave());
    y += 28;

    this._spawnText = this._addButton(panelX, y, '[T] Auto Spawn: ON', () => this._toggleSpawn());
    y += 40;

    this.add.text(panelX, y, '[ESC / F1] Close', STYLE_SECTION)
      .setOrigin(0.5).setScrollFactor(0).setDepth(1);

    // Keyboard
    this.input.keyboard.on('keydown-F1', (e) => { e.preventDefault(); this._close(); });
    this.input.keyboard.on('keydown-ESC', () => this._close());
    this.input.keyboard.on('keydown-ONE',   () => this._spawnByIndex(0));
    this.input.keyboard.on('keydown-TWO',   () => this._spawnByIndex(1));
    this.input.keyboard.on('keydown-THREE', () => this._spawnByIndex(2));
    this.input.keyboard.on('keydown-FOUR',  () => this._spawnByIndex(3));
    this.input.keyboard.on('keydown-FIVE',  () => this._spawnByIndex(4));
    this.input.keyboard.on('keydown-SIX',   () => this._spawnByIndex(5));
    this.input.keyboard.on('keydown-SEVEN', () => this._spawnByIndex(6));
    this.input.keyboard.on('keydown-EIGHT', () => this._spawnByIndex(7));
    this.input.keyboard.on('keydown-NINE',  () => this._spawnByIndex(8));
    this.input.keyboard.on('keydown-W',     () => this._toggleGod());
    this.input.keyboard.on('keydown-E',     () => this._killAll());
    this.input.keyboard.on('keydown-Q',     () => this._addCharge());
    this.input.keyboard.on('keydown-R',     () => this._skipWave());
    this.input.keyboard.on('keydown-T',     () => this._toggleSpawn());
  }

  _addButton(x, y, label, callback) {
    const txt = this.add.text(x, y, label, STYLE)
      .setOrigin(0.5).setScrollFactor(0).setDepth(1)
      .setInteractive({ useHandCursor: true });
    txt.on('pointerover', () => txt.setStyle(STYLE_HIGHLIGHT));
    txt.on('pointerout',  () => txt.setStyle(STYLE));
    txt.on('pointerdown', callback);
    return txt;
  }

  _spawn(cls) {
    const gs = this.gs;
    const p = gs.player;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(120, 200);
    const wx = p.x + Math.cos(angle) * dist;
    const wy = p.y + Math.sin(angle) * dist;
    const enemy = new cls(gs, wx, wy);
    gs.enemies.add(enemy);
    const hpMult = 1 + (gs.waveManager.wave - 1) * 0.15;
    enemy.maxHp = Math.round(enemy.maxHp * hpMult);
    enemy.hp = enemy.maxHp;
  }

  _spawnByIndex(idx) {
    const entries = Object.entries(DEBUG_SPAWNABLE);
    if (idx < entries.length) this._spawn(entries[idx][1]);
  }

  _toggleGod() {
    this.godMode = !this.godMode;
    const gs = this.gs;
    if (this.godMode) {
      gs.player.invulUntil = Infinity;
      this._godText.setText('[W] God Mode: ON').setStyle(STYLE_HIGHLIGHT);
    } else {
      gs.player.invulUntil = 0;
      this._godText.setText('[W] God Mode: OFF').setStyle(STYLE);
    }
  }

  _killAll() {
    this.gs.enemies.getChildren().forEach(e => {
      if (e.active && !e.dead) e.die();
    });
  }

  _addCharge() {
    const p = this.gs.player;
    p.skillCharges = Math.min(p.stats.skillChargesMax, p.skillCharges + 1);
  }

  _skipWave() {
    this.gs.waveManager.startWave(20);
  }

  _toggleSpawn() {
    const wm = this.gs.waveManager;
    wm.spawnEnabled = !wm.spawnEnabled;
    if (wm.spawnEnabled) {
      this._spawnText.setText('[T] Auto Spawn: ON').setStyle(STYLE);
    } else {
      this._spawnText.setText('[T] Auto Spawn: OFF').setStyle(STYLE_HIGHLIGHT);
    }
  }

  _close() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}

const GAME_W = 1280;
const GAME_H = 720;
