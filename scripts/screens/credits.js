TowerDefense.screens['credits'] = (function(manager) {
    'use strict';

    function init() {
        $('#credits-back').click(() => manager.showScreen('main-menu'));
    }

    function run() {}

    return {
        init: init,
        run: run
    };
}(TowerDefense.manager));