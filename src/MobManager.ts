import type { Npc } from './Npc.js';

/**
 * Keeps track of all the individual mobs in the game
 */
class MobManager {
    mobs: Map<string, Npc>;

    constructor() {
        this.mobs = new Map<string, Npc>();
    }

    /**
     * @param {Npc} mob
     */
    addMob(mob: Npc): void {
        this.mobs.set(mob.uuid, mob);
    }

    /**
     * Completely obliterate a mob from the game, nuclear option
     * @param {Npc} mob
     */
    removeMob(mob: Npc): void {
        mob.effects.clear();
        const room = mob.room;
        if (room) {
            room.area.removeNpc(mob);
            room.removeNpc(mob, true);
        }
        mob.__pruned = true;
        mob.removeAllListeners();
        this.mobs.delete(mob.uuid);
    }
}

export default MobManager;
