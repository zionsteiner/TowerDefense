TowerDefense.components.Projectile = function(spec) {
    let damage = spec.damage;
    let speed = spec.speed;
    let targetVec = spec.targetVec;
    let isTargetTracking = spec.isTargetTracking;
    let targetType = spec.targetType;
    let isAOE = spec.isAOE;
    let AOERadius = spec.AOERadius;
    let delay = spec.delay; // AOE only,
    let type = spec.type;

    return {
        get name() { return 'projectile'; },
        get damage() { return damage; },
        get speed() { return speed; },
        get targetVec() { return targetVec; },
        set targetVec(t) { targetVec = t; },
        get targetType() {return targetType; },
        get isAOE() { return isAOE; },
        get AOERadius() { return AOERadius; },
        get isTargetTracking() {return isTargetTracking; },  // ToDo,
        get delay() { return delay; },
        set delay(d) { delay = d; },
        get type() { return type; }
    };
};