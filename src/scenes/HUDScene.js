import { GAME } from '../config.js';

const BAR_H = 16;
const BAR_INNER = 12;

const ICON_MAP = {
  hp: 80,
  xp: 85,
  damage: 16,
  speed: 82,
  pierce: 31,
  multi: 5,
  skill: 84,
  kills: 4,
  wave: 0,
};

export class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    this.gameScene = this.scene.get('GameScene');

    this._drawBarFrames();
    this._drawTopLeft();
    this._drawTopRight();
    this._drawBottomCenter();
    this._drawBanner();
  }

  // ── Decorative bar frames (procedural) ──

  _drawBarFrames() {
    // HP bar frame — bottom-left
    const hpX = 60;
    const hpY = GAME.height - 28;
    const hpW = 260;

    this._makeBarFrame(hpX, hpY, hpW, BAR_H, 0x552222, 0x883333, 0x663344);
    this.hpIcon = this.add.sprite(hpX - 22, hpY, 'ui_icons2', ICON_MAP.hp).setScale(0.9);
    this.hpFill = this.add.rectangle(hpX + 3, hpY, 0, BAR_INNER, 0xcc2222).setOrigin(0, 0.5);
    this.hpFillBg = this.add.rectangle(hpX + 3, hpY, hpW - 6, BAR_INNER, 0x331111, 0.4).setOrigin(0, 0.5);
    this.hpFill.depth = this.hpFillBg.depth + 1;
    this.hpText = this.add.text(hpX + hpW / 2, hpY, '', {
      fontFamily: 'Courier New', fontSize: '12px', fontStyle: 'bold',
      color: '#ffcccc', stroke: '#220000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(this.hpFill.depth + 1);

    this.hpBarX = hpX + 3;
    this.hpBarW = hpW - 6;

    // XP bar frame — top center
    const xpW = 420;
    const xpX = (GAME.width - xpW) / 2;
    const xpY = 20;

    this._makeBarFrame(xpX, xpY, xpW, BAR_H, 0x152540, 0x2a4570, 0x445566);
    this.xpIcon = this.add.sprite(xpX - 22, xpY, 'ui_icons2', ICON_MAP.xp).setScale(0.9);
    this.xpFillBg = this.add.rectangle(xpX + 3, xpY, xpW - 6, BAR_INNER, 0x0a1020, 0.4).setOrigin(0, 0.5);
    this.xpFill = this.add.rectangle(xpX + 3, xpY, 0, BAR_INNER, 0x3388cc).setOrigin(0, 0.5);
    this.xpFill.depth = this.xpFillBg.depth + 1;
    this.xpText = this.add.text(xpX + xpW / 2, xpY, '', {
      fontFamily: 'Courier New', fontSize: '11px', fontStyle: 'bold',
      color: '#bbddff', stroke: '#001122', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(this.xpFill.depth + 1);

    this.xpBarX = xpX + 3;
    this.xpBarW = xpW - 6;
  }

  _makeBarFrame(x, y, w, h, bgColor, borderColor, strokeColor) {
    const pad = 4;
    const g = this.add.graphics();

    g.fillStyle(bgColor, 0.7);
    g.fillRoundedRect(x - pad, y - h / 2 - pad, w + pad * 2, h + pad * 2, 4);

    g.lineStyle(2, strokeColor, 0.8);
    g.strokeRoundedRect(x - pad, y - h / 2 - pad, w + pad * 2, h + pad * 2, 4);

    g.lineStyle(1, borderColor, 0.3);
    g.strokeRoundedRect(x - pad + 1, y - h / 2 - pad + 1, w + pad * 2 - 2, h + pad * 2 - 2, 3);

    g.setDepth(0);
    return g;
  }

  // ── Top-left: wave info ──

  _drawTopLeft() {
    const px = 16;
    const py = 48;

    const panelW = 180;
    const panelH = 50;
    this._makePanel(px, py, panelW, panelH);

    this.waveIcon = this.add.sprite(px + 20, py + 16, 'ui_icons', ICON_MAP.wave).setScale(0.8);
    this.waveText = this.add.text(px + 38, py + 8, '', {
      fontFamily: 'Courier New', fontSize: '16px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#1a1000', strokeThickness: 3,
    });
    this.waveTimerText = this.add.text(px + 38, py + 28, '', {
      fontFamily: 'Courier New', fontSize: '13px',
      color: '#ccb844', stroke: '#1a1000', strokeThickness: 2,
    });
  }

  // ── Top-right: stats ──

  _drawTopRight() {
    const px = GAME.width - 16;
    const py = 48;

    const panelW = 200;
    const panelH = 100;
    this._makePanel(px - panelW, py, panelW, panelH);

    const sx = px - panelW + 12;
    const iconScale = 0.65;
    const lineH = 20;

    // Row 1: Damage icon + value
    this.statIconDmg = this.add.sprite(sx + 8, py + 12, 'ui_icons', ICON_MAP.damage).setScale(iconScale);
    this.statDmg = this.add.text(sx + 22, py + 4, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ee9988',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 1 right: Fire rate
    this.statIconRate = this.add.sprite(sx + 90, py + 12, 'ui_icons', ICON_MAP.speed).setScale(iconScale);
    this.statRate = this.add.text(sx + 104, py + 4, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88ccee',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 2: Pierce
    this.statIconPierce = this.add.sprite(sx + 8, py + 12 + lineH, 'ui_icons', ICON_MAP.pierce).setScale(iconScale);
    this.statPierce = this.add.text(sx + 22, py + 4 + lineH, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ccee88',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 2 right: Multishot
    this.statMulti = this.add.text(sx + 90, py + 4 + lineH, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#eebb66',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 3: Kills
    this.statIconKills = this.add.sprite(sx + 8, py + 12 + lineH * 2, 'ui_icons2', ICON_MAP.kills).setScale(iconScale);
    this.statKills = this.add.text(sx + 22, py + 4 + lineH * 2, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ddd',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 3 right: Skill charges
    this.statIconSkill = this.add.sprite(sx + 90, py + 12 + lineH * 2, 'ui_icons', ICON_MAP.skill).setScale(iconScale);
    this.statSkill = this.add.text(sx + 104, py + 4 + lineH * 2, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#88ff88',
      stroke: '#000', strokeThickness: 2,
    });

    // Row 4: Skill status line
    this.skillStatusText = this.add.text(sx + 8, py + 4 + lineH * 3, '', {
      fontFamily: 'Courier New', fontSize: '12px', fontStyle: 'bold',
      color: '#aaffaa', stroke: '#001100', strokeThickness: 2,
    });
  }

  // ── Bottom-center: skill slots ──

  _drawBottomCenter() {
    const cx = GAME.width / 2;
    const by = GAME.height - 32;
    const slotSize = 40;
    const gap = 8;
    const totalSlots = 10;
    const startX = cx - ((totalSlots * (slotSize + gap) - gap) / 2);

    this.skillSlotFrames = [];
    this.skillSlotOrbs = [];

    for (let i = 0; i < totalSlots; i++) {
      const sx = startX + i * (slotSize + gap) + slotSize / 2;

      // Slot background
      const g = this.add.graphics();
      g.fillStyle(0x111118, 0.7);
      g.fillRoundedRect(sx - slotSize / 2, by - slotSize / 2, slotSize, slotSize, 6);
      g.lineStyle(2, 0x335544, 0.7);
      g.strokeRoundedRect(sx - slotSize / 2, by - slotSize / 2, slotSize, slotSize, 6);
      g.setDepth(0);

      // Orb placeholder (hidden until charged)
      const orb = this.add.sprite(sx, by, 'ui_icons', ICON_MAP.skill).setScale(0.8).setAlpha(0.25);

      this.skillSlotFrames.push({ g, x: sx, y: by });
      this.skillSlotOrbs.push(orb);
    }
  }

  // ── Banner ──

  _drawBanner() {
    this.banner = this.add.text(GAME.width / 2, 110, '', {
      fontFamily: 'Courier New', fontSize: '38px', fontStyle: 'bold',
      color: '#ffe14a', stroke: '#2a1a00', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
  }

  _makePanel(x, y, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0x0a0a14, 0.75);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(2, 0x334455, 0.6);
    g.strokeRoundedRect(x, y, w, h, 6);

    // Inner accent line at top
    g.lineStyle(1, 0x446688, 0.4);
    g.lineBetween(x + 4, y + 1, x + w - 4, y + 1);

    g.setDepth(0);
    return g;
  }

  showBanner(text) {
    if (!this.banner) return;
    this.banner.setText(text).setAlpha(1).setScale(1.4);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 0, scale: 1, duration: 1400, ease: 'Cubic.easeOut' });
  }

  update() {
    const gs = this.gameScene;
    if (!gs || !gs.player || !gs.waveManager) return;
    if (!this.hpFill) return;
    const p = gs.player;

    // HP
    const hpFrac = Math.max(0, p.hp) / p.stats.maxHp;
    this.hpFill.width = this.hpBarW * hpFrac;
    // Tint from green→yellow→red
    const hpHue = hpFrac > 0.5 ? 0x22cc44 : hpFrac > 0.25 ? 0xccaa22 : 0xcc2222;
    this.hpFill.setFillStyle(hpHue);
    this.hpText.setText(`HP ${Math.max(0, Math.round(p.hp))} / ${p.stats.maxHp}`);

    // XP
    const xpFrac = Math.min(1, p.xp / p.xpToNext);
    this.xpFill.width = this.xpBarW * xpFrac;
    // Pulse glow at high XP
    const xpAlpha = xpFrac > 0.8 ? 0.85 + Math.sin(this.time.now / 200) * 0.15 : 1;
    this.xpFill.setAlpha(xpAlpha);
    this.xpText.setText(`Lv ${p.level}   ${p.xp} / ${p.xpToNext}`);

    // Wave
    const w = gs.waveManager;
    const secLeft = Math.ceil(w.timeLeftMs / 1000);
    this.waveText.setText(`Wave ${w.wave}`);
    this.waveTimerText.setText(`${secLeft}s remaining`);

    // Stats
    const dmg = Math.round(p.stats.damage);
    const rate = (1000 / p.stats.fireRateMs).toFixed(1);
    this.statDmg.setText(`${dmg} DMG`);
    this.statRate.setText(`${rate}/s`);
    this.statPierce.setText(`x${p.stats.pierce}`);
    this.statMulti.setText(`x${p.stats.multishot}`);
    this.statKills.setText(`${gs.kills} kills`);
    this.statSkill.setText(`${p.skillCharges}/${p.stats.skillChargesMax}`);

    // Skill status line
    let skillLine;
    if (p.stats.hasTimeStop) {
      const cd = Math.max(0, ((p.timeStopReadyAt ?? 0) - gs.time.now) / 1000);
      skillLine = cd <= 0 ? 'TIME STOP READY' : `Time Stop ${cd.toFixed(1)}s`;
    } else if (p.stats.hasArcaneStorm && p.classId === 'mage') {
      const charges = p.skillCharges;
      const max = p.stats.skillChargesMax;
      skillLine = charges >= 3 ? `STORM READY ${charges}/${max}` : `Skill ${charges}/${max} (need 3)`;
    } else {
      skillLine = '';
    }
    this.skillStatusText.setText(skillLine);

    // Skill slot orbs
    const charges = p.skillCharges;
    const maxCharges = p.stats.skillChargesMax;
    for (let i = 0; i < this.skillSlotOrbs.length; i++) {
      const orb = this.skillSlotOrbs[i];
      if (i < maxCharges) {
        orb.setAlpha(i < charges ? 0.9 : 0.2);
        orb.setTint(i < charges ? 0x44ff88 : 0x334433);
      } else {
        orb.setAlpha(0);
      }
    }
  }
}
