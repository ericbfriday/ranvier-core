import type DataSource from './DataSource'

/**
 * Used to CRUD an entity from a configured DataSource
 */
export default class EntityLoader {
    private dataSource: DataSource
    public config: any

    /**
     * @param dataSource - Data source
     * @param config - Configuration
     */
    constructor(dataSource: DataSource, config: any = {}) {
        this.dataSource = dataSource
        this.config = config
    }

    /**
     * Set area name
     * @param name - Area name
     */
    setArea(name: string): void {
        this.config.area = name
    }

    /**
     * Set bundle name
     * @param name - Bundle name
     */
    setBundle(name: string): void {
        this.config.bundle = name
    }

    /**
     * Check if data source has data
     */
    hasData(): boolean {
        return this.dataSource.hasData(this.config)
    }

    /**
     * Fetch all entities
     */
    fetchAll(): any[] {
        if (!('fetchAll' in this.dataSource)) {
            throw new Error(`fetchAll not supported by ${this.dataSource.name}`)
        }

        return this.dataSource.fetchAll(this.config)
    }

    /**
     * Fetch a single entity
     * @param id - Entity ID
     */
    fetch(id: string): any {
        if (!('fetch' in this.dataSource)) {
            throw new Error(`fetch not supported by ${this.dataSource.name}`)
        }

        return this.dataSource.fetch(this.config, id)
    }

    /**
     * Replace entity data
     * @param data - New entity data
     */
    replace(data: any): any {
        if (!('replace' in this.dataSource)) {
            throw new Error(`replace not supported by ${this.dataSource.name}`)
        }

        return this.dataSource.replace(this.config, data)
    }

    /**
     * Update entity data
     * @param id - Entity ID
     * @param data - Updated entity data
     */
    update(id: string, data: any): any {
        if (!('update' in this.dataSource)) {
            throw new Error(`update not supported by ${this.dataSource.name}`)
        }

        return this.dataSource.update(this.config, id, data)
    }
}
