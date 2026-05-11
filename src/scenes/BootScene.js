const PIXEL = 2;

function paintGrid(g, grid, palette) {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
    }
  }
}

function makeTex(scene, key, grid, palette) {
  const g = scene.add.graphics().setVisible(false);
  paintGrid(g, grid, palette);
  g.generateTexture(key, grid[0].length * PIXEL, grid.length * PIXEL);
  g.destroy();
}

const PLAYER_PALETTE = {
  H: 0x2a1a0a, S: 0xe8b98a, s: 0xb88a5a, E: 0x1a1a2a,
  T: 0x4a6aa8, t: 0x2a3a68, B: 0x3a2a1a,
  L: 0x24244a, F: 0x120a05, O: 0x080408,
};

const MAGE_PALETTE = {
  H: 0x1a1a2a, S: 0x88b8ff, s: 0x5a88d8, E: 0x0a1a3a,
  T: 0x2288ff, t: 0x1044aa, B: 0x1a2a3a,
  L: 0x181848, F: 0x050518, O: 0x040410,
};

const WARRIOR_PALETTE = {
  H: 0x2a1a0a, S: 0xe8b98a, s: 0xb88a5a, E: 0x1a0a08,
  T: 0xc8442a, t: 0x8a2a18, B: 0x3a2218,
  L: 0x4a2418, F: 0x120a05, O: 0x080404,
};

const PLAYER_IDLE_A = [
  '....OOOO....',
  '...OHHHHO...',
  '..OHHHHHHO..',
  '..OHSSSSHO..',
  '..OSsEEsSO..',
  '..OSSSSSSO..',
  '...OsSSsO...',
  '..OTTTTTTO..',
  '.OTTTTTTTTO.',
  '.OTtTTTTtTO.',
  '.OTTBBBBTTO.',
  '.OTtTTTTtTO.',
  '..OTTTTTTO..',
  '..OLLOOLLO..',
  '..OLLOOLLO..',
  '..OFFOOFFO..',
];

const PLAYER_IDLE_B = [
  '............',
  '....OOOO....',
  '...OHHHHO...',
  '..OHHHHHHO..',
  '..OHSSSSHO..',
  '..OSsEEsSO..',
  '..OSSSSSSO..',
  '...OsSSsO...',
  '..OTTTTTTO..',
  '.OTTTTTTTTO.',
  '.OTtTTTTtTO.',
  '.OTTBBBBTTO.',
  '.OTtTTTTtTO.',
  '..OTTTTTTO..',
  '..OLLOOLLO..',
  '..OFFOOFFO..',
];

const PLAYER_RUN_A = [
  '....OOOO....',
  '...OHHHHO...',
  '..OHHHHHHO..',
  '..OHSSSSHO..',
  '..OSsEEsSO..',
  '..OSSSSSSO..',
  '...OsSSsO...',
  '..OTTTTTTO..',
  '.OTTTTTTTTO.',
  '.OTtTTTTtTO.',
  '.OTTBBBBTTO.',
  '.OTtTTTTtTO.',
  '..OTTTTTTO..',
  '.OLLO..OLLO.',
  '.OLLO..OLLO.',
  '.OFFO..OFFO.',
];

const PLAYER_RUN_B = [
  '....OOOO....',
  '...OHHHHO...',
  '..OHHHHHHO..',
  '..OHSSSSHO..',
  '..OSsEEsSO..',
  '..OSSSSSSO..',
  '...OsSSsO...',
  '..OTTTTTTO..',
  '.OTTTTTTTTO.',
  '.OTtTTTTtTO.',
  '.OTTBBBBTTO.',
  '.OTtTTTTtTO.',
  '..OTTTTTTO..',
  '..OLLOOLLO..',
  '.OLLOOOOLLO.',
  '.OFFO..OFFO.',
];

const CHASER_PALETTE = { G: 0x6faa4a, g: 0x3d6b2a, D: 0x1a2a14, E: 0xdd2222, M: 0x1a0a08, O: 0x050a02 };

