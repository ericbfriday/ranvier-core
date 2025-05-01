import type Character from './Character.js';
import type Damage from './Damage.js';
import type GameState from './GameState.js';
import type Skill from './Skill.js';
import EventEmitter from 'node:events';

/** @typedef EffectModifiers {{attributes: !Object<string,function>}} */
export interface EffectModifiers {
    attributes:
        | {
            [attribute: string]: (currentValue: number) => number
        }
        | ((attrName: string, currentValue: number) => number)
    incomingDamage: (damage: Damage, current: number) => number
    outgoingDamage: (damage: Damage, current: number) => number
    [key: string]: any
}

export interface EffectConfig {
    autoActivate?: boolean
    description?: string
    duration?: number
    hidden?: boolean
    maxStacks?: number
    name?: string
    persists?: boolean
    refreshes?: boolean
    tickInterval?: boolean | number
    type?: string
    unique?: boolean
    [key: string]: any
}

export interface EffectState {
    stacks?: number
    lastTick?: number
    ticks?: number
    [key: string]: any
}

export interface EffectDefinition {
    config?: EffectConfig
    state?: EffectState
    flags?: string[]
    modifiers?: Partial<EffectModifiers>
}

export interface SerializedEffect {
    config: EffectConfig
    elapsed: number
    id: string
    remaining: number
    skill?: string
    state: EffectState
}

/**
 * See the {@link http://ranviermud.com/extending/effects/|Effect guide} for usage.
 */
export class Effect extends EventEmitter {
    id: string;
    flags: string[];
    config: EffectConfig;
    startedAt: number;
    paused: number | null;
    modifiers: EffectModifiers;
    state: EffectState;
    target?: Character;
    active?: boolean;
    skill?: Skill;

    constructor(id: string, def: EffectDefinition) {
        super();

        this.id = id;
        this.flags = def.flags || [];
        this.config = Object.assign(
            {
                autoActivate: true,
                description: '',
                duration: Infinity,
                hidden: false,
                maxStacks: 0,
                name: 'Unnamed Effect',
                persists: true,
                refreshes: false,
                tickInterval: false,
                type: 'undef',
                unique: true,
            },
            def.config,
        );

        this.startedAt = 0;
        this.paused = 0;
        this.modifiers = Object.assign(
            {
                attributes: {},
                incomingDamage: (damage: Damage, current: number) => current,
                outgoingDamage: (damage: Damage, current: number) => current,
            },
            def.modifiers,
        );

        // internal state saved across player load e.g., stacks, amount of damage shield remaining, whatever
        // Default state can be found in config.state
        this.state = Object.assign({}, def.state);

        if (this.config.maxStacks) {
            this.state.stacks = 1;
        }

        // If an effect has a tickInterval it should always apply when first activated
        if (this.config.tickInterval && !this.state.tickInterval) {
            this.state.lastTick = -Infinity;
            this.state.ticks = 0;
        }

        if (this.config.autoActivate) {
            this.on('effectAdded', this.activate);
        }
    }

    /**
     * @type {string}
     */
    get name(): string {
        return this.config.name || '';
    }

    /**
     * @type {string}
     */
    get description(): string {
        return this.config.description || '';
    }

    /**
     * @type {number}
     */
    get duration(): number {
        return this.config.duration || 0;
    }

    set duration(dur: number) {
        this.config.duration = dur;
    }

    /**
     * Elapsed time in milliseconds since event was activated
     * @type {number}
     */
    get elapsed(): number | null {
        if (!this.startedAt) {
            return null;
        }

        return this.paused || Date.now() - this.startedAt;
    }

    /**
     * Remaining time in seconds
     * @type {number}
     */
    get remaining(): number {
        const elapsed = this.elapsed || 0;
        return this.config.duration || 0 - elapsed;
    }

