import { Attribute } from './Attribute.js';

/**
 * Container for a list of attributes for a {@link Character}
 *
 * @extends Map
 */
class Attributes extends Map<string, Attribute> {
    /**
     * @param {Attribute} attribute
     */
    add(attribute: Attribute): void {
        if (!(attribute instanceof Attribute)) {
            throw new TypeError(`${attribute} not an Attribute`);
        }

        this.set(attribute.name, attribute);
    }

    /**
     * @return {IterableIterator} see {@link Map#entries}
     */
    getAttributes(): IterableIterator<[string, Attribute]> {
        return this.entries();
    }

    /**
     * Clear all deltas for all attributes in the list
     */
    clearDeltas(): void {
        for (const [_, attr] of this) {
            attr.setDelta(0);
        }
    }

    /**
     * Gather data that will be persisted
     * @return {Record<string, any>}
     */
    serialize(): Record<string, any> {
        const data: Record<string, any> = {};
        for (const [name, attribute] of this.entries()) {
            data[name] = attribute.serialize();
        }

        return data;
    }
}

export default Attributes;
