## MODIFIED Requirements

### Requirement: State Toggles

DebugScene SHALL provide:
- **[W] God Mode**: Toggle player invulnerability (set `player.invulUntil = Infinity` or similar mechanism)
- **[X] Kill All**: Destroy all active enemies in the enemies group

#### Scenario: Toggle god mode on

- **WHEN** the player presses W and god mode is currently OFF
- **THEN** the player becomes invulnerable (no damage from any source), and the menu text updates to show "God Mode: ON"

#### Scenario: Toggle god mode off

- **WHEN** the player presses W and god mode is currently ON
- **THEN** normal damage behavior is restored, and the menu text updates to show "God Mode: OFF"

#### Scenario: Kill all enemies

- **WHEN** the player presses X
- **THEN** all active enemies in the enemies group have their `die()` method called
