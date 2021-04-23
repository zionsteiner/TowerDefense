// ToDo: fix assets

let TowerDefense = {
    systems: {},
    render: {},
    assets: {},
    screens: {},
    components: {},
    models: {}
};

//------------------------------------------------------------------
//
// Purpose of this code is to bootstrap (maybe I should use that as the name)
// the rest of the application.  Only this file is specified in the index.html
// file, then the code in this file gets all the other code and assets
// loaded.
//------------------------------------------------------------------
// ToDo: figure out dependency order
TowerDefense.loader = (function() {
    'use strict';

    let scriptOrder = [{
        scripts: ['random'],
        message: 'Random number generator loaded',
        onComplete: null
    }, {
        scripts: ['render/core', 'render/texture', 'render/text', 'render/rectangle', 'render/circle', 'render/animation'],
        message: 'Render',
        onComplete: null
    }, {
        scripts: ['screens/manager'],
        message: 'Manager',
        onComplete: null
    }, {
       scripts: ['screens/options', 'screens/credits',
           'screens/leaderboard'],
       message: 'Menus loaded',
       onComplete: null
    }, {
        scripts: ['screens/main-menu', 'screens/game-play'],
        message: 'Game-play',
        onComplete: null
    }, {
        scripts: ['screens/main-menu'],
        message: 'main-menu',
        onComplete: null
    }, {
        scripts: ['components/texture', 'components/position',
            'components/gridlike', 'components/keyboard-controllable',
            'components/mouse-controllable', 'components/aimable',
            'components/owner', 'components/text', 'components/rectangle',
            'components/circle', 'components/path-bound', 'components/health',
            'components/animation', 'components/spawnable', 'components/projectile',
            'components/sound', 'components/particle-emitter', 'components/particle'
        ],
        message: 'Components',
        onComplete: null
    }, {
        scripts: ['systems/system', 'systems/render', 'systems/input', 'systems/aimbot', 'systems/path-finder',
        'systems/animation', 'systems/spawner', 'systems/collision', 'systems/score-anim', 'systems/particle-system',],
        message: 'Systems',
        onComplete: null
    }, {
        scripts: ['models/entity', 'models/game-model'],
        message: 'Models',
        onComplete: null
    }];

    let assetOrder = [{
        key: 'musicSound',
        source: '/assets/audio/music.mp3'
    }, {
        key: 'arena',
        source: '/assets/imgs/arena.jpg'
    }, {
        key: 'wall',
        source: '/assets/imgs/stone.jpg'
    }, {
        key: 'tower-base',
        source: '/assets/imgs/tower-base.png'
    }, {
        key: 'tower-gun',
        source: '/assets/imgs/tower-gun.png'
    }, {
        key: 'tower-bomb',
        source: '/assets/imgs/tower-bomb.png'
    }, {
       key: 'tower-missile',
       source: '/assets/imgs/tower-missile.png',
    }, {
        key: 'tower-boomerang',
        source: '/assets/imgs/tower-boomerang.png'
    }, {
        key: 'bullet',
        source: '/assets/imgs/bullet.png'
    }, {
        key: 'bomb',
        source: '/assets/imgs/bomb.png'
    }, {
        key: 'missile',
        source: '/assets/imgs/missile.png'
    }, {
        key: 'boomerang',
        source: '/assets/imgs/boomerang.png'
    },
        {
        key: 'creep-bat',
        source: '/assets/imgs/creep-bat.png'
    }, {
        key: 'creep-bug',
        source: '/assets/imgs/creep-bug.png'
    }, {
        key: 'creep-goblin',
        source: '/assets/imgs/creep-goblin.png'
    }, {
        key: 'blood',
        source: '/assets/imgs/blood.png'
    }, {
        key: 'coin',
        source: '/assets/imgs/coin.png'
    }, {
        key: 'plus',
        source: '/assets/imgs/plus.png'
    }, {
        key: 'fire',
        source: '/assets/imgs/fire.png'
    }, {
        key: 'buySound',
        source: '/assets/audio/buy.mp3'
    }, {
        key: 'explodeSound',
        source: '/assets/audio/explosion.mp3'
    }, {
        key: 'hurtSound',
        source: '/assets/audio/hurt.mp3'
    }, {
        key: 'shootSound',
        source: '/assets/audio/shoot.mp3'
    }];

    //------------------------------------------------------------------
    //
    // Helper function used to load scripts in the order specified by the
    // 'scripts' parameter.  'scripts' expects an array of objects with
    // the following format...
    //    {
    //        scripts: [script1, script2, ...],
    //        message: 'Console message displayed after loading is complete',
    //        onComplete: function to call when loading is complete, may be null
    //    }
    //
    //------------------------------------------------------------------
    function loadScripts(scripts, onComplete) {
        //
        // When we run out of things to load, that is when we call onComplete.
        if (scripts.length > 0) {
            let entry = scripts[0];
            require(entry.scripts, function() {
                console.log(entry.message);
                if (entry.onComplete) {
                    entry.onComplete();
                }
                scripts.shift();    // Alternatively: scripts.splice(0, 1);
                loadScripts(scripts, onComplete);
            });
        } else {
            onComplete();
        }
    }

    //------------------------------------------------------------------
    //
    // Helper function used to load assets in the order specified by the
    // 'assets' parameter.  'assets' expects an array of objects with
    // the following format...
    //    {
    //        key: 'asset-1',
    //        source: 'asset/.../asset.png'
    //    }
    //
    // onSuccess is invoked per asset as: onSuccess(key, asset)
    // onError is invoked per asset as: onError(error)
    // onComplete is invoked once per 'assets' array as: onComplete()
    //
    //------------------------------------------------------------------
    function loadAssets(assets, onSuccess, onError, onComplete) {
        //
        // When we run out of things to load, that is when we call onComplete.
        if (assets.length > 0) {
            let entry = assets[0];
            loadAsset(entry.source,
                function(asset) {
                    onSuccess(entry, asset);
                    assets.shift();    // Alternatively: assets.splice(0, 1);
                    loadAssets(assets, onSuccess, onError, onComplete);
                },
                function(error) {
                    onError(error);
                    assets.shift();    // Alternatively: assets.splice(0, 1);
                    loadAssets(assets, onSuccess, onError, onComplete);
                });
        } else {
            onComplete();
        }
    }

    //------------------------------------------------------------------
    //
    // This function is used to asynchronously load image and audio assets.
    // On success the asset is provided through the onSuccess callback.
    // Reference: http://www.html5rocks.com/en/tutorials/file/xhr2/
    //
    //------------------------------------------------------------------
    function loadAsset(source, onSuccess, onError) {
        let xhr = new XMLHttpRequest();
        let fileExtension = source.substr(source.lastIndexOf('.') + 1);    // Source: http://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript

        if (fileExtension) {
            xhr.open('GET', source, true);
            xhr.responseType = 'blob';

            xhr.onload = function() {
                let asset = null;
                if (xhr.status === 200) {
                    if (fileExtension === 'png' || fileExtension === 'jpg') {
                        asset = new Image();
                    } else if (fileExtension === 'mp3') {
                        asset = new Audio();
                    } else {
                        if (onError) { onError('Unknown file extension: ' + fileExtension); }
                    }
                    asset.onload = function() {
                        window.URL.revokeObjectURL(asset.src);
                    };
                    asset.src = window.URL.createObjectURL(xhr.response);
                    if (onSuccess) { onSuccess(asset); }
                } else {
                    if (onError) { onError('Failed to retrieve: ' + source); }
                }
            };
        } else {
            if (onError) { onError('Unknown file extension: ' + fileExtension); }
        }

        xhr.send();
    }

    //------------------------------------------------------------------
    //
    // Called when all the scripts are loaded, it kicks off the demo app.
    //
    //------------------------------------------------------------------
    function mainComplete() {
        console.log('It is all loaded up');
        TowerDefense.manager.init();
    }

    //
    // Start with loading the assets, then the scripts.
    console.log('Starting to dynamically load project assets');
    loadAssets(assetOrder,
        function(source, asset) {    // Store it on success
            TowerDefense.assets[source.key] = asset;
        },
        function(error) {
            console.log(error);
        },
        function() {
            console.log('All game assets loaded');
            console.log('Starting to dynamically load project scripts');
            loadScripts(scriptOrder, mainComplete);
        }
    );

}());
