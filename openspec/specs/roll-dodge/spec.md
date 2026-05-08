# roll-dodge Specification

## Purpose

Provide both player classes (mage, warrior) with a right-click roll-dodge action: a short, invincible directional displacement on a fixed cooldown, with risk attached to the landing position. Functions as a baseline movement tool independent of the Q active-skill system.

## Requirements

### Requirement: Right-Click Triggers Roll

The system SHALL trigger a roll on right mouse button press (button index 2) while `GameScene` is active and the player is alive. The trigger MUST be edge-based (one roll per press, no auto-repeat from holding). The browser context menu MUST be disabled on the game canvas to prevent UI conflict.

#### Scenario: Successful trigger

- **WHEN** the player right-clicks while alive, scene is active, no roll is in progress, and roll cooldown has elapsed
- **THEN** a roll begins immediately (within the same frame)

#### Scenario: Hold does not auto-repeat

- **WHEN** the player presses and holds the right mouse button for 3 seconds
- **THEN** exactly one roll triggers (on initial press), no further rolls trigger from the held state

#### Scenario: Browser menu suppressed

- **WHEN** the player right-clicks the game canvas
- **THEN** the browser's native context menu does NOT appear

#### Scenario: Right-click while dead

- **WHEN** the player right-clicks while `player.dead == true`
- **THEN** no roll triggers and no state changes

#### Scenario: Right-click while paused

- **WHEN** the player right-clicks while PauseScene / UpgradeScene / DebugScene is active
- **THEN** no roll triggers (GameScene is paused, input is not processed)

### Requirement: Roll Direction Follows Mouse

The roll direction SHALL be the normalized vector from the player's position to the mouse cursor's world position at the moment of trigger. If the mouse is co-located with the player (distance < 1 pixel), the system MUST fall back to the player's most recent aim angle (`_aimAngle`).

#### Scenario: Mouse offset from player

- **WHEN** the player triggers a roll while the mouse is at world position 200px to the right of the player
- **THEN** the roll velocity vector is `(ROLL.speed, 0)` (pointing right)

#### Scenario: Mouse exactly on player

- **WHEN** the player triggers a roll while the mouse is < 1 pixel from the player's center
- **THEN** the roll direction uses `player._aimAngle` from the previous frame (never undefined since `_aimAngle` is initialized to 0 and updated each frame)

### Requirement: Roll Has Fixed Cooldown

The roll SHALL be on a fixed 1-second cooldown (`ROLL.cooldownMs`). The cooldown MUST NOT be modifiable by upgrade cards, skill orbs, or any other gameplay system.

#### Scenario: Roll within cooldown

- **WHEN** the player triggers a roll, then attempts a second roll 500ms later
- **THEN** the second attempt is rejected (no roll, no state change), and the player must wait until the original `lastRollAt + ROLL.cooldownMs` elapses

#### Scenario: Roll exactly at cooldown boundary

- **WHEN** the player triggers a roll at time T, then attempts another at time T + 1000ms
- **THEN** the second roll is allowed (cooldown is met)

#### Scenario: Cooldown unaffected by upgrades

- **GIVEN** the player has accumulated all available upgrade cards
- **WHEN** the cooldown is checked
- **THEN** the cooldown remains exactly `ROLL.cooldownMs` (no card modifies it)

### Requirement: Roll Grants Invincibility During Travel

While the roll is in progress (250ms / `ROLL.durationMs`), the player SHALL be invulnerable to all damage sources. Invincibility MUST be implemented by extending `player.invulnUntil` to at least `tryRollTime + ROLL.durationMs`. The invincibility window MUST end exactly when the roll's displacement completes.

#### Scenario: Bullet during roll

- **WHEN** the player is mid-roll and an enemy bullet overlaps the player
- **THEN** `player.takeDamage` returns false (invuln active), the bullet is killed (existing behavior), no HP is lost

#### Scenario: Enemy contact during roll

- **WHEN** the player is mid-roll and the player body overlaps an alive enemy
- **THEN** `onPlayerTouchEnemy` calls `player.takeDamage` which returns false (invuln active), no HP is lost, no contact knockback exchange occurs

#### Scenario: Pre-existing invuln preserved

- **WHEN** the player has 400ms remaining on `invulnUntil` (e.g., from a recent hit) and triggers a roll
- **THEN** `invulnUntil` is set to `Math.max(existing, now + 250)` — the longer of the two windows wins (does not shorten existing invuln)

### Requirement: Landing Damages Player on Enemy Overlap

When the roll completes, the invincibility expires at the same instant. If the player's body overlaps any alive enemy on the next physics overlap pass, the player SHALL receive damage equal to that enemy's `cfg.contactDamage` via the existing `onPlayerTouchEnemy` → `takeDamage` path. Multiple overlapping enemies MAY each trigger their own contact-damage callback per existing physics overlap behavior.

#### Scenario: Land in empty space

- **WHEN** the roll completes and no enemy overlaps the player's body
- **THEN** no damage is dealt, the roll ends cleanly, normal movement resumes

#### Scenario: Land on top of enemy

- **WHEN** the roll completes with the player body overlapping an alive Chaser (contactDamage 10)
- **THEN** within 1 frame, `player.takeDamage(10, time)` is called, HP decreases by 10, white hit-flash plays, new 400ms invuln window begins (standard behavior)

#### Scenario: Land in cluster

