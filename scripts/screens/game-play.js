TowerDefense.screens['game-play'] = (function(graphics, screens) {
    'use strict';

    let lastTimeStamp = null;
    let game = null;
    let isPaused = false;
    let currState = null;

    let components = TowerDefense.components;

    let gamePlayEntity = null;

    let timePassed = 0; // used for message delay

    function init() {
        lastTimeStamp = null;
        game = null;
        isPaused = false;
        currState = null;
    }

    function pauseGame() {
        isPaused = true;
        game.disableCapture();
        $('#canvas').css('opacity', 0.3);

        let pauseScreen = $('#pause-screen');
        pauseScreen.addClass('active');
    }

    function resumeGame() {
        isPaused = false;

        let pauseScreen = $('#pause-screen');
        pauseScreen.removeClass('active');
        $('#canvas').css('opacity', '');
        game.enableCapture();

        lastTimeStamp = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function gameLoop(timestamp) {
        let elapsedTime = timestamp - lastTimeStamp;
        lastTimeStamp = timestamp;
        update(elapsedTime);

        if (!isPaused) {
            requestAnimationFrame(gameLoop);
        }
    }

    function update(elapsedTime) {
        currState(elapsedTime);
    }

    function run() {
        init();

        game = TowerDefense.models.Game();
        game.init();

        setupGamePlayEntity();

        currState = nextLevelState;

        lastTimeStamp = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function gamePlayEntityEscapeHandler() {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    function setupGamePlayEntity() {
        // Game play entity
        gamePlayEntity = Entity.createEntity();
        gamePlayEntity.addComponent(components.KeyboardControllable({
            handlers: [{
                key: 'Escape',
                handler: gamePlayEntityEscapeHandler
            }]
        }));
        gamePlayEntity.components['keyboardControllable'].active = true;
        game.systems.keyboard.addEntity(gamePlayEntity);

        TowerDefense.assets['musicSound'].volume = 0.5;
        gamePlayEntity.addComponent(components.Sound({sounds: {'musicSound': TowerDefense.assets['musicSound']}}));
        gamePlayEntity.components.sound.get('musicSound').loop = true;
        gamePlayEntity.components.sound.get('musicSound').play();

        game.entities[gamePlayEntity.id] = gamePlayEntity;

        // Pause menu setup
        $('#pause-main-menu').click(() => {
            let pauseScreen = $('#pause-screen');
            pauseScreen.removeClass('active');
            $('#canvas').css('opacity', '');
            TowerDefense.manager.showScreen('main-menu');
        });
        $('#resume-btn').click(resumeGame);
    }

    /* States */
    function initLevelState(elapsedTime) {
        game.initNextLevel();
        currState = playGameState;
    }

    function playGameState(elapsedTime) {
        game.update(elapsedTime);

        if (game.isGameOver) {
            currState = gameOverState;
        } else if (game.isLevelOver) {
            currState = nextLevelState;
        }
    }

    let goToNextLevel = false; // Set by event handler on g press
    let waitForNextLevelCalled = false;
    function nextLevelState(elapsedTime) {
        // Display press () to start next level
        game.update(elapsedTime);

        if (!waitForNextLevelCalled) {
            waitForNextLevel();
            waitForNextLevelCalled = true;
        }

        if (goToNextLevel) {
            goToNextLevel = false;
            waitForNextLevelCalled = false;
            currState = initLevelState;
        }
    }

    function waitForNextLevel() {
        let options = screens.options.loadOptions();
        let nextLevelKey = options['nextLevel'];

        // Elegant is my middle-name (first name is Not)
        // ToDo: make individual handlers active/not active, add handlers without having to reregister
        game.systems.keyboard.removeEntity(gamePlayEntity);
        gamePlayEntity.addComponent(components.KeyboardControllable({
            handlers: [
                {
                    key: nextLevelKey,
                    handler: function () {
                        goToNextLevel = true;
                        game.systems.keyboard.removeEntity(gamePlayEntity);
                        gamePlayEntity.addComponent(components.KeyboardControllable({
                            handlers: [
                                {
                                    key: 'Escape',
                                    handler: gamePlayEntityEscapeHandler
                                }
                            ]
                        }));
                        gamePlayEntity.components.keyboardControllable.active = true;
                        game.systems.keyboard.addEntity(gamePlayEntity);
                        game.systems.render.removeEntity(gamePlayEntity);
                    }
                }, {
                    key: 'Escape',
                    handler: gamePlayEntityEscapeHandler
                }]
        }));
        gamePlayEntity.components.keyboardControllable.active = true;
        game.systems.keyboard.addEntity(gamePlayEntity);

        showMsg('Press ' + nextLevelKey + ' to start level ' + (game.currLevel + 1));    // lol

        game.systems.render.addEntity(gamePlayEntity);
    }

    function showMsg(text) {
        let textComp = components.Text({
            text: text,
            font: '1rem future',
            fillStyle: 'black'
        });
        gamePlayEntity.addComponent(textComp);
        let textWidth = graphics.measureTextWidth(textComp.font, textComp.text);
        gamePlayEntity.addComponent(components.Position({
            x: graphics.canvas.width / 2 - textWidth / 2,
            y: graphics.canvas.height / 2 - graphics.measureTextWidth(textComp.font, 'm')
        }));

        game.systems.render.addEntity(gamePlayEntity);
    }

    function gameOverState(elapsedTime) {
        // Leaderboard prompt

        timePassed += elapsedTime;

        game.update(elapsedTime);

        showMsg('GAME OVER');

        if (timePassed >= 2000) {
            isPaused = true;
            timePassed = 0;

            showLeaderboardPrompt();
        }
    }

    function showLeaderboardPrompt() {
        $('#canvas').css('opacity', 0.3);

        let leaderboardInputEl = $('#leaderboard-input');
        leaderboardInputEl.addClass('active');

        let nameEntryBtn = $('#submitNameEntryBtn');
        nameEntryBtn.click(submitEntry);

        function submitEntry() {
            nameEntryBtn.off('click');

            let newEntry = {'name': null, 'score': Math.floor(game.score)};

            function valNameInput(val) {
                let validMsgEl = $('#nameValMsg')[0];
                if (val.length === 0) {
                    validMsgEl.innerHTML = 'Name cannot be empty';
                } else if (val.length > 12) {
                    validMsgEl.innerHTML = 'Name must be 12 chars or less';
                } else {
                    validMsgEl.innerHTML = '';
                    return true;
                }

                return false;
            }

            // Spins until valid input
            let nameInputEl = $('#nameInput');
            let inputVal = nameInputEl.val().trim();
            if (!valNameInput(inputVal)) {
                nameEntryBtn.on('click', submitEntry);
                return;
            }

            newEntry.name = inputVal;
            nameInputEl.val('');

            screens.leaderboard.updateLeaderboard(newEntry);

            leaderboardInputEl.removeClass('active');
            $('#canvas').css('opacity', '');

            TowerDefense.manager.showScreen('main-menu');
        }
    }

    return {
        init: init,
        run: run
    };
})(TowerDefense.graphics, TowerDefense.screens);