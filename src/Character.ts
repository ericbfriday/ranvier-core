import type Attribute from './Attribute.js';
import type Damage from './Damage.js';
import type Effect from './Effect.js';
import type { GameState } from './GameState.js';
import type Item from './Item.js';
import type Party from './Party.js';
import type Room from './Room.js';
import { EventEmitter } from 'node:events';
import Attributes from './Attributes.js';
import Config from './Config.js';
import EffectList from './EffectList.js';
import { EquipAlreadyEquippedError, EquipSlotTakenError } from './EquipErrors.js';
import { Inventory, InventoryFullError } from './Inventory.js';
import Logger from './Logger.js';
import Metadatable from './Metadatable.js';

export interface CharacterConfig {
    name: string
    inventory?: any
    equipment?: Map<string, Item>
    level?: number
    room?: Room | null
    attributes?: Attributes
    metadata?: Record<string, any>
    effects?: any
}

/**
 * The Character class acts as the base for both NPCs and Players.
 *
 * @property {string}     name       Name shown on look/who/login
 * @property {Inventory}  inventory
 * @property {Set}        combatants Enemies this character is currently in combat with
 * @property {number}     level
 * @property {Attributes} attributes
 * @property {EffectList} effects    List of current effects applied to the character
 * @property {Room}       room       Room the character is currently in
 *
 * @extends EventEmitter
 * @mixes Metadatable
 */
export class Character extends Metadatable(EventEmitter) {
    name: string;
    inventory: Inventory;
    equipment: Map<string, Item>;
    combatants: Set<Character>;
    combatData: Record<string, any>;
    level: number;
    room: Room | null;
    attributes: Attributes;
    followers: Set<Character>;
    following: Character | null;
    party: Party | null;
    effects: EffectList;
    metadata: Record<string, any> = Metadatable(EventEmitter);
    __hydrated?: boolean;

    constructor(data: CharacterConfig) {
        super();

        this.name = data.name;
        this.inventory = new Inventory(data.inventory || {});
        this.equipment = data.equipment || new Map();
        this.combatants = new Set();
        this.combatData = {};
        this.level = data.level || 1;
        this.room = data.room || null;
        this.attributes = data.attributes || new Attributes();

        this.followers = new Set();
        this.following = null;
        this.party = null;

        this.effects = new EffectList(this, data.effects);

        // Arbitrary data bundles are free to shove whatever they want in
        // WARNING: values must be JSON.stringify-able
        if (data.metadata) {
            this.metadata = JSON.parse(JSON.stringify(data.metadata));
        }
        else {
            this.metadata = {};
        }
    }

    /**
     * Proxy all events on the player to effects
     * @param {string} event
     * @param {...*}   args
     */
    emit(event: string, ...args: any[]): boolean {
        super.emit(event, ...args);

        this.effects.emit(event, ...args);
        return true;
    }

    /**
     * @param {string} attr Attribute name
     * @return {boolean}
     */
    hasAttribute(attr: string): boolean {
        return this.attributes.has(attr);
    }

    /**
     * Get current maximum value of attribute (as modified by effects.)
     * @param {string} attr
     * @return {number}
     */
    getMaxAttribute(attr: string): number {
        if (!this.hasAttribute(attr)) {
            throw new RangeError(`Character does not have attribute [${attr}]`);
        }

        const attribute = this.attributes.get(attr);
        const currentVal = this.effects.evaluateAttribute(attribute);

        if (!attribute.formula) {
            return currentVal;
        }

        const { formula } = attribute;

        const requiredValues = formula.requires.map((reqAttr: string) =>
            this.getMaxAttribute(reqAttr),
        );

        return formula.evaluate.apply(formula, [
            attribute,
            this,
            currentVal,
            ...requiredValues,
        ]);
    }

    /**
     * @see {@link Attributes#add}
     */
    addAttribute(attribute: Attribute): void {
        this.attributes.add(attribute);
    }

    /**
     * Get the current value of an attribute (base modified by delta)
     * @param {string} attr
     * @return {number}
     */
    getAttribute(attr: string): number {
        if (!this.hasAttribute(attr)) {
            throw new RangeError(`Character does not have attribute [${attr}]`);
        }

        return this.getMaxAttribute(attr) + this.attributes.get(attr).delta;
    }

