/* 1. Tower own base and tower controls.
*  2. Tower is mouse controllable. On mouse click,
*  tower is selected and displays controls. by adding them
*  to renderer and mousecontrollable. Click away from tower
*  and stop displaying options.
*
*  Aimable should not necessarily have options menu to display. (vs mode with bots.)
*  */

// ToDo: split into upgradable, sellable, aimable
TowerDefense.components.Aimable = function(spec) {
    let isTargetInSight = false;
    let target = null;
    let upgrade = spec.upgrade;
    let upgradeSpecs = spec.upgradeSpecs;
    let targetType = spec.targetType; // ground or air
    let fireTime = 1 / upgradeSpecs[upgrade].fireRate;  // Set so that it can fire at startup

    return {
        get name() { return 'aimable'; },
        get rotationRate() { return upgradeSpecs[upgrade].rotationRate; },
        get isTargetInSight() { return isTargetInSight; },
        set isTargetInSight(t) { isTargetInSight = t; },
        get weaponType() { return spec.weaponType; },
        get damage() { return upgradeSpecs[upgrade].damage; },
        get fireRate() { return upgradeSpecs[upgrade].fireRate; },
        get radius() { return upgradeSpecs[upgrade].radius; },
        get target() { return target; },
        set target(t) { target = t; },
        get targetType() { return targetType; },
        get upgrade() { return upgrade; },
        set upgrade(u) { upgrade = u; },
        get upgradeSpecs() { return spec.upgradeSpecs; },
        get fireTime() { return fireTime; },
        set fireTime(f) { fireTime = f; }
    }
}