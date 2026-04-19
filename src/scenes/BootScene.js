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

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

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

    // Gun: small horizontal sprite (barrel points right at angle 0)
    const gun = this.add.graphics().setVisible(false);
    gun.fillStyle(0x18181e, 1); gun.fillRect(0, 2, 14, 5);
    gun.fillStyle(0x2d2d3a, 1); gun.fillRect(1, 3, 12, 3);
    gun.fillStyle(0x6a6a78, 1); gun.fillRect(10, 3, 3, 3);
    gun.fillStyle(0x5a3a20, 1); gun.fillRect(0, 3, 3, 4);
    gun.generateTexture('gun', 14, 9);
    gun.destroy();

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

    this.scene.start('MenuScene');
  }
}
