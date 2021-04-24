TowerDefense.systems.Collision = function(particleSystem) {
  let projectiles = {};
  let creeps = {'air': {}, 'ground': {}};

  function addEntity(entity) {
    if (entity.components.hasOwnProperty('projectile')) {
      projectiles[entity.id] = entity;
    } else if (entity.components.hasOwnProperty('health')) {
      creeps[entity.components.health.type][entity.id] = entity;
    }
  }

  function removeEntity(entity) {
    if (projectiles.hasOwnProperty(entity.id)) {
      delete projectiles[entity.id];
    } else {
      for (let type in creeps) {
        if (creeps[type].hasOwnProperty(entity.id)) {
          delete creeps[type][entity.id];
        }
      }
    }
  }

  function update(elapsedTime, entities, report) {
    for (let id in projectiles) {
      // Update projectile location
      let projectile = projectiles[id];
      updatePos(elapsedTime, projectile);

      // Remove out of bounds projectile (miss)
      let canvasWidth = TowerDefense.graphics.canvas.width;
      let canvasHeight = TowerDefense.graphics.canvas.height;
      let projPos = projectile.components.position;
      if (projPos.x >= canvasWidth || projPos.x <= 0 || projPos.y >= canvasHeight || projPos.y <= 0) {
        report(projectile);
        continue;
      }

      // Test for creep collision
      if (projectile.components.projectile.isAOE) {
        updateAOE(elapsedTime, projectile, report);
      } else {
        updateNonAOE(projectile, report);
      }
    }
  }

  function updatePos(elapsedTime, projectile) {
    let projComp = projectile.components.projectile;
    let projPos = projectile.components.position;

    projPos.x += projComp.targetVec.unitVec.x * projComp.speed * elapsedTime;
    projPos.y += projComp.targetVec.unitVec.y * projComp.speed * elapsedTime;

    if (projComp.type === 'boomerang' || projComp.type === 'bomb') {
      projPos.rotation += elapsedTime * projComp.speed;
    }

    if (projectile.components.hasOwnProperty('particleEmitter')) {
      let emitter = projectile.components.particleEmitter.emitters['trail'];
      let pos = projectile.components.position;
      emitter.center = {x: pos.x, y: pos.y};
      particleSystem.emit(emitter);
    }
  }

  function updateAOE(elapsedTime, projectileEntity, report) {
    // Update timer
    let projPos= projectileEntity.components.position;
    let projComp = projectileEntity.components.projectile;
    projComp.delay -= elapsedTime;
    if (projComp.delay <= 0) {
      if (projComp.targetType === 'both') {
        for (let type in creeps) {
          for (let creepId in creeps[type]) {
            // collision logic
            let creep = creeps[type][creepId];
            let creepPos = creep.components.position;
            let creepRadius = Math.max(creepPos.width, creepPos.height) / 2;
            let dist = Math.sqrt(Math.pow(projPos.x - creepPos.x, 2) + Math.pow(projPos.y - creepPos.y, 2));
            if (projComp.AOERadius + creepRadius >= dist) {
              damageCreep(creep, projComp.damage, report);
            }
          }
        }
      } else {
        for (let creepId in creeps[projComp.targetType]) {
          // collision logic
          let creep = creeps[projComp.targetType][creepId];
          let creepPos = creep.components.position;
          let creepRadius = Math.max(creepPos.width, creepPos.height) / 2;
          let dist = Math.sqrt(Math.pow(projPos.x - creepPos.x, 2) + Math.pow(projPos.y - creepPos.y, 2));
          if (projComp.AOERadius + creepRadius >= dist) {
            damageCreep(creep, projComp.damage, report);
          }
        }
      }

      report(projectileEntity);
    }
  }

  function updateNonAOE(projectileEntity, report) {
    let projPos = projectileEntity.components.position;
    let projComp = projectileEntity.components.projectile;

    if (projComp.targetType === 'both') {
      for (let type in creeps) {
        for (let creepId in creeps[type]) {
          let creep = creeps[type][creepId];
          if (collides(projPos, creep.components.position)) {
            // Damage first creep hit
            damageCreep(creep, projComp.damage, report);
            report(projectileEntity);
            break;
          }
        }
      }
    } else {
      for (let creepId in creeps[projComp.targetType]) {
        let creep = creeps[projComp.targetType][creepId];
        if (collides(projPos, creep.components.position)) {
          // Damage first creep hit
          damageCreep(creep, projComp.damage, report);
          report(projectileEntity);
          break;
        }
      }
    }
  }


  function damageCreep(creep, damage, report) {
    let creepHealth = creep.components.health;
    creepHealth.currHealth -= damage;
    if (creepHealth.currHealth <= 0) {
      report(creep);
    }
  }

  // Circle intersection
  function collides(a, b){
    let radiusA = Math.max(a.width, a.height) / 2;
    let radiusB = Math.max(b.width, b.height) / 2;
    let dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    return (radiusA + radiusB) >= dist;
  }


  return {
    update: update,
    addEntity: addEntity,
    removeEntity: removeEntity
  };
};