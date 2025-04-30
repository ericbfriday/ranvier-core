/**
 * @module EffectFlag
 * @enum {symbol}
 */
const EffectFlag = {
    BUFF: Symbol('BUFF'),
    DEBUFF: Symbol('DEBUFF'),
} as const;

export default EffectFlag;
