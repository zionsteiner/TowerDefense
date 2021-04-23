TowerDefense.systems.Animation = function() {
    let system = System();

    system.update = function(elapsedTime) {
        for (let id in system.entities) {
            let entity = system.entities[id];
            let animation = entity.components.animation;
            animation.updateElapsedTime(elapsedTime);
            if (animation.animationTime > animation.getSpriteTime()) {
                animation.animationTime -= animation.getSpriteTime();
                animation.incrSprite();
            }

            // Update direction if necessary
            if (!animation.usePosRotation) {
                let pos = entity.components.position;
                if (pos.rotation === 0) {
                    animation.setDirection('right');
                } else if (pos.rotation === 270) {
                    animation.setDirection('up');
                } else if (pos.rotation === 180) {
                    animation.setDirection('left');
                } else if (pos.rotation === 90) {
                    animation.setDirection('down');
                }
            }
        }
    }

    return system;
};