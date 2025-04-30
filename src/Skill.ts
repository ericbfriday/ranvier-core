import type Effect from './Effect'
import Broadcast from './Broadcast'
import Damage from './Damage'
import * as SkillErrors from './SkillErrors'
import SkillFlag from './SkillFlag'
import SkillType from './SkillType'

export interface SkillConfig {
    configureEffect?: (effect: Effect) => Effect
    cooldown?: number | { group: string, length: number }
    effect?: string | null
    flags?: (typeof SkillFlag)[]
    info?: (player: any) => string
    initiatesCombat?: boolean
    name: string
    requiresTarget?: boolean
    resource?: any | any[]
    run?: (args: string, player: any, target: any) => any
    targetSelf?: boolean
    type?: typeof SkillType
    options?: Record<string, any>
}

/**
 * @property {function (Effect)} configureEffect modify the skill's effect before adding to player
 * @property {null|number}      cooldownLength When a number > 0 apply a cooldown effect to disallow usage
 *                                       until the cooldown has ended
 * @property {string}           effect Id of the passive effect for this skill
 * @property {Array<SkillFlag>} flags
 * @property {function ()}      info Function to run to display extra info about this skill
 * @property {function ()}      run  Function to run when skill is executed/activated
 * @property {GameState}        state
 * @property {SkillType}        type
 */
export default class Skill {
    configureEffect: (effect: Effect) => Effect
    cooldownGroup: string | null
    cooldownLength: number | null
    effect: string | null
    flags: (typeof SkillFlag)[]
    id: string
    info: (player?: any) => string
    initiatesCombat: boolean
    name: string
    options: Record<string, any>
    requiresTarget: boolean
    resource: any | any[]
    run: (args: string, player: any, target: any) => any
    state: any
    targetSelf: boolean
    type: typeof SkillType

    /**
     * @param {string} id
     * @param {object} config
     * @param {GameState} state
     */
    constructor(id: string, config: SkillConfig, state: any) {
        const {
            configureEffect = _ => _,
            cooldown = null,
            effect = null,
            flags = [],
            info = _ => '',
            initiatesCombat = false,
            name,
            requiresTarget = true,
            resource = null /* format [{ attribute: 'someattribute', cost: 10}] */,
            run = (_) => {},
            targetSelf = false,
            type = SkillType.SKILL,
            options = {},
        } = config

        this.configureEffect = configureEffect

        this.cooldownGroup = null
        if (cooldown && typeof cooldown === 'object') {
            this.cooldownGroup = cooldown.group
            this.cooldownLength = cooldown.length
        }
        else {
            this.cooldownLength = cooldown
        }

        this.effect = effect
        this.flags = flags
        this.id = id
        this.info = info.bind(this)
        this.initiatesCombat = initiatesCombat
        this.name = name
        this.options = options
        this.requiresTarget = requiresTarget
        this.resource = resource
        this.run = run.bind(this)
        this.state = state
        this.targetSelf = targetSelf
        this.type = type
    }

    /**
     * perform an active skill
     * @param {string} args
     * @param {Player} player
     * @param {Character} target
     */
    execute(args: string, player: any, target: any): boolean {
        if (this.flags.includes(SkillFlag.PASSIVE)) {
            throw new SkillErrors.PassiveError()
        }

        const cdEffect = this.onCooldown(player)
        if (this.cooldownLength && cdEffect) {
            throw new SkillErrors.CooldownError(cdEffect)
        }

        if (this.resource) {
            if (!this.hasEnoughResources(player)) {
                throw new SkillErrors.NotEnoughResourcesError()
            }
        }

        if (target !== player && this.initiatesCombat) {
            player.initiateCombat(target)
        }

        // allow skills to not incur the cooldown if they return false in run
        if (this.run(args, player, target) !== false) {
            this.cooldown(player)
            if (this.resource) {
                this.payResourceCosts(player)
            }
        }

        return true
    }

    /**
     * @param {Player} player
     * @return {boolean} If the player has paid the resource cost(s).
     */
    payResourceCosts(player: any): boolean {
        const hasMultipleResourceCosts = Array.isArray(this.resource)
        if (hasMultipleResourceCosts) {
            for (const resourceCost of this.resource) {
                this.payResourceCost(player, resourceCost)
            }
            return true
        }

        return this.payResourceCost(player, this.resource)
    }

    // Helper to pay a single resource cost.
    payResourceCost(player: any, resource: any): boolean {
    // Resource cost is calculated as the player damaging themself so effects
    // could potentially reduce resource costs
        const damage = new Damage(resource.attribute, resource.cost, player, this, {
            hidden: true,
        })

        damage.commit(player)
        return true
    }

    activate(player: any): void {
        if (!this.flags.includes(SkillFlag.PASSIVE)) {
            return
        }

        if (!this.effect) {
            throw new Error('Passive skill has no attached effect')
        }

        let effect = this.state.EffectFactory.create(this.effect, {
            description: this.info(player),
        })
        effect = this.configureEffect(effect)
        effect.skill = this
        player.addEffect(effect)
        this.run(null, player, null)
    }

    /**
     * @param {Character} character
     * @return {boolean|Effect} If on cooldown returns the cooldown effect
     */
    onCooldown(character: any): boolean | Effect {
        for (const effect of character.effects.entries()) {
            if (
                effect.id === 'cooldown'
                && effect.state.cooldownId === this.getCooldownId()
            ) {
                return effect
            }
        }

        return false
    }

    /**
     * Put this skill on cooldown
     * @param {number} duration Cooldown duration
     * @param {Character} character
     */
    cooldown(character: any): void {
        if (!this.cooldownLength) {
            return
        }

        character.addEffect(this.createCooldownEffect())
    }

    getCooldownId(): string {
        return this.cooldownGroup
            ? `skillgroup:${this.cooldownGroup}`
            : `skill:${this.id}`
    }

    /**
     * Create an instance of the cooldown effect for use by cooldown()
     *
     * @private
     * @return {Effect}
     */
    createCooldownEffect(): Effect {
        if (!this.state.EffectFactory.has('cooldown')) {
            this.state.EffectFactory.add('cooldown', this.getDefaultCooldownConfig())
        }

        const effect = this.state.EffectFactory.create(
            'cooldown',
            { name: `Cooldown: ${this.name}`, duration: this.cooldownLength! * 1000 },
            { cooldownId: this.getCooldownId() },
        )
        effect.skill = this

        return effect
    }

    getDefaultCooldownConfig(): any {
        return {
            config: {
                name: 'Cooldown',
                description: 'Cannot use ability while on cooldown.',
                unique: false,
                type: 'cooldown',
            },
            state: {
                cooldownId: null,
            },
            listeners: {
                effectDeactivated() {
                    Broadcast.sayAt(
                        this.target,
                        `You may now use <bold>${this.skill.name}</bold> again.`,
                    )
                },
            },
        }
    }

    /**
     * @param {Character} character
     * @return {boolean}
     */
    hasEnoughResources(character: any): boolean {
        if (Array.isArray(this.resource)) {
            return this.resource.every(resource =>
                this.hasEnoughResource(character, resource),
            )
        }
        return this.hasEnoughResource(character, this.resource)
    }

    /**
     * @param {Character} character
     * @param {{ attribute: string, cost: number}} resource
     * @return {boolean}
     */
    hasEnoughResource(
        character: any,
        resource: { attribute: string, cost: number },
    ): boolean {
        return (
            !resource.cost
            || (character.hasAttribute(resource.attribute)
                && character.getAttribute(resource.attribute) >= resource.cost)
        )
    }
}
