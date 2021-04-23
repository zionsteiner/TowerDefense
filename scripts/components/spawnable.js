TowerDefense.components.Spawnable = function(spec) {
    let delay = spec.delay;

    return {
        get name() { return 'spawnable'; },
        delay: delay
    }
};