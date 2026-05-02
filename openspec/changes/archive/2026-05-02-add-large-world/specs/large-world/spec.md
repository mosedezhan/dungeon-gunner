# Large World Capability Specification

## ADDED Requirements

### Requirement: World dimensions shall be configurable and larger than viewport

The system SHALL define world dimensions in `src/config.js` under the `WORLD` block, independent from viewport dimensions. The world SHALL be 3× the viewport width and 5× the viewport height, providing 3840×3600 total space when viewport is 1280×720.

#### Scenario: World is 15x larger than viewport
- **WHEN** GAME.width is 1280 and GAME.height is 720
- **THEN** WORLD.width shall be 3840 (3 × viewport width)
- **AND** WORLD.height shall be 3600 (5 × viewport height)

#### Scenario: World constants are accessible
- **WHEN** code imports from config.js
- **THEN** WORLD.width and WORLD.height shall be exported
- **AND** these values shall be independent from GAME.width/height

### Requirement: Camera shall smoothly follow player within world bounds

The system SHALL make the camera smoothly follow the player character with linear interpolation (lerp=0.1), and SHALL constrain the camera so it never shows areas outside the world boundaries.

#### Scenario: Camera follows player smoothly
- **WHEN** player moves from position (100, 100) to (200, 200)
- **THEN** camera shall move toward new position with lerp=0.1
- **AND** camera movement shall appear smooth, not instant

#### Scenario: Camera stops at world boundaries
- **WHEN** player reaches world edge (e.g., x=3840)
- **THEN** camera shall not scroll beyond world boundary
- **AND** black space shall not appear beyond world edge

### Requirement: Enemies shall spawn outside camera but inside world

The system SHALL provide a `getSpawnRing()` method that returns valid spawn positions that are:
1. Outside the current camera viewport
2. Inside the world boundaries
3. Distributed around the four edges of the visible area

#### Scenario: Spawn points are outside viewport
- **WHEN** camera is centered at player position (1920, 1800) in world
- **THEN** spawn positions shall be at least margin distance away from camera edges
- **AND** no enemy shall spawn directly on screen

#### Scenario: Spawn points are inside world
- **WHEN** player is near world edge (e.g., within 500px of x=3840)
- **THEN** spawn positions shall be clamped to world boundary
- **AND** no enemy shall spawn outside world (x > 3840 or x < 0)

### Requirement: Projectiles shall be recycled when leaving world boundaries

The system SHALL recycle bullets and enemy bullets when they exit the world boundaries (not just camera viewport), preventing memory leaks and ensuring clean gameplay.

#### Scenario: Player bullets despawn at world edge
- **WHEN** player bullet travels past x > WORLD.width or y > WORLD.height
- **THEN** bullet shall be disabled and recycled to object pool
- **AND** no damage shall be dealt to enemies outside world

#### Scenario: Enemy bullets despawn at world edge
- **WHEN** enemy bullet travels past x < 0 or y < 0
- **THEN** bullet shall be disabled and recycled to object pool
- **AND** bullet shall not continue processing

### Requirement: World floor shall render efficiently

The system SHALL render the world floor using a cached texture pattern tiled across the entire world area, avoiding performance issues from thousands of individual rectangle objects.

#### Scenario: Floor renders as single tiled texture
- **WHEN** game scene loads
- **THEN** a single tileSprite shall cover the entire world area
- **AND** floor pattern shall repeat seamlessly across 3840×3600 area

#### Scenario: Floor rendering is performant
- **WHEN** camera moves across the world
- **THEN** frame rate shall remain stable (≥30 FPS)
- **AND** no new graphics objects shall be created during camera movement

### Requirement: Viewport dimensions shall be increased

The system SHALL increase the game viewport from 960×600 to 1280×720, providing a larger visible area while maintaining aspect ratio compatibility with common displays.

#### Scenario: Viewport is 1280x720
- **WHEN** Phaser game initializes
- **THEN** canvas shall be sized to 1280×720
- **AND** GAME.width shall equal 1280
- **AND** GAME.height shall equal 720

### Requirement: World system shall provide centralized interface

The system SHALL provide a `World` class with methods for world boundary queries, spawn ring calculation, and out-of-bounds checking, abstracting world logic from individual entities.

#### Scenario: World module exports required methods
- **WHEN** code imports from World.js
- **THEN** World class shall be available
- **AND** World.getBounds() shall return world boundary rectangle
- **AND** World.getSpawnRing(camera) shall return spawn area data
- **AND** World.isOutOfBounds(x, y) shall return boolean
- **AND** World.setupPhysicsWorld() shall configure physics world bounds

#### Scenario: World interface is used by existing systems
- **WHEN** GameScene initializes physics
- **THEN** world.setupPhysicsWorld() shall be called
- **WHEN** WaveManager spawns enemies
- **THEN** world.getSpawnRing() shall determine spawn positions
- **WHEN** Bullet preUpdate executes
- **THEN** world.isOutOfBounds() shall check position
