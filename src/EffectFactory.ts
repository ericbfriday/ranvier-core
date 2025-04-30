import type { GameState } from './GameState';
import Effect from './Effect';
import EventManager from './EventManager';

/** @typedef {{config: Object<string,*>, listeners: Object<String,function (...*)>}} */
interface EffectConfig {
    config?: Record<string, any>
    listeners?:
        | Record<string, Function>
        | ((state: GameState) => Record<string, Function>)
    state?: Record<string, any>
    [key: string]: any
}

interface EffectEntry {
    definition: EffectConfig
    eventManager: EventManager
}

/**
 * @property {Map} effects
 */
class EffectFactory {
    effects: Map<string, EffectEntry>;

    constructor() {
        this.effects = new Map();
    }

    /**
     * @param {string} id
     * @param {EffectConfig} config
     * @param {GameState} state
     */
    add(id: string, config: EffectConfig, state: GameState): void {
        if (this.effects.has(id)) {
            return;
        }

        const definition = Object.assign({}, config);
        delete definition.listeners;
        let listeners = config.listeners || {};
        if (typeof listeners === 'function') {
            listeners = listeners(state);
        }

        const eventManager = new EventManager();
        for (const event in listeners) {
            eventManager.add(event, listeners[event]);
        }

        this.effects.set(id, { definition, eventManager });
    }

    has(id: string): boolean {
        return this.effects.has(id);
    }

    /**
     * Get a effect definition. Use `create` if you want an instance of a effect
     * @param {string} id
     * @return {object}
     */
    get(id: string): EffectEntry | undefined {
        return this.effects.get(id);
    }

    /**
     * @param {string}  id      effect id
     * @param {?object} config  Effect.config override
     * @param {?object} state   Effect.state override
     * @return {Effect}
     */
    create(
        id: string,
    config: Record<string, any> = {},
    state: Record<string, any> = {},
    ): Effect {
        const entry = this.effects.get(id);
        if (!entry || !entry.definition) {
            throw new Error(`No valid entry definition found for effect ${id}.`);
        }
        const def = Object.assign({}, entry.definition);
        def.config = Object.assign(def.config || {}, config);
        def.state = Object.assign(def.state || {}, state);
        const effect = new Effect(id, def);
        entry.eventManager.attach(effect);

        return effect;
    }
}

export default EffectFactory;
