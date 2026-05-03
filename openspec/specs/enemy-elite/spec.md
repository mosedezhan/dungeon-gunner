## ADDED Requirements

### Requirement: Elite Visual Layer

All elite enemies SHALL share a common visual treatment:
- `setScale(2.4)` (base scale 2.0 + 20%)
- Body tint set to dark/black (`0x222222`) via `setTintFill`
- Two red eye sprites (`elite_eye` texture) positioned relative to the body, using `setTintFill(0xff0000)`
- Dark smoke particle effect: every ~200ms, spawn a semi-transparent dark gray circle sprite above the body that drifts upward and fades out over ~300ms

#### Scenario: Elite enemy visual setup

- **WHEN** any elite enemy is constructed
- **THEN** the body scale is 2.4, body tint is 0x222222, two red eye sprites are attached, and the smoke particle timer begins

### Requirement: Elite Chaser — Berserk Mechanic

The `EliteChaser` class SHALL extend `Chaser`. When HP drops to ≤ 60% of maxHp, the EliteChaser enters berserk state: speed increases from base to `cfg.berserkSpeed` (~140). Berserk persists until death. Visual feedback: red pulsing tint overlay.

#### Scenario: Berserk triggers at 60% HP

- **WHEN** the EliteChaser takes damage and `this.hp <= this.maxHp * 0.6`
- **THEN** `this.berserk` is set to `true`, movement speed becomes `cfg.berserkSpeed`, and a red pulse VFX begins

#### Scenario: Berserk speed is not stackable

- **WHEN** the EliteChaser in berserk state takes additional damage
- **THEN** the speed remains `cfg.berserkSpeed` (no further increase)

#### Scenario: Berserk lasts until death

- **WHEN** the EliteChaser is in berserk state
- **THEN** berserk does not expire — it continues until the enemy dies

### Requirement: Elite Shooter — Triple Spread

The `EliteShooter` class SHALL extend `Shooter`. When firing, it emits 3 bullets at angles `[-spreadAngle, 0, +spreadAngle]` relative to the aim direction, instead of a single bullet.

#### Scenario: Elite Shooter fires 3 bullets

- **WHEN** the EliteShooter's fire cooldown expires and the player is in range
- **THEN** 3 bullets are fired simultaneously at angles `a - cfg.spreadAngle`, `a`, `a + cfg.spreadAngle`, where `a` is the angle to the player

### Requirement: Elite Config Blocks

`config.js` SHALL contain:

**`ENEMY.elite_chaser`**:
| Field | Purpose | Expected Range |
|---|---|---|
| `hp` | Base hit points | ~40 (2× chaser) |
| `speed` | Normal chase speed | same as chaser (~70) |
| `contactDamage` | Touch damage | ~15 |
| `radius` | Physics collision radius | ~10 (slightly larger) |
| `xp` | XP awarded on kill | ~5 |
| `tint` | Body tint (elite black) | 0x222222 |
| `berserkSpeed` | Speed when berserk | ~140 |
| `berserkThreshold` | HP % to trigger berserk | 0.6 |
| `berserkTint` | Tint during berserk | 0xff3333 |

**`ENEMY.elite_shooter`**:
| Field | Purpose | Expected Range |
|---|---|---|
| `hp` | Base hit points | ~60 (2× shooter) |
| `speed` | Movement speed | same as shooter (~55) |
| `contactDamage` | Touch damage | ~10 |
| `radius` | Physics collision radius | ~12 (slightly larger) |
| `xp` | XP awarded on kill | ~7 |
| `preferredRange` | Desired distance from player | same as shooter (~260) |
| `fireRateMs` | Fire cooldown | ~1600 |
| `bulletSpeed` | Bullet velocity | ~260 |
| `bulletDamage` | Damage per bullet | ~12 |
| `spreadAngle` | Spread angle in radians | ~0.2 (~12°) |

### Requirement: Elite Spawn Schedule

WaveManager SHALL spawn elite enemies on a fixed schedule, independent of the random mix pool:

- Wave 10-12: 1 elite per ~15s
- Wave 13+: 2 elites per ~15s
- Elite type (EliteChaser or EliteShooter) chosen randomly on each spawn

#### Scenario: First elite appears at wave 10

- **WHEN** the current wave is ≥ 10 AND sufficient time has elapsed since last elite spawn
- **THEN** WaveManager spawns one elite enemy at a valid spawn point

### Requirement: Namespace Convention

| Field | EliteChaser | EliteShooter |
|---|---|---|
| `id` | `elite_chaser` | `elite_shooter` |
| `texture_keys` | Reuses `chaser_a` | Reuses `shooter_a` |
| `anim_keys` | Reuses `chaser_walk` | Reuses `shooter_walk` |
| `config_block` | `ENEMY.elite_chaser` | `ENEMY.elite_shooter` |

**Texture reuse exception**: Elites intentionally reuse base enemy textures. The `id` prefix (`elite_`) does not align with texture prefix — this is documented and accepted for elite variants.
