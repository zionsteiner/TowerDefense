TowerDefense.systems.Render = function(graphics) {
    'use strict';

    let system = System();

    // ToDo: add render priority
    system.renderEntities = function(entities) {
        for (let id in entities) {
            let entity = entities[id];
            if (entity.components.rectangle) {
                TowerDefense.render.Rectangle(graphics, entity.components.rectangle, entity.components.position);
            }
            if (entity.components.circle) {
                TowerDefense.render.Circle(graphics, entity.components.circle, entity.components.position);
            }
            if (entity.components.texture) {
                TowerDefense.render.Texture(graphics, entity.components.texture, entity.components.position);
            }
            if (entity.components.text) {
                TowerDefense.render.Text(graphics, entity.components.text, entity.components.position);
            }
            if (entity.components.animation) {
                TowerDefense.render.Animation(graphics, entity.components.animation, entity.components.position)
            }
        }
    }

    system.update = function(elapsedTime) {
        system.renderEntities(system.entities);
    }

    return system;
};
