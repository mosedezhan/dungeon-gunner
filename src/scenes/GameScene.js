import { GAME } from '../config.js';
import { Player } from '../entities/Player.js';
import { Bullet } from '../entities/Bullet.js';
import { EnemyBullet } from '../entities/EnemyBullet.js';
import { XPOrb } from '../entities/XPOrb.js';
import { WaveManager } from '../systems/WaveManager.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.physics.world.setBounds(0, 0, GAME.width, GAME.height);
    this.drawFloor();

    this.player = new Player(this, GAME.width / 2, GAME.height / 2);

    this.bullets      = this.physics.add.group({ classType: Bullet,      runChildUpdate: true, maxSize: 200 });
    this.enemyBullets = this.physics.add.group({ classType: EnemyBullet, runChildUpdate: true, maxSize: 200 });
    this.xpOrbs       = this.physics.add.group({ classType: XPOrb,       runChildUpdate: true, maxSize: 400 });
    this.enemies      = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.onPlayerHitByEnemyBullet, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPickupXP, null, this);

    this.kills = 0;
    this.waveManager = new WaveManager(this);

    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard.on('keydown-P',   () => this.pauseGame());

    this.scene.launch('HUDScene');
  }

  pauseGame() {
    if (!this.scene.isActive() || this.player.dead) return;
    // Don't pause over upgrade screen
    if (this.scene.isActive('UpgradeScene')) return;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  drawFloor() {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x15151f, 1).fillRect(0, 0, GAME.width, GAME.height);
    g.lineStyle(1, 0x22222e, 1);
    const step = 32;
    for (let x = 0; x <= GAME.width; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, GAME.height); g.strokePath(); }
    for (let y = 0; y <= GAME.height; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(GAME.width, y); g.strokePath(); }
    g.fillStyle(0x2a2a3a, 1);
    for (let x = 0; x <= GAME.width; x += step)
      for (let y = 0; y <= GAME.height; y += step)
        g.fillRect(x - 1, y - 1, 2, 2);
  }

  tryShoot() {
    if (!this.scene.isActive()) return;
    const time = this.time.now;
    if (!this.player.canShoot(time)) return;
    this.player.markShot(time);

    const angle = this.player.aimAngle();
    const mx = this.player.muzzle.x;
    const my = this.player.muzzle.y;
    const shots = Math.max(1, this.player.stats.multishot);
    const spread = 0.22;
    for (let i = 0; i < shots; i++) {
      const t = shots === 1 ? 0 : (i / (shots - 1) - 0.5) * 2;
      const a = angle + t * spread;
      const b = this.bullets.get(mx, my);
      if (!b) continue;
      b.fire(mx, my, a, this.player.stats.bulletSpeed, this.player.stats.damage, this.player.stats.pierce);
    }

    const flash = this.add.image(mx, my, 'muzzle').setDepth(12);
    flash.setBlendMode(Phaser.BlendModes.ADD).setRotation(angle);
    this.tweens.add({ targets: flash, scale: { from: 1.2, to: 0.2 }, alpha: 0, duration: 90, onComplete: () => flash.destroy() });
  }

  onBulletHitEnemy(bullet, enemy) {
    if (!bullet.active || enemy.dead) return;
    if (bullet.hitSet.has(enemy)) return;
    enemy.takeDamage(bullet.damage);
    enemy.knockback(bullet.x, bullet.y, 140);
    bullet.onHit(enemy);
  }

  onPlayerTouchEnemy(player, enemy) {
    if (enemy.dead || player.dead) return;
    if (this.time.now < enemy.contactCooldown) return;
    enemy.contactCooldown = this.time.now + 500;
    if (player.takeDamage(enemy.cfg.contactDamage, this.time.now)) {
      enemy.knockback(player.x, player.y, 180);
    }
  }

  onPlayerHitByEnemyBullet(player, bullet) {
    if (!bullet.active || player.dead) return;
    bullet.kill();
    player.takeDamage(bullet.damage, this.time.now);
  }

  onPickupXP(player, orb) {
    if (!orb.active || player.dead) return;
    const val = orb.value;
    orb.kill();
    const leveled = player.addXP(val);
    if (leveled.length > 0) this.triggerLevelUp(leveled.length);
  }

  handleEnemyDeath(enemy) {
    this.kills += 1;
    const orb = this.xpOrbs.get(enemy.x, enemy.y);
    if (orb) orb.spawn(enemy.x, enemy.y, enemy.cfg.xp);
  }

  onWaveStart(n) {
    const show = () => this.scene.get('HUDScene')?.showBanner?.(`WAVE ${n}`);
    // First wave fires before HUDScene.create runs (scene.launch is queued) — defer
    if (this.scene.isActive('HUDScene')) show();
    else this.time.delayedCall(60, show);
  }

  triggerLevelUp(count) {
    this.scene.pause();
    this.scene.launch('UpgradeScene', { remaining: count });
  }

  onPlayerDead() {
    this.time.delayedCall(350, () => {
      this.scene.stop('HUDScene');
      this.scene.stop('UpgradeScene');
      this.scene.start('GameOverScene', {
        wave: this.waveManager.wave, level: this.player.level, kills: this.kills,
      });
    });
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.waveManager.update(time, delta);
    if (this.input.activePointer.isDown) this.tryShoot();
  }
}
