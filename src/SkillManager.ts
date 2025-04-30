import type Skill from './Skill'
import SkillFlag from './SkillFlag'

/**
 * Keeps track of registered skills
 */
export default class SkillManager {
    skills: Map<string, Skill>

    constructor() {
        this.skills = new Map()
    }

    /**
     * @param {string} skill Skill name
     * @return {Skill|undefined}
     */
    get(skill: string): Skill | undefined {
        return this.skills.get(skill)
    }

    /**
     * @param {Skill} skill
     */
    add(skill: Skill): void {
        this.skills.set(skill.id, skill)
    }

    /**
     * @param {Skill} skill
     */
    remove(skill: Skill): void {
        this.skills.delete(skill.name)
    }

    /**
     * Find executable skills
     * @param {string}  search
     * @param {boolean} includePassive
     * @return {Skill|undefined}
     */
    find(search: string, includePassive = false): Skill | undefined {
        for (const [id, skill] of this.skills) {
            if (!includePassive && skill.flags.includes(SkillFlag.PASSIVE)) {
                continue
            }

            if (id.indexOf(search) === 0) {
                return skill
            }
        }
        return undefined
    }
}
