import type Area from './Area';
import EntityFactory = require('./EntityFactory');
import Npc = require('./Npc');

/**
 * Stores definitions of npcs to allow for easy creation/cloning
 * @extends EntityFactory
 */
class MobFactory extends EntityFactory {
    /**
     * Create a new instance of a given npc definition. Resulting npc will not
     * have its default inventory.  If you want to also populate its default
     * contents you must manually call `npc.hydrate(state)`
     *
     * @param {Area}   area
     * @param {string} entityRef
     * @return {Npc}
     */
    create(area: Area, entityRef: string): Npc {
        const npc = this.createByType(area, entityRef, Npc);
        npc.area = area;
        return npc;
    }
}

export default MobFactory;
