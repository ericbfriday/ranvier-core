import type Character from './Character'

interface DamageMetadata {
    type?: string
    hidden?: boolean
    critical?: boolean
    [key: string]: any
}

/**
 * @property {string} attribute Attribute the damage is going to apply to
 * @property {number} amount Initial amount of damage to be done
 * @property {?Character} attacker Character causing the damage
 * @property {*} source Where the damage came from: skill, item, room, etc.
 * @property {object} metadata Extra info about the damage: type, hidden, critical, etc.
 */
class Damage {
    attribute: string
    amount: number
    attacker: Character | null
    source: any
    metadata: DamageMetadata

    /**
     * @param {string} attribute Attribute the damage is going to apply to
     * @param {number} amount
     * @param {Character} [attacker] Character causing the damage
     * @param {*} [source] Where the damage came from: skill, item, room, etc.
     * @property {object} metadata Extra info about the damage: type, hidden, critical, etc.
     */
    constructor(
        attribute: string,
        amount: number,
    attacker = null,
    source = null,
    metadata: DamageMetadata = {},
    ) {
        if (!Number.isFinite(amount)) {
            throw new TypeError(
                `Damage amount must be a finite Number, got ${amount}.`,
            )
        }

        if (typeof attribute !== 'string') {
            throw new TypeError('Damage attribute name must be a string')
        }

        this.attacker = attacker
        this.attribute = attribute
        this.amount = amount
        this.source = source
        this.metadata = metadata
    }

    /**
     * Evaluate actual damage taking attacker/target's effects into account
     * @param {Character} target
     * @return {number} Final damage amount
     */
    evaluate(target: Character): number {
        let amount = this.amount

        if (this.attacker) {
            amount = this.attacker.evaluateOutgoingDamage(this, amount, target)
        }

        return target.evaluateIncomingDamage(this, amount)
    }

    /**
     * Actually lower the attribute
     * @param {Character} target
     * @fires Character#hit
     * @fires Character#damaged
     */
    commit(target: Character): void {
        const finalAmount = this.evaluate(target)
        target.lowerAttribute(this.attribute, finalAmount)

        if (this.attacker) {
            /**
             * @event Character#hit
             * @param {Damage} damage
             * @param {Character} target
             * @param {number} finalAmount
             */
            this.attacker.emit('hit', this, target, finalAmount)
        }

        /**
         * @event Character#damaged
         * @param {Damage} damage
         * @param {number} finalAmount
         */
        target.emit('damaged', this, finalAmount)
    }
}

export default Damage
