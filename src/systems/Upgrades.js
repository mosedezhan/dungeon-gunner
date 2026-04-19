import { UPGRADES } from '../config.js';

export function randomUpgrades(count) {
  return Phaser.Utils.Array.Shuffle(UPGRADES.slice()).slice(0, count);
}