const CHASER_A = [
  '...OOOOO...',
  '..OGGgGGO..',
  '.OGGGGGGGO.',
  '.OGEMMMEGO.',
  '.OgGGGGGgO.',
  '.OGgMMMgGO.',
  '.OGggggggO.',
  '..OGGGGGO..',
  '.OGGgggGGO.',
  '.OGO...OGO.',
  '.OO.....OO.',
];
const CHASER_B = [
  '...OOOOO...',
  '..OGGgGGO..',
  '.OGGGGGGGO.',
  '.OGEMMMEGO.',
  '.OgGGGGGgO.',
  '.OGgMMMgGO.',
  '.OGggggggO.',
  '..OGGGGGO..',
  '.OGgggggGO.',
  '..OO...OO..',
  '...O...O...',
];

const RUSHER_PALETTE = { Y: 0xd9c04a, y: 0x8a742a, E: 0xffcc33, M: 0x220a00, O: 0x080400 };

const RUSHER_A = [
  '...OOOO...',
  '..OYYYYO..',
  '.OYyEEyYO.',
  '.OYyMMyYO.',
  '..OYyyYO..',
  '.OYYyyYYO.',
  '.OYyyyyYO.',
  '.OO.OO.OO.',
  '..O..O..O.',
];
const RUSHER_B = [
  '...OOOO...',
  '..OYYYYO..',
  '.OYyEEyYO.',
  '.OYyMMyYO.',
  '..OYyyYO..',
  '.OYYyyYYO.',
  '.OYyyyyYO.',
  '..OOO.OO..',
  '...O....O.',
];

const SHOOTER_PALETTE = { P: 0xc85a9a, p: 0x7a2a5a, D: 0x2a0a20, E: 0x55eeff, R: 0x552066, O: 0x0a0408 };

const SHOOTER_A = [
  '...OOOOOO...',
  '..OPPPppPO..',
  '.OPPPPPPPPO.',
  '.OPpEDDEpPO.',
  '.OPPPRRPPPO.',
  '.OPpPPPPpPO.',
  '.OPPppppPPO.',
  '..OPPpppPO..',
  '.OPPpppppPO.',
  '.OPO....OPO.',
  '.OO......OO.',
];
const SHOOTER_B = [
  '...OOOOOO...',
  '..OPPPppPO..',
  '.OPPPPPPPPO.',
  '.OPpEDDEpPO.',
  '.OPPPRRPPPO.',
  '.OPpPPPPpPO.',
  '.OPPppppPPO.',
  '..OPPpppPO..',
  '.OPppppppPO.',
  '..OO....OO..',
  '...O....O...',
];

// Giant: tall lanky humanoid with club, earthy tones (Elder Scrolls style)
const GIANT_PALETTE = {
  S: 0xc8a878, s: 0x8a6a44, E: 0xffffff, M: 0xdd2222,
  F: 0x4a3218, f: 0x6a4a2a, B: 0x7a5a38, b: 0x5a3a22,
  C: 0x8a7a5a, c: 0x6a5a3a, O: 0x050302,
};

const GIANT_A = [
  '....OOOO....',
  '...OssssO...',
  '..OsSEESsO..',
  '..OsSMMSsO..',
  '..OsssssO...',
  '...OsssO....',
  '..OBsBO.CC..',
  '.OsBBBBsOC..',
  '.OsBBbBBsO..',
  '.OsBBBBBsO..',
  '..OBBbBBO...',
  '..OBFFFBO...',
  '...OFffFO...',
  '..OLL..LLO..',
  '..OLL..LLO..',
  '..OO....OO..',
];
const GIANT_B = [
  '....OOOO....',
  '...OssssO...',
  '..OsSEESsO..',
  '..OsSMMSsO..',
  '..OsssssO...',
  '...OsssO....',
  '..OBsBO.CC..',
  '.OsBBBBsOC..',
  '.OsBBbBBsO..',
  '.OsBBBBBsO..',
  '..OBBbBBO...',
  '..OBFFFBO...',
  '...OFffFO...',
  '.OLL....OLLO',
  '..OLO..OLO..',
  '..OO....OO..',
];

