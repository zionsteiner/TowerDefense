TowerDefense.components.Sound = function(spec) {
    return {
        get name() { return 'sound'; },
        get: function(k) { return spec.sounds[k]; },
        loop: spec.loop || false,
        play: false
    };
};