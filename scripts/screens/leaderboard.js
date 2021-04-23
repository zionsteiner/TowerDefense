TowerDefense.screens['leaderboard'] = (function(manager) {
    'use strict';

    const LEADERBOARD_ID = 'TowerDefenseLeaderboard';
    let nScores = 10;

    function updateLeaderboard(newEntry) {
        let leaderboard = loadLeaderboard();

        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);

        // Keep top n scores
        leaderboard.splice(nScores, leaderboard.length - nScores);
        saveLeaderboard(leaderboard);
    }

    function saveLeaderboard(leaderboard) {
        window.localStorage.setItem(LEADERBOARD_ID, JSON.stringify(leaderboard));
    }

    function loadLeaderboard() {
        let leaderboard = window.localStorage.getItem(LEADERBOARD_ID);
        if (leaderboard !== null) {
            leaderboard = JSON.parse(leaderboard);
        } else {
            leaderboard = [];
            saveLeaderboard(leaderboard);
        }

        return leaderboard;
    }

    function init() {
        $('#leaderboard-back').click(() => manager.showScreen('main-menu'));
    }

    function run() {
        $('#leaderboardList').empty();

        let leaderboard = loadLeaderboard();
        for (let i = 0; i < leaderboard.length; ++i) {
            let entry = leaderboard[i];
            let entryEl = $(
                `<div class="leaderboardEntry">
                    <p class="leaderboardRank">${i+1}</p>
                    <p class="leaderboardName">${entry.name}</p>
                    <p class="leaderboardScore">${entry.score}</p>
                </div>`
            );
            entryEl.appendTo('#leaderboardList');
        }
    }

    return {
        init: init,
        run: run,
        updateLeaderboard: updateLeaderboard,
        saveLeaderboard: saveLeaderboard,
        loadLeaderboard: loadLeaderboard
    };
}(TowerDefense.manager));