// Bomber: small round bomb body, red-orange
const BOMBER_PALETTE = {
  R: 0xff6633, r: 0xcc3311, D: 0x661108, E: 0xffee44, F: 0xffaa22,
  W: 0xffffff, O: 0x0a0402,
};

// Mimic: treasure chest disguise (brown-gold) and revealed form (open lid, red eyes, legs)
const MIMIC_PALETTE = {
  C: 0xc8a028, c: 0x8a6a14, B: 0x6a4a14, b: 0x4a3010,
  G: 0xffd700, g: 0xbba020, L: 0xdab840,
  E: 0xff3333, W: 0xffffff, D: 0x2a1a08, O: 0x0a0802,
  R: 0xcc8844, r: 0x996633,
};

const BOMBER_A = [
  '...OOOOO...',
  '..ORrrrRO..',
  '.ORRRRRRRO.',
  '.ORrEWErRO.',
  '.ORRRRRRRO.',
  '.ORrFFFFRO.',
  '.ORrrrrrRO.',
  '..ORRRRRO..',
  '..ORO.ORO..',
  '..OO...OO..',
];
const BOMBER_B = [
  '...OOOOO...',
  '..ORrrrRO..',
  '.ORRRRRRRO.',
  '.ORrEWErRO.',
  '.ORRRRRRRO.',
  '.ORrFFFFRO.',
  '.ORrrrrrRO.',
  '..ORRRRRO..',
  '...OO.OO...',
  '...O...O...',
];

// Mimic chest (closed): brown-gold treasure chest
const MIMIC_CHEST_A = [
  '............',
  '..OBbbbbbBO.',
  '.OBCCCCCCBO.',
  'OBCCCGGCCBBO',
  'OBCCLLLLLCBO',
  'OBBCCLLLCBBO',
  'OBBCCCCCCBBO',
  '.OBccccccBO.',
  '..OOBOOBOO..',
  '...O...O....',
];
const MIMIC_CHEST_B = [
  '............',
  '..OBbbbbbBO.',
  '.OBCCCCCCBO.',
  'OBCCCGGCCBBO',
  'OBCCLLLLLCBO',
  'OBBCCLLLCBBO',
  'OBBCCCCCCBBO',
  '.OBccccccBO.',
  '....OO.OO...',
  '....O...O...',
];

