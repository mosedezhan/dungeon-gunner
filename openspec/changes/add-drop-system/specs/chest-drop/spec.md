## ADDED Requirements

### Requirement: Chest Entity

The system SHALL provide a `Chest` entity extending `Phaser.Physics.Arcade.Sprite`, pooled via a physics group in GameScene with `runChildUpdate: true` and `maxSize: 20`. The entity SHALL NOT use magnetic attraction — it remains stationary after spawning.

Texture: `chest` spritesheet (4 frames idle) + `chest_open` spritesheet (4 frames open animation). On spawn the chest SHALL play the idle animation loop.

#### Scenario: Spawn chest from enemy death

- **WHEN** an enemy dies and the chest drop check passes (based on `DROPS.chest.dropTable` for the enemy type)
- **THEN** a Chest is spawned at the enemy's death position, stationary, in CLOSED state

#### Scenario: Chest idle animation

- **WHEN** a Chest is active and in CLOSED state
- **THEN** it plays a looping 4-frame idle animation

### Requirement: Chest Interaction Prompt

When the player is within `DROPS.chest.interactRadius` (default 60px) of a CLOSED chest, a text prompt "[E]" SHALL appear above the chest. When the player moves out of range, the prompt SHALL disappear.

#### Scenario: Player enters interact range

- **WHEN** the player is within `interactRadius` of a CLOSED chest
- **THEN** a "[E]" text label is shown above the chest

#### Scenario: Player leaves interact range

- **WHEN** the player moves beyond `interactRadius` of a chest showing the prompt
- **THEN** the prompt text is hidden

### Requirement: Chest E Key Interaction

GameScene SHALL register a `keydown-E` handler. When pressed while a CLOSED chest is within `interactRadius`, the chest SHALL begin its opening sequence. If multiple chests are in range, the nearest one SHALL be opened. The player SHALL NOT be locked or immobilized during chest opening — movement and combat continue normally.

#### Scenario: Open nearest chest

- **WHEN** the player presses E and is within interactRadius of 2+ CLOSED chests
- **THEN** the nearest chest begins opening

#### Scenario: No chest in range

- **WHEN** the player presses E and no CLOSED chest is within interactRadius
- **THEN** nothing happens

#### Scenario: Player moves freely during opening

- **WHEN** a chest is in OPENING state
- **THEN** the player can continue to move, attack, and use skills normally

### Requirement: Chest State Machine

Chest SHALL have three states: CLOSED, OPENING, REWARDED. State transitions: CLOSED → (E key) → OPENING → (animation complete) → REWARDED → (reward dispatched) → kill().

#### Scenario: CLOSED to OPENING

- **WHEN** the player presses E near a CLOSED chest
- **THEN** the chest transitions to OPENING state and plays the 4-frame `chest_open` animation (non-looping, ~400ms)

#### Scenario: OPENING to REWARDED

- **WHEN** the chest_open animation completes
- **THEN** the chest transitions to REWARDED state and calls `scene.onChestOpen(chest)`

#### Scenario: REWARDED to kill

- **WHEN** `onChestOpen` finishes dispatching rewards
- **THEN** the chest's `kill()` is called, returning it to the pool

### Requirement: Chest Drop Table

Chest drop rates SHALL be configurable per enemy type via `DROPS.chest.dropTable` in config.js, same pattern as HealthPotion.

#### Scenario: Giant drops chest

- **WHEN** a Giant enemy dies
- **THEN** chest drop probability is `DROPS.chest.dropTable.giant` (higher than default)

### Requirement: Chest Reward Table

`DROPS.chest.rewards` SHALL define a weighted reward table. Each reward entry SHALL have `type`, `weight`, and type-specific parameters. On chest open, `rewardCount` (default 2) rewards SHALL be randomly selected without replacement.

#### Scenario: XP burst reward

- **WHEN** `xp_burst` is selected as a reward
- **THEN** 5-8 XPOrbs are spawned around the chest position with `xpMult` multiplier on their value

#### Scenario: Heal reward

- **WHEN** `heal` is selected as a reward
- **THEN** the player is healed by `healPct` of maxHp

#### Scenario: Skill charge reward

- **WHEN** `skill_charge` is selected as a reward
- **THEN** the player gains `count` skill charges (capped at max)

#### Scenario: Damage boost reward

- **WHEN** `damage_boost` is selected as a reward
- **THEN** the player receives a damage buff with `mult` multiplier for `durMs` milliseconds

#### Scenario: Speed boost reward

- **WHEN** `speed_boost` is selected as a reward
- **THEN** the player receives a speed buff with `mult` multiplier for `durMs` milliseconds

#### Scenario: Magnet aura reward

- **WHEN** `magnet_aura` is selected as a reward
- **THEN** the player receives a pickup radius buff expanded to `radius` for `durMs` milliseconds

### Requirement: onChestOpen Extension Point

`GameScene.onChestOpen(chest)` SHALL be the sole entry point for chest reward logic. Future chest stream features (tiers, curses, choice rewards) SHALL modify only this function, not the Chest entity itself.

#### Scenario: Future extensibility

- **WHEN** a new chest feature is added (e.g. chest tiers)
- **THEN** only `onChestOpen` and the reward table need modification — the Chest entity class remains unchanged