    /**
     * Get the base value for a given attribute
     * @param {string} attr Attribute name
     * @return {number}
     */
    getBaseAttribute(attributeName: string): number {
        const attr = this.attributes.get(attributeName);
        return attr && attr.base;
    }

    /**
     * Fired when a Character's attribute is set, raised, or lowered
     * @event Character#attributeUpdate
     * @param {string} attributeName
     * @param {Attribute} attribute
     */

    /**
     * Clears any changes to the attribute, setting it to its base value.
     * @param {string} attr
     * @fires Character#attributeUpdate
     */
    setAttributeToMax(attr: string): void {
        if (!this.hasAttribute(attr)) {
            throw new Error(`Invalid attribute ${attr}`);
        }

        this.attributes.get(attr).setDelta(0);
        this.emit('attributeUpdate', attr, this.getAttribute(attr));
    }

    /**
     * Raise an attribute by name
     * @param {string} attr
     * @param {number} amount
     * @see {@link Attributes#raise}
     * @fires Character#attributeUpdate
     */
    raiseAttribute(attr: string, amount: number): void {
        if (!this.hasAttribute(attr)) {
            throw new Error(`Invalid attribute ${attr}`);
        }

        this.attributes.get(attr).raise(amount);
        this.emit('attributeUpdate', attr, this.getAttribute(attr));
    }

    /**
     * Lower an attribute by name
     * @param {string} attr
     * @param {number} amount
     * @see {@link Attributes#lower}
     * @fires Character#attributeUpdate
     */
    lowerAttribute(attr: string, amount: number): void {
        if (!this.hasAttribute(attr)) {
            throw new Error(`Invalid attribute ${attr}`);
        }

        this.attributes.get(attr).lower(amount);
        this.emit('attributeUpdate', attr, this.getAttribute(attr));
    }

    /**
     * Update an attribute's base value.
     *
     * NOTE: You _probably_ don't want to use this the way you think you do. You should not use this
     * for any temporary modifications to an attribute, instead you should use an Effect modifier.
     *
     * This will _permanently_ update the base value for an attribute to be used for things like a
     * player purchasing a permanent upgrade or increasing a stat on level up
     *
     * @param {string} attr Attribute name
     * @param {number} newBase New base value
     * @fires Character#attributeUpdate
     */
    setAttributeBase(attr: string, newBase: number): void {
        if (!this.hasAttribute(attr)) {
            throw new Error(`Invalid attribute ${attr}`);
        }

        this.attributes.get(attr).setBase(newBase);
        this.emit('attributeUpdate', attr, this.getAttribute(attr));
    }

    /**
     * @param {string} type
     * @return {boolean}
     * @see {@link Effect}
     */
    hasEffectType(type: string): boolean {
        return this.effects.hasEffectType(type);
    }

    /**
     * @param {Effect} effect
     * @return {boolean}
     */
    addEffect(effect: Effect): boolean {
        return this.effects.add(effect);
    }

    /**
     * @param {Effect} effect
     * @see {@link Effect#remove}
     */
    removeEffect(effect: Effect): void {
        this.effects.remove(effect);
    }

    /**
     * Start combat with a given target.
     * @param {Character} target
     * @param {?number}   lag    Optional milliseconds of lag to apply before the first attack
     * @fires Character#combatStart
     */
    initiateCombat(target: Character, lag = 0): void {
        if (!this.isInCombat()) {
            this.combatData.lag = lag;
            this.combatData.roundStarted = Date.now();
            /**
             * Fired when Character#initiateCombat is called
             * @event Character#combatStart
             */
            this.emit('combatStart');
        }

        if (this.isInCombat(target)) {
            return;
        }

        // this doesn't use `addCombatant` because `addCombatant` automatically
        // adds this to the target's combatants list as well
        this.combatants.add(target);
        this.emit('combatantAdded', target);
        if (!target.isInCombat()) {
            // TODO: This hardcoded 2.5 second lag on the target needs to be refactored
            target.initiateCombat(this, 2500);
        }

        target.addCombatant(this);
    }

    /**
     * Check to see if this character is currently in combat or if they are
     * currently in combat with a specific character
     * @param {?Character} target
     * @return boolean
     */
    isInCombat(target?: Character): boolean {
        return target ? this.combatants.has(target) : this.combatants.size > 0;
    }

