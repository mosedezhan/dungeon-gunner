## ADDED Requirements

### Requirement: Player Buff Management

Player SHALL maintain a `buffs` Map keyed by buff type string (e.g. `'damage_boost'`, `'speed_boost'`, `'magnet_aura'`). Each entry SHALL store `{ expiresAt, originalValue, params }`. The Player SHALL expose `addBuff(type, durationMs, params)` and `removeBuff(type)` methods.

#### Scenario: Add new buff

- **WHEN** `addBuff('damage_boost', 10000, { mult: 1.5 })` is called and no damage_boost is active
- **THEN** the current `stats.damage` is saved as `originalValue`, `stats.damage` is multiplied by `mult`, and the buff entry is stored with `expiresAt = now + 10000`

#### Scenario: Refresh existing buff

- **WHEN** `addBuff('damage_boost', 10000, { mult: 1.5 })` is called and a damage_boost is already active
- **THEN** `expiresAt` is refreshed to `now + 10000` but the stat is NOT multiplied again (no stacking)

#### Scenario: Buff expires

- **WHEN** `now >= buff.expiresAt` is detected in Player.update()
- **THEN** the buff's `originalValue` is restored to the corresponding stat, and the buff entry is removed from the Map

### Requirement: Player Heal Method

Player SHALL expose a `heal(amount)` method that adds `amount` to `player.hp`, capped at `stats.maxHp`.

#### Scenario: Heal below max

- **WHEN** `player.heal(20000)` is called and `hp = 80000, maxHp = 100000`
- **THEN** `player.hp` becomes 100000 (capped, not overhealed)

#### Scenario: Heal at max

- **WHEN** `player.heal(20000)` is called and `hp = 100000`
- **THEN** `player.hp` remains 100000 (no overheal)

### Requirement: Buff Stat Mapping

Each buff type SHALL map to a specific Player stat:
- `damage_boost` → `stats.damage` (multiply)
- `speed_boost` → `stats.moveSpeed` (multiply)
- `magnet_aura` → temporarily expands XP/SKILL pickupRadius (store as param, checked in orb preUpdate)

#### Scenario: Damage boost applied

- **WHEN** a `damage_boost` buff with `mult: 1.5` is active on a player with `stats.damage = 10`
- **THEN** bullet/slash damage calculations use `stats.damage = 15`

#### Scenario: Speed boost applied

- **WHEN** a `speed_boost` buff with `mult: 1.3` is active on a player with `stats.moveSpeed = 180`
- **THEN** the player moves at speed 234

#### Scenario: Magnet aura applied

- **WHEN** a `magnet_aura` buff is active with `radius: 300`
- **THEN** XPOrb, SkillOrb, and HealthPotion use 300 as their pickup radius when checking distance to this player

### Requirement: Buff Visual Feedback

Active buffs SHALL display a visual indicator on the player:
- `damage_boost`: red glow outline on player sprite
- `speed_boost`: foot dust/trail particles
- `magnet_aura`: blue circle aura around player at buff radius

#### Scenario: Damage boost visual

- **WHEN** a damage_boost buff is active
- **THEN** the player sprite has a red tinted outline effect

#### Scenario: Buff visual removed

- **WHEN** a buff expires and is removed
- **THEN** the corresponding visual effect is cleared
