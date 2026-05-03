## ADDED Requirements

### Requirement: DebugScene Overlay

The system SHALL provide a `DebugScene` registered in `main.js`, triggered by pressing **F1** during active gameplay. The scene SHALL pause GameScene and display a semi-transparent overlay with text-based menu options. Pressing F1 or ESC SHALL close the panel and resume GameScene.

#### Scenario: Open debug panel

- **WHEN** the player presses F1 during active gameplay (GameScene active, player alive)
- **THEN** GameScene is paused and DebugScene is launched as an overlay

#### Scenario: Close debug panel

- **WHEN** the player presses F1 or ESC while DebugScene is active
- **THEN** GameScene is resumed and DebugScene is stopped

#### Scenario: Cannot open during pause/upgrade/gameover

- **WHEN** the player presses F1 while PauseScene or UpgradeScene is active, or player is dead
- **THEN** nothing happens (guard clause prevents overlapping overlays)

### Requirement: Spawn Enemies at Cursor

DebugScene SHALL display a list of spawnable enemies read from `src/debug/registry.js`. Each entry SHALL have a number shortcut key (1-9). Pressing a number key or clicking the text SHALL spawn the corresponding enemy at the mouse cursor's world position and add it to GameScene's enemies group with current wave HP scaling.

#### Scenario: Spawn enemy via number key

- **WHEN** the player presses a number key (1-9) that maps to a registered enemy type
- **THEN** a new instance of that enemy class is created at the mouse cursor's world position, added to the enemies group, and HP-scaled by current wave multiplier

#### Scenario: Spawn enemy via click

- **WHEN** the player clicks on a spawn menu item text
- **THEN** the same spawn logic executes as the number key shortcut

### Requirement: Skill Actions

DebugScene SHALL provide:
- **[Q] +1 Skill Charge**: Increment `player.skillCharges` by 1 (capped at `stats.skillChargesMax`)
- Triggering a skill directly is NOT required (player can press Q in-game after adding charges)

#### Scenario: Add skill charge

- **WHEN** the player presses Q in the debug panel
- **THEN** `player.skillCharges` is incremented by 1, capped at `player.stats.skillChargesMax`

### Requirement: State Toggles

DebugScene SHALL provide:
- **[W] God Mode**: Toggle player invulnerability (set `player.invulUntil = Infinity` or similar mechanism)
- **[E] Kill All**: Destroy all active enemies in the enemies group

#### Scenario: Toggle god mode on

- **WHEN** the player presses W and god mode is currently OFF
- **THEN** the player becomes invulnerable (no damage from any source), and the menu text updates to show "God Mode: ON"

#### Scenario: Toggle god mode off

- **WHEN** the player presses W and god mode is currently ON
- **THEN** normal damage behavior is restored, and the menu text updates to show "God Mode: OFF"

#### Scenario: Kill all enemies

- **WHEN** the player presses E
- **THEN** all active enemies in the enemies group have their `die()` method called

### Requirement: Wave Skip

DebugScene SHALL provide **[R] Skip to Wave**: Jump to wave 20 (or a configurable target) by repeatedly calling `waveManager.startWave()`.

#### Scenario: Skip to wave 20

- **WHEN** the player presses R
- **THEN** WaveManager is set to wave 20, spawn interval is recalculated, and `onWaveStart(20)` is called

### Requirement: Debug Registry

`src/debug/registry.js` SHALL export a `DEBUG_SPAWNABLE` object mapping display labels (with number prefix) to Enemy subclass constructors. All existing enemy types SHALL be registered.

#### Initial registry entries

| Key | Class |
|---|---|
| `'1:Chaser'` | `Chaser` |
| `'2:Rusher'` | `Rusher` |
| `'3:Shooter'` | `Shooter` |
| `'4:Giant'` | `Giant` |
| `'5:Bomber'` | `Bomber` |
| `'6:Elite Chaser'` | `EliteChaser` |
| `'7:Elite Shooter'` | `EliteShooter` |

### Requirement: AI Workflow Rule for Registry Sync

`src/entities/CLAUDE.md` and root `CLAUDE.md` SHALL be updated with the rule: when adding a new Enemy subclass, the developer MUST also update `src/debug/registry.js` to register the new entity.
