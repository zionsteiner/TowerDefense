TowerDefense.render.Animation = function(graphics, animation, position) {
    'use strict';

    let rotation = animation.usePosRotation ? position.rotation * Math.PI / 180 : 0;

    graphics.drawSubTexture({
        image: animation.spriteSheet,
        center: {
            x: position.x,
            y: position.y
        },
        rotation: rotation,
        subTextureWidth: animation.subTextureWidth,
        subTextureHeight: animation.subTextureHeight,
        xIdx: animation.xIdx,
        yIdx: animation.yIdx,
        size: {
            width: position.width,
            height: position.height
        }
    });
};