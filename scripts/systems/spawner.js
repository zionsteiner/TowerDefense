// Entities are created elsewhere, this is responsible for registering them to other
// systems
TowerDefense.systems.Spawner = function() {
    let system = System();

    system.update = function(elapsedTime, entities, reportSpawn) {
        for (let id in system.entities) {
            let entity = system.entities[id];
            entity.components.spawnable.delay -= elapsedTime;
            if (entity.components.spawnable.delay <= 0) {
                system.removeEntity(entity);
                delete entity.components.spawnable;
                reportSpawn(entity);
            }
        }
    };

    return system;
};