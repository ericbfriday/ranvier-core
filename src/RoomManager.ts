import type Room from './Room.js';

/**
 * Keeps track of all the individual rooms in the game
 */
export class RoomManager {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    /**
     * Get a room by entity reference
     * @param entityRef - Room entity reference
     */
    getRoom(entityRef: string): Room | undefined {
        return this.rooms.get(entityRef);
    }

    /**
     * Add a room to the manager
     * @param room - Room to add
     */
    addRoom(room: Room): void {
        this.rooms.set(room.entityReference, room);
    }

    /**
     * Remove a room from the manager
     * @param room - Room to remove
     */
    removeRoom(room: Room): void {
        this.rooms.delete(room.entityReference);
    }
}

export default RoomManager;
