TowerDefense.systems.Keyboard = function() {
    'use strict';

    let entities = {};
    
    let keys = {};
    let handlers = {};

    let isEnabled = false;

    function keyPress(e) {
        keys[e.key] = e.timeStamp;
    }

    function keyRelease(e) {
        delete keys[e.key];
    }

    // ToDo: figure out 'active' status (tower commands)
    // ToDo: handlers are called 6-8x before keyRelease is called
    function update(elapsedTime) {
        for (let key in keys) {
            if (keys.hasOwnProperty(key) && handlers[key] !== undefined) {
                for (let id in handlers[key]) {
                    if (handlers[key].hasOwnProperty(id)) {
                        if (entities[id].components['keyboardControllable'].active) {
                            handlers[key][id](elapsedTime);
                        }
                    }
                }
            }
        }
        keys = {};
    }

    function register(key, id, handler) {
        if (handlers[key] === undefined) {
            handlers[key] = {};
        }
        
        handlers[key][id] = handler;
    }
    
    function deregister(key, id) {
        if (handlers.hasOwnProperty(key)) {
            delete handlers[key][id];
        }
    }
    
    function addEntity(entity) {
        if (entity.components.hasOwnProperty('keyboardControllable')) {
            entities[entity.id] = entity;
            
            let entityHandlers = entity.components['keyboardControllable'].handlers;
            for (let handler of entityHandlers) {
                    register(handler['key'], entity.id, handler['handler']);
            }
        }
    }
    
    function removeEntity(entity) {
        if (entity.components.hasOwnProperty('keyboardControllable')) {
            delete entities[entity.id];
            
            let entityHandlers = entity.components['keyboardControllable'].handlers;
            for (let i = 0; i < entityHandlers.length; ++i) {
                let handler = entityHandlers[i];
                deregister(handler.key, entity.id);
            }
        }
    }

    function enableCapture() {
        if (!isEnabled) {
            window.addEventListener('keydown', keyPress);
            window.addEventListener('keyup', keyRelease);
            isEnabled = true;
        }
    }

    function disableCapture() {
        if (isEnabled) {
            window.removeEventListener('keydown', keyPress);
            window.removeEventListener('keyup', keyRelease);
            keys = {};
            isEnabled = false;
        }
    }

    return {
        keys: keys,
        handlers: handlers,
        register: register,
        deregister: deregister,
        addEntity: addEntity,
        removeEntity: removeEntity,
        update: update,
        enableCapture: enableCapture,
        disableCapture: disableCapture,
    };
};

TowerDefense.systems.Mouse = function() {
    'use strict';

    let isEnabled = false;

    let that = {
        entities : {},
        mouseDown : [],
        mouseUp : [],
        mouseMove : [],
        handlersDown : {},
        handlersUp : {},
        handlersMove : {}
    };

    function mouseDown(e) {
        that.mouseDown.push(convertToCanvasCoords(e));
    }

    function mouseUp(e) {
        that.mouseUp.push(convertToCanvasCoords(e));
    }

    function mouseMove(e) {
        that.mouseMove.push(convertToCanvasCoords(e));
    }

    that.update = function(elapsedTime) {
        for (let event = 0; event < that.mouseDown.length; event++) {
            for (let id in that.handlersDown) {
                if (that.entities[id].components['mouseControllable'].active) {
                    that.handlersDown[id](that.mouseDown[event], elapsedTime);
                }
            }
        }

        for (let event = 0; event < that.mouseUp.length; event++) {
            for (let id in that.handlersUp) {
                if (that.entities[id].components['mouseControllable'].active) {
                    that.handlersUp[id](that.mouseUp[event], elapsedTime);
                }
            }
        }

        for (let event = 0; event < that.mouseMove.length; event++) {
            for (let id in that.handlersMove) {
                if (that.entities[id].components['mouseControllable'].active) {
                    that.handlersMove[id](that.mouseMove[event], elapsedTime);
                }
            }
        }

        that.mouseDown.length = 0;
        that.mouseUp.length = 0;
        that.mouseMove.length = 0;
    };

    that.register = function(type, id, handler) {
        if (type === 'mousedown') {
            that.handlersDown[id] = handler;
        }
        else if (type === 'mouseup') {
            that.handlersUp[id] = handler;
        }
        else if (type === 'mousemove') {
            that.handlersMove[id] = handler;
        }
    };

    that.deregister = function(type, id) {
        if (type === 'mousedown') {
            delete that.handlersDown[id];
        }
        else if (type === 'mouseup') {
            delete that.handlersUp[id];
        }
        else if (type === 'mousemove') {
            delete that.handlersMove[id];
        }
    }

    that.addEntity = function(entity) {
        if (entity.components.hasOwnProperty('mouseControllable')) {
            that.entities[entity.id] = entity;

            let mouseControls = entity.components['mouseControllable'].handlers;
            if (mouseControls['mousedown']) {
                that.register('mousedown', entity.id, mouseControls['mousedown']);
            }
            if (mouseControls['mouseup']) {
                that.register('mouseup', entity.id, mouseControls['mouseup']);
            }
            if (mouseControls['mousemove']) {
                that.register('mousemove', entity.id, mouseControls['mousemove']);
            }
        }
    }

    that.removeEntity = function(entity) {
        if (entity.components.hasOwnProperty('mouseControllable')) {
            delete that.entities[entity.id];

            let mouseControls = entity.components['mouseControllable'].handlers;
            if (mouseControls['mousedown']) {
                that.deregister('mousedown', entity.id);
            }
            if (mouseControls['mouseup']) {
                that.deregister('mouseup', entity.id);
            }
            if (mouseControls['mousemove']) {
                that.deregister('mousemove', entity.id);
            }
        }
    }

    function convertToCanvasCoords(e) {
        let scaleX = TowerDefense.graphics.canvas.width / TowerDefense.graphics.canvas.offsetWidth;
        let scaleY = TowerDefense.graphics.canvas.height / TowerDefense.graphics.canvas.offsetHeight;

        let xClick = (e.clientX - TowerDefense.graphics.canvas.getBoundingClientRect().left) * scaleX;
        let yClick = (e.clientY - TowerDefense.graphics.canvas.getBoundingClientRect().top) * scaleY;

        return {x: xClick, y: yClick};
    }

    that.enableCapture = function() {
        if (!isEnabled) {
            TowerDefense.graphics.canvas.addEventListener('mousedown', mouseDown);
            TowerDefense.graphics.canvas.addEventListener('mouseup', mouseUp);
            TowerDefense.graphics.canvas.addEventListener('mousemove', mouseMove);

            isEnabled = true;
        }
    }

    that.disableCapture = function() {
        if (isEnabled) {
            TowerDefense.graphics.canvas.removeEventListener('mousedown', mouseDown);
            TowerDefense.graphics.canvas.removeEventListener('mouseup', mouseUp);
            TowerDefense.graphics.canvas.removeEventListener('mousemove', mouseMove);
            isEnabled = false;

            that.mouseDown.length = 0;
            that.mouseUp.length = 0;
            that.mouseMove.length = 0;
        }
    }

    return that;
};