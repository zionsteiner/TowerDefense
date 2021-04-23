/* ToDo: goblin death animation
 * How to handle rotation?
 * Some spritesheets need rotation (bug), others different section of spritesheet,
 * Use position.rotation or path-bound.direction?
 */
TowerDefense.components.Animation = function(spec) {
    let spriteSheet = spec.spriteSheet;
    let spriteTime = spec.spriteTime;
    let xDim = spec.xDim;
    let yDim = spec.yDim;
    let xMin = spec.xMin;
    let yMin = spec.yMin;
    let xMax = spec.xMax;
    let yMax = spec.yMax;

    let subTextureWidth = spriteSheet.width / xDim;
    let subTextureHeight = spriteSheet.height / yDim;

    let usePosRotation = spec.usePosRotation;

    let animationTime = 0;

    let xIdx = 0;
    let yIdx = 0;

    function updateElapsedTime(elapsedTime) {
        animationTime += elapsedTime;
    }

    function getSpriteTime() {
        return spriteTime[xIdx - xMin];
    }

    function incrSprite() {
        xIdx++;
        xIdx %= (xMax - xMin + 1);
    }

    // ToDo: make configurable, not all spritesheets look like this
    function setDirection(d) {
        switch (d) {
            case 'up': yIdx = 2;
            break;
            case 'down': yIdx = 0;
            break;
            case 'left': yIdx = 3;
            break;
            case 'right': yIdx = 1;
        }
    }

    return {
        name: 'animation',
        get spriteSheet() { return spriteSheet; },
        updateElapsedTime: updateElapsedTime,
        getSpriteTime: getSpriteTime,
        incrSprite: incrSprite,
        get animationTime() { return animationTime; },
        set animationTime(a) { animationTime = a; },
        get subTextureWidth() { return subTextureWidth; },
        get subTextureHeight() { return subTextureHeight; },
        get xIdx() { return xIdx; },
        get yIdx() { return yIdx; },
        get usePosRotation() { return usePosRotation; },
        setDirection: setDirection
    }
}