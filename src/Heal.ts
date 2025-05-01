import type Character from './Character.js';
import Damage from './Damage.js';

/**
 * Heal is `Damage` that raises an attribute instead of lowering it
 * @extends Damage
 */
class Heal extends Damage {
    /**
     * Raise a given attribute
     * @param target - Target character
     * @fires Character#heal
     * @fires Character#healed
     */
    commit(target: Character): void {
        const finalAmount = this.evaluate(target);
        target.raiseAttribute(this.attribute, finalAmount);

        if (this.attacker) {
            /**
             * @event Character#heal
             * @param {Heal} heal
             * @param {Character} target
             * @param {number} finalAmount
             */
            this.attacker.emit('heal', this, target, finalAmount);
        }
        /**
         * @event Character#healed
         * @param {Heal} heal
         * @param {number} finalAmount
         */
        target.emit('healed', this, finalAmount);
    }
}

export default Heal;
