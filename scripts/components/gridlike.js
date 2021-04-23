TowerDefense.components.Gridlike = function(spec) {
    // Represent the map
    let width = spec.width;
    let height = spec.height;
    let entrance = null;
    let exit = null;

    let grid = [];

    // Is set on init, tower purchase/sell, and change of entrance/exit
    let needsPathUpdate = true;

    reset();

    function reset() {
        grid = [];
        for (let i = 0; i < height; ++i) {
            grid.push([]);
            for (let j = 0; j < width; ++j) {
                grid[i].push({x: j,
                    y: i,
                    'obstructed': false,
                    entity: null,
                    'canPlace': true,
                    'next': null});

                // No towers on perimeter
                if (j === 0 || j === (height - 1) || i === 0 || i === (width - 1)) {
                    grid[i][j].canPlace = false;
                }
            }
        }

        entrance = topEntrance();
        exit = bottomEntrance();
    }

    function leftEntrance() {
        return grid[Math.floor(grid[0].length / 2)][0];
    }

    function rightEntrance() {
        return grid[Math.floor(grid[grid.length - 1].length / 2)][grid.length - 1];
    }

    function topEntrance() {
        return grid[0][Math.floor(grid.length / 2)];
    }

    function bottomEntrance() {
        return grid[grid[Math.floor(grid.length / 2)].length - 1][Math.floor(grid.length / 2)];
    }

    return {
        get name() { return 'gridlike'; },
        get width() {return width; },
        get height() {return height; },
        get grid() { return grid; },
        get needsPathUpdate() { return needsPathUpdate; },
        set needsPathUpdate(b) { needsPathUpdate = b; },
        get entrance() { return entrance; },
        set entrance(e) { entrance = e; },
        leftEntrance: leftEntrance,
        rightEntrance: rightEntrance,
        topEntrance: topEntrance,
        bottomEntrance: bottomEntrance,
        get exit() { return exit; },
        set exit(e) { exit = e; },
        reset: reset
    };
}