// All owned will be deleted on owner delete
TowerDefense.components.Owner = function(spec) {
    let owned = {};

    if (spec.entities) {
        for (let i = 0; i < spec.entities.length; ++i) {
            addEntity(spec.entities[i]);
        }
    }

    function addEntity(entity) {
        owned[entity.id] = entity;
    }

    function removeEntity(entity) {
        delete owned[entity.id];
    }

    return {
        get name() { return 'owner'; },
        get owned() { return owned; },
        addEntity: addEntity,
        removeEntity: removeEntity
    };
};