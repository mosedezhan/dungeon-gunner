## ADDED Requirements

### Requirement: Warrior Class Selectable

The system SHALL expose the warrior class as a selectable option in `ClassSelectScene`. The `CLASSES.warrior` configuration MUST have `locked: false`, MUST declare a `skill` field naming the warrior's active skill, MUST declare a `baseStats` object with at minimum `maxHp`, `moveSpeed`, `damage`, `attackRateMs`, `swingRange`, and `swingArc`, and MUST reference distinct warrior textures (not reuse `player_*`).

#### Scenario: Warrior card selectable

- **WHEN** the player opens `ClassSelectScene`
- **THEN** the warrior card is interactive (has hover and click handlers), is reachable via keyboard navigation, and selecting it starts `GameScene` with `{ class: 'warrior' }`

#### Scenario: Warrior baseStats applied on Player construction

- **WHEN** `Player` is constructed with `classId: 'warrior'`
- **THEN** `player.stats` equals `{ ...PLAYER, ...CLASSES.warrior.baseStats }` so warrior fields override defaults

### Requirement: Warrior Visual Identity

The system SHALL render the warrior with distinct textures and animations: `warrior_idle_a/b`, `warrior_run_a/b` for the body (red/orange palette variant of the player pixel grid) and `warrior_idle` / `warrior_run` animation keys (mirroring the mage_* convention). The warrior MUST display a `sword` sprite instead of the `gun` sprite carried by mage and the default player.

#### Scenario: Warrior body and sword rendered

- **WHEN** a warrior `Player` enters `GameScene`
- **THEN** the body sprite plays `warrior_idle` (or `warrior_run` while moving) AND a `sword` sprite is created and follows the player position; no `gun` sprite is created

#### Scenario: Sword aim follows mouse

- **WHEN** the warrior is alive and the player moves the mouse
- **THEN** the sword sprite's rotation tracks the player→mouse angle every frame (same convention as the mage's gun)

### Requirement: Hold-To-Swing Attack

The system SHALL trigger a melee swing whenever the left mouse button is held down AND the time since the last swing is at least `player.stats.attackRateMs`. The swing MUST be initiated by the player calling `Player.tryAttack(time)` from `GameScene.update()`. Click-to-swing (single press) MUST also work as a degenerate case of hold-to-swing.

#### Scenario: Swing throttled by attackRateMs

- **WHEN** the player holds the left mouse button continuously
- **THEN** swings trigger at intervals of approximately `attackRateMs` ms (subject to per-frame granularity), and additional `tryAttack` calls between intervals are no-ops

#### Scenario: tryAttack dispatches by classId

- **WHEN** `Player.tryAttack(time)` is called
- **THEN** the player checks `this.classId`: if `'warrior'`, it triggers a swing; if `'mage'` (or any non-warrior class), it triggers the existing bullet-firing logic. The mage's bullet behavior MUST remain unchanged.

### Requirement: 90-Degree Forward Arc Hit Detection

A single warrior swing SHALL damage every alive enemy whose distance from the player is `≤ swingRange` AND whose angle from the player (measured via `atan2(enemy.y - player.y, enemy.x - player.x)`) is within `±swingArc/2` of the current aim direction. Each swing MUST hit each affected enemy exactly once (no double-hits within a swing). The damage applied MUST equal `player.stats.damage`, and each hit MUST also call `enemy.knockback(player.x, player.y, force)` with a configured knockback force.

#### Scenario: Enemy in arc takes damage

- **WHEN** the warrior swings while an alive enemy is at distance ≤ `swingRange` AND within `±swingArc/2` of the aim direction
- **THEN** the enemy takes `player.stats.damage` damage AND receives an outward knockback impulse from the player

#### Scenario: Enemy outside arc unaffected

- **WHEN** the warrior swings while an alive enemy is at distance ≤ `swingRange` BUT outside `±swingArc/2` of the aim direction
- **THEN** the enemy's HP, velocity, and position are unchanged by the swing

#### Scenario: Enemy outside range unaffected

- **WHEN** the warrior swings while an alive enemy is within the arc angle BUT at distance > `swingRange`
- **THEN** the enemy's HP, velocity, and position are unchanged by the swing

#### Scenario: One swing hits each enemy at most once

- **WHEN** a single swing's hit detection runs
- **THEN** each qualifying enemy receives exactly one `takeDamage` call from this swing (no double-damage from re-iteration)

### Requirement: Swing Visual Effects

The system SHALL render a multi-layered visual effect for each swing:
1. The `sword` sprite MUST tween its rotation from `aim - swingArc/2` to `aim + swingArc/2` over a configured duration (~120ms with ease-out).
2. A procedurally-generated `slash` arc texture MUST appear centered on the player, oriented along the aim direction, scaled outward AND faded out within a configured duration.
3. The sword sprite MUST leave 2 trailing afterimages with decreasing alpha along the swing path.

All swing VFX textures MUST be generated procedurally in `BootScene` (no external assets). The VFX MUST clean up after itself (no leaked sprites).

#### Scenario: Sword arc tween on swing

- **WHEN** a swing triggers
- **THEN** the sword sprite's rotation animates from `aim - swingArc/2` to `aim + swingArc/2` and returns to follow-aim behavior on tween completion

#### Scenario: Slash texture spawned and fades

- **WHEN** a swing triggers
- **THEN** a slash sprite spawns at the player position with rotation matching aim, scales up, fades to 0 alpha within the configured duration, and is destroyed on completion

#### Scenario: Afterimage trail on swing

- **WHEN** a swing triggers
- **THEN** 2 sword afterimage sprites spawn with decreasing alpha, mirror the swing tween, and are destroyed on completion

### Requirement: Hit-Stop On Successful Swing

