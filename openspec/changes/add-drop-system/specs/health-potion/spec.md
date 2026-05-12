## ADDED Requirements

### Requirement: HealthPotion Entity

The system SHALL provide a `HealthPotion` entity extending `Phaser.Physics.Arcade.Sprite`, pooled via a physics group in GameScene with `runChildUpdate: true` and `maxSize: 50`.

Texture: `flask_red` spritesheet (4 frames, loaded from assets). The entity SHALL play an idle pulse animation on spawn.

#### Scenario: Spawn health potion from enemy death

- **WHEN** an enemy dies and the health potion drop check passes (based on `DROPS.healthPotion.dropTable` for the enemy type)
- **THEN** a HealthPotion is spawned at the enemy's death position with a small random initial velocity that decays after ~250ms

#### Scenario: Health potion idle animation

- **WHEN** a HealthPotion is active in the world
- **THEN** it plays a looping 4-frame idle animation and a sine-based pulse tween

### Requirement: HealthPotion Magnetic Pickup

HealthPotion SHALL use magnetic attraction identical to XPOrb: when the player enters `DROPS.healthPotion.pickupRadius`, the potion accelerates toward the player at `magnetSpeed`.

#### Scenario: Player enters pickup radius

- **WHEN** the player is within `pickupRadius` of an active HealthPotion
- **THEN** the potion moves toward the player at `magnetSpeed`

#### Scenario: Player overlaps health potion

- **WHEN** the player's physics body overlaps an active HealthPotion
- **THEN** the potion is killed (returned to pool) and the player receives healing

### Requirement: HealthPotion Healing

HealthPotion SHALL heal the player by `DROPS.healthPotion.healPercent` of `player.stats.maxHp`, capped at maxHp. The potion SHALL be picked up even when the player is at full HP.

#### Scenario: Pickup at partial health

- **WHEN** the player picks up a HealthPotion while below maxHp
- **THEN** `player.hp` is increased by `healPercent * maxHp`, capped at maxHp

#### Scenario: Pickup at full health

- **WHEN** the player picks up a HealthPotion while at full HP
- **THEN** the potion is consumed with no effect (HP remains at maxHp)

### Requirement: HealthPotion Drop Table

HealthPotion drop rates SHALL be configurable per enemy type via `DROPS.healthPotion.dropTable` in config.js. The table SHALL support `default` as a fallback key.

#### Scenario: Default drop rate

- **WHEN** an enemy type has no specific entry in the drop table
- **THEN** the `default` drop rate is used

#### Scenario: Enemy-specific drop rate

- **WHEN** an enemy type (e.g. `elite`) has a specific entry in the drop table
- **THEN** that specific rate overrides the default