    /**
     * @param {Character} target
     * @fires Character#combatantAdded
     */
    addCombatant(target: Character): void {
        if (this.isInCombat(target)) {
            return;
        }

        this.combatants.add(target);
        target.addCombatant(this);
        /**
         * @event Character#combatantAdded
         * @param {Character} target
         */
        this.emit('combatantAdded', target);
    }

    /**
     * @param {Character} target
     * @fires Character#combatantRemoved
     * @fires Character#combatEnd
     */
    removeCombatant(target: Character): void {
        if (!this.combatants.has(target)) {
            return;
        }

        this.combatants.delete(target);
        target.removeCombatant(this);

        /**
         * @event Character#combatantRemoved
         * @param {Character} target
         */
        this.emit('combatantRemoved', target);

        if (!this.combatants.size) {
            /**
             * @event Character#combatEnd
             */
            this.emit('combatEnd');
        }
    }

    /**
     * Fully remove this character from combat
     */
    removeFromCombat(): void {
        if (!this.isInCombat()) {
            return;
        }

        for (const combatant of this.combatants) {
            this.removeCombatant(combatant);
        }
    }

    /**
     * @see EffectList.evaluateIncomingDamage
     * @param {Damage} damage
     * @return {number}
     */
    evaluateIncomingDamage(damage: Damage, currentAmount: number): number {
        const amount = this.effects.evaluateIncomingDamage(damage, currentAmount);
        return Math.floor(amount);
    }

    /**
     * @see EffectList.evaluateOutgoingDamage
     * @param {Damage} damage
     * @param {number} currentAmount
     * @return {number}
     */
    evaluateOutgoingDamage(damage: Damage, currentAmount: number): number {
        return this.effects.evaluateOutgoingDamage(damage, currentAmount);
    }

    /**
     * @param {Item} item
     * @param {string} slot Slot to equip the item in
     *
     * @throws EquipSlotTakenError
     * @throws EquipAlreadyEquippedError
     * @fires Character#equip
     * @fires Item#equip
     */
    equip(item: Item, slot: string): void {
        if (this.equipment.has(slot)) {
            throw new EquipSlotTakenError();
        }

        if (item.isEquipped) {
            throw new EquipAlreadyEquippedError();
        }

        if (this.inventory) {
            this.removeItem(item);
        }

        this.equipment.set(slot, item);
        item.isEquipped = true;
        item.equippedBy = this;
        /**
         * @event Item#equip
         * @param {Character} equipper
         */
        item.emit('equip', this);
        /**
         * @event Character#equip
         * @param {string} slot
         * @param {Item} item
         */
        this.emit('equip', slot, item);
    }

    /**
     * Remove equipment in a given slot and move it to the character's inventory
     * @param {string} slot
     *
     * @throws InventoryFullError
     * @fires Item#unequip
     * @fires Character#unequip
     */
    unequip(slot: string): void {
        if (this.isInventoryFull()) {
            throw new InventoryFullError();
        }

        const item = this.equipment.get(slot);
        if (!item) {
            return;
        }

        item.isEquipped = false;
        item.equippedBy = null;
        this.equipment.delete(slot);
        /**
         * @event Item#unequip
         * @param {Character} equipper
         */
        item.emit('unequip', this);
        /**
         * @event Character#unequip
         * @param {string} slot
         * @param {Item} item
         */
        this.emit('unequip', slot, item);
        this.addItem(item);
    }

    /**
     * Move an item to the character's inventory
     * @param {Item} item
     */
    addItem(item: Item): void {
        this._setupInventory();
        this.inventory.addItem(item);
        item.carriedBy = this;
    }

    /**
     * Remove an item from the character's inventory. Warning: This does not automatically place the
     * item in any particular place. You will need to manually add it to the room or another
     * character's inventory
     * @param {Item} item
     */
    removeItem(item: Item): void {
        this.inventory.removeItem(item);

        // if we removed the last item unset the inventory
        // This ensures that when it's reloaded it won't try to set
        // its default inventory. Instead it will persist the fact
        // that all the items were removed from it
        if (!this.inventory.size) {
            this.inventory = null as unknown as Inventory;
        }
        item.carriedBy = null;
    }