// Mimic revealed (open lid, red eyes, small legs): fleeing form
const MIMIC_REVEALED_A = [
  '.....D....',
  '....GcG...',
  '..OBCCCCBO',
  '.OBCCLLLBO',
  '.OBCCCCCCBO',
  '..OBCCEEBO',
  '...OBccBO.',
  '...OBBBBO.',
  '..ORO.ORO.',
  '..OO...OO.',
];
const MIMIC_REVEALED_B = [
  '.....D....',
  '....GcG...',
  '..OBCCCCBO',
  '.OBCCLLLBO',
  '.OBCCCCCCBO',
  '..OBCCEEBO',
  '...OBccBO.',
  '...OBBBBO.',
  '...OO.OO..',
  '...O...O..',
];

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    this.load.image('map_1', 'assets/map/map_1.png');
    this.load.image('map_2', 'assets/map/map_2.png');
    this.load.spritesheet('warrior_sheet', 'assets/warrior2/warrior2_sheet.png', {
      frameWidth: 128, frameHeight: 131,
    });
    this.load.spritesheet('mage_sheet', 'assets/mage/mage_sheet.png', {
      frameWidth: 128, frameHeight: 128,
    });

    // UI spritesheets
    this.load.spritesheet('ui_icons', 'assets/ui/icons.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.spritesheet('ui_icons2', 'assets/ui/icons2.png', {
      frameWidth: 32, frameHeight: 32,
    });
    this.load.spritesheet('ui_menu', 'assets/ui/menu_icons.png', {
      frameWidth: 64, frameHeight: 64,
    });
  }

  create() {
    // Characters
    makeTex(this, 'player_idle_a', PLAYER_IDLE_A, PLAYER_PALETTE);
    makeTex(this, 'player_idle_b', PLAYER_IDLE_B, PLAYER_PALETTE);
    makeTex(this, 'player_run_a',  PLAYER_RUN_A,  PLAYER_PALETTE);
    makeTex(this, 'player_run_b',  PLAYER_RUN_B,  PLAYER_PALETTE);

    makeTex(this, 'chaser_a',  CHASER_A,  CHASER_PALETTE);
    makeTex(this, 'chaser_b',  CHASER_B,  CHASER_PALETTE);
    makeTex(this, 'rusher_a',  RUSHER_A,  RUSHER_PALETTE);
    makeTex(this, 'rusher_b',  RUSHER_B,  RUSHER_PALETTE);
    makeTex(this, 'shooter_a', SHOOTER_A, SHOOTER_PALETTE);
    makeTex(this, 'shooter_b', SHOOTER_B, SHOOTER_PALETTE);
    makeTex(this, 'giant_a', GIANT_A, GIANT_PALETTE);
    makeTex(this, 'giant_b', GIANT_B, GIANT_PALETTE);
    makeTex(this, 'bomber_a', BOMBER_A, BOMBER_PALETTE);
    makeTex(this, 'bomber_b', BOMBER_B, BOMBER_PALETTE);
    makeTex(this, 'mimic_chest_a', MIMIC_CHEST_A, MIMIC_PALETTE);
    makeTex(this, 'mimic_chest_b', MIMIC_CHEST_B, MIMIC_PALETTE);
    makeTex(this, 'mimic_revealed_a', MIMIC_REVEALED_A, MIMIC_PALETTE);
    makeTex(this, 'mimic_revealed_b', MIMIC_REVEALED_B, MIMIC_PALETTE);

    // Gun: small horizontal sprite (barrel points right at angle 0)
    const gun = this.add.graphics().setVisible(false);
    gun.fillStyle(0x18181e, 1); gun.fillRect(0, 2, 14, 5);
    gun.fillStyle(0x2d2d3a, 1); gun.fillRect(1, 3, 12, 3);
    gun.fillStyle(0x6a6a78, 1); gun.fillRect(10, 3, 3, 3);
    gun.fillStyle(0x5a3a20, 1); gun.fillRect(0, 3, 3, 4);
    gun.generateTexture('gun', 14, 9);
    gun.destroy();

    // Sword: horizontal blade pointing right at angle 0; origin at grip end
    const sword = this.add.graphics().setVisible(false);
    sword.fillStyle(0x886622, 1); sword.fillRect(0, 3, 2, 3);  // pommel
    sword.fillStyle(0x3a2010, 1); sword.fillRect(2, 3, 5, 3);  // grip
    sword.fillStyle(0xaa8833, 1); sword.fillRect(7, 1, 2, 7);  // crossguard
    sword.fillStyle(0xddddee, 1); sword.fillRect(9, 3, 12, 3); // blade body
    sword.fillStyle(0xffffff, 1); sword.fillRect(9, 3, 12, 1); // top highlight
    sword.fillStyle(0xaaaabb, 1); sword.fillRect(9, 5, 12, 1); // bottom shade
    sword.fillStyle(0xffffff, 1); sword.fillRect(20, 4, 2, 1); // tip highlight
    sword.fillStyle(0xddddee, 1); sword.fillRect(21, 3, 1, 3); // tip taper
    sword.generateTexture('sword', 24, 9);
    sword.destroy();

    // Slash arc: 90° wedge facing right (+x), cyan/white crescent
    const SLASH = 96;
    const slash = this.add.graphics().setVisible(false);
    const sx = SLASH / 2, sy = SLASH / 2;
    slash.fillStyle(0x88ddff, 0.18);
    slash.beginPath(); slash.moveTo(sx, sy);
    slash.arc(sx, sy, 44, -Math.PI / 4, Math.PI / 4);
    slash.lineTo(sx, sy); slash.fillPath();
    slash.lineStyle(2, 0x66ccff, 0.45);
    slash.beginPath(); slash.arc(sx, sy, 32, -Math.PI / 4, Math.PI / 4); slash.strokePath();
    slash.lineStyle(2, 0xaaffff, 0.7);
    slash.beginPath(); slash.arc(sx, sy, 38, -Math.PI / 4, Math.PI / 4); slash.strokePath();
    slash.lineStyle(3, 0xffffff, 1);
    slash.beginPath(); slash.arc(sx, sy, 44, -Math.PI / 4, Math.PI / 4); slash.strokePath();
    slash.generateTexture('slash', SLASH, SLASH);
    slash.destroy();

    // Bullet-time vignette: screen-sized blue overlay with darker borders
    const VW = 1280, VH = 720;
    const vig = this.add.graphics().setVisible(false);
    vig.fillStyle(0x2244aa, 0.35); vig.fillRect(0, 0, VW, VH);
    vig.fillStyle(0x001133, 0.45);
    vig.fillRect(0, 0, VW, 90); vig.fillRect(0, VH - 90, VW, 90);
    vig.fillRect(0, 0, 110, VH); vig.fillRect(VW - 110, 0, 110, VH);
    vig.fillStyle(0x000022, 0.65);
    vig.fillRect(0, 0, VW, 30); vig.fillRect(0, VH - 30, VW, 30);
    vig.fillRect(0, 0, 40, VH); vig.fillRect(VW - 40, 0, 40, VH);
    vig.generateTexture('bullet_time_vignette', VW, VH);
    vig.destroy();

    // Bullet (player): bright yellow with white core
    const bullet = this.add.graphics().setVisible(false);
    bullet.fillStyle(0xffffff, 1); bullet.fillCircle(4, 4, 2);
    bullet.fillStyle(0xffe14a, 1); bullet.fillCircle(4, 4, 4);
    bullet.fillStyle(0xffffff, 1); bullet.fillCircle(4, 4, 1);
    bullet.generateTexture('bullet', 8, 8);
    bullet.destroy();

    // Enemy bullet: red-purple
    const ebul = this.add.graphics().setVisible(false);
    ebul.fillStyle(0xff77cc, 1); ebul.fillCircle(4, 4, 4);
    ebul.fillStyle(0xff2266, 1); ebul.fillCircle(4, 4, 3);
    ebul.fillStyle(0xffffff, 1); ebul.fillCircle(4, 4, 1);
    ebul.generateTexture('enemy_bullet', 8, 8);
    ebul.destroy();

    // Muzzle flash
    const flash = this.add.graphics().setVisible(false);
    flash.fillStyle(0xffffff, 1); flash.fillCircle(8, 8, 3);
    flash.fillStyle(0xffe14a, 1); flash.fillCircle(8, 8, 6);
    flash.fillStyle(0xff8a22, 0.5); flash.fillCircle(8, 8, 8);
    flash.generateTexture('muzzle', 16, 16);
    flash.destroy();

    // XP orb: cyan gem
    const orb = this.add.graphics().setVisible(false);
    orb.fillStyle(0x88eeff, 1); orb.fillCircle(5, 5, 5);
    orb.fillStyle(0x22bbff, 1); orb.fillCircle(5, 5, 4);
    orb.fillStyle(0xffffff, 1); orb.fillCircle(4, 4, 1);
    orb.generateTexture('xp', 10, 10);
    orb.destroy();

    // Skill orb: warm orange/red, distinct from XP cyan
    const sorb = this.add.graphics().setVisible(false);
    sorb.fillStyle(0xff8a22, 0.9); sorb.fillCircle(5, 5, 5);
    sorb.fillStyle(0xffcc44, 1);   sorb.fillCircle(5, 5, 4);
    sorb.fillStyle(0xff3322, 1);   sorb.fillCircle(5, 5, 2);
    sorb.fillStyle(0xffffff, 1);   sorb.fillCircle(4, 4, 1);
    sorb.generateTexture('skill_orb', 10, 10);
    sorb.destroy();

    // Siphon XP orb: gold with green glow (distinct from normal cyan XP)
    const siorb = this.add.graphics().setVisible(false);
    siorb.fillStyle(0xffd700, 1);   siorb.fillCircle(5, 5, 5);
    siorb.fillStyle(0xffaa22, 1);   siorb.fillCircle(5, 5, 4);
    siorb.fillStyle(0x44ff88, 0.7); siorb.fillCircle(5, 5, 3);
    siorb.fillStyle(0xffffff, 1);   siorb.fillCircle(4, 4, 1);
    siorb.generateTexture('xp_orb_siphon', 10, 10);
    siorb.destroy();

    // Arcane vortex: purple energy swirl (64x64)
    const VORTEX = 64;
    const vt = this.add.graphics().setVisible(false);
    const vc = VORTEX / 2;
    vt.fillStyle(0x220044, 0.3); vt.fillCircle(vc, vc, 30);
    vt.fillStyle(0x6622aa, 0.5); vt.fillCircle(vc, vc, 22);
    vt.fillStyle(0xaa44ff, 0.7); vt.fillCircle(vc, vc, 14);
    vt.fillStyle(0xdd88ff, 0.9); vt.fillCircle(vc, vc, 8);
    vt.fillStyle(0xffffff, 0.8); vt.fillCircle(vc, vc, 3);
    vt.lineStyle(2, 0xaa44ff, 0.6);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      vt.beginPath();
      vt.arc(vc, vc, 18, a, a + Math.PI / 3);
      vt.strokePath();
    }
    vt.generateTexture('arcane_vortex', VORTEX, VORTEX);
    vt.destroy();

    // Shockwave ring: transparent center, bright outer rim, faint inner halo
    const shock = this.add.graphics().setVisible(false);
    shock.fillStyle(0x66bbff, 0.18); shock.fillCircle(32, 32, 30);
    shock.lineStyle(3, 0xffffff, 1.0);  shock.strokeCircle(32, 32, 28);
    shock.lineStyle(2, 0x88ddff, 0.85); shock.strokeCircle(32, 32, 25);
    shock.lineStyle(1, 0xffffff, 0.5);  shock.strokeCircle(32, 32, 22);
    shock.generateTexture('shockwave', 64, 64);
    shock.destroy();

    // Slam impact: expanding ring shockwave (orange-yellow)
    const slamImp = this.add.graphics().setVisible(false);
    slamImp.fillStyle(0xffaa44, 0.15); slamImp.fillCircle(24, 24, 24);
    slamImp.lineStyle(3, 0xffddaa, 1.0);  slamImp.strokeCircle(24, 24, 22);
    slamImp.lineStyle(2, 0xffaa44, 0.85); slamImp.strokeCircle(24, 24, 18);
    slamImp.lineStyle(1, 0xffffff, 0.5);  slamImp.strokeCircle(24, 24, 25);
    slamImp.generateTexture('slam_impact', 48, 48);
    slamImp.destroy();

    // Slam dust particle: soft brown blob
    const dustG = this.add.graphics().setVisible(false);
    dustG.fillStyle(0x8a7a5a, 0.7); dustG.fillCircle(6, 6, 6);
    dustG.fillStyle(0xaa9a6a, 0.4); dustG.fillCircle(6, 6, 4);
    dustG.generateTexture('slam_dust', 12, 12);
    dustG.destroy();

    // Elite eye: bright red glow dot for elite enemy eyes
    const eyeG = this.add.graphics().setVisible(false);
    eyeG.fillStyle(0xff2222, 1); eyeG.fillCircle(3, 2, 2);
    eyeG.fillStyle(0xff6644, 0.7); eyeG.fillCircle(3, 2, 3);
    eyeG.generateTexture('elite_eye', 6, 4);
    eyeG.destroy();

    // Elite smoke: dark gray semi-transparent puff
    const smokeG = this.add.graphics().setVisible(false);
    smokeG.fillStyle(0x222222, 0.5); smokeG.fillCircle(5, 5, 5);
    smokeG.fillStyle(0x444444, 0.3); smokeG.fillCircle(5, 5, 3);
    smokeG.generateTexture('elite_smoke', 10, 10);
    smokeG.destroy();

    // Frost zone: blue translucent circle for frost field
    const fz = this.add.graphics().setVisible(false);
    fz.fillStyle(0x4488ff, 0.25); fz.fillCircle(32, 32, 30);
    fz.lineStyle(2, 0x88ccff, 0.6); fz.strokeCircle(32, 32, 28);
    fz.lineStyle(1, 0xaaddff, 0.4); fz.strokeCircle(32, 32, 24);
    fz.generateTexture('frost_zone', 64, 64);
    fz.destroy();

    // Ice spike: diamond crystal shape for blizzard
    const isp = this.add.graphics().setVisible(false);
    isp.fillStyle(0x88ccff, 1);
    isp.beginPath(); isp.moveTo(6, 0); isp.lineTo(12, 8); isp.lineTo(6, 20); isp.lineTo(0, 8); isp.closePath(); isp.fillPath();
    isp.fillStyle(0xffffff, 0.7);
    isp.beginPath(); isp.moveTo(6, 2); isp.lineTo(10, 8); isp.lineTo(6, 14); isp.lineTo(2, 8); isp.closePath(); isp.fillPath();
    isp.generateTexture('ice_spike', 12, 20);
    isp.destroy();

    // Time-stop clock face: dark bronze rim, ivory dial, roman markers, no hand
    const CLOCK = 96;
    const cg = this.add.graphics().setVisible(false);
    const cx = CLOCK / 2, cy = CLOCK / 2;
    cg.fillStyle(0x1a0a08, 1); cg.fillCircle(cx, cy, 46);
    cg.fillStyle(0x886622, 1); cg.fillCircle(cx, cy, 44);
    cg.fillStyle(0xddc88a, 1); cg.fillCircle(cx, cy, 40);
    cg.fillStyle(0xf2e2b0, 1); cg.fillCircle(cx, cy, 38);
    // 12 hour ticks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const major = i % 3 === 0;
      const r1 = major ? 30 : 33;
      const r2 = 38;
      const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1;
      const x2 = cx + Math.cos(a) * r2, y2 = cy + Math.sin(a) * r2;
      cg.lineStyle(major ? 3 : 1, 0x1a0a08, 1);
      cg.beginPath(); cg.moveTo(x1, y1); cg.lineTo(x2, y2); cg.strokePath();
    }
    // Center pin
    cg.fillStyle(0x1a0a08, 1); cg.fillCircle(cx, cy, 3);
    cg.generateTexture('time_stop_clock', CLOCK, CLOCK);
    cg.destroy();

    // Time-stop second hand: thin tapered needle pointing up at rotation 0
    const HAND_W = 8, HAND_H = 40;
    const hg = this.add.graphics().setVisible(false);
    hg.fillStyle(0x1a0a08, 1); hg.fillRect(HAND_W / 2 - 1, 2, 2, HAND_H - 6);
    hg.fillStyle(0xffffff, 1); hg.fillRect(HAND_W / 2 - 1, 2, 2, 6);
    hg.fillStyle(0x441100, 1); hg.fillRect(HAND_W / 2 - 2, HAND_H - 6, 4, 6);
    hg.generateTexture('time_stop_hand', HAND_W, HAND_H);
    hg.destroy();

    // Time-stop shards: 6 angular triangle pieces in deep purple/bronze
    const SHARD = 32;
    const shardPalettes = [0x886622, 0xddc88a, 0xaa4488, 0x442266, 0xcc8844, 0x6622aa];
    for (let i = 0; i < 6; i++) {
      const sg = this.add.graphics().setVisible(false);
      sg.fillStyle(shardPalettes[i], 1);
      sg.beginPath();
      sg.moveTo(SHARD / 2, 2);
      sg.lineTo(SHARD - 2, SHARD - 4);
      sg.lineTo(4, SHARD - 8);
      sg.closePath();
      sg.fillPath();
      sg.lineStyle(1, 0xffffff, 0.6);
      sg.beginPath();
      sg.moveTo(SHARD / 2, 2);
      sg.lineTo(SHARD - 2, SHARD - 4);
      sg.strokePath();
      sg.generateTexture(`time_stop_shard_${i}`, SHARD, SHARD);
      sg.destroy();
    }

    // Create animations
    this.anims.create({
      key: 'player_idle',
      frames: [{ key: 'player_idle_a' }, { key: 'player_idle_b' }],
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'player_run',
      frames: [{ key: 'player_run_a' }, { key: 'player_idle_a' }, { key: 'player_run_b' }, { key: 'player_idle_a' }],
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'mage_south_idle', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 0, end: 6 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'mage_south_run', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 0, end: 6 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'mage_east_idle', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 7, end: 13 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'mage_east_run', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 7, end: 13 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'mage_north_idle', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 14, end: 20 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'mage_north_run', frames: this.anims.generateFrameNumbers('mage_sheet', { start: 14, end: 20 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_south_idle', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 0, end: 7 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_south_run', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 0, end: 7 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_east_idle', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 8, end: 15 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_east_run', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 8, end: 15 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_north_idle', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 16, end: 23 }),
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_north_run', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 16, end: 23 }),
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'warrior_attack', frames: this.anims.generateFrameNumbers('warrior_sheet', { start: 24, end: 31 }),
      frameRate: 12, repeat: 0,
    });
    this.anims.create({
      key: 'chaser_walk',
      frames: [{ key: 'chaser_a' }, { key: 'chaser_b' }],
      frameRate: 4, repeat: -1,
    });
    this.anims.create({
      key: 'rusher_walk',
      frames: [{ key: 'rusher_a' }, { key: 'rusher_b' }],
      frameRate: 10, repeat: -1,
    });
    this.anims.create({
      key: 'shooter_walk',
      frames: [{ key: 'shooter_a' }, { key: 'shooter_b' }],
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'giant_walk',
      frames: [{ key: 'giant_a' }, { key: 'giant_b' }],
      frameRate: 3, repeat: -1,
    });
    this.anims.create({
      key: 'giant_die',
      frames: [{ key: 'giant_a' }, { key: 'giant_b' }],
      frameRate: 8, repeat: 0,
    });
    this.anims.create({
      key: 'bomber_walk',
      frames: [{ key: 'bomber_a' }, { key: 'bomber_b' }],
      frameRate: 8, repeat: -1,
    });
    this.anims.create({
      key: 'bomber_die',
      frames: [{ key: 'bomber_a' }, { key: 'bomber_b' }],
      frameRate: 8, repeat: 0,
    });
    this.anims.create({
      key: 'mimic_wander',
      frames: [{ key: 'mimic_chest_a' }, { key: 'mimic_chest_b' }],
      frameRate: 2, repeat: -1,
    });
    this.anims.create({
      key: 'mimic_flee',
      frames: [{ key: 'mimic_revealed_a' }, { key: 'mimic_revealed_b' }],
      frameRate: 10, repeat: -1,
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('debug')) {
      this.scene.start('GameScene', { class: 'mage', debug: true });
    } else {
      this.scene.start('MenuScene');
    }
  }
}
