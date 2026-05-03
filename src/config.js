export const GAME = {
  width: 1280,
  height: 720,
  bg: 0x15151f,
};

export const WORLD = {
  width: 3840,
  height: 3600,
};

export const PLAYER = {
  maxHp: 100000,
  moveSpeed: 180,
  damage: 10,
  fireRateMs: 280,
  bulletSpeed: 520,
  pierce: 0,
  multishot: 1,
  regen: 0,
  invulnMs: 400,
  skillChargesMax: 10,
};

export const BULLET = {
  lifetimeMs: 900,
  radius: 3,
};

export const ENEMY = {
  chaser: { hp: 20, speed: 70, contactDamage: 10, radius: 8, xp: 1, tint: 0x6faa4a, bodyTint: 0x3d6b2a },
  rusher: { hp: 12, speed: 140, contactDamage: 8, radius: 6, xp: 2, tint: 0xd9c04a, bodyTint: 0x8a742a },
  shooter: {
    hp: 30, speed: 55, contactDamage: 6, radius: 9, xp: 3, tint: 0xc85a9a, bodyTint: 0x7a2a5a,
    preferredRange: 260, fireRateMs: 1400, bulletSpeed: 260, bulletDamage: 12
  },
  giant: {
    hp: 100, speed: 38, contactDamage: 14, radius: 14, xp: 8, tint: 0xc8a878, bodyTint: 0x4a3218,
    slamTriggerRange: 130, windUpMs: 400, swingMs: 100, impactMs: 100, recoveryMs: 400,
    slamCooldownMs: 3000, slamRadius: 90, slamDamage: 25,
  },
  bomber: {
    hp: 18, speed: 55, contactDamage: 8, radius: 7, xp: 4, tint: 0xff6633, bodyTint: 0xaa2211,
    triggerRange: 180, windUpMs: 300, jumpMs: 150, leapSpeed: 300,
    blastRadius: 75, blastDamage: 25, cooldownMs: 2000,
  },
};

export const XP = {
  pickupRadius: 110,
  magnetSpeed: 320,
  baseToNext: 5,
  perLevel: 5,
};

export const SKILL = {
  pickupRadius: 110,
  magnetSpeed: 320,
  dropChance: 0.1,
  knockbackRadius: 120,
  knockbackForce: 480,
  damagePercent: 0.2,
  vfxMaxScale: 8,
  vfxDurationMs: 500,
};

export const WAVE = {
  durationMs: 20000,
  startSpawnMs: 1200,
  minSpawnMs: 260,
};

export const CLASSES = {
  mage: {
    id: 'mage',
    name: '法师',
    description: '精通弹开技能',
    textureKey: 'mage',
    skill: 'shockwave',
    color: 0x4488ff,
  },
  warrior: {
    id: 'warrior',
    name: '战士',
    description: '近战挥砍 / 子弹时间',
    textureKey: 'warrior',
    skill: 'bullet_time',
    color: 0xc8442a,
    baseStats: {
      maxHp: 120000,
      moveSpeed: 200,
      damage: 1800,
      attackRateMs: 380,
      swingRange: 80,
      swingArc: Math.PI / 2,
    },
  },
};

export const WARRIOR = {
  swordTweenMs: 120,
  slashDurationMs: 200,
  afterimageCount: 2,
  hitStopMs: 40,
  hitShakeMs: 50,
  hitShakeIntensity: 0.003,
  burstThreshold: 3,
  burstShakeMs: 120,
  burstShakeIntensity: 0.008,
  knockbackForce: 160,
};

export const BULLET_TIME = {
  slowFactor: 0.3,
  durationMs: 2500,
  vignetteFadeInMs: 150,
  vignetteFadeOutMs: 300,
  vignetteAlpha: 0.45,
};

export const UPGRADES = [
  { id: 'damage', name: 'Sharper Edge', desc: '+25% damage', classes: ['mage', 'warrior'], apply: p => { p.stats.damage *= 1.25; } },
  { id: 'firerate', name: 'Faster Fingers', desc: '+20% fire rate', classes: ['mage'], apply: p => { p.stats.fireRateMs *= 0.83; } },
  { id: 'movespeed', name: 'Swift Feet', desc: '+15% move speed', classes: ['mage', 'warrior'], apply: p => { p.stats.moveSpeed *= 1.15; } },
  { id: 'maxhp', name: 'Tough Hide', desc: '+20 max HP (& heal)', classes: ['mage', 'warrior'], apply: p => { p.stats.maxHp += 20; p.hp = p.stats.maxHp; } },
  { id: 'multishot', name: 'Triple Shot', desc: '+2 bullets spread', classes: ['mage'], apply: p => { p.stats.multishot += 2; } },
  { id: 'pierce', name: 'Piercing Rounds', desc: '+1 pierce', classes: ['mage'], apply: p => { p.stats.pierce += 1; } },
  { id: 'bspeed', name: 'Hot Load', desc: '+30% bullet speed', classes: ['mage'], apply: p => { p.stats.bulletSpeed *= 1.3; } },
  { id: 'regen', name: 'Regeneration', desc: '+1 HP / sec', classes: ['mage', 'warrior'], apply: p => { p.stats.regen += 1; } },
  {
    id: 'skillmax', name: 'Resonance Core', desc: '+1 max skill charge', classes: ['mage', 'warrior'], apply: p => {
      p.stats.skillChargesMax += 1;
      p.skillCharges = Math.min(p.stats.skillChargesMax, p.skillCharges + 1);
    }
  },
  { id: 'swingrange', name: 'Long Reach', desc: '+20% swing range', classes: ['warrior'], apply: p => { p.stats.swingRange *= 1.2; } },
  { id: 'swingarc', name: 'Wide Sweep', desc: '+15° swing arc', classes: ['warrior'], apply: p => { p.stats.swingArc += Math.PI / 12; } },
  { id: 'attackspeed', name: 'Fervor', desc: '+20% swing speed', classes: ['warrior'], apply: p => { p.stats.attackRateMs *= 0.83; } },
  { id: 'cleave', name: 'Cleaving Edge', desc: '+30% damage when hitting 2+ targets', classes: ['warrior'], apply: p => { p.stats.cleaveBonus = (p.stats.cleaveBonus ?? 0) + 0.3; } },
];

export function xpToNext(level) {
  return XP.baseToNext + level * XP.perLevel;
}
