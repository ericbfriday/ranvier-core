/**
 * Representation of an "Attribute" which is any value that has a base amount and depleted/restored
 * safely. Where safely means without being destructive to the base value.
 *
 * An attribute on its own cannot be raised above its base value. To raise attributes above their
 * base temporarily see the {@link http://ranviermud.com/extending/effects|Effect guide}.
 *
 * @property {string} name
 * @property {number} base
 * @property {number} delta Current difference from the base
 * @property {AttributeFormula} formula
 * @property {object} metadata any custom info for this attribute
 */
export class Attribute {
    name: string;
    base: number;
    delta: number;
    formula: AttributeFormula | null;
    metadata: Record<string, any>;

    /**
     * @param {string} name
     * @param {number} base
     * @param {number} delta=0
     * @param {AttributeFormula} formula=null
     * @param {object} metadata={}
     */
    constructor(
        name: string,
        base: number,
    delta = 0,
    formula: AttributeFormula | null = null,
    metadata: Record<string, any> = {},
    ) {
        if (Number.isNaN(base)) {
            throw new TypeError(`Base attribute must be a number, got ${base}.`);
        }
        if (Number.isNaN(delta)) {
            throw new TypeError(`Attribute delta must be a number, got ${delta}.`);
        }
        if (formula && !(formula instanceof AttributeFormula)) {
            throw new TypeError(
                'Attribute formula must be instance of AttributeFormula',
            );
        }

        this.name = name;
        this.base = base;
        this.delta = delta;
        this.formula = formula;
        this.metadata = metadata;
    }

    /**
     * Lower current value
     * @param {number} amount
     */
    lower(amount: number): void {
        this.raise(-amount);
    }

    /**
     * Raise current value
     * @param {number} amount
     */
    raise(amount: number): void {
        const newDelta = Math.min(this.delta + amount, 0);
        this.delta = newDelta;
    }

    /**
     * Change the base value
     * @param {number} amount
     */
    setBase(amount: number): void {
        this.base = Math.max(amount, 0);
    }

    /**
     * Bypass raise/lower, directly setting the delta
     * @param {amount}
     */
    setDelta(amount: number): void {
        this.delta = Math.min(amount, 0);
    }

    serialize(): { delta: number, base: number } {
        const { delta, base } = this;
        return { delta, base };
    }
}

/**
 * @property {Array<string>} requires Array of attributes required for this formula to run
 * @property {function (...number) : number} formula
 */
export class AttributeFormula {
    requires: string[];
    formula: (...args: any[]) => number;

    constructor(requires: string[], fn: (...args: any[]) => number) {
        if (!Array.isArray(requires)) {
            throw new TypeError('requires not an array');
        }

        if (typeof fn !== 'function') {
            throw new TypeError('Formula function is not a function');
        }

        this.requires = requires;
        this.formula = fn;
    }

    evaluate(attribute: Attribute, ...args: any[]): number {
        if (typeof this.formula !== 'function') {
            throw new Error(`Formula is not callable ${this.formula}`);
            return 0;
        }

        return this.formula.bind(attribute)(...args);
    }
}
