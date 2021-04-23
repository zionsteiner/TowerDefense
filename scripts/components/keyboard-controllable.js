TowerDefense.components.KeyboardControllable = function(spec) {
    'use strict';

    // {key : handler}
    let handlers = spec.handlers;
    let active = false;

    return {
        get name() { return 'keyboardControllable'; },
        handlers: handlers,
        get active() { return active; },
        set active(a) { active = a; }
    };
};