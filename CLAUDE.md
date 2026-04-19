# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Phaser 3 is loaded via CDN in `index.html`. Requires a local static server (ES modules won't work from `file://`):

```bash
python -m http.server 8000
# Open http://localhost:8000
```

Or use VS Code Live Server extension.

There are no tests, no linter, and no bundler. All changes are verified by browser testing.

## Architecture

**Phaser 3 game with ES module structure.** All source is in `src/`, loaded as native ES modules from `index.html`.

### Scene Flow (registered in order in `main.js`)

```
BootScene → MenuScene → GameScene (parallel: HUDScene)
                          ├─ PauseScene (overlay, pauses GameScene)
                          ├─ UpgradeScene (overlay, pauses GameScene on level-up)
                          └─ GameOverScene (replaces all on death)
```

- **BootScene** — Generates ALL textures and animations procedurally via `Graphics.generateTexture()`. No external sprite assets. Every character/enemy/effect is defined as a pixel grid constant painted to a texture. All Phaser animation keys are created here.
- **GameScene** — Main game loop. Owns all physics groups (`bullets`, `enemyBullets`, `xpOrbs`, `enemies`), the `Player` instance, and the `WaveManager`. All overlap/collision callbacks live here. Calls `scene.launch('HUDScene')` which runs in parallel.
- **HUDScene** — Reads state directly from `this.scene.get('GameScene')` each frame. Has `showBanner(text)` method called by GameScene for wave transitions (deferred on first wave since launch is async).
- **UpgradeScene** — Receives `{ remaining }` data. Pauses GameScene, shows 3 random upgrade cards. Picks apply functions directly to `Player.stats`.
- **PauseScene** — Pauses GameScene, resume with ESC/P, quit-to-menu with Q.
- **GameOverScene** — Receives `{ wave, level, kills }` from GameScene via `scene.start()`.

### Entity Pattern

Entities extend `Phaser.Physics.Arcade.Sprite` and self-register via `scene.add.existing(this)` + `scene.physics.add.existing(this)`. They are pooled via `scene.physics.add.group({ classType, maxSize })`.

- **Player** — Holds `stats` object (mutable copy of `PLAYER` config). Gun is a separate sprite that rotates with mouse. `muzzle` is a `Vector2` updated each frame for bullet spawn point. Supports invulnerability frames, regen accumulation.
- **Enemy** (base) — Subclassed by `Chaser`, `Rusher`, `Shooter`. Each reads behavior from `ENEMY` config block. Enemies use `preUpdate` for AI (chase/strafe/shoot). `Shooter` uses `enemyBullets` group from scene.
- **Bullet / EnemyBullet** — Fire-and-forget projectiles with lifetime and offscreen culling. Player bullets track `hitSet` for pierce (hit same enemy only once).
- **XPOrb** — Pulses via tween, attracted to player within `XP.pickupRadius`.

### Config (`src/config.js`)

Single source of truth for all tunables: player stats, enemy definitions, wave timing, XP curve, upgrade definitions. The `UPGRADES` array contains `apply(p)` functions that mutate `Player.stats` directly. When tuning game balance, edit this file only.

### Key Conventions

- **No external assets required.** All sprites are procedural pixel art in BootScene. Texture keys are hardcoded strings referenced across scenes/entities.
- **Scene communication** uses Phaser's scene manager (`scene.get()`, `scene.pause()`, `scene.launch()`, `scene.start()` with data). No event bus.
- **`GameScene.handleEnemyDeath()`** is called by `Enemy.die()` via scene reference — this is the hook for spawning XP orbs and tracking kills.
- **Physics groups** use `runChildUpdate: true` so pooled entities get their `preUpdate` called automatically when active.

## Git & GitHub

- Remote: `https://github.com/mosedezhan/dungeon-gunner`
- Commit style: `feat:`, `fix:`, `refactor:` conventional prefixes
- Push after each meaningful change
