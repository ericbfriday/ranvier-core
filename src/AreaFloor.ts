/**
 * IF you absolutely need to iterate over a floor in a tight (nested) loop you
 * should use the low/high properties like so.
 *
 * ```javascript
 * const floor = area.map.get(2);
 * for (let x = floor.lowX; x <= floor.highX; x++) {
 *  for (let y = floor.lowY; y <= floor.highY; y++) {
 *    const room = floor.getRoom(x, y);
 *
 *    if (!room) {
 *      continue;
 *    }
 *  }
 * }
 * ```
 *
 * Note the `<=` to avoid fenceposting the loop
 */

// Import Room type - you'll need to create this interface based on your Room implementation
import type Room from './Room.js';

export class AreaFloor {
    z: number;
    lowX: number;
    highX: number;
    lowY: number;
    highY: number;
    map: Array<Array<Room | undefined>>;

    constructor(z: number) {
        this.z = z;
        this.lowX = this.highX = this.lowY = this.highY = 0;
        this.map = [];
    }

    addRoom(x: number, y: number, room: Room): void {
        if (!room) {
            throw new Error('Invalid room given to AreaFloor.addRoom');
        }

        if (this.getRoom(x, y)) {
            throw new Error(
                `AreaFloor.addRoom: trying to add room at filled coordinates: ${x}, ${y}`,
            );
        }

        if (x < this.lowX) {
            this.lowX = x;
        }
        else if (x > this.highX) {
            this.highX = x;
        }

        if (y < this.lowY) {
            this.lowY = y;
        }
        else if (y > this.highY) {
            this.highY = y;
        }

        if (!Array.isArray(this.map[x])) {
            this.map[x] = [];
        }

        this.map[x][y] = room;
    }

    /**
     * Get a room at specified coordinates
     */
    getRoom(x: number, y: number): Room | undefined {
        return this.map[x] && this.map[x][y];
    }

    /**
     * Remove a room at specified coordinates
     */
    removeRoom(x: number, y: number): void {
        if (!this.map[x] || !this.map[x][y]) {
            throw new Error(
                'AreaFloor.removeRoom: trying to remove non-existent room',
            );
        }

        this.map[x][y] = undefined;
    }
}

export default AreaFloor;
