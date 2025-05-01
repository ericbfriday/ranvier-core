export const SkillFlag = {
    PASSIVE: Symbol('PASSIVE'),
    ACTIVE: Symbol('ACTIVE'),
} as const;

export type SkillFlagType = (typeof SkillFlag)[keyof typeof SkillFlag];

export default SkillFlag;
