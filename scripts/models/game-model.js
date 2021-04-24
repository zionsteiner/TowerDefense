TowerDefense.models.Game = function() {
    'use strict';

    // ToDo: organize these
    const INIT_MONEY = 500;
    const INIT_LIVES = 30;
    const REFUND_RATE = 0.75;

    // ToDo: make rectangular arenas possible
    // Must be even
    const WALL_SEG_LENGTH = 6;
    const ARENA_DIM = 3 * WALL_SEG_LENGTH + 1;

    // These should not change; resizing is done via css
    const CANVAS_WIDTH = TowerDefense.graphics.canvas.width;
    const CANVAS_HEIGHT = TowerDefense.graphics.canvas.height;
    const GRID_CELL_WIDTH = CANVAS_WIDTH / ARENA_DIM;
    const GRID_CELL_HEIGHT = CANVAS_HEIGHT / ARENA_DIM;

    const INIT_MAX_CREEP_SPAWN_DELTA = 2000;

    const WAVE1SETTINGS = {
        level: 1,
        maxCreepSpawnDelta: INIT_MAX_CREEP_SPAWN_DELTA,
        creepSpecs: {
            goblinSpec: {
                n: 2,
                spec: {
                    type: 'ground',
                    health: 100,
                    spriteSheet: TowerDefense.assets['creep-goblin'],
                    spriteTime: [1000/7, 1000/7, 1000/7, 1000/7, 1000/7, 1000/7, 1000/7],
                    xDim: 17,
                    yDim: 5,
                    xMin: 0,
                    xMax: 6,
                    yMin: 0,
                    yMax: 3,
                    usePosRotation: false,
                    speed: 0.75 * GRID_CELL_WIDTH / 1000
                }
            },
            bugSpec: {
                n: 2,
                spec: {
                    type: 'ground',
                    health: 75,
                    spriteSheet: TowerDefense.assets['creep-bug'],
                    spriteTime: [200, 1000, 200, 600],
                    xDim: 4,
                    yDim: 1,
                    xMin: 0,
                    xMax: 3,
                    yMin: 0,
                    yMax: 0,
                    usePosRotation: true,
                    speed: 1.5 * GRID_CELL_WIDTH / 1000
                }
            },
            batSpec: {
                n: 0,
                spec: {
                    type: 'air',
                    health: 50,
                    spriteSheet: TowerDefense.assets['creep-bat'],
                    spriteTime: [1000/4, 1000/4, 1000/4, 1000/4],
                    xDim: 4,
                    yDim: 4,
                    xMin: 0,
                    xMax: 3,
                    yMin: 0,
                    yMax: 3,
                    usePosRotation: false,
                    speed: 2 * GRID_CELL_WIDTH / 1000
                }
            }
        }
    };

    let entities = {};
    let systems = {};
    let systemCallbacks = {
        'pathfinder': function(entity) {
            gameStats.setLives(gameStats.getLives() - 1);
            gameStats.setCreepCount(gameStats.getCreepCount() - 1);
            removeEntity(entity);
        },
        'spawner': function(creep) {
            systems['render'].addEntity(creep);
            systems['pathfinder'].addEntity(creep);
            systems['animation'].addEntity(creep);
            systems['collision'].addEntity(creep);
            systems['aimbot'].addEntity(creep);

            let healthbar = creep.components.health.healthBarEntities;
            systems['render'].addEntity(healthbar.green);
            systems['render'].addEntity(healthbar.red);
        },
        // ToDo: how to remove dead creeps and projectiles
        'aimbot': function(shooter) {
            let aimable = shooter.components.aimable;
            if (aimable.fireTime - (1 / aimable.fireRate) >= 0) {
                aimable.fireTime -= (1 / aimable.fireRate);

                let pos = shooter.components.position;
                let targetPos = aimable.target.components.position;

                let targetVec = {x: targetPos.x - pos.x, y: targetPos.y - pos.y};
                targetVec.len = Math.sqrt(Math.pow(targetVec.x, 2) + Math.pow(targetVec.y, 2));
                targetVec.unitVec = {x: targetVec.x / targetVec.len, y: targetVec.y / targetVec.len};
                let projectile = Entity.createEntity();
                projectile.addComponent(components.Texture({
                    img: TowerDefense.assets[aimable.weaponType],
                }));
                // Spawn right off tower
                projectile.addComponent(components.Position({
                    x: pos.x + targetVec.unitVec.x * GRID_CELL_WIDTH,
                    y: pos.y + targetVec.unitVec.y * GRID_CELL_HEIGHT,
                    width: PROJECTILE_SPECS[aimable.weaponType].width,
                    height: PROJECTILE_SPECS[aimable.weaponType].height,
                    rotation: pos.rotation
                }));
                projectile.addComponent(components.Projectile({
                    damage: aimable.damage,
                    speed: PROJECTILE_SPECS[aimable.weaponType].speed,
                    targetVec: targetVec,
                    isTargetTracking: PROJECTILE_SPECS[aimable.weaponType].isTargetTracking,
                    targetType: aimable.targetType,
                    // Bomb specific below here
                    isAOE: PROJECTILE_SPECS[aimable.weaponType].isAOE,
                    delay: PROJECTILE_SPECS[aimable.weaponType].delay,
                    AOERadius: PROJECTILE_SPECS[aimable.weaponType].AOERadius,
                    type: aimable.weaponType
                }));

                // ToDo: make particle effect match damage radius
                if (aimable.weaponType === 'missile' || aimable.weaponType === 'bomb') {
                    projectile.addComponent(components.ParticleEmitter({
                        'explode': {
                            img: TowerDefense.assets['fire'],
                            size: {mean: 5, stddev: 1},
                            speed: {mean: 105 / 1000, stddev: 5 / 1000},
                            quantity: 100,
                            rotationToSpeed: 1 / 50,
                            lifetime: {mean: 750, stddev: 100},
                            center: {x: projectile.components.position.x, y: projectile.components.position.y},
                        },
                        'trail': {
                            img: TowerDefense.assets['fire'],
                            size: {mean: 5, stddev: 1},
                            speed: {mean: 15 / 1000, stddev: 5 / 1000},
                            quantity: 25,
                            rotationToSpeed: 1 / 50,
                            lifetime: {mean: 300, stddev: 100},
                            center: {x: projectile.components.position.x, y: projectile.components.position.y},
                        }
                    }));
                    projectile.addComponent(components.Sound({sounds: {explodeSound: TowerDefense.assets['explodeSound']}}));
                }

                entities[projectile.id] = projectile;

                systems['collision'].addEntity(projectile);
                systems['render'].addEntity(projectile);

                // Sound effect
                shooter.components.sound.get('shootSound').currentTime = 0;
                shooter.components.sound.get('shootSound').play();
            }
        },
        'collision': function(entity) {
            if (entity.components.hasOwnProperty('projectile')) {
                if (entity.components.particleEmitter) {
                    let emitter = entity.components.particleEmitter.emitters['explode'];
                    let pos = entity.components.position;
                    emitter.center = {x: pos.x, y: pos.y};
                    systems.particles.emit(emitter);
                }

                if (entity.components.hasOwnProperty('sound')) {
                    entity.components.sound.get('explodeSound').volume = 0.5;
                    entity.components.sound.get('explodeSound').currentTime = 0;
                    entity.components.sound.get('explodeSound').play();
                }
            } else if (entity.components.hasOwnProperty('health')) {
                // Add creep score
                let fullHealth = entity.components.health.fullHealth;
                gameStats.setScore(gameStats.getScore() + fullHealth);
                gameStats.setMoney(gameStats.getMoney() + fullHealth);
                gameStats.setCreepCount(gameStats.getCreepCount() - 1);

                entity.components.sound.get('hurtSound').currentTime = 0;
                entity.components.sound.get('hurtSound').play();

                let emitter = entity.components.particleEmitter.emitters['death'];
                let pos = entity.components.position;
                emitter.center = {x: pos.x, y: pos.y};
                systems.particles.emit(emitter);

                // Score animation
                let scoreAnim = Entity.createEntity();
                scoreAnim.addComponent(components.Text({
                    text: '+' + entity.components.health.fullHealth,
                    font: '0.5rem future',
                    fillStyle: 'green',
                    strokeStyle: 'green'
                }));
                scoreAnim.addComponent(components.Position({
                    x: entity.components.position.x,
                    y: entity.components.position.y - 2 * GRID_CELL_HEIGHT,
                }));
                entities[scoreAnim.id] = scoreAnim;
                systems.render.addEntity(scoreAnim);
                systems.scoreAnim.addEntity(scoreAnim);
            }
            removeEntity(entity);
        },
        'scoreAnim': function(entity) {
            removeEntity(entity);
        },
        'particles': function(particle) {
            // if is entity
            if (particle.components) {
                removeEntity(particle);
            }
            // else spawn new
            else {
                let entity = Entity.createEntity();
                entity.addComponent(components.Position({
                    x: particle.center.x,
                    y: particle.center.y,
                    rotation: particle.rotation,
                    width: particle.size.width,
                    height: particle.size.height
                }));
                entity.addComponent(components.Particle({
                    lifetime: particle.lifetime,
                    aliveDuration: particle.aliveDuration,
                    speed: particle.speed,
                    direction: particle.direction,
                    rotationToSpeed: particle.rotationToSpeed
                }));
                entity.addComponent(components.Texture({
                    img: particle.img
                }));

                entities[entity.id] = entity;
                systems.render.addEntity(entity);
                systems.particles.addEntity(entity);
            }
        }
    };

    let grid = null;

    let gameStats = null;
    let currLevelSettings = null;

    let isGameOver = false;
    let isLevelOver = false;

    let components = TowerDefense.components;

    let towerControls = {};

    // ToDo: logic needs to be refactored into placeable component and system
    let isTowerBeingPlaced = false;

    // Tower specs
    const PROJECTILE_SPECS = {
        'bullet': {
            width: GRID_CELL_WIDTH / 2,
            height: GRID_CELL_HEIGHT / 2,
            speed: 10 * GRID_CELL_WIDTH / 1000,  // make part of tower spec? (doesn't make sense for gas tower)
            isAOE: false,
            isTargetTracking: false // ToDo
        },
        'bomb': {
            width: GRID_CELL_WIDTH,
            height: GRID_CELL_HEIGHT,
            speed: 8 * GRID_CELL_WIDTH / 1000,
            isAOE: true,
            delay: 500,
            AOERadius: 3 * GRID_CELL_WIDTH,
            isTargetTracking: false,
        },
        'missile': {
            width: GRID_CELL_WIDTH,
            height: GRID_CELL_HEIGHT,
            speed: 10 * GRID_CELL_WIDTH / 1000,
            isAOE: false,
            isTargetTracking: true
        },
        'boomerang': {
            width: GRID_CELL_HEIGHT,
            height: GRID_CELL_HEIGHT,
            speed: 8 * GRID_CELL_WIDTH / 1000,
            isAOE: false,
            isTargetTracking: true
        }
    };
    const TOWER_SPECS = {
        'tower-gun': {
            weaponType: 'bullet',
            targetType: 'ground',
            upgrade: 0,
            upgradeSpecs: [
                {
                    rotationRate: 135 / 1000,
                    damage: 10,
                    fireRate: 3 / 1000,
                    radius: 4 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 100,
                },{
                    rotationRate: 180 / 1000,
                    damage: 15,
                    fireRate: 5 / 1000,
                    radius: 3 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 150,
                }, {
                    rotationRate: 225 / 1000,
                    damage: 20,
                    fireRate: 5 / 1000,
                    radius: 6 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 200
                }
            ]
        },
        'tower-bomb': {
            weaponType: 'bomb',
            targetType: 'ground',
            upgrade: 0,
            upgradeSpecs: [
                {
                    rotationRate: 135 / 1000,
                    damage: 20,
                    fireRate: 1 / 1000,
                    radius: 5 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 300,
                },{
                    rotationRate: 180 / 1000,
                    damage: 25,
                    fireRate: 1 / 1000,
                    radius: 6 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 500,
                }, {
                    rotationRate: 225 / 1000,
                    damage: 30,
                    fireRate: 1 / 1000,
                    radius: 7 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 1000
                }
            ]
        },
        'tower-missile': {
            weaponType: 'missile',
            targetType: 'air',
            upgrade: 0,
            upgradeSpecs: [
                {
                    rotationRate: 135 / 1000,
                    damage: 25,
                    fireRate: 1 / 1000,
                    radius: 6 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 300,
                },{
                    rotationRate: 180 / 1000,
                    damage: 30,
                    fireRate: 1 / 1000,
                    radius: 7 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 400,
                }, {
                    rotationRate: 225 / 1000,
                    damage: 35,
                    fireRate: 1 / 1000,
                    radius: 8 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 500
                }
            ]
        },
        'tower-boomerang': {
            weaponType: 'boomerang',
            targetType: 'both',
            upgrade: 0,
            upgradeSpecs: [
                {
                    rotationRate: 135 / 1000,
                    damage: 25,
                    fireRate: 1 / 1000,
                    radius: 5 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 300,
                },{
                    rotationRate: 180 / 1000,
                    damage: 30,
                    fireRate: 2 / 1000,
                    radius: 6 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 450,
                }, {
                    rotationRate: 225 / 1000,
                    damage: 35,
                    fireRate: 3 / 1000,
                    radius: 7 * (CANVAS_WIDTH / ARENA_DIM),
                    cost: 500
                }
            ]
        }
    };

    // One time stuff
    function init() {
        reset();
    }

    // Set level options
    function initNextLevel() {
        isLevelOver = false;
        gameStats.setCurrLevel(gameStats.getCurrLevel() + 1);

        // Swap entrance
        if (grid.entrance === grid.leftEntrance()) {
            grid.entrance = grid.topEntrance();
            grid.exit = grid.bottomEntrance();
        } else {
            grid.entrance = grid.leftEntrance();
            grid.exit = grid.rightEntrance();
        }
        grid.needsPathUpdate = true;

        if (gameStats.getCurrLevel() === 1) {
            currLevelSettings = WAVE1SETTINGS;
        } else {
            currLevelSettings = getNextLevelSettings(currLevelSettings);
        }

        // Generate creep spawn times. Game will spawn creeps in update()
        let lastSpawnTime = 0;
        let totalCreeps = 0;
        let specArray = [];
        let spawnDelays = [];
        for (let id in currLevelSettings.creepSpecs) {
            let creepSpec = currLevelSettings.creepSpecs[id];
            totalCreeps += creepSpec.n;
            for (let i = 0; i < creepSpec.n; ++i) {
                specArray.push(creepSpec.spec);
                let spawnDelay = lastSpawnTime + Random.nextDouble() * currLevelSettings.maxCreepSpawnDelta;
                spawnDelays.push(spawnDelay);
                lastSpawnTime = spawnDelay;
            }
        }

        shuffleArray(specArray);
        for (let i = 0; i < specArray.length; ++i) {
            createCreep(specArray[i], spawnDelays[i]);
        }

        gameStats.setCreepCount(totalCreeps);
    }

    function shuffleArray(arr, iters=1) {
        for (let i = 0; i < iters * arr.length; ++i) {
            let randIdx = Math.floor(Random.nextDouble() * arr.length);
            let idx = i % arr.length;
            let temp = arr[idx];
            arr[idx] = arr[randIdx];
            arr[randIdx] = temp;
        }

        return arr;
    }

    function getNextLevelSettings(currSettings) {
        let newSettings = Object.assign({}, currSettings);

        newSettings.level++;
        newSettings.creepSpecs.goblinSpec.n += 3;
        newSettings.creepSpecs.goblinSpec.spec.health *= 1.10;
        newSettings.creepSpecs.goblinSpec.spec.health = Math.round(newSettings.creepSpecs.goblinSpec.spec.health);
        newSettings.creepSpecs.bugSpec.n += 3;
        newSettings.creepSpecs.bugSpec.spec.health *= 1.10;
        newSettings.creepSpecs.bugSpec.spec.health = Math.round(newSettings.creepSpecs.bugSpec.spec.health);

        if (newSettings.level >= 3) {
            newSettings.creepSpecs.batSpec.n += 3;
            newSettings.creepSpecs.batSpec.spec.health *= 1.10;
            newSettings.creepSpecs.batSpec.spec.health = Math.round(newSettings.creepSpecs.batSpec.spec.health);
        }

        newSettings.maxCreepSpawnDelta = Math.max(500, newSettings.maxCreepSpawnDelta - 10 * newSettings.level);

        return newSettings;
    }

    function createCreep(spec, delay) {
        let creepEntities = {};

        let creep = Entity.createEntity();
        creepEntities[creep.id] = creep;

        // Rand entrance point
        let position = null;
        if (grid.entrance === grid.topEntrance()) {
            let xPos = GRID_CELL_WIDTH * (Math.floor(Random.nextDouble() * (ARENA_DIM - 2 * WALL_SEG_LENGTH)) + WALL_SEG_LENGTH) + GRID_CELL_WIDTH / 2;
            position = components.Position({
                x: xPos,
                y: GRID_CELL_HEIGHT / 2,
                width: GRID_CELL_WIDTH,
                height: GRID_CELL_HEIGHT,
                rotation: 270
            });
        } else if (grid.entrance === grid.leftEntrance()) {
            let yPos = GRID_CELL_HEIGHT * (Math.floor(Random.nextDouble() * (ARENA_DIM - 2 * WALL_SEG_LENGTH)) + WALL_SEG_LENGTH) + GRID_CELL_HEIGHT / 2;
            position = components.Position({
                x: GRID_CELL_WIDTH / 2,
                y: yPos,
                width: GRID_CELL_WIDTH,
                height: GRID_CELL_HEIGHT,
                rotation: 0
            });
        }
        creep.addComponent(position);


        // Health bar entities
        let green = Entity.createEntity();
        green.addComponent(components.Position({
            x: position.x - GRID_CELL_WIDTH / 2,
            y: position.y - GRID_CELL_HEIGHT * 2.25,
            width: GRID_CELL_WIDTH,
            height: GRID_CELL_HEIGHT / 4
        }));
        green.addComponent(components.Rectangle({
            fillStyle: 'green'
        }));
        let red = Entity.createEntity();
        red.addComponent(components.Position({
            x: position.x + GRID_CELL_WIDTH / 2,
            y: position.y - GRID_CELL_HEIGHT * 2.25,
            width: 0,
            height: GRID_CELL_HEIGHT / 4
        }));
        red.addComponent(components.Rectangle({
            fillStyle: 'red'
        }));
        let healthBarEntities = {'green': green, 'red': red};
        creep.addComponent(components.Health({
            type: spec.type,
            health: spec.health,
            healthBarEntities: healthBarEntities,
        }));
        creep.addComponent(components.Owner({
            entities: [green, red]
        }));

        creep.addComponent(components.Animation({
            spriteSheet: spec.spriteSheet,
            spriteTime: spec.spriteTime,
            xDim: spec.xDim,
            yDim: spec.yDim,
            xMin: spec.xMin,
            yMin: spec.yMin,
            xMax: spec.xMax,
            yMax: spec.yMax,
            usePosRotation: spec.usePosRotation
        }));

        creep.addComponent(components.Sound({sounds: {'hurtSound': TowerDefense.assets['hurtSound']}}));

        creep.addComponent(components.Pathbound({
            type: spec.type,
            speed: spec.speed
        }));

        creep.addComponent(components.ParticleEmitter({
            'death': {
                img: TowerDefense.assets['blood'],
                size: {mean: 5, stddev: 1},
                speed: {mean: 10 / 1000, stddev: 5 / 1000},
                quantity: 100,
                rotationToSpeed: 1 / 500,
                lifetime: {mean: 300, stddev: 100},
                center: {x: position.x, y: position.y},
            }
        }));

        creep.addComponent(components.Spawnable({
            delay: delay
        }));

        systems['spawner'].addEntity(creep);

        creepEntities[creep.id] = creep;
        creepEntities[green.id] = green;
        creepEntities[red.id] = red;

        mergeObjects(entities, creepEntities);

        return creep;
    }

    function initArena(spec) {
        let arena = {};
        let ground = Entity.createEntity();
        ground.addComponent(components.Texture({
            img: TowerDefense.assets['arena']
        }));
        ground.addComponent(components.Gridlike({
            width: spec.arenaDim,
            height: spec.arenaDim
        }));
        ground.addComponent(components.Position({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_WIDTH / 2,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            rotation: 0
        }));
        systems.render.addEntity(ground);
        arena[ground.id] = ground;

        /* Create walls */
        function createWall(x, y) {
            let wall = Entity.createEntity();
            let posSpec = {
                width: CANVAS_WIDTH / spec.arenaDim,
                height: CANVAS_HEIGHT / spec.arenaDim,
                rotation: 0
            };
            posSpec.x = x * posSpec.width + posSpec.width / 2;
            posSpec.y = y * posSpec.height + posSpec.height / 2;
            wall.addComponent(components.Position(posSpec));
            wall.addComponent(components.Texture({img: TowerDefense.assets['wall']}));

            systems.render.addEntity(wall);
            ground.components['gridlike'].grid[y][x].obstructed = true;
            ground.components['gridlike'].grid[y][x]['entity'] = wall;

            arena[wall.id] = wall;

            return wall;
        }

        for (let i = 0; i < spec.wallSegLength; ++i) {
            // Left
            createWall(0, i);
            createWall(0, spec.arenaDim - i - 1);

            // Top
            if (i !== 0) {
                createWall(i, 0);
            }
            createWall(spec.arenaDim - i - 1, 0);

            // Right
            if (i !== 0) {
                createWall(spec.arenaDim - 1, i);
            }
            createWall(spec.arenaDim - 1, spec.arenaDim - i - 1);

            // Bottom
            if (i !== 0) {
                createWall(i, spec.arenaDim - 1);
            }
            createWall(spec.arenaDim - i - 1, spec.arenaDim - 1);
        }

        mergeObjects(entities, arena);

        return arena;
    }

    /* Called in initTowerPurchaseBar
    /* ToDo: figure out multicell towers (they look to small)
     * 1. Hit number for tower, triggering towerPurchaseBarCallback
       2. If enough money, tower becomes placeable.
       3. Tower is created at upgrade 1, only system is renderable and mouse controllable.
       4. Tower w/ radius is dragged around w/ mouse.
       5. When dragging, valid zones are green, invalid are red.
       6. On click on invalid zone, canceled.
       7. On click on valid zone, buy and place. Register to correct systems,
       remove radius and swap mouse handler to selection. */
    function purchaseTower(spec) {
        if (gameStats.getMoney() >= TOWER_SPECS[spec.type]['upgradeSpecs'][0]['cost']) {
            isTowerBeingPlaced = true;

            let towerEntities = {};

            let x = CANVAS_WIDTH - (CANVAS_WIDTH / ARENA_DIM) / 2;
            let y = (CANVAS_WIDTH / ARENA_DIM) / 2;

            let base = Entity.createEntity();
            // Position must be in center of grid cell
            base.addComponent(components.Position({
                // x: spec.x * (CANVAS_WIDTH / ARENA_DIM),
                // y: spec.y * (CANVAS_WIDTH / ARENA_DIM),
                x: x,
                y: y,
                width: CANVAS_WIDTH / ARENA_DIM,
                height: CANVAS_HEIGHT / ARENA_DIM,
                rotation: 0
            }));
            base.addComponent(components.Texture({
                img: TowerDefense.assets['tower-base']
            }));

            let tower = Entity.createEntity();
            tower.addComponent(components.Position({
                x: x,
                y: y,
                width: CANVAS_WIDTH / ARENA_DIM,
                height: CANVAS_HEIGHT / ARENA_DIM,
                rotation: 0
            }));
            tower.addComponent(components.Texture({
                img: TowerDefense.assets[spec.type]
            }));
            let circle = components.Circle({
                x: x,
                y: y,
                radius: TOWER_SPECS[spec.type]['upgradeSpecs'][0].radius,
                fillStyle: 'red',
                alpha: 0.5
            });
            tower.addComponent(circle);

            tower.addComponent(components.ParticleEmitter({
                'sell': {
                    img: TowerDefense.assets['coin'],
                    size: {mean: 7, stddev: 1},
                    speed: {mean: 15 / 1000, stddev: 5 / 1000},
                    quantity: 10,
                    rotationToSpeed: 1 / 50,
                    lifetime: {mean: 1000, stddev: 100},
                    center: {x: tower.components.position.x, y: tower.components.position.y},
                },
                'upgrade': {
                    img: TowerDefense.assets['plus'],
                    size: {mean: 7, stddev: 1},
                    speed: {mean: 15 / 1000, stddev: 5 / 1000},
                    quantity: 10,
                    rotationToSpeed: 1 / 50,
                    lifetime: {mean: 1000, stddev: 100},
                    center: {x: tower.components.position.x, y: tower.components.position.y},
                }
            }));

            tower.addComponent(components.Sound({sounds: {
                    'buySound': TowerDefense.assets['buySound'],
                    'shootSound': TowerDefense.assets['shootSound']
                }}));

            tower.addComponent(components.Aimable(TOWER_SPECS[spec.type]));
            tower.addComponent(components.Owner({
                entities: [base]
            }));

            // Only fires if active (false by default)
            tower.addComponent(components.KeyboardControllable({
                handlers: [
                    {
                        key: towerControls['upgrade'],
                        handler: function() {
                            let aimable = tower.components['aimable'];
                            let isUpgradable = aimable.upgrade < aimable.upgradeSpecs.length - 1;
                            let cost = aimable.upgradeSpecs[aimable.upgrade].cost;
                            let canAfford = gameStats.getMoney() >= cost;
                            if (isUpgradable && canAfford) {
                                aimable.upgrade++;
                                gameStats.setMoney(gameStats.getMoney() - cost);

                                let emitter = tower.components.particleEmitter.emitters['upgrade'];
                                let pos = tower.components.position;
                                emitter.center = {x: pos.x, y: pos.y};
                                systems.particles.emit(emitter);

                                tower.components.sound.play = true;
                            }
                        }
                    }, {
                        key: towerControls['sell'],
                        handler: function() {
                            let cost = 0;
                            for (let i = 0; i <= tower.components['aimable'].upgrade; ++i) {
                                cost += tower.components['aimable'].upgradeSpecs[i].cost;
                            }
                            gameStats.setMoney(gameStats.getMoney() + cost * REFUND_RATE);

                            let emitter = tower.components.particleEmitter.emitters['sell'];
                            let pos = tower.components.position;
                            emitter.center = {x: pos.x, y: pos.y};
                            systems.particles.emit(emitter);

                            tower.components.sound.get('buySound').currentTime = 0;
                            tower.components.sound.get('buySound').play();

                            removeEntity(tower);

                            let gridCoords = systems.pathfinder.toNearestGridCellCenter(pos);
                            grid.grid[gridCoords.grid.y][gridCoords.grid.x].obstructed = false;
                            grid.grid[gridCoords.grid.y][gridCoords.grid.x].canPlace = true;
                            grid.grid[gridCoords.grid.y][gridCoords.grid.x].entity = null;
                            grid.needsPathUpdate = true;
                        }
                    }]
            }));

            // Make this a component? Placeable?
            let mouseControllableSpec = {
                handlers: {
                    'mousemove': function(e) {
                        if (isTowerBeingPlaced) {
                            let pos = systems['pathfinder'].toNearestGridCellCenter(e);
                            base.components['position'].x = pos.canvas.x;
                            base.components['position'].y = pos.canvas.y;
                            tower.components['position'].x = pos.canvas.x;
                            tower.components['position'].y = pos.canvas.y;

                            tower.components['circle'].fillStyle = grid.grid[pos.grid.y][pos.grid.x].canPlace ? 'green' : 'red';
                        }
                    },
                    'mousedown': function(e) {
                        if (isTowerBeingPlaced) {
                            let pos = systems['pathfinder'].toNearestGridCellCenter(e);
                            if (grid.grid[pos.grid.y][pos.grid.x].canPlace) {
                                // Place
                                base.components['position'].x = pos.canvas.x;
                                base.components['position'].y = pos.canvas.y;
                                tower.components['position'].x = pos.canvas.x;
                                tower.components['position'].y = pos.canvas.y;

                                // Remove radius
                                delete tower.components['circle'];

                                // Pay
                                gameStats.setMoney(gameStats.getMoney() - TOWER_SPECS[spec.type]['upgradeSpecs'][0].cost);

                                // Change mouse event handlers
                                systems['mouse'].removeEntity(tower);
                                mouseControllableSpec.handlers = {
                                    'mousedown': function(e) {
                                        let clickLoc = systems.pathfinder.toNearestGridCellCenter(e);
                                        let towerLoc = systems.pathfinder.toNearestGridCellCenter(tower.components.position);
                                        if (clickLoc.grid.x === towerLoc.grid.x && clickLoc.grid.y === towerLoc.grid.y) {
                                            // Show radius
                                            circle.radius = tower.components['aimable'].radius;
                                            circle.fillStyle = 'green';
                                            tower.addComponent(circle);

                                            // Activate keyboard shortcuts
                                            tower.components['keyboardControllable'].active = true;
                                        } else {
                                            // Remove radius
                                            delete tower.components['circle'];

                                            // Deactivate keyboard shortcuts
                                            tower.components['keyboardControllable'].active = false;
                                        }
                                    }
                                };

                                // Reregister
                                tower.components['mouseControllable'].handlers = mouseControllableSpec.handlers;
                                systems['mouse'].addEntity(tower);

                                systems.aimbot.addEntity(tower);
                                systems.keyboard.addEntity(tower);

                                tower.components.sound.get('buySound').play();

                                isTowerBeingPlaced = false;

                                grid.grid[pos.grid.y][pos.grid.x].entity = tower;
                                grid.grid[pos.grid.y][pos.grid.x].obstructed = true;
                                grid.grid[pos.grid.y][pos.grid.x].canPlace = false;
                                grid.needsPathUpdate = true;
                            } else {
                                removeEntity(tower);
                                isTowerBeingPlaced = false;
                            }
                        }
                    }
                }
            };
            tower.addComponent(components.MouseControllable(mouseControllableSpec));

            systems.render.addEntity(base);
            towerEntities[base.id] = base;
            systems.render.addEntity(tower);
            towerEntities[tower.id] = tower;
            systems.mouse.addEntity(tower);
            tower.components['mouseControllable'].active = true;

            mergeObjects(entities, towerEntities);

            return towerEntities;
        }
    }

    // ToDo: figure out how to scale properly with grid size
    // ToDo: add tower names
    function initTowerPurchaseBar(arenaDim) {
        let barItems = {};

        let key = 1;
        let towerTextures = {
            'tower-gun': {
                texture: TowerDefense.assets['tower-gun'],
                key: key++
            },
            'tower-bomb': {
                texture: TowerDefense.assets['tower-bomb'],
                key: key++
            },
            'tower-missile': {
                texture: TowerDefense.assets['tower-missile'],
                key: key++
            },
            'tower-boomerang': {
                texture: TowerDefense.assets['tower-boomerang'],
                key: key++
            }
        };

        let CANVAS_HEIGHT = TowerDefense.graphics.canvas.height;
        let CANVAS_WIDTH = TowerDefense.graphics.canvas.width;

        let boxHeight = 1.75 * CANVAS_HEIGHT / arenaDim;

        let nTowers = Object.keys(towerTextures).length
        let boxWidth = nTowers * (CANVAS_WIDTH / arenaDim);

        let cellWidth = boxWidth / nTowers;
        
        // Box
        let border = Entity.createEntity();
        border.addComponent(components.Rectangle({
            lineWidth: 3,
            strokeStyle: '#003366',
            fillStyle: '#A5F2F3'
        }));
        border.addComponent(components.Position({
            x: CANVAS_WIDTH - boxWidth,
            y: 0,
            width: boxWidth,
            height: boxHeight,
            rotation: 0
        }));
        systems['render'].addEntity(border);
        barItems[border.id] = border;
        
        // Items
        let i = 0;
        for (let type in towerTextures) {
            let centerX = (CANVAS_WIDTH - boxWidth) + i * cellWidth + cellWidth / 2;

            let baseTexture = Entity.createEntity();
            baseTexture.addComponent(components.Texture({
                img: TowerDefense.assets['tower-base']
            }));
            baseTexture.addComponent(components.Position({
                x: centerX,
                y: cellWidth / 2,
                width: cellWidth,
                height: cellWidth,
                rotation: 0
            }));
            systems['render'].addEntity(baseTexture);
            barItems[baseTexture.id] = baseTexture;

            let towerTexture = Entity.createEntity();
            towerTexture.addComponent(components.Texture({
                img: towerTextures[type].texture
            }));
            towerTexture.addComponent(components.Position({
                x: centerX,
                y: cellWidth / 2,
                width: cellWidth,
                height: cellWidth,
                rotation: 0
            }));
            systems['render'].addEntity(towerTexture);
            barItems[towerTexture.id] = towerTexture;

            let textEntity = Entity.createEntity();
            textEntity.addComponent(components.Text({
                text: towerTextures[type].key,
                font: (0.5 * 6 / WALL_SEG_LENGTH) + 'rem future',
                fillStyle: '#003366',
                strokeStyle: '#003366',
            }));

            let textY = cellWidth;
            textEntity.addComponent(components.Position({
                x: centerX,
                y: textY,
                rotation: 0,
            }));
            textEntity.addComponent(components.KeyboardControllable({
                handlers: [
                    {
                        key: towerTextures[type].key,
                        handler: function() {
                            if (!isTowerBeingPlaced) {
                                purchaseTower({
                                    type: type
                                });
                            }
                        }
                    }
                ]
            }));
            textEntity.components['keyboardControllable'].active = true;
            systems['render'].addEntity(textEntity);
            systems['keyboard'].addEntity(textEntity);
            barItems[textEntity.id] = textEntity;

            i++;
        }

        mergeObjects(entities, barItems);

        return barItems;
    }

    // State (not really a component for this yet) . Setters update rendering
    // Top left corner
    // ToDo: make canvas rectangular and put stats and purchase bar there.
    function initGameStatsBar(spec) {
        let font = (0.75 * 4 / WALL_SEG_LENGTH) + 'rem future';
        let mWidth = TowerDefense.graphics.measureTextWidth(font, 'm')

        let gameStatsBarEntities = {};

        let nItems = 4;
        let score = spec.score;
        let currLevel = spec.currLevel;
        let money = spec.money;
        let lives = spec.lives;
        let creepCount = 0;

        let stateEntity = Entity.createEntity();

        function scoreStr() { return 'Score: ' + score; }
        function moneyStr() { return '$: ' + money; }
        function levelStr() { return 'Level: ' + currLevel; }
        function livesStr() { return 'Lives: ' + lives; }

        // Border
        stateEntity.addComponent(components.Position({
            x: 0,
            y: 0,
            width: 12 * mWidth,
            height: 3 * nItems * mWidth,
            rotation: 0
        }));
        stateEntity.addComponent(components.Rectangle({
            lineWidth: 5,
            strokeStyle: '#A93952',
            fillStyle: '#DCDBD9'
        }));

        // Contents
        let levelRenderer = Entity.createEntity();
        levelRenderer.addComponent(components.Position({
            x: 0.5 * mWidth,
            y: 0.5 * mWidth
        }));
        levelRenderer.addComponent(components.Text({
            text: 'Level: ' + currLevel,
            font: font,
            fillStyle: '#2DCBE9',
            strokeStyle: '#373534'
        }));

        let scoreRenderer = Entity.createEntity();
        scoreRenderer.addComponent(components.Position({
            x: 0.5 * mWidth,
            y: 3 * mWidth
        }));
        scoreRenderer.addComponent(components.Text({
            text: 'Score: ' + score,
            font: font,
            fillStyle: '#2DCBE9',
            strokeStyle: '#373534'
        }));
        systems.render.addEntity(scoreRenderer);

        let livesRenderer = Entity.createEntity();
        livesRenderer.addComponent(components.Position({
            x: 0.5 * mWidth,
            y: 6 * mWidth
        }));
        livesRenderer.addComponent(components.Text({
            text: 'Lives: ' + lives,
            font: font,
            fillStyle: '#2DCBE9',
            strokeStyle: '#373534'
        }));

        let moneyRenderer = Entity.createEntity();
        moneyRenderer.addComponent(components.Position({
            x: 0.5 * mWidth,
            y: 9 * mWidth
        }));
        moneyRenderer.addComponent(components.Text({
            text: '$: ' + money,
            font: font,
            fillStyle: '#2DCBE9',
            strokeStyle: '#373534'
        }));

        systems.render.addEntity(stateEntity);
        systems.render.addEntity(levelRenderer);
        systems.render.addEntity(scoreRenderer);
        systems.render.addEntity(moneyRenderer);
        systems.render.addEntity(livesRenderer);

        stateEntity.addComponent(components.Owner({
            entities: [levelRenderer, scoreRenderer, moneyRenderer, livesRenderer]
        }));

        stateEntity.getCurrLevel = function() {
            return currLevel;
        };
        stateEntity.setCurrLevel = function(c) {
            currLevel = c;
            levelRenderer.components.text.text = levelStr();
        };
        stateEntity.getScore = function() {
            return score;
        };
        stateEntity.setScore = function(s) {
            score = s;
            scoreRenderer.components.text.text = scoreStr();
        };
        stateEntity.getMoney = function() {
            return money;
        };
        stateEntity.setMoney = function(m) {
            money = m;
            moneyRenderer.components.text.text = moneyStr();
        };
        stateEntity.getLives = function() {
            return lives;
        };
        stateEntity.setLives = function(l) {
            lives = l;
            livesRenderer.components.text.text = livesStr();
        };
        stateEntity.getCreepCount = function() {
            return creepCount;
        };
        stateEntity.setCreepCount = function(c) {
            creepCount = c;
        };

        gameStatsBarEntities[stateEntity.id] = stateEntity;
        gameStatsBarEntities[scoreRenderer.id] = scoreRenderer;
        gameStatsBarEntities[levelRenderer.id] = levelRenderer;
        gameStatsBarEntities[moneyRenderer.id] = moneyRenderer;
        gameStatsBarEntities[livesRenderer.id] = livesRenderer;

        mergeObjects(entities, gameStatsBarEntities);

        return stateEntity;
    }

    function mergeObjects(dest, source) {
        for (let key in source) {
            dest[key] = source[key];
        }
    }

    function update(elapsedTime) {
        for (let system in systems) {
            systems[system].update(elapsedTime, entities, systemCallbacks[system]);
        }

        if (gameStats.getCreepCount() === 0) {
            isLevelOver = true;
        }
        if (gameStats.getLives() <= 0) {
            isGameOver = true;
        }
    }

    // Systems controls (input, sound)
    function enableCapture() {
        systems.keyboard.enableCapture();
        systems.mouse.enableCapture();
    }

    function disableCapture() {
        systems.keyboard.disableCapture();
        systems.mouse.disableCapture();
    }

    function removeEntity(entity) {
        let toRemove = [entity];
        if (entity.components.hasOwnProperty('owner')) {
            for (let ownedId in entity.components['owner'].owned) {
                toRemove.push(entity.components['owner'].owned[ownedId]);
            }
        }

        for (let i = 0; i < toRemove.length; ++i) {
            for (let system in systems) {
                systems[system].removeEntity(toRemove[i]);
            }
        }
    }

    function reset() {
        isGameOver = false;
        isLevelOver = false;

        systems = {};
        entities = {};

        // Init systems, arena
        systems['keyboard'] = TowerDefense.systems.Keyboard();
        systems['mouse'] = TowerDefense.systems.Mouse();
        systems['render'] = TowerDefense.systems.Render(TowerDefense.graphics);
        systems['aimbot'] = TowerDefense.systems.Aimbot();
        systems['pathfinder'] = TowerDefense.systems.Pathfinder({arenaDim: ARENA_DIM});
        systems['animation'] = TowerDefense.systems.Animation();
        systems['spawner'] = TowerDefense.systems.Spawner();
        systems['particles'] = TowerDefense.systems.ParticleSystem();
        systems['collision'] = TowerDefense.systems.Collision(systems['particles']);
        systems['scoreAnim'] = TowerDefense.systems.ScoreAnim(GRID_CELL_HEIGHT);


        let arena = initArena({
            'arenaDim': ARENA_DIM,
            'wallSegLength': WALL_SEG_LENGTH
        });
        for (let id in arena) {
            let entity = arena[id];
            if (entity.components.hasOwnProperty('gridlike')) {
                systems['pathfinder'].setGrid(entity.components.gridlike);
                grid = entity.components.gridlike;
                break;
            }
        }

        initTowerPurchaseBar(ARENA_DIM);
        gameStats = initGameStatsBar({
            score: 0,
            money: INIT_MONEY,
            lives: INIT_LIVES,
            currLevel: 0,
        });

        // Load keymappings
        let options = TowerDefense.screens.options.loadOptions();
        towerControls['upgrade'] = options['upgrade'];
        towerControls['sell'] = options['sell'];

        enableCapture();
    }

    return {
        init: init,
        initNextLevel: initNextLevel,
        get score() { return gameStats.getScore(); },
        get currLevel() { return gameStats.getCurrLevel(); },
        get money() { return gameStats.getMoney(); },
        get isGameOver() { return isGameOver; },
        get isLevelOver() { return isLevelOver; },
        update: update,
        get entities() { return entities; },
        get systems() { return systems; },
        enableCapture: enableCapture,
        disableCapture: disableCapture,
        reset: reset,
        get arenaDim() { return ARENA_DIM; }
    };
};