TowerDefense.components.Health = function(spec) {
    let type = spec.type;   // ground or air
    let health = spec.health;
    let currHealth = health;
    let healthBarEntities = spec.healthBarEntities;
    let greenBar = healthBarEntities.green;
    let redBar = healthBarEntities.red;

    // Level updated here, pos updated in path-finder
    function updateHealthbar() {
        let redPos = redBar.components.position;
        redPos.width = (health - currHealth) / health * redPos.height * 4;

        let greenPos = greenBar.components.position;
        greenPos.width = greenPos.height * 4 - redPos.width;
    }

    return {
        get name() { return 'health'; },
        get type() { return type; },
        get fullHealth() { return health; },
        get currHealth() { return currHealth; },
        set currHealth(h) {
            currHealth = h;
            updateHealthbar();
        },
        get healthBarEntities() { return healthBarEntities; }
    };
};