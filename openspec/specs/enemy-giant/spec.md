## ADDED Requirements

### Requirement: Giant Enemy Entity

The system SHALL provide a `Giant` class extending `Enemy`, constructed with `(scene, x, y)` and configured from `ENEMY.giant` in `config.js`. The Giant MUST register texture key `giant_a` and play animation `giant_walk` on construction. The Giant's collision radius MUST be set from `cfg.radius` (expected ~14-16) via `body.setCircle()`.

#### Scenario: Giant spawns and walks toward player

- **WHEN** a Giant is spawned at `(x, y)` via `new Giant(scene, x, y)` and added to the enemies group
- **THEN** the Giant displays texture `giant_a`, plays animation `giant_walk`, and moves toward the player at `cfg.speed` (expected 35-40 px/s)

#### Scenario: Giant physics body matches config

- **WHEN** a Giant is constructed
- **THEN** `body.setCircle` is called with `cfg.radius` and appropriate offset so the circle is centered on the sprite

### Requirement: Slam State Machine

The Giant SHALL implement a four-phase slam attack driven by `slamState` (`'idle'` | `'windup'` | `'swing'` | `'impact'` | `'recovery'`) and transitions based on `scene.time.now` timestamps. The state machine MUST progress through windup → swing → impact → recovery → idle in sequence. Each transition is time-driven, not tween-driven.

#### Scenario: Trigger slam when player in range

- **WHEN** the Giant is in `idle` state AND the player distance is ≤ `cfg.slamTriggerRange` AND the time since last slam end is ≥ `cfg.slamCooldownMs`
- **THEN** the Giant enters `windup` state, records `slamStartAt = scene.time.now`

#### Scenario: Wind-up phase behavior

- **WHEN** the Giant is in `windup` state
- **THEN** the Giant's velocity is set to (0, 0) every frame, a ground warning circle is displayed at the Giant's position with radius = `cfg.slamRadius`, and the Giant sprite plays a subtle tremor effect
- **AND** no chase movement occurs

#### Scenario: Swing phase transition

- **WHEN** the Giant has been in `windup` state for `cfg.windUpMs` (expected ~400ms)
- **THEN** the Giant enters `swing` state and the warning circle is destroyed

#### Scenario: Impact phase with AOE damage

- **WHEN** the Giant enters `impact` state
- **THEN** the system checks if `Phaser.Math.Distance.Between(giant, player)` ≤ `cfg.slamRadius`
- **AND** if true, the player takes `cfg.slamDamage` damage (pure damage, no knockback on player)
- **AND** a shockwave VFX sprite is spawned at the Giant's position, scales up and fades out over ~300ms, then is destroyed
- **AND** the camera shakes with configured intensity

#### Scenario: Recovery phase behavior

- **WHEN** the Giant is in `recovery` state
- **THEN** the Giant's velocity is set to (0, 0) every frame and no chase movement occurs

#### Scenario: Return to idle after recovery

- **WHEN** the Giant has been in `recovery` state for `cfg.recoveryMs` (expected ~400ms)
- **THEN** the Giant returns to `idle` state and resumes chase behavior

#### Scenario: Slam does not trigger during bullet_time slowdown

- **WHEN** the Giant is in `idle` state AND `scene.slowFactor < 1.0` (bullet time active)
- **THEN** the slam state machine does NOT progress — the Giant continues chase behavior at reduced speed
- **NOTE**: This is the default behavior since `cfg.windUpMs` is compared against `scene.time.now` which is real-time, and the Giant's velocity is already scaled by `slowFactor` via `Enemy.setVelocity` override. No special handling needed unless slam timing should also be affected by slowFactor.

### Requirement: Wind-up Ground Warning Circle

The system SHALL display a semi-transparent red stroked circle on the ground during the Giant's wind-up phase. The circle MUST have its radius equal to `cfg.slamRadius`, be centered on the Giant's position, and use a pulsing alpha effect (oscillating between configurable min/max alpha values) to convey urgency. The warning circle MUST be destroyed on impact phase entry.

#### Scenario: Warning circle appears during wind-up

- **WHEN** the Giant enters `windup` state
- **THEN** a red stroked circle appears at the Giant's position with radius = `cfg.slamRadius` and pulses in alpha

#### Scenario: Warning circle removed on impact

- **WHEN** the Giant transitions from `windup` to `swing`
- **THEN** the warning circle graphics object is destroyed