The system SHALL freeze scene time for a configured short duration (~40ms) when a swing hits at least one enemy. This MUST be implemented by setting `scene.time.timeScale = 0` AND `scene.physics.world.isPaused = true`, then restoring both via `scene.time.delayedCall` after the configured duration. Hit-stop MUST be skipped while bullet time is active (`scene.slowFactor < 1.0`) to avoid stacking slow effects.

#### Scenario: Hit-stop fires on hit

- **WHEN** a swing hits at least one enemy AND `scene.slowFactor === 1.0`
- **THEN** scene time freezes for the configured Hit-stop duration, then restores

#### Scenario: Hit-stop skipped on whiff

- **WHEN** a swing hits zero enemies
- **THEN** no Hit-stop occurs

#### Scenario: Hit-stop skipped during bullet time

- **WHEN** a swing hits at least one enemy AND `scene.slowFactor < 1.0` (bullet time active)
- **THEN** Hit-stop is skipped to avoid stacking with bullet time

### Requirement: Multi-Hit Reward VFX

When a single swing hits 3 or more enemies, the system SHALL render an extra burst: a 1-frame full-screen white flash AND a stronger camera shake (≥ 120ms duration, ≥ 0.008 intensity) replacing the standard per-hit shake. Single-target and 2-target swings MUST use only the standard hit feedback (small shake + tint flash on hit).

#### Scenario: 3-hit swing triggers burst

- **WHEN** a single swing's hit count is ≥ 3
- **THEN** a 1-frame white screen overlay flashes AND the camera shakes with the stronger configured parameters

#### Scenario: 2-hit swing uses standard feedback

- **WHEN** a single swing's hit count is exactly 2
- **THEN** the screen flash is NOT triggered AND the camera shake (if any) uses the standard parameters

### Requirement: Skill Dispatch By Class

The system SHALL dispatch active-skill triggers via `GameScene.useSkill(player)`, which reads `CLASSES[player.classId].skill` and routes to the appropriate skill implementation. `Player.triggerSkill()` MUST call `this.scene.useSkill?.(this)` instead of hardcoding any specific skill method. The mage's skill string MUST resolve to the existing shockwave behavior, and the warrior's skill string MUST resolve to bullet time.

#### Scenario: Mage Q triggers shockwave via dispatch

- **WHEN** a mage player triggers the skill (via Q with charges available)
- **THEN** `useSkill(player)` reads `CLASSES.mage.skill`, resolves to `'shockwave'`, and invokes `fireShockwave(player.x, player.y)` with identical behavior to the prior hardcoded path

#### Scenario: Warrior Q triggers bullet time via dispatch

- **WHEN** a warrior player triggers the skill (via Q with charges available)
- **THEN** `useSkill(player)` reads `CLASSES.warrior.skill`, resolves to `'bullet_time'`, and invokes `fireBulletTime()`

### Requirement: Per-Class Upgrade Pool Filtering

Each entry in the `UPGRADES` array SHALL declare a `classes` field listing the class IDs for which the upgrade is eligible. `UpgradeScene` MUST filter the candidate pool by `player.classId` before drawing the 3-card selection. Existing bullet-only upgrades (`firerate`, `multishot`, `pierce`, `bspeed`) MUST be restricted to `['mage']`. General upgrades (`damage`, `movespeed`, `maxhp`, `regen`, `skillmax`) MUST remain visible to both classes.

#### Scenario: Warrior never sees bullet-only cards

- **WHEN** a warrior player levels up and `UpgradeScene` draws cards
- **THEN** the candidate pool excludes `firerate`, `multishot`, `pierce`, and `bspeed`; none of these cards can appear in the 3-card draw

#### Scenario: Mage upgrade pool unchanged

- **WHEN** a mage player levels up and `UpgradeScene` draws cards
- **THEN** the candidate pool includes all 9 cards visible to mage (5 general + 4 bullet-only); the draw behavior is identical to pre-change behavior

#### Scenario: General upgrade visible to both classes

- **WHEN** the upgrade `damage` (or any other general card) is evaluated for either a mage or warrior player
- **THEN** the card is in the candidate pool for both classes

### Requirement: Warrior-Specific Upgrade Cards

The `UPGRADES` array SHALL include 4 warrior-specific cards visible only to the warrior class:

1. **Long Reach** (`swingrange`): increases `swingRange` by 20% per pick
2. **Wide Sweep** (`swingarc`): increases `swingArc` by 15° (~0.2618 rad) per pick
3. **Fervor** (`attackspeed`): decreases `attackRateMs` by 17% per pick (multiply by ~0.83)
4. **Cleaving Edge** (`cleave`): when a swing hits ≥ 2 enemies, that swing's damage is increased by 30% for all hits

Each card's `apply(p)` function MUST mutate `p.stats` directly (consistent with existing upgrade pattern). The Cleaving Edge effect MUST be implemented as a `stats.cleaveBonus` flag/multiplier read by the swing damage application.

#### Scenario: Long Reach increases swingRange

- **GIVEN** the warrior has `swingRange = 80`
- **WHEN** the player selects Long Reach
- **THEN** `player.stats.swingRange === 96` (80 × 1.20)

#### Scenario: Cleaving Edge boosts multi-target damage

- **GIVEN** the warrior has Cleaving Edge applied (e.g. `stats.cleaveBonus = 0.30`) and `stats.damage = 18`
- **WHEN** a single swing hits ≥ 2 enemies
- **THEN** each hit applies `damage × (1 + cleaveBonus)` (e.g. 23.4) instead of `damage`

#### Scenario: Cleaving Edge inactive on single-hit swing

- **GIVEN** the warrior has Cleaving Edge applied
- **WHEN** a single swing hits exactly 1 enemy
- **THEN** that hit applies `damage` (18) without the cleave bonus
