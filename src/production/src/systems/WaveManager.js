import { WAVE } from '../config.js';
import { Chaser } from '../entities/enemies/Chaser.js';
import { Rusher } from '../entities/enemies/Rusher.js';
import { Shooter } from '../entities/enemies/Shooter.js';

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.wave = 0;
    this.waveStartAt = 0;
    this.nextSpawnAt = 0;
    this.spawnInterval = WAVE.startSpawnMs;
    this.startWave(1);
  }

  startWave(n) {
    this.wave = n;
    this.waveStartAt = this.scene.time.now;
    this.spawnInterval = Math.max(WAVE.minSpawnMs, WAVE.startSpawnMs - (n - 1) * 90);
    this.nextSpawnAt = this.scene.time.now + 500;
    this.scene.onWaveStart?.(n);
  }

  get timeLeftMs() {
    return Math.max(0, WAVE.durationMs - (this.scene.time.now - this.waveStartAt));
  }

  mixForWave() {
    const w = this.wave;
    const mix = [Chaser];
    if (w >= 2) mix.push(Chaser);
    if (w >= 3) mix.push(Rusher);
    if (w >= 5) mix.push(Shooter);
    if (w >= 6) mix.push(Rusher);
    if (w >= 8) mix.push(Shooter);
    return mix;
  }

  update(time, delta) {
    if (time - this.waveStartAt >= WAVE.durationMs) this.startWave(this.wave + 1);
    if (time >= this.nextSpawnAt) {
      this.spawn();
      this.nextSpawnAt = time + this.spawnInterval;
    }
  }

  spawn() {
    const cam = this.scene.cameras.main;
    const pad = 50;
    const w = cam.worldView.width, h = cam.worldView.height;
    const edge = Phaser.Math.Between(0, 3);
    let x, y;
    if (edge === 0)      { x = Phaser.Math.Between(-pad, w + pad); y = -pad; }
    else if (edge === 1) { x = w + pad; y = Phaser.Math.Between(-pad, h + pad); }
    else if (edge === 2) { x = Phaser.Math.Between(-pad, w + pad); y = h + pad; }
    else                 { x = -pad; y = Phaser.Math.Between(-pad, h + pad); }

    const mix = this.mixForWave();
    const EnemyClass = Phaser.Utils.Array.GetRandom(mix);
    const enemy = new EnemyClass(this.scene, x, y);
    this.scene.enemies.add(enemy);

    const hpMult = 1 + (this.wave - 1) * 0.15;
    enemy.maxHp = Math.round(enemy.maxHp * hpMult);
    enemy.hp = enemy.maxHp;
  }
}
