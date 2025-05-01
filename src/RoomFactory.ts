import type Area from './Area.js';
import EntityFactory from './EntityFactory.js';
import Room from './Room.js';

/**
 * Stores definitions of npcs to allow for easy creation/cloning
 * @extends EntityFactory
 */
class RoomFactory extends EntityFactory {
    /**
     * Create a new instance of a given room. Room will not be hydrated
     *
     * @param {Area}   area
     * @param {string} entityRef
     * @return {Room}
     */
    create(area: Area, entityRef: string): Room {
        const room = this.createByType(area, entityRef, Room);
        room.area = area;
        return room;
    }
}

export default RoomFactory;
