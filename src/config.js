export const GAME = {
  width: 960,
  height: 600,
  bg: 0x15151f,
};

export const PLAYER = {
  maxHp: 100,
  moveSpeed: 180,
  damage: 10,
  fireRateMs: 280,
  bulletSpeed: 520,
  pierce: 0,
  multishot: 1,
  regen: 0,
  invulnMs: 400,
};

export const BULLET = {
  lifetimeMs: 900,
  radius: 3,
};

export const ENEMY = {
  chaser:  { hp: 20, speed: 70,  contactDamage: 10, radius: 8,  xp: 1, tint: 0x6faa4a, bodyTint: 0x3d6b2a },
  rusher:  { hp: 12, speed: 140, contactDamage: 8,  radius: 6,  xp: 2, tint: 0xd9c04a, bodyTint: 0x8a742a },
  shooter: { hp: 30, speed: 55,  contactDamage: 6,  radius: 9,  xp: 3, tint: 0xc85a9a, bodyTint: 0x7a2a5a,
             preferredRange: 260, fireRateMs: 1400, bulletSpeed: 260, bulletDamage: 12 },
};

export const XP = {
  pickupRadius: 110,
  magnetSpeed: 320,
  baseToNext: 5,
  perLevel: 5,
};

export const WAVE = {
  durationMs: 20000,
  startSpawnMs: 1200,
  minSpawnMs: 260,
};

export const UPGRADES = [
  { id: 'damage',    name: 'Sharper Bullets',  desc: '+25% damage',         apply: p => { p.stats.damage *= 1.25; } },
  { id: 'firerate',  name: 'Faster Fingers',   desc: '+20% fire rate',      apply: p => { p.stats.fireRateMs *= 0.83; } },
  { id: 'movespeed', name: 'Swift Feet',       desc: '+15% move speed',     apply: p => { p.stats.moveSpeed *= 1.15; } },
  { id: 'maxhp',     name: 'Tough Hide',       desc: '+20 max HP (& heal)', apply: p => { p.stats.maxHp += 20; p.hp = p.stats.maxHp; } },
  { id: 'multishot', name: 'Triple Shot',      desc: '+2 bullets spread',   apply: p => { p.stats.multishot += 2; } },
  { id: 'pierce',    name: 'Piercing Rounds',  desc: '+1 pierce',           apply: p => { p.stats.pierce += 1; } },
  { id: 'bspeed',    name: 'Hot Load',         desc: '+30% bullet speed',   apply: p => { p.stats.bulletSpeed *= 1.3; } },
  { id: 'regen',     name: 'Regeneration',     desc: '+1 HP / sec',         apply: p => { p.stats.regen += 1; } },
];

export function xpToNext(level) {
  return XP.baseToNext + level * XP.perLevel;
}
