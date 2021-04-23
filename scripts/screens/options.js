TowerDefense.screens['options'] = (function(manager) {
    'use strict';

    const OPTIONS_ID = 'TDOptions';

    // Default input
    const DEFAULT_UPGRADE = 'u';
    const DEFAULT_SELL = 's';
    const DEFAULT_NEXT_LEVEL= 'g';

    let currUpgradeKey = DEFAULT_UPGRADE;
    let currSellKey= DEFAULT_SELL;
    let currNextLevelKey = DEFAULT_NEXT_LEVEL;

    function init() {
        // Save controls to storage
        let optionsItem = loadOptions();
        if (optionsItem !== null) {
            currUpgradeKey = optionsItem['upgrade'];
            currSellKey = optionsItem['sell'];
            currNextLevelKey = optionsItem['nextLevel'];
        } else {
            optionsItem = {};
            window.localStorage.setItem(OPTIONS_ID, JSON.stringify(optionsItem));
            saveOption('upgrade', currUpgradeKey);
            saveOption('sell', currSellKey);
            saveOption('nextLevel', currNextLevelKey);
        }

        $('#upgradeTowerControl .controlKey').html(currUpgradeKey);

        $('#sellTowerControl .controlKey').html(currSellKey);

        $('#nextLevelControl .controlKey').html(currNextLevelKey);

        $('#options-back').click(() => manager.showScreen('main-menu'));
        $('#upgradeTowerBindBtn').click(() => window.addEventListener('keydown', remapUpgrade));
        $('#sellTowerBtn').click(() => window.addEventListener('keydown', remapSell));
        $('#nextLevelBtn').click(() => window.addEventListener('keydown', remapNextLevel));
    }

    function remapUpgrade(e) {
        let key = e.key;

        if (key !== currUpgradeKey) {

            currUpgradeKey = key;
            saveOption('upgrade', currUpgradeKey);
            $('#upgradeTowerControl .controlKey').html(currUpgradeKey);
        }
            window.removeEventListener('keydown', remapUpgrade);
    }

    function remapSell(e) {
        let key = e.key;

        if (key !== currSellKey) {
            currSellKey = e.key;
            saveOption('sell', currSellKey);
            $('#sellTowerControl .controlKey').html(currSellKey);
        }
            window.removeEventListener('keydown', remapSell);
    }

    function remapNextLevel(e) {
        let key = e.key;

        if (key !== currNextLevelKey) {
            currNextLevelKey = e.key;
            saveOption('nextLevel', currNextLevelKey);
            $('#nextLevelControl .controlKey').html(currNextLevelKey);
        }
            window.removeEventListener('keydown', remapNextLevel);
    }

    // ToDo: namespace by entity
    function saveOption(option, key) {
        let optionsItem = loadOptions();
        optionsItem[option] = key;
        localStorage.setItem(OPTIONS_ID, JSON.stringify(optionsItem));
    }

    function loadOptions() {
        let optionsItem = localStorage.getItem(OPTIONS_ID);
        return optionsItem === null ? null : JSON.parse(optionsItem);
    }

    function run() {}

    return {
        init: init,
        run: run,
        loadOptions: loadOptions
    };
}(TowerDefense.manager));