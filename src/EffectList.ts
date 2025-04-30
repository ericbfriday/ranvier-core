import type Attribute from './Attribute';
import type Character from './Character';
import type Damage from './Damage';
import type Effect from './Effect';

/**
 * Self-managing list of effects for a target
 */
class EffectList {
    /** Set of effects */
    private effects: Set<Effect>;
    /** Target character */
    private target: Character;

    /**
     * @param target - Character to which the effects apply
     * @param effects - Array of serialized effects (Object) or actual Effect instances
     */
    constructor(target: Character, effects: Effect[] = []) {
        this.effects = new Set(effects);
        this.target = target;
    }

    /**
     * Current number of active effects
     */
    get size(): number {
        this.validateEffects();
        return this.effects.size;
    }

    /**
     * Get current list of effects as an array
     */
    entries(): Effect[] {
        this.validateEffects();
        return [...this.effects];
    }

    /**
     * Check if effect of given type exists
     */
    hasEffectType(type: string): boolean {
        return !!this.getByType(type);
    }

    /**
     * Get an effect by its type
     */
    getByType(type: string): Effect | undefined {
        return [...this.effects].find((effect) => {
            return effect.config.type === type;
        });
    }

    /**
     * Proxy an event to all effects
     * @param event - Event name
     * @param args - Event arguments
     */
    emit(event: string, ...args: any[]): void {
        this.validateEffects();
        if (event === 'effectAdded' || event === 'effectRemoved') {
            // don't forward these events on from the player as it would cause confusion between Character#effectAdded
            // and Effect#effectAdded. The former being when any effect gets added to a character, the later is fired on
            // an effect when it is added to a character
            return;
        }

        for (const effect of this.effects) {
            if (effect.paused) {
                continue;
            }

            if (event === 'updateTick' && effect.config.tickInterval) {
                const sinceLastTick = Date.now() - effect.state.lastTick;
                if (sinceLastTick < effect.config.tickInterval * 1000) {
                    continue;
                }
                effect.state.lastTick = Date.now();
                effect.state.ticks++;
            }
            effect.emit(event, ...args);
        }
    }

    /**
     * Add an effect to this list
     * @param effect - Effect to add
     * @fires Effect#effectAdded
     * @fires Effect#effectStackAdded
     * @fires Effect#effectRefreshed
     * @fires Character#effectAdded
     */
    add(effect: Effect): boolean {
        if (effect.target) {
            throw new Error('Cannot add effect, already has a target.');
        }

        for (const activeEffect of this.effects) {
            if (effect.config.type === activeEffect.config.type) {
                if (
                    activeEffect.config.maxStacks
                    && activeEffect.state.stacks < activeEffect.config.maxStacks
                ) {
                    activeEffect.state.stacks = Math.min(
                        activeEffect.config.maxStacks,
                        activeEffect.state.stacks + 1,
                    );

                    /**
                     * @event Effect#effectStackAdded
                     * @param {Effect} effect The new effect that is trying to be added
                     */
                    activeEffect.emit('effectStackAdded', effect);
                    return true;
                }

                if (activeEffect.config.refreshes) {
                    /**
                     * @event Effect#effectRefreshed
                     * @param {Effect} effect The new effect that is trying to be added
                     */
                    activeEffect.emit('effectRefreshed', effect);
                    return true;
                }

                if (activeEffect.config.unique) {
                    return false;
                }
            }
        }

        this.effects.add(effect);
        effect.target = this.target;

        /**
         * @event Effect#effectAdded
         */
        effect.emit('effectAdded');
        /**
         * @event Character#effectAdded
         */
        this.target.emit('effectAdded', effect);
        effect.on('remove', () => this.remove(effect));
        return true;
    }

    /**
     * Deactivate and remove an effect
     * @param effect - Effect to remove
     * @throws ReferenceError
     * @fires Character#effectRemoved
     */
    remove(effect: Effect): void {
        if (!this.effects.has(effect)) {
            throw new ReferenceError('Trying to remove effect that was never added');
        }

        effect.deactivate();
        this.effects.delete(effect);
        /**
         * @event Character#effectRemoved
         */
        this.target.emit('effectRemoved');
    }

    /**
     * Remove all effects, bypassing all deactivate and remove events
     */
    clear(): void {
        this.effects = new Set();
    }

    /**
     * Ensure effects are still current and if not remove them
     */
    validateEffects(): void {
        for (const effect of this.effects) {
            if (!effect.isCurrent()) {
                this.remove(effect);
            }
        }
    }

    /**
     * Gets the effective "max" value of an attribute (before subtracting delta).
     * Does the work of actually applying attribute modification
     * @param attr - Attribute to evaluate
     */
    evaluateAttribute(attr: Attribute): number {
        this.validateEffects();

        const attrName = attr.name;
        let attrValue = attr.base || 0;

        for (const effect of this.effects) {
            if (effect.paused) {
                continue;
            }
            attrValue = effect.modifyAttribute(attrName, attrValue);
        }

        return attrValue;
    }

    /**
     * @param damage - Damage instance
     * @param currentAmount - Current damage amount
     */
    evaluateIncomingDamage(damage: Damage, currentAmount: number): number {
        this.validateEffects();

        for (const effect of this.effects) {
            currentAmount = effect.modifyIncomingDamage(damage, currentAmount);
        }

        // Don't allow a modifier to make damage go negative, it would cause weird
        // behavior where damage raises an attribute
        return Math.max(currentAmount, 0) || 0;
    }

    /**
     * @param damage - Damage instance
     * @param currentAmount - Current damage amount
     */
    evaluateOutgoingDamage(damage: Damage, currentAmount: number): number {
        this.validateEffects();

        for (const effect of this.effects) {
            currentAmount = effect.modifyOutgoingDamage(damage, currentAmount);
        }

        // Same thing, mutatis mutandis, for outgoing damage
        return Math.max(currentAmount, 0) || 0;
    }

    /**
     * Serialize this effect list
     */
    serialize(): any[] {
        this.validateEffects();
        const serialized = [];
        for (const effect of this.effects) {
            if (!effect.config.persists) {
                continue;
            }

            serialized.push(effect.serialize());
        }

        return serialized;
    }

    /**
     * Hydrate this effect list
     * @param state - Game state
     */
    hydrate(state: any): void {
        const effects = this.effects;
        this.effects = new Set();
        for (const newEffect of effects) {
            const effect = state.EffectFactory.create(newEffect.id);
            effect.hydrate(state, newEffect);
            this.add(effect);
        }
    }
}

export default EffectList;
