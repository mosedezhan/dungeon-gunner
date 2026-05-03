## ADDED Requirements

### Requirement: Bomber Enemy Entity

The system SHALL provide a `Bomber` class extending `Enemy`, constructed with `(scene, x, y)` and configured from `ENEMY.bomber` in `config.js`. The Bomber MUST register texture key `bomber_a` and play animation `bomber_walk` on construction.

#### Scenario: Bomber spawns and walks toward player

- **WHEN** a Bomber is spawned at `(x, y)` via `new Bomber(scene, x, y)` and added to the enemies group
- **THEN** the Bomber displays texture `bomber_a`, plays animation `bomber_walk`, and moves toward the player at `cfg.speed`

### Requirement: Three-Phase State Machine

The Bomber SHALL implement a three-phase attack driven by `state` (`'idle'` | `'windup'` | `'leaping'`) and transitions based on `scene.time.now` timestamps.

```
idle → windup (when player in triggerRange and cooldown elapsed)
windup → leaping (after windUpMs / slowFactor)
leaping → explode (after leapDurationMs, NOT scaled by slowFactor)
```

#### Scenario: Trigger windUp when player in range

- **WHEN** the Bomber is in `idle` state AND the player distance is ≤ `cfg.triggerRange` AND the time since last explosion end is ≥ `cfg.cooldownMs`
- **THEN** the Bomber enters `windup` state

#### Scenario: Wind-up phase tracks player position

- **WHEN** the Bomber is in `windup` state
- **THEN** the Bomber's velocity is set to (0, 0), the Bomber visually trembles/flashes red, and `_leapTarget` is updated every frame to the player's current position
- **AND** the windUp duration is scaled by slowFactor: `cfg.windUpMs / slowFactor`

#### Scenario: Leap phase is invulnerable

- **WHEN** the Bomber enters `leaping` state
- **THEN** the Bomber's body is disabled (`body.enable = false`), making it invulnerable to bullets and contact damage
- **AND** a tween moves the Bomber from its current position to `_leapTarget` over `cfg.leapDurationMs` (NOT scaled by slowFactor)

#### Scenario: Explode on landing

- **WHEN** the leap tween completes
- **THEN** the Bomber triggers `_explode()`: distance-based AOE damage check, explosion VFX, and self-destruction (no `handleEnemyDeath` call)

### Requirement: Continuous Tracking During Wind-Up

The Bomber SHALL update its leap target to the player's current position every frame during the windUp phase. The target SHALL be locked at the moment the leap begins (transition from windup to leaping).

#### Scenario: Target updates during windUp

- **WHEN** the Bomber is in `windup` state and the player moves from position A to position B
- **THEN** `_leapTarget` tracks the player's current position (B), not the position when windUp started (A)

#### Scenario: Target locked during leap

- **WHEN** the Bomber transitions from `windup` to `leaping`
- **THEN** the leap target is the final value of `_leapTarget` and does not change during the leap

### Requirement: Dual Death Paths

#### Scenario: Killed by player — normal death

- **WHEN** the Bomber's HP reaches 0 due to player damage (bullet or swing)
- **AND** the Bomber is NOT in `leaping` state
- **THEN** `die()` plays a normal death animation (scale/fade tween) AND calls `scene.handleEnemyDeath(this)` to spawn XP orbs and increment kill count
- **AND** NO explosion occurs

#### Scenario: Self-destruct — explosion

- **WHEN** the Bomber's leap tween completes
- **THEN** `_explode()` checks if player distance ≤ `cfg.blastRadius`, applies `cfg.blastDamage` if true, plays explosion VFX, and destroys the Bomber
- **AND** `handleEnemyDeath` is NOT called (no XP orbs, no kill count increment, no SkillOrb drop)

### Requirement: Explosion VFX

The system SHALL render an explosion effect when the Bomber self-destructs: a `slam_impact` sprite (reused from Giant) scaled to match `blastRadius`, plus a brief white flash overlay. The VFX MUST clean up after itself.

#### Scenario: Explosion VFX plays on self-destruct

- **WHEN** the Bomber self-destructs via `_explode()`
- **THEN** a shockwave ring sprite spawns at the explosion point, scales up and fades out over ~300ms, AND a brief camera shake occurs

### Requirement: Bullet Time Interaction

The windUp duration SHALL be scaled by `scene.slowFactor` (divided by slowFactor), consistent with Giant's slam timing pattern. The leap duration SHALL NOT be scaled by slowFactor — the leap always takes `cfg.leapDurationMs` regardless of bullet_time state.

#### Scenario: Bullet time extends windUp

- **WHEN** bullet time is active (slowFactor = 0.3) and the Bomber is in `windup` state
- **THEN** the effective windUp duration is `cfg.windUpMs / 0.3` (e.g., 300ms → ~1000ms)

#### Scenario: Bullet time does not slow leap

- **WHEN** bullet time is active and the Bomber is in `leaping` state
- **THEN** the leap still completes in `cfg.leapDurationMs` (not extended)

### Requirement: Bomber Config Block

`config.js` SHALL contain an `ENEMY.bomber` block with the following fields:

| Field | Purpose | Expected Range |
|---|---|---|
| `hp` | Base hit points | ~18 |
| `speed` | Chase speed (px/s) | 55-60 |
| `contactDamage` | Touch damage | ~8 |
| `radius` | Physics collision radius | 7-8 |
| `xp` | XP awarded on kill | 3-4 |
| `tint` | Body primary tint | red-orange |
| `bodyTint` | Body secondary tint | darker red |
| `triggerRange` | Distance to trigger windUp | ~180 |
| `windUpMs` | Wind-up phase duration | ~300 |
| `leapDurationMs` | Leap travel time | ~150 |
| `blastRadius` | AOE damage radius | ~70-80 |
| `blastDamage` | Damage dealt by explosion | ~25 |
| `cooldownMs` | Min time between trigger attempts | ~2000 |

### Requirement: Wave Manager Registration

`WaveManager.mixForWave()` SHALL include Bomber in the spawn pool starting from wave 6. A second entry at wave 8. A third entry at wave 9.

### Requirement: Namespace Convention Compliance

| Field | Value |
|---|---|
| `id` | `bomber` |
| `texture_keys` | `[bomber_a, bomber_b]` |
| `anim_keys` | `[bomber_walk, bomber_die]` |
| `config_block` | `ENEMY.bomber` |
