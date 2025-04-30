import type { Item } from './Item'
import ItemType = require('./ItemType')

/**
 * Keep track of all items in game
 */
class ItemManager {
    items: Set<Item>

    constructor() {
        this.items = new Set<Item>()
    }

    add(item: Item): void {
        this.items.add(item)
    }

    remove(item: Item): void {
        if (item.room) {
            item.room.removeItem(item)
        }

        if (item.carriedBy) {
            item.carriedBy.removeItem(item)
        }

        if (item.type === ItemType.CONTAINER && item.inventory) {
            item.inventory.forEach(childItem => this.remove(childItem))
        }

        item.__pruned = true
        item.removeAllListeners()
        this.items.delete(item)
    }

    /**
     * @fires Item#updateTick
     */
    tickAll(): void {
        for (const item of this.items) {
            /**
             * @event Item#updateTick
             */
            item.emit('updateTick')
        }
    }
}

export default ItemManager
