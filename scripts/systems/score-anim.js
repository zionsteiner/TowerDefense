TowerDefense.systems.ScoreAnim = function(gridCellHeight) {
    let system = System();


    const DELAY = 1000;
    const MOVE_RATE = 2 * gridCellHeight / 1000;

    system.addEntity = function(entity) {
        entity.timeElapsed = 0;
        system.entities[entity.id] = entity;
    };

    system.update = function(elapsedTime, entities, report) {
        for (let id in system.entities) {
            let scoreAnim = system.entities[id];

            scoreAnim.timeElapsed += elapsedTime;

            if (scoreAnim.timeElapsed < DELAY) {
                let pos = scoreAnim.components.position;
                pos.y -= MOVE_RATE * elapsedTime;
            } else {
                report(scoreAnim);
            }
        }
    };

    return system;
};