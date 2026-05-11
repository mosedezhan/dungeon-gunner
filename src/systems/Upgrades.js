import { UPGRADES } from '../config.js';

export function randomUpgrades(count, player) {
  const classId = player?.classId;
  const stats = player?.stats ?? {};

  const pool = UPGRADES.filter(u => {
    if (classId && !u.classes.includes(classId)) return false;
    if (u.maxLevel && u.levelStat) {
      const cur = Number(stats[u.levelStat] ?? 0);
      if (cur >= u.maxLevel) return false;
    }
    if (u.prerequisites?.length) {
      const met = u.prerequisites.every(pre => (stats[pre.stat] ?? 0) >= pre.min);
      if (!met) return false;
    }
    if (u.requires && !u.requires(player)) return false;
    return true;
  });

  let picks = Phaser.Utils.Array.Shuffle(pool.slice()).slice(0, count);

  // First-time guarantee for time_stop unlock card.
  const ts = pool.find(u => u.id === 'time_stop');
  if (ts && !stats.timeStopShown && !picks.includes(ts)) {
    if (picks.length === 0) picks = [ts];
    else picks[picks.length - 1] = ts;
  }
  if (ts) stats.timeStopShown = true;

  // First-time guarantee for arcane_storm unlock card.
  const as = pool.find(u => u.id === 'arcane_storm');
  if (as && !stats.arcaneStormShown && !picks.includes(as)) {
    if (picks.length === 0) picks = [as];
    else picks[picks.length - 1] = as;
  }
  if (as) stats.arcaneStormShown = true;

  return picks;
}
