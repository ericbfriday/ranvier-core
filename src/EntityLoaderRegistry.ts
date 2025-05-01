import type { DataSource } from './DataSource.js';
import { EntityLoader } from './EntityLoader.ts';

export interface EntityLoaderConfig {
    [key: string]: {
        source: string
        config?: any
    }
}

/**
 * Holds instances of configured EntityLoaders
 */
export default class EntityLoaderRegistry extends Map<string, EntityLoader> {
    /**
     * Load entity loaders from configuration
     * @param sourceRegistry - Registry of data sources
     * @param config - Configuration for entity loaders
     */
    load(
        sourceRegistry: Map<string, DataSource>,
    config: EntityLoaderConfig = {},
    ): void {
        for (const [name, settings] of Object.entries(config)) {
            if (!Object.prototype.hasOwnProperty.call(settings, 'source')) {
                throw new Error(`EntityLoader [${name}] does not specify a 'source'`);
            }

            if (typeof settings.source !== 'string') {
                throw new TypeError(`EntityLoader [${name}] has an invalid 'source'`);
            }

            const source = sourceRegistry.get(settings.source);

            if (!source) {
                throw new Error(
                    `Invalid source [${settings.source}] for entity [${name}]`,
                );
            }

            const sourceConfig = settings.config || {};

            this.set(
                name,
                new EntityLoader(sourceRegistry.get(settings.source)!, sourceConfig),
            );
        }
    }
}
