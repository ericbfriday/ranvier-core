import type { Area } from './Area.js';
import EntityFactory from './EntityFactory.js';
import Item from './Item.js';

/**
 * Stores definitions of items to allow for easy creation/cloning of objects
 */
export class ItemFactory extends EntityFactory {
    /**
     * Create a new instance of an item by EntityReference. Resulting item will
     * not be held or equipped and will _not_ have its default contents. If you
     * want it to also populate its default contents you must manually call
     * `item.hydrate(state)`
     *
     * @param {Area}   area
     * @param {string} entityRef
     * @return {Item}
     */
    create(area: Area, entityRef: string): Item {
        const item = this.createByType(area, entityRef, Item);
        item.area = area;
        return item;
    }
}

export default ItemFactory;
