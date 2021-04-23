// ToDo: rectangle pos should be center. Convert to upper left corner in here
TowerDefense.render.Rectangle = function(graphics, rectangle, position) {
    'use strict';

    let spec = {
        'position': {
            x: position.x,
            y: position.y,
        },
        width: position.width,
        height: position.height,
        rotation: position.rotation,
        fillStyle: rectangle.fillStyle,
        strokeStyle: rectangle.strokeStyle,
        lineWidth: rectangle.lineWidth,
        alpha: rectangle.alpha
    };

    graphics.drawRectangle(spec);
};