## ADDED Requirements

### Requirement: Skill Charge Resource

The system SHALL maintain a per-player skill-charge resource consisting of a current count and a max count. The current count MUST start at 0 at game start, MUST never exceed the max count, and MUST never go below 0. The max count MUST start at 1 and MUST be increasable via the upgrade system. All skill state MUST reset to defaults when a new game starts.

#### Scenario: Initial state on game start

- **WHEN** a new game session starts and the player is created
- **THEN** `player.skillCharges` is `0` and `player.stats.skillChargesMax` is `1`

#### Scenario: Charge clamped to max on pickup

- **WHEN** the player picks up a skill orb while `skillCharges == skillChargesMax`
- **THEN** the orb is consumed (removed from the world) and `skillCharges` does NOT exceed `skillChargesMax`

### Requirement: Q Key Triggers Shockwave

The system SHALL bind the Q key to triggering the shockwave skill while `GameScene` is the active gameplay scene. Triggering the skill MUST consume exactly one charge, and MUST be a no-op when the player has zero charges, is dead, or when `GameScene` is paused (e.g., during PauseScene or UpgradeScene).

#### Scenario: Successful trigger

- **WHEN** the player presses Q while `skillCharges >= 1` and the player is alive and the scene is not paused
- **THEN** `skillCharges` decreases by 1 AND the shockwave effect (clear + knockback + VFX) executes

#### Scenario: No charges available

- **WHEN** the player presses Q while `skillCharges == 0`
- **THEN** no effect occurs, no charges are consumed, and no VFX is spawned

#### Scenario: Pressed while paused

- **WHEN** the player presses Q while UpgradeScene or PauseScene is active
- **THEN** the press is ignored and no charge is consumed

#### Scenario: Pressed while dead

- **WHEN** the player presses Q while `player.dead == true`
- **THEN** the press is ignored

### Requirement: Shockwave Clears Enemy Bullets

The shockwave effect SHALL destroy every active bullet in the `enemyBullets` group on the screen at the moment of activation. Player bullets MUST NOT be affected. Bullets that spawn after the shockwave's frame of activation MUST NOT be retroactively destroyed.

#### Scenario: All enemy bullets cleared

- **WHEN** the shockwave triggers with N active enemy bullets on screen
- **THEN** all N enemy bullets are killed (returned to pool, no longer rendering or moving) AND no player bullets are affected

#### Scenario: Late-spawning bullets unaffected

- **WHEN** an enemy fires a new bullet on the frame after the shockwave triggered
- **THEN** that new bullet exists normally and is not destroyed

### Requirement: Shockwave Knocks Back Nearby Enemies

The shockwave effect SHALL apply a short outward knockback to every enemy whose distance from the player at the moment of activation is less than the configured knockback radius. Enemies outside that radius MUST NOT be affected. The knockback MUST NOT deal damage.

#### Scenario: Enemy inside radius is knocked back

- **WHEN** the shockwave triggers and an enemy is within `SKILL.knockbackRadius` of the player
- **THEN** that enemy receives an outward knockback impulse away from the player AND its HP is unchanged

#### Scenario: Enemy outside radius is unaffected

- **WHEN** the shockwave triggers and an enemy is beyond `SKILL.knockbackRadius`
- **THEN** that enemy's velocity and position are unaffected by the shockwave

### Requirement: Shockwave 360° Visual Effect

The shockwave SHALL render a single radiating ring centered on the player that expands outward in 360° and fades out within a short, configured duration. The VFX MUST clean up after itself (no leaked sprites). The VFX texture MUST be procedurally generated in `BootScene` (no external assets).

#### Scenario: VFX spawns and fades

- **WHEN** the shockwave triggers
- **THEN** a ring sprite appears centered on the player, scales from a small initial value to `SKILL.vfxMaxScale`, fades from full alpha to 0 within `SKILL.vfxDurationMs`, and is destroyed on completion

### Requirement: Skill Orb Drop on Enemy Death

When an enemy dies, the system SHALL roll against `SKILL.dropChance` (a probability in `[0, 1]`). On success, the system MUST spawn one skill orb at the enemy's death position. This drop MUST be independent of the existing XP orb drop (both can coexist on the same kill).

#### Scenario: Successful drop roll

- **WHEN** an enemy dies and the random roll < `SKILL.dropChance`
- **THEN** a `SkillOrb` is spawned at the enemy's position AND an XP orb is also spawned (XP behavior unchanged)

#### Scenario: Failed drop roll

- **WHEN** an enemy dies and the random roll ≥ `SKILL.dropChance`
- **THEN** no SkillOrb is spawned (XP orb behavior unchanged)

### Requirement: Skill Orb Pickup Behavior

A `SkillOrb` SHALL be a pooled physics sprite that pulses visually, magnetizes toward the player when within `SKILL.pickupRadius`, and on player overlap grants `+1` to `skillCharges` (clamped to `skillChargesMax`) and removes itself from the world. The orb's visual MUST be visually distinct from the XP orb (different color/shape) so players can identify it at a glance.

#### Scenario: Pickup grants charge

- **WHEN** the player overlaps an active skill orb while `skillCharges < skillChargesMax`
- **THEN** `skillCharges` increases by 1 AND the orb is removed

#### Scenario: Magnet attraction

- **WHEN** an active skill orb is within `SKILL.pickupRadius` of the player
- **THEN** the orb accelerates toward the player

#### Scenario: Pickup at full charge

- **WHEN** the player overlaps an active skill orb while `skillCharges == skillChargesMax`
- **THEN** the orb is removed AND `skillCharges` is unchanged

### Requirement: Upgrade Card Increases Skill Max

The upgrade pool SHALL include a "Resonance Core" card that, when selected, increments `player.stats.skillChargesMax` by 1 and grants `+1` current charge (also clamped to the new max). This card MUST be eligible to appear in the level-up 3-choice draw alongside existing cards.

#### Scenario: Apply Resonance Core

- **GIVEN** the player has `skillChargesMax = 1` and `skillCharges = 0`
- **WHEN** the player selects the Resonance Core upgrade
- **THEN** `skillChargesMax` becomes `2` AND `skillCharges` becomes `1`

#### Scenario: Card eligible in draw

- **WHEN** the level-up 3-choice draw runs
- **THEN** the Resonance Core card is in the candidate pool with the same selection rules as other cards

### Requirement: HUD Displays Skill Charges

The `HUDScene` SHALL display the player's current skill-charge state in the form `skill <current>/<max>`, updated each frame. The display MUST be visible during normal gameplay and MUST NOT obscure the gameplay area.

#### Scenario: HUD reflects current state

- **WHEN** `player.skillCharges = 1` and `player.stats.skillChargesMax = 2`
- **THEN** the HUD shows `skill 1/2` (or visually equivalent representation)

#### Scenario: HUD updates after trigger

- **WHEN** the player triggers the shockwave consuming one charge
- **THEN** within one frame the HUD's current value decreases by 1