    /**
     * Whether this effect has lapsed
     * @return {boolean}
     */
    isCurrent(): boolean {
        const elapsed = this.elapsed || 0;
        return elapsed < (this.config.duration || 0);
    }

    /**
     * Set this effect active
     * @fires Effect#effectActivated
     */
    activate(): void {
        if (!this.target) {
            throw new Error('Cannot activate an effect without a target');
        }

        if (this.active) {
            return;
        }

        this.startedAt = Date.now() - (this.elapsed || 0);
        this.active = true;
        /**
         * @event Effect#effectActivated
         */
        this.emit('effectActivated');
    }

    /**
     * Set this effect active
     * @fires Effect#effectDeactivated
     */
    deactivate(): void {
        if (!this.active) {
            return;
        }

        this.active = false;

        /**
         * @event Effect#effectDeactivated
         */
        this.emit('effectDeactivated');
    }

    /**
     * Remove this effect from its target
     * @fires Effect#remove
     */
    remove(): void {
    /**
     * @event Effect#remove
     */
        this.emit('remove');
    }

    /**
     * Stop this effect from having any effect temporarily
     */
    pause(): void {
        this.paused = this.elapsed;
    }

    /**
     * Resume a paused effect
     */
    resume(): void {
        this.startedAt = Date.now() - (this.paused || 0);
        this.paused = null;
    }

    /**
     * @param {string} attrName
     * @param {number} currentValue
     * @return {number} attribute modified by effect
     */
    modifyAttribute(attrName: string, currentValue: number): number {
        let modifier: (current: number) => number = (current: number) => current;

        if (typeof this.modifiers.attributes === 'function') {
            modifier = (current: number) => {
                return (this.modifiers.attributes as Function).bind(this)(
                    attrName,
                    current,
                );
            };
        }
        else if (attrName in this.modifiers.attributes) {
            modifier = (
                this.modifiers.attributes as Record<string, (current: number) => number>
            )[attrName];
        }

        return modifier.bind(this)(currentValue);
    }

    /**
     * @param {Damage} damage
     * @param {number} currentAmount
     * @return {number}
     */
    modifyIncomingDamage(damage: Damage, currentAmount: number): number {
        const modifier = this.modifiers.incomingDamage.bind(this);
        return modifier(damage, currentAmount);
    }

    /**
     * @param {Damage} damage
     * @param {number} currentAmount
     * @return {number}
     */
    modifyOutgoingDamage(damage: Damage, currentAmount: number): number {
        const modifier = this.modifiers.outgoingDamage.bind(this);
        return modifier(damage, currentAmount);
    }

    /**
     * Gather data to persist
     * @return {object}
     */
    serialize(): SerializedEffect {
        const config = Object.assign({}, this.config);
        config.duration
      = config.duration === Infinity ? ('inf' as any) : config.duration;

        const state = Object.assign({}, this.state);
        // store lastTick as a difference so we can make sure to start where we left off when we hydrate
        if (state.lastTick && Number.isFinite(state.lastTick)) {
            state.lastTick = Date.now() - state.lastTick;
        }

        return {
            config,
            elapsed: this.elapsed as number,
            id: this.id,
            remaining: this.remaining,
            skill: this.skill && this.skill.id,
            state,
        };
    }

    /**
     * Reinitialize from persisted data
     * @param {GameState}
     * @param {object} data
     */
    hydrate(state: GameState, data: SerializedEffect): void {
        data.config.duration
      = data.config.duration === 'inf' ? Infinity : data.config.duration;
        this.config = data.config;

        if (!Number.isNaN(data.elapsed)) {
            this.startedAt = Date.now() - data.elapsed;
        }

        if (!Number.isNaN(data.state.lastTick as number)) {
            data.state.lastTick = Date.now() - (data.state.lastTick as number);
        }
        this.state = data.state;

        if (data.skill) {
            this.skill
        = state.SkillManager.get(data.skill)
            || state.SpellManager.get(data.skill);
        }
    }
}

export default Effect;
