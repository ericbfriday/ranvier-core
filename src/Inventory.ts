import type Character from './Character'
import type GameState from './GameState'
import Item from './Item'

/**
 * Representation of a `Character` or container `Item` inventory
 * @extends Map
 */
export default class Inventory extends Map<string, Item> {
    maxSize: number

    /**
     * @param {object} init
     * @param {Array<Item>} init.items
     * @param {number} init.max Max number of items this inventory can hold
     */
    constructor(init: { items?: Array<[string, Item]>, max?: number } = {}) {
        const safeInit = Object.assign(
            {
                items: [],
                max: Infinity,
            },
            init,
        )

        super(safeInit.items)
        this.maxSize = safeInit.max
    }

    /**
     * @param {number} size
     */
    setMax(size: number): void {
        this.maxSize = size
    }

    /**
     * @return {number}
     */
    getMax(): number {
        return this.maxSize
    }

    /**
     * @return {boolean}
     */
    get isFull(): boolean {
        return this.size >= this.maxSize
    }

    /**
     * @param {Item} item
     */
    addItem(item: Item): void {
        if (this.isFull) {
            throw new InventoryFullError()
        }
        this.set(item.uuid, item)
    }

    /**
     * @param {Item} item
     */
    removeItem(item: Item): void {
        this.delete(item.uuid)
    }

    serialize(): { items: Array<[string, any]>, max: number } {
    // Circular dependency is handled by dynamic import in the original code
        const data = {
            items: [] as Array<[string, any]>,
            max: this.maxSize,
        }

        for (const [uuid, item] of this) {
            if (!(item instanceof Item)) {
                this.delete(uuid)
                continue
            }

            data.items.push([uuid, item.serialize()])
        }

        return data
    }

    /**
     * @param {GameState} state
     * @param {Character|Item} carriedBy
     */
    hydrate(state: GameState, carriedBy: Character | Item): void {
    // Circular dependency is handled by dynamic import in the original code
        for (const [uuid, def] of this) {
            if (def instanceof Item) {
                def.carriedBy = carriedBy
                continue
            }
            // @ts-expect-error IDK wtf this is doing.
            if (!def.entityReference) {
                continue
            }

            const area = state.AreaManager.getAreaByReference(def.entityReference)
            const newItem = state.ItemFactory.create(area, def.entityReference)
            newItem.uuid = uuid
            newItem.carriedBy = carriedBy
            newItem.initializeInventory(def.inventory)
            newItem.hydrate(state, def)
            this.set(uuid, newItem)
            state.ItemManager.add(newItem)
        }
    }
}

/**
 * @extends Error
 */
export class InventoryFullError extends Error {
    constructor(message?: string) {
        super(message || 'Inventory full')
        this.name = 'InventoryFullError'
    }
}
