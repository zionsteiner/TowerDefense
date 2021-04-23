TowerDefense.components.ParticleEmitter = function(spec) {
    let emitters = spec;

    // let image = spec.image;
    // let center = spec.center;
    // let size = spec.size;
    // let speed = spec.speed;
    // let quantity = spec.quantity;
    // let rotationToSpeed = spec.rotationToSpeed;
    // let lifetime = spec.lifetime;
    // let direction = spec.direction;
    // let emitterCenter = spec.emitterCenter;
    // let isTrailing = spec.isTrailing;

    return {
        get name() { return 'particleEmitter'; },
        emitters: emitters
    };
};