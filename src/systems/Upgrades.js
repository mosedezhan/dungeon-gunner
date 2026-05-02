import { UPGRADES } from '../config.js';

export function randomUpgrades(count, classId) {
  const pool = classId
    ? UPGRADES.filter(u => u.classes.includes(classId))
    : UPGRADES.slice();
  return Phaser.Utils.Array.Shuffle(pool.slice()).slice(0, count);
}