- **WHEN** the roll completes overlapping 2 enemies simultaneously
- **THEN** the first overlap callback deals damage and starts standard `invulnMs`, subsequent overlaps within that window are blocked by the new invuln (standard behavior)

#### Scenario: Landing damage path uses existing system

- **WHEN** the roll ends
- **THEN** no separate "landing damage" code path runs — overlap is detected by the standard `physics.add.overlap(player, enemies, onPlayerTouchEnemy)` registered in `GameScene.create()`, just naturally unblocked by expired invuln

### Requirement: Roll Locks Input

While the roll is in progress, the system SHALL ignore WASD/arrow movement input, left-click attack input, and additional right-click roll input. Player velocity during the roll MUST be the fixed roll vector, not influenced by `moveSpeed`, `slowFactor`, or any other modifier.

#### Scenario: WASD ignored during roll

- **WHEN** the player is mid-roll and presses A (left)
- **THEN** the roll continues in the original direction; WASD is not read

#### Scenario: Left-click ignored during roll

- **WHEN** the player is mid-roll and left-clicks
- **THEN** `tryAttack` returns early without firing/swinging; no bullet is spawned, no swing is performed

#### Scenario: Right-click during roll

- **WHEN** the player is mid-roll and right-clicks again
- **THEN** the second `tryRoll` call returns false (rolling guard); no new roll begins; cooldown timer is not reset

#### Scenario: Roll velocity unaffected by slowFactor

- **GIVEN** bullet time is active (`scene.slowFactor = 0.3`)
- **WHEN** the player triggers a roll
- **THEN** the player's actual velocity equals `ROLL.speed` in the chosen direction (full 600 px/s), not `ROLL.speed * 0.3`

### Requirement: Roll Visual Effects

The system SHALL render three visual layers during a roll: (1) a dust burst at the launch position, (2) afterimage trail of the player sprite during travel, (3) a dust burst at the landing position. The player sprite itself MUST display a blue iframe tint (`ROLL.iframeTint = 0x88ccff`) for the roll duration. All VFX MUST clean up after their tweens complete (no leaked sprites or timers). Textures MUST be reused from existing procedural assets — no new PNG files required.

#### Scenario: Launch dust spawns

- **WHEN** the roll begins
- **THEN** a `shockwave` sprite tinted `ROLL.dustTint` (gray) appears at the player's position, scales from 0.3 to 1.0, fades alpha 0.6 to 0 over 180ms, and is destroyed on completion

#### Scenario: Afterimages spawn periodically

- **WHEN** the roll is in progress
- **THEN** every `ROLL.afterimageIntervalMs` (50ms), a copy of the player's running sprite spawns at the player's current position, fades alpha 0.5 to 0 and scales 1 to 0.85 over `ROLL.afterimageDurationMs` (200ms), and destroys itself on completion. The afterimage timer is removed when the roll ends.

#### Scenario: Iframe tint applied and cleared

- **WHEN** the roll begins
- **THEN** the player sprite calls `setTintFill(0x88ccff)` (blue tint indicating invuln); when the roll ends, `clearTint()` is called

#### Scenario: Landing dust spawns

- **WHEN** the roll ends
- **THEN** a second dust sprite spawns at the landing position with the same parameters as the launch dust

#### Scenario: No leaked sprites or timers

- **GIVEN** the player has performed 100 rolls
- **THEN** no orphaned dust / afterimage sprites or timers remain in the scene; all VFX have been destroyed and the afterimage timer for each completed roll has been removed

### Requirement: Left-Click Attack Replaces Any-Button Attack

The attack trigger condition in `GameScene.update()` SHALL be `this.input.activePointer.leftButtonDown()` instead of the current `isDown` (which fires on any mouse button). Right-click MUST NOT trigger an attack.

#### Scenario: Left-click fires attack

- **WHEN** the player holds the left mouse button while not rolling
- **THEN** attacks fire/swing at the configured rate (existing behavior preserved)

#### Scenario: Right-click does not fire attack

- **WHEN** the player presses or holds the right mouse button while not rolling and within roll cooldown
- **THEN** no attack is triggered (no bullet/swing); the right-click is consumed only by the roll trigger logic (or ignored if on cooldown)

#### Scenario: Both buttons held

- **WHEN** the player holds both left and right buttons simultaneously
- **THEN** left-click drives the attack rate as normal; right-click triggers exactly one roll on its initial press (edge-triggered), no additional rolls fire from the held state

### Requirement: Roll Independent of Skill System

The roll SHALL NOT consume `skillCharges`, MUST NOT block or be blocked by Q-key skill triggers, and MUST NOT appear in the `UPGRADES` pool. The roll cooldown timer MUST be tracked separately from any skill cooldown (e.g., time-stop's `timeStopReadyAt`).

#### Scenario: Roll does not affect skill charges

- **GIVEN** the player has `skillCharges = 3`
- **WHEN** the player rolls
- **THEN** `skillCharges` remains `3` after the roll

#### Scenario: Skill and roll same frame

- **WHEN** the player presses Q and right-clicks within the same frame
- **THEN** both effects can resolve: the Q skill fires (if charges available) AND the roll begins (if cooldown ready). Neither blocks the other.

#### Scenario: Roll absent from upgrade pool

- **WHEN** the level-up 3-choice draw runs
- **THEN** no roll-related upgrade card appears (e.g., no "Roll CD -0.2s", no "+1 roll charge"); the roll is a baseline action, not an upgradeable system
