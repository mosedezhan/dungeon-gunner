import { WAVE } from '../config.js';
import { Chaser } from '../entities/enemies/Chaser.js';
import { Rusher } from '../entities/enemies/Rusher.js';
import { Shooter } from '../entities/enemies/Shooter.js';
import { Giant } from '../entities/enemies/Giant.js';
import { Bomber } from '../entities/enemies/Bomber.js';
import { EliteChaser } from '../entities/enemies/EliteChaser.js';
import { EliteShooter } from '../entities/enemies/EliteShooter.js';
import { EliteGiant } from '../entities/enemies/EliteGiant.js';

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.wave = 0;
    this.waveStartAt = 0;
    this.nextSpawnAt = 0;
    this.spawnInterval = WAVE.startSpawnMs;
    this.nextEliteAt = Infinity;
    this.eliteInterval = 15000;
    this.spawnEnabled = true;
    this.startWave(1);
  }

  startWave(n) {
    this.wave = n;
    this.waveStartAt = this.scene.time.now;
    this.spawnInterval = Math.max(WAVE.minSpawnMs, WAVE.startSpawnMs - (n - 1) * 90);
    this.nextSpawnAt = this.scene.time.now + 500;
    if (n >= 10 && this.nextEliteAt === Infinity) {
      this.nextEliteAt = this.scene.time.now + 5000;
    }
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
    if (w >= 5) mix.push(Giant);
    if (w >= 9) mix.push(Giant);
    if (w >= 6) mix.push(Bomber);
    if (w >= 8) mix.push(Bomber);
    if (w >= 9) mix.push(Bomber);
    return mix;
  }

  update(time, delta) {
    if (this.spawnEnabled && time - this.waveStartAt >= WAVE.durationMs) this.startWave(this.wave + 1);
    if (this.spawnEnabled && time >= this.nextSpawnAt) {
      this.spawn();
      this.nextSpawnAt = time + this.spawnInterval;
    }
    if (this.spawnEnabled && this.wave >= 10 && time >= this.nextEliteAt) {
      this.spawnElite();
      const count = this.wave >= 13 ? 2 : 1;
      this.nextEliteAt = time + this.eliteInterval / count;
    }
  }

  spawn() {
    const pos = this._getSpawnPos();
    const mix = this.mixForWave();
    const EnemyClass = Phaser.Utils.Array.GetRandom(mix);
    const enemy = new EnemyClass(this.scene, pos.x, pos.y);
    this.scene.enemies.add(enemy);

    const hpMult = 1 + (this.wave - 1) * 0.15;
    enemy.maxHp = Math.round(enemy.maxHp * hpMult);
    enemy.hp = enemy.maxHp;
  }

  spawnElite() {
    const pos = this._getSpawnPos();
    const types = [EliteChaser, EliteShooter, EliteGiant];
    const EliteClass = Phaser.Utils.Array.GetRandom(types);
    const enemy = new EliteClass(this.scene, pos.x, pos.y);
    this.scene.enemies.add(enemy);

    const hpMult = 1 + (this.wave - 1) * 0.15;
    enemy.maxHp = Math.round(enemy.maxHp * hpMult);
    enemy.hp = enemy.maxHp;
  }

  _getSpawnPos() {
    const ring = this.scene.world.getSpawnRing(this.scene.cameras.main);
    const pad = 50;
    const edge = Phaser.Math.Between(0, 3);
    let x, y;

    if (edge === 0) {
      x = Phaser.Math.Between(ring.viewX - pad, ring.viewRight + pad);
      y = ring.viewY - pad;
    } else if (edge === 1) {
      x = ring.viewRight + pad;
      y = Phaser.Math.Between(ring.viewY - pad, ring.viewBottom + pad);
    } else if (edge === 2) {
      x = Phaser.Math.Between(ring.viewX - pad, ring.viewRight + pad);
      y = ring.viewBottom + pad;
    } else {
      x = ring.viewX - pad;
      y = Phaser.Math.Between(ring.viewY - pad, ring.viewBottom + pad);
    }

    x = Phaser.Math.Clamp(x, -pad, ring.worldW + pad);
    y = Phaser.Math.Clamp(y, -pad, ring.worldH + pad);
    return { x, y };
  }
}
