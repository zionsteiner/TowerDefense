TowerDefense.render.Circle = function(graphics, circle, position) {
    'use strict';

    let spec = {
        x: position.x,
        y: position.y,
        rotation: position.rotation,
        radius: circle.radius,
        fillStyle: circle.fillStyle,
        strokeStyle: circle.strokeStyle,
        lineWidth: circle.lineWidth,
        alpha: circle.alpha
    };

    graphics.drawCircle(spec);
};