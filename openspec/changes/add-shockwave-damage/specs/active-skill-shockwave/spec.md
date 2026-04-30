## MODIFIED Requirements

### Requirement: Shockwave Knocks Back Nearby Enemies

The shockwave effect SHALL apply a short outward knockback to every enemy whose distance from the player at the moment of activation is less than the configured knockback radius AND who survives the simultaneous shockwave damage. Enemies outside that radius MUST NOT be affected. Enemies whose HP reaches 0 from the shockwave damage MUST NOT receive a knockback impulse — they enter the normal death pipeline in place.

#### Scenario: Surviving enemy inside radius is knocked back

- **WHEN** the shockwave triggers, an enemy is within `SKILL.knockbackRadius` of the player, AND the enemy's HP remains above 0 after shockwave damage
- **THEN** that enemy first takes shockwave damage, then receives an outward knockback impulse away from the player

#### Scenario: Enemy outside radius is unaffected

- **WHEN** the shockwave triggers and an enemy is beyond `SKILL.knockbackRadius`
- **THEN** that enemy's HP, velocity, and position are unaffected by the shockwave

#### Scenario: Lethal shockwave damage skips knockback

- **WHEN** the shockwave triggers and an enemy within radius takes lethal shockwave damage (HP becomes ≤ 0)
- **THEN** that enemy enters `Enemy.die()` in place and does NOT receive a knockback impulse

## ADDED Requirements

### Requirement: Shockwave Deals Percentage AoE Damage

The shockwave effect SHALL deal damage to every alive enemy whose distance from the player at the moment of activation is less than `SKILL.knockbackRadius`. The damage amount MUST equal `enemy.maxHp * SKILL.damagePercent`. Damage MUST be applied via the existing `Enemy.takeDamage()` path so that the standard 60ms hit-flash, death tween, and death pipeline (XP orb + SkillOrb drops + kill count) all trigger normally. `SKILL.damagePercent` MUST be configurable in `src/config.js` as a number in `[0, 1]`.

#### Scenario: Damage applies before knockback

- **WHEN** the shockwave triggers and an enemy is within `SKILL.knockbackRadius`
- **THEN** `enemy.takeDamage(enemy.maxHp * SKILL.damagePercent)` executes BEFORE the knockback decision for that enemy

#### Scenario: Damage can kill weak enemies

- **WHEN** an enemy's current HP is at or below `enemy.maxHp * SKILL.damagePercent` and the enemy is within shockwave radius
- **THEN** the shockwave damage kills the enemy AND the enemy drops XP orbs and rolls SkillOrb drop chance per the standard `handleEnemyDeath` path

#### Scenario: Damage uses max HP, not current HP

- **WHEN** an enemy already at half HP is within shockwave radius
- **THEN** the damage dealt equals `enemy.maxHp * SKILL.damagePercent` (NOT `currentHp * damagePercent`)

#### Scenario: Damage independent of knockback stun window

- **WHEN** a second shockwave triggers while an enemy is still within the previous `knockUntil` stun window
- **THEN** the second shockwave still applies full damage to that enemy (the stun window only gates AI velocity override, not damage application)

#### Scenario: Player bullets unaffected by shockwave damage logic

- **WHEN** the shockwave triggers
- **THEN** the damage logic only iterates `scene.enemies`; no `scene.bullets` (player bullets) member receives damage or destruction
