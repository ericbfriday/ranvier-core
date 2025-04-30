import type { EventEmitter } from 'node:events';

interface MetadatableEntity extends EventEmitter {
    metadata: Record<string, any>
}

/**
 * @ignore
 * @exports MetadatableFn
 * @param {*} parentClass
 * @return {module:MetadatableFn~Metadatable}
 */
function Metadatable<T extends new (...args: any[]) => EventEmitter>(parentClass: T) {
    return class extends parentClass implements MetadatableEntity {
        metadata!: Record<string, any>;

        /**
         * Set a metadata value.
         * Warning: Does _not_ autovivify, you will need to create the parent objects if they don't exist
         * @param {string} key   Key to set. Supports dot notation e.g., `"foo.bar"`
         * @param {*}      value Value must be JSON.stringify-able
         * @throws Error
         * @throws RangeError
         * @fires Metadatable#metadataUpdate
         */
        setMeta(key: string, value: any): void {
            if (!this.metadata) {
                throw new Error('Class does not have metadata property');
            }

            const parts = key.split('.');
            const property = parts.pop() as string;
            let base = this.metadata;

            while (parts.length) {
                const part = parts.shift() as string;
                if (!(part in base)) {
                    throw new RangeError(`Metadata path invalid: ${key}`);
                }
                base = base[part];
            }

            const oldValue = base[property];
            base[property] = value;

            /**
             * @event Metadatable#metadataUpdate
             * @param {string} key
             * @param {*} newValue
             * @param {*} oldValue
             */
            this.emit('metadataUpdated', key, value, oldValue);
        }

        /**
         * Get metadata by dot notation
         * Warning: This method is _very_ permissive and will not error on a non-existent key. Rather, it will return false.
         * @param {string} key Key to fetch. Supports dot notation e.g., `"foo.bar"`
         * @return {*}
         * @throws Error
         */
        getMeta(key: string): any {
            if (!this.metadata) {
                throw new Error('Class does not have metadata property');
            }

            const base = this.metadata;
            return key.split('.').reduce((obj, index) => obj && obj[index], base);
        }
    };
}

export default Metadatable;
