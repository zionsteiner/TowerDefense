TowerDefense.render.Text = function(graphics, text, position) {
    'use strict';

    let spec = {
        'position': {
            x: position.x,
            y: position.y,
        },
        rotation: position.rotation,
        text: text.text,
        font: text.font,
        fillStyle: text.fillStyle,
        strokeStyle: text.strokeStyle
    };

    graphics.drawText(spec);
};