/**
 * @module SkillType
 * @enum {symbol}
 */
const SkillType = {
    SKILL: Symbol('SKILL'),
    SPELL: Symbol('SPELL'),
} as const

export type SkillTypeValue = (typeof SkillType)[keyof typeof SkillType]

export default SkillType
