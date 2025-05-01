import type Area from './Area.js';
import type GameEntity from './GameEntity.js';
import BehaviorManager from './BehaviorManager.js';

/**
 * Stores definitions of entities to allow for easy creation/cloning
 */
export class EntityFactory {
    private entities: Map<string, any>;
    public scripts: BehaviorManager;

    constructor() {
        this.entities = new Map();
        this.scripts = new BehaviorManager();
    }

    /**
     * Create the key used by the entities and scripts maps
     * @param area - Area name
     * @param id - Entity ID
     */
    createEntityRef(area: string, id: string | number): string {
        return `${area}:${id}`;
    }

    /**
     * Get an entity definition
     * @param entityRef - Entity reference
     */
    getDefinition(entityRef: string): any {
        return this.entities.get(entityRef);
    }

    /**
     * Set an entity definition
     * @param entityRef - Entity reference
     * @param def - Entity definition
     */
    setDefinition(entityRef: string, def: any): void {
        def.entityReference = entityRef;
        this.entities.set(entityRef, def);
    }

    /**
     * Add an event listener from a script to a specific item
     * @see BehaviorManager::addListener
     * @param entityRef - Entity reference
     * @param event - Event name
     * @param listener - Listener function
     */
    addScriptListener(
        entityRef: string,
        event: string,
        listener: Function,
    ): void {
        this.scripts.addListener(entityRef, event, listener);
    }

    /**
     * Create a new instance of a given npc definition. Resulting npc will not be held or equipped
     * and will _not_ have its default contents. If you want it to also populate its default contents
     * you must manually call `npc.hydrate(state)`
     *
     * @param area - Area
     * @param entityRef - Entity reference
     * @param Type - Type of entity to instantiate
     */
    createByType<T extends GameEntity>(
        area: Area,
        entityRef: string,
        Type: new (area: Area, definition: any) => T,
    ): T {
        const definition = this.getDefinition(entityRef);
        if (!definition) {
            throw new Error(`No Entity definition found for ${entityRef}`);
        }
        const entity = new Type(area, definition);

        if (this.scripts.has(entityRef)) {
            this.scripts.get(entityRef).attach(entity);
        }

        return entity;
    }

    /**
     * Create an entity
     */
    create<T>(...args: any[]): T {
        throw new Error('No type specified for Entity.create');
    }

    /**
     * Clone an existing entity.
     * @param entity - Entity to clone
     */
    clone<T extends GameEntity>(entity: T): T {
        return this.create(entity.area, entity.entityReference) as T;
    }
}
export default EntityFactory;
