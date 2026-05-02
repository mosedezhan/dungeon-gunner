## ADDED Requirements

### Requirement: Bullet Time Slows World, Not Player

The system SHALL maintain a `scene.slowFactor` numeric field on `GameScene` (default `1.0`). When bullet time activates, `slowFactor` MUST drop to a configured value in `(0, 1)` (default `0.3`) for a configured duration, then restore to `1.0`. While `slowFactor < 1.0`, the world (enemies, enemy bullets, shooter fire cadence) MUST be slowed proportionally; the player's movement speed, attack rate, and animation rate MUST be UNAFFECTED.

#### Scenario: slowFactor default state

- **WHEN** `GameScene.create()` finishes
- **THEN** `scene.slowFactor === 1.0`

#### Scenario: slowFactor drops on activation

- **WHEN** `fireBulletTime()` is invoked while `slowFactor === 1.0`
- **THEN** `scene.slowFactor` is set to the configured slow value (default `0.3`)

#### Scenario: slowFactor restores after duration

- **GIVEN** `fireBulletTime()` was invoked at time T with configured duration D
- **WHEN** time T + D is reached
- **THEN** `scene.slowFactor === 1.0`

#### Scenario: Player movement speed unaffected

- **GIVEN** `slowFactor = 0.3` is active
- **WHEN** the player holds a movement key
- **THEN** the player's actual displacement per real second equals their displacement at `slowFactor = 1.0` (player ignores slowFactor)

#### Scenario: Player attack rate unaffected

- **GIVEN** `slowFactor = 0.3` is active and the player is a warrior
- **WHEN** the player holds the left mouse button
- **THEN** swing intervals continue at `attackRateMs` real-time (the swing throttle does NOT divide by slowFactor)

### Requirement: Enemy Velocity Scaled By slowFactor

The system SHALL ensure every velocity assignment on `Enemy` instances (and subclasses) is multiplied by `scene.slowFactor` before being applied to the underlying physics body. This is achieved by overriding `Enemy.setVelocity(x, y)` to scale arguments by `scene.slowFactor` and delegate to the base implementation. The override MUST cover both AI-driven velocity changes (called from subclass `preUpdate`) and one-shot knockback impulses (called from `Enemy.knockback`). Enemies whose AI re-asserts velocity every frame MUST therefore move at `slowFactor` of their normal speed for the entire duration that `slowFactor < 1.0`.

#### Scenario: Enemy moves at slowFactor of normal speed

- **GIVEN** `slowFactor = 0.3` is active and an enemy with normal speed S
- **WHEN** the enemy executes its AI for one frame
- **THEN** the enemy's effective displacement that frame is `S × 0.3 × delta_seconds`

#### Scenario: Knockback impulse scaled at apply time

- **GIVEN** `slowFactor = 0.3` is active
- **WHEN** an enemy receives a knockback impulse of magnitude `power` via `Enemy.knockback`
- **THEN** the body's velocity becomes `power × 0.3` (scaled by the override), and standard Phaser drag decays it from that lower starting value (resulting in a shorter visual knockback trajectory rather than a longer-duration one)

### Requirement: Enemy Bullet Velocity Scaled By slowFactor

`EnemyBullet.preUpdate(time, delta)` SHALL rescale the bullet's current velocity by `scene.slowFactor` every frame, identically to enemies. Player bullets MUST NOT be scaled.

#### Scenario: Enemy bullet flies at slowFactor of normal speed

- **GIVEN** `slowFactor = 0.3` is active and an enemy bullet fired at speed S
- **WHEN** the bullet's `preUpdate` runs that frame
- **THEN** the bullet's effective displacement is `S × 0.3 × delta_seconds`

#### Scenario: Player bullets unaffected

- **GIVEN** `slowFactor = 0.3` is active and a player (mage) bullet exists
- **WHEN** the bullet's `preUpdate` runs that frame
- **THEN** the bullet's velocity is NOT scaled by slowFactor; it travels at its full configured speed

### Requirement: Shooter Fire Cadence Slowed Proportionally

`Shooter` enemies SHALL use an effective fire interval of `fireRateMs / scene.slowFactor` when checking whether to fire. This means at `slowFactor = 0.3`, shooter fire intervals stretch to ~3.33× the base interval, matching the visual sense that "everything in the world is slow".

#### Scenario: Shooter fires less often during bullet time

- **GIVEN** a shooter with `fireRateMs = 1400` AND `slowFactor = 0.3`
- **WHEN** the shooter checks if it can fire
- **THEN** the effective interval is `1400 / 0.3 ≈ 4666` ms; the shooter fires only when at least that interval has elapsed since the last shot

#### Scenario: Shooter fire cadence restores after bullet time ends

- **GIVEN** bullet time has ended and `slowFactor === 1.0`
- **WHEN** the shooter checks if it can fire on subsequent frames
- **THEN** the effective interval returns to `fireRateMs` (1400 ms in the example)

### Requirement: Bullet Time Skill Trigger

The bullet time skill SHALL be triggered via `GameScene.fireBulletTime()`, which MUST be invoked by `useSkill(player)` when `CLASSES[player.classId].skill === 'bullet_time'`. Triggering MUST consume exactly one charge from `player.skillCharges`. Triggering bullet time again while already active MUST NOT extend or refresh the duration; the second trigger SHALL be a no-op (no charge consumed beyond the standard `useSkill` semantics, which already gate on `skillCharges > 0` via `Player.triggerSkill`).

#### Scenario: Successful trigger

- **WHEN** the warrior presses Q while `skillCharges >= 1`, `slowFactor === 1.0`, and the player is alive and the scene is not paused
- **THEN** `skillCharges` decreases by 1 AND `slowFactor` drops to the configured slow value AND the bullet time VFX activates

#### Scenario: Re-trigger during active bullet time is a no-op

- **GIVEN** bullet time is already active (`slowFactor < 1.0`)
- **WHEN** the player presses Q with `skillCharges >= 1`
- **THEN** `fireBulletTime()` returns without effect: `slowFactor` is unchanged, the duration timer is not reset, and `skillCharges` is unchanged (the gate is in `fireBulletTime` itself, not in `Player.triggerSkill`)

### Requirement: Bullet Time Visual Effect

The system SHALL render a screen-space VFX while bullet time is active: a procedurally-generated semi-transparent blue vignette overlay that fades in within ~150ms of activation AND fades out within ~300ms before slowFactor restores. The vignette texture MUST be created in `BootScene` (no external assets), MUST be screen-locked (not affected by camera scroll), MUST sit at a depth above gameplay sprites but below HUD, AND MUST be cleaned up after fade-out completes.

#### Scenario: Vignette fades in on activation

- **WHEN** `fireBulletTime()` activates
- **THEN** a vignette overlay sprite is created at scroll-locked screen position, alpha tweens from 0 to its configured peak alpha within the configured fade-in duration

#### Scenario: Vignette fades out before restore

- **GIVEN** bullet time has been active for `duration - fadeOutMs`
- **WHEN** the fade-out tween starts
- **THEN** the vignette alpha tweens from peak to 0 within the fade-out duration; the sprite is destroyed when `slowFactor` restores to 1.0

#### Scenario: Vignette respects screen scroll

- **WHEN** the player moves and the camera follows during active bullet time
- **THEN** the vignette overlay remains aligned to the screen viewport, not the world (does not scroll out of view)
