/**
 * @module CommandType
 * @enum {symbol}
 */
const CommandType = {
    COMMAND: Symbol('COMMAND'),
    SKILL: Symbol('SKILL'),
    CHANNEL: Symbol('CHANNEL'),
    MOVEMENT: Symbol('MOVEMENT'),
} as const

export default CommandType
