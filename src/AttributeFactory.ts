import { Attribute, AttributeFormula } from './Attribute'

interface AttributeDefinition {
    name: string
    base: number
    formula: AttributeFormula | null
    metadata: Record<string, any>
}

/**
 * @property {Map} attributes
 */
class AttributeFactory {
    attributes: Map<string, AttributeDefinition>

    constructor() {
        this.attributes = new Map()
    }

    /**
     * @param {string} name
     * @param {number} base
     * @param {AttributeFormula} formula
     * @param {Record<string, any>} metadata
     */
    add(
        name: string,
        base: number,
    formula: AttributeFormula | null = null,
    metadata: Record<string, any> = {},
    ): void {
        if (formula && !(formula instanceof AttributeFormula)) {
            throw new TypeError('Formula not instance of AttributeFormula')
        }

        this.attributes.set(name, {
            name,
            base,
            formula,
            metadata,
        })
    }

    /**
     * @see Map#has
     */
    has(name: string): boolean {
        return this.attributes.has(name)
    }

    /**
     * Get a attribute definition. Use `create` if you want an instance of a attribute
     * @param {string} name
     * @return {object}
     */
    get(name: string): AttributeDefinition | undefined {
        return this.attributes.get(name)
    }

    /**
     * @param {string} name
     * @param {number} base
     * @param {number} delta
     * @return {Attribute}
     */
    create(name: string, base: number | null = null, delta = 0): Attribute {
        if (!this.has(name)) {
            throw new RangeError(`No attribute definition found for [${name}]`)
        }

        const def = this.attributes.get(name)
        if (!def) {
            throw new Error(`Attribute definition for [${name}] is undefined`)
        }

        return new Attribute(
            name,
            base || def.base,
            delta,
            def.formula,
            def.metadata,
        )
    }

    /**
     * Make sure there are no circular dependencies between attributes
     * @throws Error
     */
    validateAttributes(): void {
        const references: Record<string, string[]> = {}

        for (const [attrName, def] of this.attributes.entries()) {
            if (!def.formula) {
                continue
            }

            references[attrName] = def.formula.requires
        }

        for (const attrName in references) {
            const check = this._checkReferences(attrName, references)
            if (Array.isArray(check)) {
                const path = check.concat(attrName).join(' -> ')
                throw new Error(
                    `Attribute formula for [${attrName}] has circular dependency [${path}]`,
                )
            }
        }
    }

    /**
     * @private
     * @param {string} attr attribute name to check for circular ref
     * @param {Record<string, string[]>} references
     * @param {string[]} stack
     * @return {boolean | string[]}
     */
    _checkReferences(
        attr: string,
        references: Record<string, string[]>,
    stack: string[] = [],
    ): boolean | string[] {
        if (stack.includes(attr)) {
            return stack
        }

        const requires = references[attr]

        if (!requires || !requires.length) {
            return true
        }

        for (const reqAttr of requires) {
            const check = this._checkReferences(
                reqAttr,
                references,
                stack.concat(attr),
            )
            if (Array.isArray(check)) {
                return check
            }
        }

        return true
    }
}

export default AttributeFactory
