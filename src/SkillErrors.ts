import type Effect from './Effect.js';

/**
 * Error used when trying to execute a skill and the player doesn't have enough resources
 * @extends Error
 */
export class NotEnoughResourcesError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'NotEnoughResourcesError';
    }
}

/**
 * Error used when trying to execute a passive skill
 * @extends Error
 */
export class PassiveError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = 'PassiveError';
    }
}

/**
 * Error used when trying to execute a skill on cooldown
 * @property {Effect} effect
 * @extends Error
 */
export class CooldownError extends Error {
    effect: Effect;

    /**
     * @param {Effect} effect Cooldown effect that triggered this error
     */
    constructor(effect: Effect) {
        super();
        this.name = 'CooldownError';
        this.effect = effect;
    }
}
