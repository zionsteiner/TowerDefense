TowerDefense.components.Pathbound = function(spec) {
    return {
        get name() { return 'pathbound'},
        currCell: null,
        destCell: null,
        speed: spec.speed,
        direction: null,
        type: spec.type
    };
};