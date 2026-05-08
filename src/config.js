export const GAME = {
  width: 1280,
  height: 720,
  bg: 0x15151f,
};

export const WORLD = {
  width: 3840,
  height: 3600,
  tileScale: 0.5,
  mapSwitchWave: 10,
  mapTransitionDurationMs: 900,
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

export const ROLL = {
  durationMs: 250,
  speed: 600,
  cooldownMs: 1000,
  iframeTint: 0x88ccff,
  dustTint: 0xaaaaaa,
  afterimageIntervalMs: 50,
  afterimageDurationMs: 200,
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
  mimic: {
    hp: 18, speed: 160, contactDamage: 0, radius: 10, xp: 8, tint: 0xc8a028, bodyTint: 0x6a4a14,
    wanderRadius: 30, wanderSpeed: 20, wanderPauseMinMs: 500, wanderPauseMaxMs: 1000,
    triggerRange: 150, fleeTimeMs: 8000, wanderTimeMs: 12000, panicAccel: 40,
    zigzagIntervalMs: 500, zigzagSpread: 0.52,
  },
  elite_chaser: {
    hp: 200, speed: 70, contactDamage: 15, radius: 10, xp: 5,
    berserkSpeed: 140, berserkThreshold: 0.6, berserkTint: 0xff3333,
  },
  elite_shooter: {
    hp: 180, speed: 55, contactDamage: 10, radius: 12, xp: 7,
    preferredRange: 260, fireRateMs: 1600, bulletSpeed: 260, bulletDamage: 12,
    spreadAngle: 0.2,
  },
  elite_giant: {
    hp: 300, speed: 38, contactDamage: 18, radius: 16, xp: 12,
    slamTriggerRange: 130, windUpMs: 400, swingMs: 100, impactMs: 100, recoveryMs: 400,
    slamCooldownMs: 3000, slamRadius: 100, slamDamage: 30,
    dashTriggerRange: 260, dashSpeed: 170, dashDurationMs: 2000, dashCooldownMs: 5000,
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
    description: '精通冲击波技能',
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
      damage: 50,
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
  // Per-level upgrades (T0 = base, T2 = max)
  durationLevels: [2500, 3500, 4500],
  slowFactorLevels: [0.30, 0.20, 0.10],
};

export const ARCANE_STORM = {
  pulseCount: 5,
  pulseIntervalMs: 800,
  baseRadius: 120,
  radiusStep: 40,
  damagePercent: 0.15,
  knockbackForce: 480,
  vfxMaxScale: 8,
  vortexDurationMs: 4000,
  vortexScale: 4,
  pulseColor: 0xaa44ff,
  // Frost overlay per pulse
  frostSlowFactors: [1, 0.5, 0.35],
  frostDurationsMs: [0, 2000, 3000],
  frostTint: 0x88ccff,
  // Siphon per pulse
  siphonOrbCounts: [0, 1, 2],
  siphonXpMultipliers: [0, 0.5, 0.75],
  siphonTint: 0x44ff88,
  siphonLineDurationMs: 300,
};

export const TIME_STOP = {
  cooldownMs: 15000,
  durationMs: 5000,
  invulnMs: 5000,
  enemyTint: 0x555555,
  bulletTint: 0x444444,
  overlayColor: 0x1a0a2a,
  overlayAlpha: 0.30,
  flashAlpha: 0.85,
  flashDurationMs: 220,
  shakeMs: 220,
  shakeIntensity: 0.012,
  // Clock face UI (top-right)
  clockX: 1180,
  clockY: 100,
  clockScale: 1.6,
  handColors: [0xffd84a, 0xff9a2a, 0xff3322],
  // Shatter
  shardCount: 6,
  shardSpeedMin: 180,
  shardSpeedMax: 360,
  shardLifetimeMs: 700,
};

export const UPGRADES = [
  { id: 'damage', name: '锋芒', desc: '+25% 伤害', classes: ['mage', 'warrior'], apply: p => { p.stats.damage *= 1.25; } },
  { id: 'firerate', name: '敏捷连射', desc: '+20% 射速', classes: ['mage'], apply: p => { p.stats.fireRateMs *= 0.83; } },
  { id: 'movespeed', name: '疾行', desc: '+15% 移动速度', classes: ['mage', 'warrior'], apply: p => { p.stats.moveSpeed *= 1.15; } },
  { id: 'maxhp', name: '坚毅之肤', desc: '+20 最大生命值（并回复至满）', classes: ['mage', 'warrior'], apply: p => { p.stats.maxHp += 20; p.hp = p.stats.maxHp; } },
  { id: 'multishot', name: '三连发', desc: '+2 发散射子弹', classes: ['mage'], apply: p => { p.stats.multishot += 2; } },
  { id: 'pierce', name: '贯穿弹', desc: '+1 穿透', classes: ['mage'], apply: p => { p.stats.pierce += 1; } },
  { id: 'bspeed', name: '急速装填', desc: '+30% 子弹速度', classes: ['mage'], apply: p => { p.stats.bulletSpeed *= 1.3; } },
  { id: 'regen', name: '愈合', desc: '+1 生命值/秒', classes: ['mage', 'warrior'], apply: p => { p.stats.regen += 1; } },
  {
    id: 'skillmax', name: '共振核心', desc: '+1 技能充能上限', classes: ['mage', 'warrior'], apply: p => {
      p.stats.skillChargesMax += 1;
      p.skillCharges = Math.min(p.stats.skillChargesMax, p.skillCharges + 1);
    }
  },
  { id: 'swingrange', name: '延伸打击', desc: '+20% 挥砍范围', classes: ['warrior'], apply: p => { p.stats.swingRange *= 1.2; } },
  { id: 'swingarc', name: '横扫阔斧', desc: '+15° 挥砍角度', classes: ['warrior'], apply: p => { p.stats.swingArc += Math.PI / 12; } },
  { id: 'attackspeed', name: '狂热', desc: '+20% 挥砍速度', classes: ['warrior'], apply: p => { p.stats.attackRateMs *= 0.83; } },
  { id: 'cleave', name: '裂地斩', desc: '命中 2+ 目标时 +30% 伤害', classes: ['warrior'], apply: p => { p.stats.cleaveBonus = (p.stats.cleaveBonus ?? 0) + 0.3; } },
  {
    id: 'bt_duration', name: '时光延展', desc: '子弹时间 +1 秒',
    classes: ['warrior'], maxLevel: 2, levelStat: 'btDurationLevel',
    apply: p => { p.stats.btDurationLevel = (p.stats.btDurationLevel ?? 0) + 1; },
  },
  {
    id: 'bt_slow', name: '引力井', desc: '子弹时间减速增强',
    classes: ['warrior'], maxLevel: 2, levelStat: 'btSlowLevel',
    apply: p => { p.stats.btSlowLevel = (p.stats.btSlowLevel ?? 0) + 1; },
  },
  {
    id: 'time_stop', name: '时停', desc: '5 秒时间停止 — 15 秒冷却',
    classes: ['warrior'], maxLevel: 1, levelStat: 'hasTimeStop',
    requires: p => (p.stats.btDurationLevel ?? 0) >= 2
      && (p.stats.btSlowLevel ?? 0) >= 2,
    apply: p => {
      p.stats.hasTimeStop = true;
      p.stats.skillId = 'time_stop';
    },
  },
  {
    id: 'frost_nova', name: '冰霜新星', desc: '冲击波附带减速',
    classes: ['mage'], maxLevel: 2, levelStat: 'frostLevel',
    apply: p => { p.stats.frostLevel = (p.stats.frostLevel ?? 0) + 1; },
  },
  {
    id: 'mana_siphon', name: '法力虹吸', desc: '冲击波吸取经验',
    classes: ['mage'], maxLevel: 2, levelStat: 'siphonLevel',
    apply: p => { p.stats.siphonLevel = (p.stats.siphonLevel ?? 0) + 1; },
  },
  {
    id: 'arcane_storm', name: '奥术风暴', desc: '5 次冲击波脉冲 — 消耗 3 充能',
    classes: ['mage'], maxLevel: 1, levelStat: 'hasArcaneStorm',
    requires: p => {
      const frost = p.stats.frostLevel ?? 0;
      const siphon = p.stats.siphonLevel ?? 0;
      return (frost + siphon) >= 3;
    },
    apply: p => { p.stats.hasArcaneStorm = true; },
  },
];

export function xpToNext(level) {
  return XP.baseToNext + level * XP.perLevel;
}