    /**
     * Check to see if this character has a particular item by EntityReference
     * @param {EntityReference} itemReference
     * @return {Item|boolean}
     */
    hasItem(itemReference: string): Item | false {
        for (const [uuid, item] of this.inventory) {
            if (item.entityReference === itemReference) {
                return item;
            }
        }

        return false;
    }

    /**
     * @return {boolean}
     */
    isInventoryFull(): boolean {
        this._setupInventory();
        return this.inventory.isFull;
    }

    /**
     * @private
     */
    _setupInventory(): void {
        this.inventory = this.inventory || new Inventory();
        // Default max inventory size config
        if (!this.isNpc && !isFinite(this.inventory.getMax())) {
            this.inventory.setMax(Config.get('defaultMaxPlayerInventory') || 20);
        }
    }

    /**
     * Begin following another character. If the character follows itself they stop following.
     * @param {Character} target
     */
    follow(target: Character): void {
        if (target === this) {
            this.unfollow();
            return;
        }

        this.following = target;
        target.addFollower(this);
        /**
         * @event Character#followed
         * @param {Character} target
         */
        this.emit('followed', target);
    }

    /**
     * Stop following whoever the character was following
     * @fires Character#unfollowed
     */
    unfollow(): void {
        if (!this.following) {
            return;
        }

        this.following.removeFollower(this);
        /**
         * @event Character#unfollowed
         * @param {Character} following
         */
        this.emit('unfollowed', this.following);
        this.following = null;
    }

    /**
     * @param {Character} follower
     * @fires Character#gainedFollower
     */
    addFollower(follower: Character): void {
        this.followers.add(follower);
        follower.following = this;
        /**
         * @event Character#gainedFollower
         * @param {Character} follower
         */
        this.emit('gainedFollower', follower);
    }

    /**
     * @param {Character} follower
     * @fires Character#lostFollower
     */
    removeFollower(follower: Character): void {
        this.followers.delete(follower);
        follower.following = null;
        /**
         * @event Character#lostFollower
         * @param {Character} follower
         */
        this.emit('lostFollower', follower);
    }

    /**
     * @param {Character} target
     * @return {boolean}
     */
    isFollowing(target: Character): boolean {
        return this.following === target;
    }

    /**
     * @param {Character} target
     * @return {boolean}
     */
    hasFollower(target: Character): boolean {
        return this.followers.has(target);
    }

    /**
     * Initialize the character from storage
     * @param {GameState} state
     */
    hydrate(state: GameState): boolean {
        if (this.__hydrated) {
            Logger.warn('Attempted to hydrate already hydrated character.');
            return false;
        }

        if (!(this.attributes instanceof Attributes)) {
            const attributes = this.attributes;
            this.attributes = new Attributes();

            for (const attr in attributes) {
                let attrConfig = attributes[attr];
                if (typeof attrConfig === 'number') {
                    attrConfig = { base: attrConfig };
                }

                if (typeof attrConfig !== 'object' || !('base' in attrConfig)) {
                    throw new Error(
                        `Invalid base value given to attributes.\n${
                            JSON.stringify(attributes, null, 2)}`,
                    );
                }

                if (!state.AttributeFactory.has(attr)) {
                    throw new Error(
                        `Entity trying to hydrate with invalid attribute ${attr}`,
                    );
                }

                this.addAttribute(
                    state.AttributeFactory.create(
                        attr,
                        attrConfig.base,
                        attrConfig.delta || 0,
                    ),
                );
            }
        }

        this.effects.hydrate(state);

        // inventory is hydrated in the subclasses because npc and players hydrate their inventories differently

        this.__hydrated = true;
        return true;
    }

    /**
     * Gather data to be persisted
     * @return {object}
     */
    serialize(): object {
        return {
            attributes: this.attributes.serialize(),
            level: this.level,
            name: this.name,
            room: this.room ? this.room.entityReference : null,
            effects: this.effects.serialize(),
        };
    }

    /**
     * @see {@link Broadcast}
     */
    getBroadcastTargets(): Character[] {
        return [this];
    }

    /**
     * @return {boolean}
     */
    get isNpc(): boolean {
        return false;
    }
}

export default Character;
