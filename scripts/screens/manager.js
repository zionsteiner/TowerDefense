TowerDefense.manager = (function(screens) {
    'use strict';

    function showScreen(screenId) {
        $('.active').removeClass('active');
        screens[screenId].run();
        $('#'+screenId).addClass('active');
    }

    function init() {
        for (let screen in screens) {
            if (screens.hasOwnProperty(screen)) {
                screens[screen].init();
            }
        }

        showScreen('main-menu');
    }

    return {
        init : init,
        showScreen : showScreen
    };
}(TowerDefense.screens));