### Requirement: Slam Impact VFX

The system SHALL render a shockwave ring effect at the point of impact. The shockwave MUST be a pre-generated ring texture (`slam_impact`) spawned as a sprite, scaled up rapidly while fading to 0 alpha over ~300ms, then destroyed.

#### Scenario: Shockwave VFX plays on impact

- **WHEN** the Giant enters `impact` state
- **THEN** a `slam_impact` sprite spawns at the Giant's position, scales from 1× to a configured max scale (e.g., matching `slamRadius`), fades alpha to 0, and is destroyed on tween completion

### Requirement: Enhanced Death Effect

The Giant SHALL override the base `Enemy.die()` method with an amplified death animation: longer duration (~400ms vs base 260ms), wider random rotation (±180° vs ±120°), and an accompanying camera shake (e.g., 200ms, intensity 0.005). The override MUST still call `scene.handleEnemyDeath(this)` to preserve XP orb spawning and kill counting.

#### Scenario: Giant death plays enhanced animation

- **WHEN** a Giant's HP reaches 0
- **THEN** `die()` triggers: `handleEnemyDeath` is called, the sprite tweens to scale 0.3, alpha 0, random angle ±180° over 400ms, camera shakes for 200ms at 0.005 intensity, and the sprite is destroyed on tween completion

#### Scenario: XP and kill count preserved

- **WHEN** a Giant dies
- **THEN** `scene.handleEnemyDeath(this)` is called before the death tween begins, so XP orbs spawn and the kill counter increments identically to other enemy types

### Requirement: Giant Config Block

`config.js` SHALL contain an `ENEMY.giant` block with the following fields:

| Field | Purpose | Expected Range |
|---|---|---|
| `hp` | Base hit points | 60-80 |
| `speed` | Chase speed (px/s) | 35-40 |
| `contactDamage` | Touch damage per contact cooldown | 12-15 |
| `radius` | Physics collision radius | 14-16 |
| `xp` | XP awarded on kill | 5-6 |
| `tint` | Body primary tint | earthy brown/tan |
| `bodyTint` | Body secondary tint | darker brown |
| `slamTriggerRange` | Distance to player that initiates slam | ~110 |
| `windUpMs` | Wind-up phase duration | ~400 |
| `swingMs` | Swing phase duration | ~100 |
| `impactMs` | Impact phase duration (VFX window) | ~100 |
| `recoveryMs` | Recovery phase duration | ~400 |
| `slamCooldownMs` | Minimum time between slams | ~3000 |
| `slamRadius` | AOE damage radius | ~70 |
| `slamDamage` | Damage dealt by slam | 20-25 |

#### Scenario: Giant config read from config.js

- **WHEN** a Giant is constructed
- **THEN** all behavior parameters (speed, hp, slam timing, damage values) are read from `ENEMY.giant` — no hardcoded values in Giant.js

### Requirement: Wave Manager Registration

`WaveManager.mixForWave()` SHALL include Giant in the spawn pool starting from wave 4. A second Giant entry SHALL be added at wave 7. A third Giant entry SHALL be added at wave 9.

#### Scenario: Giant appears in wave 4

- **WHEN** wave number is ≥ 4
- **THEN** `Giant` is in the spawn mix (1 entry)

#### Scenario: Second Giant entry in wave 7

- **WHEN** wave number is ≥ 7
- **THEN** `Giant` appears twice in the spawn mix, increasing spawn probability

#### Scenario: Third Giant entry in wave 9

- **WHEN** wave number is ≥ 9
- **THEN** `Giant` appears three times in the spawn mix

### Requirement: Namespace Convention Compliance

The Giant enemy SHALL comply with `src/entities/CLAUDE.md` naming conventions:

| Field | Value |
|---|---|
| `id` | `giant` |
| `texture_keys` | `[giant_a, giant_b]` |
| `anim_keys` | `[giant_walk, giant_die]` |
| `config_block` | `ENEMY.giant` |

All texture and animation key prefixes MUST equal the `id` (`giant`).

#### Scenario: Texture keys prefixed with id

- **WHEN** BootScene generates Giant textures
- **THEN** texture keys are `giant_a` and `giant_b` (prefix `giant` matches id)

#### Scenario: Animation keys prefixed with id

- **WHEN** BootScene registers Giant animations
- **THEN** animation keys are `giant_walk` and `giant_die` (prefix `giant` matches id)
