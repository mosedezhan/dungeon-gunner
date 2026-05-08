import { GAME, SKILL, WORLD, CLASSES, WARRIOR, BULLET_TIME, TIME_STOP, ARCANE_STORM } from '../config.js';
import { Player } from '../entities/Player.js';
import { Bullet } from '../entities/Bullet.js';
import { EnemyBullet } from '../entities/EnemyBullet.js';
import { XPOrb } from '../entities/XPOrb.js';
import { SkillOrb } from '../entities/SkillOrb.js';
import { SiphonOrb } from '../entities/SiphonOrb.js';
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
    this.siphonOrbs   = this.physics.add.group({ classType: SiphonOrb,   runChildUpdate: true, maxSize: 200 });
    this.enemies      = this.physics.add.group();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouchEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.onPlayerHitByEnemyBullet, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPickupXP, null, this);
    this.physics.add.overlap(this.player, this.skillOrbs, this.onPickupSkillOrb, null, this);
    this.physics.add.overlap(this.player, this.siphonOrbs, this.onPickupXP, null, this);

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

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => {
      if (pointer.button !== 2) return;
      if (!this.scene.isActive() || this.player.dead) return;
      this.player.tryRoll(this.time.now);
    });

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
    const ts = this.add.tileSprite(WORLD.width / 2, WORLD.height / 2, WORLD.width, WORLD.height, 'map_1')
      .setDepth(-10);
    ts.tileScaleX = WORLD.tileScale;
    ts.tileScaleY = WORLD.tileScale;
    this.floorTile = ts;
  }

  triggerMapTransition() {
    const duration = WORLD.mapTransitionDurationMs;
    this.player.invulnUntil = this.time.now + duration;

    const cam = this.cameras.main;
    cam.fadeOut(400, 255, 255, 255);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.floorTile.setTexture('map_2');
      cam.shake(150, 0.003);
      cam.fadeIn(400, 255, 255, 255);
    });
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
    const skillId = player.stats.skillId ?? CLASSES[player.classId]?.skill;
    if (skillId === 'shockwave') {
      if (player.stats.hasArcaneStorm && player.skillCharges >= 3 && !this._arcaneStormActive) {
        return this.fireArcaneStorm(player.x, player.y);
      }
      this.fireShockwave(player.x, player.y);
      return true;
    }
    if (skillId === 'bullet_time') return this.fireBulletTime();
    if (skillId === 'time_stop')   return this.fireTimeStop();
    return false;
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
    if (this.slowFactor < 1) return false;
    const stats = this.player?.stats ?? {};
    const slowLvl = Math.min(stats.btSlowLevel ?? 0, BULLET_TIME.slowFactorLevels.length - 1);
    const durLvl  = Math.min(stats.btDurationLevel ?? 0, BULLET_TIME.durationLevels.length - 1);
    const slowFactor = BULLET_TIME.slowFactorLevels[slowLvl];
    const durationMs = BULLET_TIME.durationLevels[durLvl];

    this.slowFactor = slowFactor;

    const vig = this.add.image(0, 0, 'bullet_time_vignette')
      .setOrigin(0).setScrollFactor(0).setDepth(45).setAlpha(0);
    this._bulletTimeVignette = vig;
    this.tweens.add({
      targets: vig,
      alpha: BULLET_TIME.vignetteAlpha,
      duration: BULLET_TIME.vignetteFadeInMs,
      ease: 'Cubic.easeOut',
    });

    const fadeOutAt = durationMs - BULLET_TIME.vignetteFadeOutMs;
    this.time.delayedCall(fadeOutAt, () => {
      if (!vig.scene) return;
      this.tweens.add({
        targets: vig, alpha: 0,
        duration: BULLET_TIME.vignetteFadeOutMs,
        ease: 'Cubic.easeIn',
      });
    });
    this.time.delayedCall(durationMs, () => {
      this.slowFactor = 1;
      vig.destroy();
      if (this._bulletTimeVignette === vig) this._bulletTimeVignette = null;
    });
    return true;
  }

  fireTimeStop() {
    if (this.slowFactor < 1) return false;
    if (this._timeStopActive) return false;
    this._timeStopActive = true;
    this.slowFactor = 0;

    const player = this.player;
    player.invulnUntil = Math.max(player.invulnUntil, this.time.now + TIME_STOP.invulnMs);

    // Trigger flash + shake
    const flash = this.add.rectangle(0, 0, GAME.width, GAME.height, 0xffffff, TIME_STOP.flashAlpha)
      .setOrigin(0).setScrollFactor(0).setDepth(48);
    this.tweens.add({
      targets: flash, alpha: 0, duration: TIME_STOP.flashDurationMs,
      ease: 'Cubic.easeOut', onComplete: () => flash.destroy(),
    });
    this.cameras.main.shake(TIME_STOP.shakeMs, TIME_STOP.shakeIntensity);

    // Greyscale overlay (camera-locked, behind clock UI)
    const overlay = this.add.rectangle(0, 0, GAME.width, GAME.height, TIME_STOP.overlayColor, 0)
      .setOrigin(0).setScrollFactor(0).setDepth(44);
    this.tweens.add({ targets: overlay, alpha: TIME_STOP.overlayAlpha, duration: 180 });

    // Tint frozen actors
    const tintedEnemies = [];
    this.enemies.getChildren().forEach(e => {
      if (e.dead || !e.active) return;
      tintedEnemies.push(e);
      e.setTint(TIME_STOP.enemyTint);
    });
    const tintedBullets = [];
    this.enemyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      tintedBullets.push(b);
      b.setTint(TIME_STOP.bulletTint);
    });

    // Clock UI: face + rotating hand (top-right, camera-locked)
    const cx = TIME_STOP.clockX, cy = TIME_STOP.clockY, cs = TIME_STOP.clockScale;
    const clock = this.add.image(cx, cy, 'time_stop_clock')
      .setScrollFactor(0).setDepth(46).setScale(cs).setAlpha(0);
    const hand = this.add.image(cx, cy, 'time_stop_hand')
      .setScrollFactor(0).setDepth(47).setScale(cs).setAlpha(0)
      .setOrigin(0.5, 0.85).setRotation(0).setTint(TIME_STOP.handColors[0]);
    this.tweens.add({ targets: [clock, hand], alpha: 1, duration: 200 });

    // Hand sweeps a full revolution over duration; tint shifts gold→orange→red
    const totalMs = TIME_STOP.durationMs;
    const colors = TIME_STOP.handColors;
    this.tweens.add({
      targets: hand,
      rotation: Math.PI * 2,
      duration: totalMs,
      ease: 'Linear',
      onUpdate: () => {
        const t = Phaser.Math.Clamp(hand.rotation / (Math.PI * 2), 0, 1);
        const idx = t < 0.6 ? 0 : t < 0.9 ? 1 : 2;
        hand.setTint(colors[idx]);
        if (idx === 2) {
          hand.setScale(cs * (1 + 0.04 * Math.sin(this.time.now / 30)));
        }
      },
    });

    // End: shatter + greyscale fade-out + flash + shake
    this.time.delayedCall(totalMs, () => {
      this._timeStopActive = false;
      this.slowFactor = 1;
      tintedEnemies.forEach(e => { if (e && e.active && !e.dead) e.clearTint(); });
      tintedBullets.forEach(b => { if (b && b.active) b.clearTint(); });

      // Shatter clock into shards
      const shardCount = TIME_STOP.shardCount;
      for (let i = 0; i < shardCount; i++) {
        const key = `time_stop_shard_${i % 6}`;
        const shard = this.add.image(cx, cy, key)
          .setScrollFactor(0).setDepth(47).setScale(cs);
        const a = (i / shardCount) * Math.PI * 2 + Math.random() * 0.6;
        const speed = Phaser.Math.Between(TIME_STOP.shardSpeedMin, TIME_STOP.shardSpeedMax);
        const tx = cx + Math.cos(a) * speed * (TIME_STOP.shardLifetimeMs / 1000);
        const ty = cy + Math.sin(a) * speed * (TIME_STOP.shardLifetimeMs / 1000) + 80;
        this.tweens.add({
          targets: shard,
          x: tx, y: ty,
          rotation: Phaser.Math.FloatBetween(-Math.PI * 2, Math.PI * 2),
          alpha: 0,
          duration: TIME_STOP.shardLifetimeMs,
          ease: 'Cubic.easeIn',
          onComplete: () => shard.destroy(),
        });
      }
      clock.destroy();
      hand.destroy();

      // Greyscale fade-out + closing flash
      this.tweens.add({
        targets: overlay, alpha: 0, duration: 260,
        onComplete: () => overlay.destroy(),
      });
      const endFlash = this.add.rectangle(0, 0, GAME.width, GAME.height, 0xffffff, 0.6)
        .setOrigin(0).setScrollFactor(0).setDepth(48);
      this.tweens.add({
        targets: endFlash, alpha: 0, duration: 180,
        onComplete: () => endFlash.destroy(),
      });
      this.cameras.main.shake(TIME_STOP.shakeMs, TIME_STOP.shakeIntensity);
    });
    return true;
  }

  fireShockwave(x, y) {
    const p = this.player;
    const frostLevel = p.stats.frostLevel ?? 0;
    const siphonLevel = p.stats.siphonLevel ?? 0;

    this.enemyBullets.getChildren().forEach(b => { if (b.active) b.kill(); });
    this.enemies.getChildren().forEach(e => {
      if (e.dead) return;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < SKILL.knockbackRadius) {
        e.takeDamage(e.maxHp * SKILL.damagePercent);
        if (!e.dead) e.knockback(x, y, SKILL.knockbackForce);

        // Frost slow
        if (frostLevel > 0 && !e.dead) {
          e.frostSlowFactor = ARCANE_STORM.frostSlowFactors[frostLevel];
          e.frostSlowUntil = this.time.now + ARCANE_STORM.frostDurationsMs[frostLevel];
          e.setTint(ARCANE_STORM.frostTint);
        }

        // Mana siphon: green flash + siphon orbs
        if (siphonLevel > 0 && !e.dead) {
          this._spawnSiphonVfx(e.x, e.y, p, siphonLevel, e.cfg.xp);
        }
      }
    });
    this._spawnShockwaveVfx(x, y);
    this.cameras.main.shake(120, 0.004);
  }

  _spawnSiphonVfx(ex, ey, player, siphonLevel, enemyXp) {
    // Green flash on enemy
    const flash = this.add.image(ex, ey, 'xp_orb_siphon')
      .setBlendMode(Phaser.BlendModes.ADD).setScale(3).setDepth(20).setAlpha(0.8);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 5, duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Green energy line from enemy to player
    const line = this.add.graphics().setDepth(21);
    line.lineStyle(2, ARCANE_STORM.siphonTint, 0.8);
    line.beginPath();
    line.moveTo(ex, ey);
    line.lineTo(player.x, player.y);
    line.strokePath();
    this.tweens.add({
      targets: line, alpha: 0, duration: ARCANE_STORM.siphonLineDurationMs,
      onComplete: () => line.destroy(),
    });

    // Spawn gold XP orbs near player after short delay
    const orbCount = ARCANE_STORM.siphonOrbCounts[siphonLevel];
    const xpMult = ARCANE_STORM.siphonXpMultipliers[siphonLevel];
    const orbValue = Math.max(1, Math.round(enemyXp * xpMult));
    this.time.delayedCall(ARCANE_STORM.siphonLineDurationMs * 0.6, () => {
      for (let i = 0; i < orbCount; i++) {
        const ox = player.x + Phaser.Math.Between(-20, 20);
        const oy = player.y + Phaser.Math.Between(-20, 20);
        const orb = this.siphonOrbs.get(ox, oy);
        if (orb) orb.spawn(ox, oy, orbValue);
      }
    });
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

  fireArcaneStorm(x, y) {
    if (this._arcaneStormActive) return false;
    this._arcaneStormActive = true;

    const p = this.player;
    const frostLevel = p.stats.frostLevel ?? 0;
    const siphonLevel = p.stats.siphonLevel ?? 0;
    const pulseCount = ARCANE_STORM.pulseCount;

    // Spawn central vortex
    const vortex = this.add.image(x, y, 'arcane_vortex')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(19)
      .setScale(0.5)
      .setAlpha(0.8);
    this.tweens.add({
      targets: vortex,
      rotation: Math.PI * 4,
      scale: ARCANE_STORM.vortexScale,
      alpha: 0.3,
      duration: ARCANE_STORM.vortexDurationMs,
      ease: 'Linear',
    });

    // Update vortex position to follow player
    const vortexFollow = () => {
      if (vortex.scene) {
        vortex.x = p.x;
        vortex.y = p.y;
      }
    };

    // Fire pulses at intervals
    for (let i = 0; i < pulseCount; i++) {
      this.time.delayedCall(i * ARCANE_STORM.pulseIntervalMs, () => {
        if (!this._arcaneStormActive) return;

        const radius = ARCANE_STORM.baseRadius + i * ARCANE_STORM.radiusStep;
        const px = p.x, py = p.y;

        // Clear enemy bullets
        this.enemyBullets.getChildren().forEach(b => { if (b.active) b.kill(); });

        // Damage + effects in radius
        this.enemies.getChildren().forEach(e => {
          if (e.dead) return;
          const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
          if (d < radius) {
            e.takeDamage(e.maxHp * ARCANE_STORM.damagePercent);
            if (!e.dead) e.knockback(px, py, ARCANE_STORM.knockbackForce);

            // Inherit frost
            if (frostLevel > 0 && !e.dead) {
              e.frostSlowFactor = ARCANE_STORM.frostSlowFactors[frostLevel];
              e.frostSlowUntil = this.time.now + ARCANE_STORM.frostDurationsMs[frostLevel];
              e.setTint(ARCANE_STORM.frostTint);
            }

            // Inherit siphon
            if (siphonLevel > 0 && !e.dead) {
              this._spawnSiphonVfx(e.x, e.y, p, siphonLevel, e.cfg.xp);
            }
          }
        });

        // Purple shockwave ring
        const ring = this.add.image(px, py, 'shockwave')
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(20)
          .setScale(0.3)
          .setTint(ARCANE_STORM.pulseColor);
        this.tweens.add({
          targets: ring,
          scale: SKILL.vfxMaxScale + i * 0.5,
          alpha: 0,
          duration: SKILL.vfxDurationMs,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });

        this.cameras.main.shake(100, 0.005);
        vortexFollow();
      });
    }

    // End storm
    this.time.delayedCall(pulseCount * ARCANE_STORM.pulseIntervalMs + 200, () => {
      this._arcaneStormActive = false;
      this.tweens.add({
        targets: vortex, alpha: 0, scale: ARCANE_STORM.vortexScale * 1.5, duration: 300,
        onComplete: () => vortex.destroy(),
      });
    });

    return 3; // consume 3 charges
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
    if (this.input.activePointer.leftButtonDown()) this.player.tryAttack(this.time.now);
  }
}
