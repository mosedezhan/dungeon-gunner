import { GAME, SKILL, WORLD, CLASSES, WARRIOR, BULLET_TIME } from '../config.js';
import { Player } from '../entities/Player.js';
import { Bullet } from '../entities/Bullet.js';
import { EnemyBullet } from '../entities/EnemyBullet.js';
import { XPOrb } from '../entities/XPOrb.js';
import { SkillOrb } from '../entities/SkillOrb.js';
import { WaveManager } from '../systems/WaveManager.js';
import { World } from '../systems/World.js';
import { Mimic } from '../entities/enemies/Mimic.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create(data) {
    this.world = new World(this);
    this.world.setupPhysicsWorld();
    this.drawFloor();

    const classId = data?.class ?? 'mage';
    this.player = new Player(this, WORLD.width / 2, WORLD.height / 2, classId);

    this.bullets      = this.physics.add.group({ classType: Bullet,      runChildUpdate: true, maxSize: 200 });
    this.enemyBullets = this.physics.add.group({ classType: EnemyBullet, runChildUpdate: true, maxSize: 200 });
    this.xpOrbs       = this.physics.add.group({ classType: XPOrb,       runChildUpdate: true, maxSize: 400 });
    this.skillOrbs    = this.physics.add.group({ classType: SkillOrb,    runChildUpdate: true, maxSize: 100 });
    this.enemies      = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.onPlayerHitByEnemyBullet, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPickupXP, null, this);
    this.physics.add.overlap(this.player, this.skillOrbs, this.onPickupSkillOrb, null, this);

    this.kills = 0;
    this.slowFactor = 1;
    this._bulletTimeVignette = null;
    this.waveManager = new WaveManager(this);

    // Camera setup: smooth follow with boundary constraint
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);

    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard.on('keydown-P',   () => this.pauseGame());
    this.input.keyboard.on('keydown-Q',   () => {
      if (!this.scene.isActive() || this.player.dead) return;
      this.player.triggerSkill();
    });
    this.input.keyboard.on('keydown-F1', (e) => { e.preventDefault(); this.openDebug(); });

    this.scene.launch('HUDScene');

    if (data?.debug) {
      this.waveManager.spawnEnabled = false;
    }
  }

  pauseGame() {
    if (!this.scene.isActive() || this.player.dead) return;
    // Don't pause over upgrade or debug screen
    if (this.scene.isActive('UpgradeScene') || this.scene.isActive('DebugScene')) return;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  openDebug() {
    if (!this.scene.isActive() || this.player.dead) return;
    if (this.scene.isActive('UpgradeScene') || this.scene.isActive('PauseScene')) return;
    this.scene.pause();
    this.scene.launch('DebugScene');
  }

  drawFloor() {
    // Generate a 32x32 tile texture matching the original grid pattern
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0x15151f, 1).fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x22222e, 1);
    g.strokeRect(0, 0, 32, 32);
    g.fillStyle(0x2a2a3a, 1).fillRect(15, 15, 2, 2);
    g.generateTexture('floor_tile', 32, 32);
    g.destroy();

    // Use tileSprite to cover the entire world
    this.add.tileSprite(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 'floor_tile')
      .setDepth(-10);
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

  onPickupSkillOrb(player, orb) {
    if (!orb.active || player.dead) return;
    orb.kill();
    player.gainSkillCharge(1);
  }

  handleEnemyDeath(enemy) {
    this.kills += 1;
    const orb = this.xpOrbs.get(enemy.x, enemy.y);
    if (orb) orb.spawn(enemy.x, enemy.y, enemy.cfg.xp);
    if (Math.random() < SKILL.dropChance) {
      const so = this.skillOrbs.get(enemy.x, enemy.y);
      if (so) so.spawn(enemy.x, enemy.y);
    }

    if (enemy instanceof Mimic) {
      if (Math.random() < 0.25) {
        this.triggerLevelUp(1);
      } else {
        this.player.skillCharges = this.player.stats.skillChargesMax;
        const glow = this.add.image(this.player.x, this.player.y, 'skill_orb')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(5).setDepth(30).setAlpha(0.8);
        this.tweens.add({
          targets: glow, alpha: 0, scale: 8, duration: 400, ease: 'Cubic.easeOut',
          onComplete: () => glow.destroy(),
        });
      }
    }
  }

  useSkill(player) {
    const skillId = CLASSES[player.classId]?.skill;
    if (skillId === 'shockwave')   this.fireShockwave(player.x, player.y);
    else if (skillId === 'bullet_time') this.fireBulletTime();
  }

  performSwing(player, angle) {
    const range = player.stats.swingRange;
    const halfArc = player.stats.swingArc / 2;
    const baseDamage = player.stats.damage;
    const cleaveBonus = player.stats.cleaveBonus ?? 0;

    const hits = new Set();
    this.enemies.getChildren().forEach(e => {
      if (e.dead || hits.has(e)) return;
      const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
      if (d > range) return;
      const a = Math.atan2(e.y - player.y, e.x - player.x);
      const da = Math.abs(Phaser.Math.Angle.Wrap(a - angle));
      if (da <= halfArc) hits.add(e);
    });

    const hitCount = hits.size;
    const damage = hitCount >= 2 ? baseDamage * (1 + cleaveBonus) : baseDamage;
    hits.forEach(e => {
      e.takeDamage(damage);
      if (!e.dead) e.knockback(player.x, player.y, WARRIOR.knockbackForce);
    });

    this._spawnSwingVfx(player, angle);

    if (hitCount > 0) {
      if (hitCount >= WARRIOR.burstThreshold) {
        const flash = this.add.rectangle(0, 0, GAME.width, GAME.height, 0xffffff, 0.55)
          .setOrigin(0).setScrollFactor(0).setDepth(50);
        this.time.delayedCall(40, () => flash.destroy());
        this.cameras.main.shake(WARRIOR.burstShakeMs, WARRIOR.burstShakeIntensity);
      } else {
        this.cameras.main.shake(WARRIOR.hitShakeMs, WARRIOR.hitShakeIntensity);
      }
      if (this.slowFactor === 1) this._triggerHitStop();
    }
  }

  _spawnSwingVfx(player, angle) {
    const halfArc = player.stats.swingArc / 2;
    const startRot = angle - halfArc;
    const endRot   = angle + halfArc;
    const w = player.weapon;

    player._swingActive = true;
    w.rotation = startRot;
    w.setFlipY(false);
    this.tweens.add({
      targets: w,
      rotation: endRot,
      duration: WARRIOR.swordTweenMs,
      ease: 'Cubic.easeOut',
      onComplete: () => { player._swingActive = false; },
    });

    for (let i = 1; i <= WARRIOR.afterimageCount; i++) {
      const ghost = this.add.image(w.x, w.y, 'sword')
        .setOrigin(0.15, 0.5).setScale(2).setDepth(10)
        .setRotation(startRot).setAlpha(0.5 - i * 0.15);
      this.tweens.add({
        targets: ghost,
        rotation: endRot,
        alpha: 0,
        duration: WARRIOR.swordTweenMs + i * 40,
        ease: 'Cubic.easeOut',
        onComplete: () => ghost.destroy(),
      });
    }

    const slash = this.add.image(player.x, player.y, 'slash')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(20)
      .setRotation(angle)
      .setScale(0.6)
      .setAlpha(0.95);
    this.tweens.add({
      targets: slash,
      scale: 1.4,
      alpha: 0,
      duration: WARRIOR.slashDurationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  _triggerHitStop() {
    this.time.timeScale = 0;
    this.physics.world.isPaused = true;
    setTimeout(() => {
      this.time.timeScale = 1;
      this.physics.world.isPaused = false;
    }, WARRIOR.hitStopMs);
  }

  fireBulletTime() {
    if (this.slowFactor < 1) return;
    this.slowFactor = BULLET_TIME.slowFactor;

    const vig = this.add.image(0, 0, 'bullet_time_vignette')
      .setOrigin(0).setScrollFactor(0).setDepth(45).setAlpha(0);
    this._bulletTimeVignette = vig;
    this.tweens.add({
      targets: vig,
      alpha: BULLET_TIME.vignetteAlpha,
      duration: BULLET_TIME.vignetteFadeInMs,
      ease: 'Cubic.easeOut',
    });

    const fadeOutAt = BULLET_TIME.durationMs - BULLET_TIME.vignetteFadeOutMs;
    this.time.delayedCall(fadeOutAt, () => {
      if (!vig.scene) return;
      this.tweens.add({
        targets: vig, alpha: 0,
        duration: BULLET_TIME.vignetteFadeOutMs,
        ease: 'Cubic.easeIn',
      });
    });
    this.time.delayedCall(BULLET_TIME.durationMs, () => {
      this.slowFactor = 1;
      vig.destroy();
      if (this._bulletTimeVignette === vig) this._bulletTimeVignette = null;
    });
  }

  fireShockwave(x, y) {
    this.enemyBullets.getChildren().forEach(b => { if (b.active) b.kill(); });
    this.enemies.getChildren().forEach(e => {
      if (e.dead) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < SKILL.knockbackRadius) {
        e.takeDamage(e.maxHp * SKILL.damagePercent);
        if (!e.dead) e.knockback(x, y, SKILL.knockbackForce);
      }
    });
    this._spawnShockwaveVfx(x, y);
    this.cameras.main.shake(120, 0.004);
  }

  _spawnShockwaveVfx(x, y) {
    const ring = this.add.image(x, y, 'shockwave')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(20)
      .setScale(0.2);
    this.tweens.add({
      targets: ring,
      scale: SKILL.vfxMaxScale,
      alpha: 0,
      duration: SKILL.vfxDurationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
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
    if (this.input.activePointer.isDown) this.player.tryAttack(this.time.now);
  }
}
