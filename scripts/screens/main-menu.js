TowerDefense.screens['main-menu'] = (function(manager) {
    'use strict';

    function init() {
        $('#play-game-screen-btn').click(() => manager.showScreen('game-play'));
        $('#leaderboard-screen-btn').click(() => manager.showScreen('leaderboard'));
        $('#options-screen-btn').click(() => manager.showScreen('options'));
        $('#credits-screen-btn').click(() => manager.showScreen('credits'));
    }

    function run() {}

    return {
        init: init,
        run: run
    };
}(TowerDefense.manager));