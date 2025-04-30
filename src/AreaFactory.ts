import Area from './Area'
import EntityFactory from './EntityFactory'

interface AreaDefinition {
    bundle: string
    manifest: any
}

/**
 * Stores definitions of items to allow for easy creation/cloning of objects
 */
class AreaFactory extends EntityFactory {
    /**
     * Create a new instance of an area by name. Resulting area will not have
     * any of its contained entities (items, npcs, rooms) hydrated. You will
     * need to call `area.hydrate(state)`
     *
     * @param {GameState} state
     * @param {string} bundle Name of this bundle this area is defined in
     * @param {string} entityRef Area name
     * @return {Area}
     */
    override create(entityRef: string): Area {
        const definition = this.getDefinition(entityRef) as AreaDefinition
        if (!definition) {
            throw new Error(`No Entity definition found for ${entityRef}`)
        }

        const area = new Area(definition.bundle, entityRef, definition.manifest)

        if (this.scripts.has(entityRef)) {
            const script = this.scripts.get(entityRef)
            if (script) {
                script.attach(area)
            }
        }

        return area
    }

    /**
     * @see AreaFactory#create
     */
    clone(area: Area): Area {
        return this.create(area.name)
    }
}

export default AreaFactory
