let System = function() {
    let entities = {};

    function addEntity(entity) {
        entities[entity.id] = entity;
    }

    function removeEntity(entity) {
        delete entities[entity.id];
    }

    return {
        entities: entities,
        addEntity: addEntity,
        removeEntity: removeEntity
    }
};