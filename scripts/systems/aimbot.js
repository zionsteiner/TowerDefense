TowerDefense.systems.Aimbot = function() {
  'use strict';

  let shooters = {};
  let targets = {};

  function addEntity(entity) {
    if (entity.components.hasOwnProperty('aimable')) {
      shooters[entity.id] = entity;
    } else if (entity.components.hasOwnProperty('health')) {
      targets[entity.id] = entity;
    }
  }

  function removeEntity(entity) {
    if (shooters.hasOwnProperty(entity.id)) {
      delete shooters[entity.id];
    }
    if (targets.hasOwnProperty(entity.id)) {
      delete targets[entity.id];
    }
  }
  
  // ToDo: closest vs least angle? Recalc each time or shoot at target until dead/out of range?
  function update(elapsedTime, entities, reportShoot) {
    // Find all targetable entities (assumes has position, health)
    if (targets === {}) {
      return;
    }

    let targetable = [];
    for (let id in targets) {
      let entity = targets[id];
      if (entity.components.hasOwnProperty('health')) {
        targetable.push(entity);
      }
    }

    for (let id in shooters) {
      let aimable = shooters[id];

      // Test for within range
      let i = 0;
      let target = null;
      let minDist = Number.MAX_SAFE_INTEGER;
      while (i < targetable.length) {
        let currTarget = targetable[i];
        if (currTarget.components.health.type === aimable.components.aimable.targetType || aimable.components.aimable.targetType === 'both') {
          let currDist = dist(aimable, currTarget);
          if (currDist < minDist) {
            target = currTarget;
            minDist = currDist;
          }
        }

        ++i;
      }
      if (target !== null && minDist <= aimable.components.aimable.radius) {
        // Aim at closest
        aimable.components['aimable'].target = target;
        let angle = computeAngle(aimable, target);
        if (testTolerance(angle.angle, 0, 0.2) === false) {
          if (angle.crossProd > 0) {
            rotateRight(aimable, elapsedTime);
          } else {
            rotateLeft(aimable, elapsedTime);
          }
        } else {
          aimable.components.aimable.fireTime += elapsedTime;
          reportShoot(aimable);
        }
      }
    }
  }

  function rotateRight(aimable, elapsedTime) {
    aimable.components['position'].rotation -= aimable.components['aimable'].rotationRate * elapsedTime;
  }

  function rotateLeft(aimable, elapsedTime) {
    aimable.components['position'].rotation += aimable.components['aimable'].rotationRate * elapsedTime;
  }

  function dist(a, b) {
    let posA = a.components.position;
    let posB = b.components.position;
    return Math.sqrt(Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2));
  }

  function computeAngle(aimable, target) {
    let aimableVec = {
      x: Math.cos(aimable.components['position'].rotation * Math.PI / 180),
      y: Math.sin(aimable.components['position'].rotation * Math.PI / 180),
    }
    let targetVec = {
      x: target.components['position'].x - aimable.components['position'].x,
      y: target.components['position'].y - aimable.components['position'].y
    }

    targetVec.len = Math.sqrt(Math.pow(targetVec.x, 2) + Math.pow(targetVec.y, 2));
    targetVec.x /= targetVec.len;
    targetVec.y /= targetVec.len;

    let dotProd = aimableVec.x * targetVec.x + aimableVec.y * targetVec.y;
    let angle = Math.acos(dotProd);

    let crossProd = crossProduct(aimable, target);

    return {
      angle: angle,
      crossProd: crossProd
    };
  }

  function crossProduct(aimable, target) {
    let aPos = aimable.components['position'];
    let bPos = target.components['position'];
    return (aPos.x * bPos.y - aPos.y * bPos.x);
  }

  function testTolerance(value, test, tolerance) {
    return Math.abs(value - test) < tolerance;
  }

  return {
    addEntity: addEntity,
    removeEntity: removeEntity,
    update: update
  };

};