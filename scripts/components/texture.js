TowerDefense.components.Texture = function(spec) {
    return {
        get name() { return 'texture'; },
        get: function() { return spec.img; }
    };
};