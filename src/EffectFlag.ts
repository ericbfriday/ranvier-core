/**
 * @module EffectFlag
 * @enum {symbol}
 */
export const EffectFlag = {
    BUFF: Symbol('BUFF'),
    DEBUFF: Symbol('DEBUFF'),
} as const;

export default EffectFlag;
