TowerDefense.components.Position = function(spec) {
    'use strict';

    return {
        get name() { return 'position'; },
        get x() { return spec.x; },
        set x(val) { spec.x = val; },
        get y() { return spec.y; },
        set y(val) { spec.y = val; },
        get width() { return spec.width; },
        set width(v) { spec.width = v; },
        get height() { return spec.height; },
        set height(v) { spec.height = v; },
        get rotation() { return spec.rotation; },
        set rotation(val) { spec.rotation = val; }
    };
};
