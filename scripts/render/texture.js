TowerDefense.render.Texture = function(graphics, texture, position) {
    'use strict';

    let spec = {
        center: {
            x: position.x,
            y: position.y,
        },
        size: {
            width: position.width,
            height: position.height
        },
        rotation: position.rotation,
        image: texture.get()
    };

    graphics.drawTexture(spec);
};