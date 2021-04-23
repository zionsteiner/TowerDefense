// ToDo: this is really slow. Would Floyd-Warshall work better?
TowerDefense.systems.Pathfinder = function(spec) {
    let system = System();

    let grid = null;
    system.setGrid = function(g) {
        grid = g;
    };

    system.update = function(elapsedTime, entities, reportExit) {
        updateGrid();
        updatePathbound(elapsedTime, reportExit);
    }

    /* Grid updates:
    * 1. update shortest path (next) and canPlace on tower sell/purchase, init, change of entrance/exit
    * 2. for canPlace, need to check top to bot and left to right */
    function updateGrid() {
        if (!grid.needsPathUpdate) {
            return;
        }

        for (let y = 0; y < grid.grid.length; ++y) {
            for (let x = 0; x < grid.grid[y].length; ++x) {
                if (grid.grid[y][x]['obstructed'] || !grid.grid[y][x].canPlace) {
                    grid.grid[y][x].canPlace = false;
                } else {
                    // Test if placing would obstruct path
                    grid.grid[y][x].obstructed = true;

                    // Save curr entrance info
                    let currEntrance = grid.entrance;
                    let currExit = grid.exit;

                    // Test horizontal path
                    grid.entrance = grid.leftEntrance();
                    grid.exit = grid.rightEntrance();
                    let horizontalClear = calcShortestPath();

                    grid.entrance = grid.topEntrance();
                    grid.exit = grid.bottomEntrance();
                    let verticalClear = calcShortestPath();

                    grid.grid[y][x].canPlace = horizontalClear && verticalClear;

                    // Restore
                    grid.grid[y][x].obstructed = false;
                    grid.entrance = currEntrance;
                    grid.exit = currExit;
                }
            }
        }

        calcShortestPath(true);

        grid.needsPathUpdate = false;
    }

    function testTolerance(value, test, tolerance) {
        return Math.abs(value - test) < tolerance;
    }

    function updatePathbound(elapsedTime, reportExit) {
        // For path-bound entities, set dest, direction, move a bit
        for (let id in system.entities) {
            // Get relevant components
            let entity = system.entities[id];
            let pos = entity.components.position;
            let pathbound = entity.components.pathbound;

            let currLoc = system.toNearestGridCellCenter(pos);

            // IGNORE
            /* 1. If no currCell, set currCell and next cell
            *  2. Move
            *  3. test dist to dest
            *  4. if within tolerance, snap to dest
            *  5. set new dest*/
            // IGNORE
            if (pathbound.currCell === null) {
                pathbound.currCell = grid.grid[currLoc.grid.y][currLoc.grid.x];
                pathbound.currCell.canPlace = false;
                pathbound.destCell = pathbound.currCell.next;
                pathbound.destCell.canPlace = false;
            }

            // ToDo: potential bugs with multiple creeps
            // ToDo: snap to grid cell center
            // ToDo: totally forgot why this works. if its after movement logic some creeps lose the path and go off screen
            /* Trade off: tolerance too high, creep positions get offcenter from grid track, worse with each turn
            *  tolerance too low, creeps moving too fast fall off track */
            if (pathbound.type === 'ground') {
                if (testTolerance(pos.x, currLoc.canvas.x, 3) && testTolerance(pos.y, currLoc.canvas.y, 3)) {
                    pathbound.currCell.canPlace = true;
                    pathbound.currCell = grid.grid[currLoc.grid.y][currLoc.grid.x];
                    pathbound.currCell.canPlace = false;

                    if (pathbound.currCell === grid.exit) {
                        reportExit(entity);
                        continue;
                    }

                    pathbound.destCell = pathbound.currCell.next;
                    pathbound.destCell.canPlace = false;
                }
            } else if (pathbound.type === 'air') {
                pathbound.currCell.canPlace = true;
                pathbound.currCell = grid.grid[currLoc.grid.y][currLoc.grid.x];
                pathbound.currCell.canPlace = false;

                if (pathbound.currCell === grid.exit) {
                    reportExit(entity);
                    continue;
                }
            }

            // 2. Move
            // Air can fly over towers
            if (pathbound.type === 'air') {
                let xDelta = grid.exit.x - pathbound.currCell.x;
                let yDelta = grid.exit.y - pathbound.currCell.y;

                if (Math.abs(xDelta) > Math.abs(yDelta)) {
                    xDelta /= Math.abs(xDelta);
                    pos.x += xDelta * pathbound.speed * elapsedTime;

                    if (xDelta > 0) {
                        pos.rotation = 0;
                    } else if (xDelta < 0) {
                        pos.rotation = 180;
                    }
                } else {
                    yDelta /= Math.abs(yDelta);
                    pos.y += yDelta * pathbound.speed * elapsedTime;

                    if (yDelta > 0) {
                        pos.rotation = 90;
                    } else if (yDelta < 0) {
                        pos.rotation = 270;
                    }
                }
            } else {
                // Step towards dest (only one delta should have value) and update direction
                let xDelta = (pathbound.destCell.x - pathbound.currCell.x) * pathbound.speed * elapsedTime;
                pos.x += xDelta;
                if (xDelta > 0) {
                    pos.rotation = 0;
                } else if (xDelta < 0) {
                    pos.rotation = 180;
                }
                if (xDelta !== 0) {
                    pos.y = currLoc.canvas.y;
                }

                let yDelta = (pathbound.destCell.y - pathbound.currCell.y) * pathbound.speed * elapsedTime;
                pos.y += yDelta;
                if (yDelta > 0) {
                    pos.rotation = 90;
                } else if (yDelta < 0) {
                    pos.rotation = 270;
                }
                if (yDelta !== 0) {
                    pos.x = currLoc.canvas.x;
                }
            }

            // Bug handler
            if (pos.x < 0 || pos.x > TowerDefense.graphics.canvas.width || pos.y < 0 || pos.y > TowerDefense.graphics.canvas.height) {
                reportExit(entity);
            }

            // Update healthbar pos
            let healthbar = entity.components.health.healthBarEntities;

            let greenBarPos = healthbar.green.components.position;
            greenBarPos.x = pos.x - greenBarPos.width / 2;
            greenBarPos.y = pos.y - greenBarPos.height * 2.25;

            let redBarPos = healthbar.red.components.position;
            redBarPos.x = greenBarPos.x + pos.width - redBarPos.width;
            redBarPos.y = greenBarPos.y;

            // // 3. test dist to dest
            // let destLoc = system.gridCellToCanvasCoords(pathbound.destCell);
            // if (testTolerance(pos.x, destLoc.x, 5) && testTolerance(pos.y, destLoc.y, 5)) {
            //     // 4. snap to dest
            //     pos.x = destLoc.x;
            //     pos.y = destLoc.y;
            //     // 5. set new dest
            //     pathbound.currCell.canPlace = true;
            //     pathbound.currCell = pathbound.destCell;
            //     pathbound.destCell = pathbound.currCell.next;
            //
            //     if (pathbound.currCell === grid.exit) {
            //         reportExit(entity);
            //     }
            // }
        }
    }

    function calcShortestPath(update=false) {
        let queue = [];
        let visited = {};
        let addedToQueue = {};

        let startCell = grid.entrance;
        let endCell = grid.exit;

        // Add initial coords to queue
        for (let nbr of getNeighbors(endCell)) {
            if (update) {
                nbr['next'] = endCell;
            }
            queue.push(nbr);
            addedToQueue[[nbr.x, nbr.y]] = true;
        }
        visited[[endCell.x, endCell.y]] = true;

        // Find path
        let isPathFound = false;
        while (queue.length) {
            let cell = queue.shift();
            for (let nbr of getNeighbors(cell)) {
                let key = [nbr.x, nbr.y];
                if (!visited.hasOwnProperty(key)) {
                    if (update) {
                        nbr['next'] = cell;
                    }

                    if (nbr === startCell) {
                        isPathFound = true;
                    }
                    if (!addedToQueue.hasOwnProperty(key)) {
                        queue.push(nbr); // dont need to push if already in there
                        addedToQueue[[nbr.x, nbr.y]] = true;
                    }
                }
            }
            visited[[cell.x, cell.y]] = true;
        }

        return isPathFound;
    }

    function getNeighbors(cell) {
        let nbrs = [];

        let coords = [[cell.x, cell.y - 1], [cell.x, cell.y + 1], [cell.x - 1, cell.y], [cell.x + 1, cell.y]];
        for (let i = 0; i < coords.length; ++i) {
            let [x, y] = coords[i];

            if (y >= 0 && y < grid.grid.length && x >= 0 && x < grid.grid[y].length && !grid.grid[y][x]['obstructed']) {
                nbrs.push(grid.grid[y][x]);
            }
        }

        return nbrs;
    }

    system.gridCellToCanvasCoords = function(e) {
        let xConvFactor = TowerDefense.graphics.canvas.width / spec.arenaDim;
        let yConvFactor =TowerDefense.graphics.canvas.height / spec.arenaDim;

        return {x: e.x * xConvFactor + 0.5 * xConvFactor, y: e.y * yConvFactor + 0.5 * yConvFactor};
    }

    system.toNearestGridCellCenter = function(e) {
        // Convert to grid coords
        let xConvFactor = spec.arenaDim / TowerDefense.graphics.canvas.width;
        let yConvFactor = spec.arenaDim / TowerDefense.graphics.canvas.height;
        let x = e.x * xConvFactor;
        let y = e.y * yConvFactor;

        // Round
        let rX = Math.round(x);
        if (x - rX < 0) {
            rX -= 0.5
        } else if (e.x - rX > 0) {
            rX += 0.5;
        } else {
            rX += 0.5;
        }

        let rY = Math.round(y);
        if (y - rY < 0) {
            rY -= 0.5
        } else if (e.y - rY > 0) {
            rY += 0.5;
        } else {
            rY += 0.5;
        }

        // Verify in-bounds
        rX = Math.max(0.5, Math.min(spec.arenaDim - 0.5, rX));
        rY = Math.max(0.5, Math.min(spec.arenaDim - 0.5, rY));

        return {
            canvas: {
                x: rX / xConvFactor,
                y: rY / yConvFactor
            },
            grid: {
                x: Math.floor(rX),
                y: Math.floor(rY)
            }
        };
    }

    return system;
};