import type EntityLoader from './EntityLoader.js';
import { EventEmitter } from 'node:events';
import Data from './Data.js';
import EventManager from './EventManager.js';
import Player from './Player.js';

/**
 * Keeps track of all active players in game
 * @extends EventEmitter
 * @property {Map} players
 * @property {EventManager} events Player events
 * @property {EntityLoader} loader
 * @listens PlayerManager#save
 * @listens PlayerManager#updateTick
 */
class PlayerManager extends EventEmitter {
    players: Map<string, Player>;
    events: EventManager;
    loader: EntityLoader | null;

    constructor() {
        super();
        this.players = new Map();
        this.events = new EventManager();
        this.loader = null;
        this.on('updateTick', this.tickAll);
    }

    /**
     * Set the entity loader from which players are loaded
     * @param {EntityLoader} loader
     */
    setLoader(loader: EntityLoader): void {
        this.loader = loader;
    }

    /**
     * @param {string} name
     * @return {Player}
     */
    getPlayer(name: string): Player | undefined {
        return this.players.get(name.toLowerCase());
    }

    /**
     * @param {Player} player
     */
    addPlayer(player: Player): void {
        this.players.set(this.keyify(player), player);
    }

    /**
     * Remove the player from the game. WARNING: You must manually save the player first
     * as this will modify serializable properties
     * @param {Player} player
     * @param {boolean} killSocket true to also force close the player's socket
     */
    removePlayer(player: Player, killSocket = false): void {
        if (killSocket) {
            player.socket!.end();
        }

        player.removeAllListeners();
        player.removeFromCombat();
        player.effects.clear();
        if (player.room) {
            player.room.removePlayer(player);
        }
        (player as any).__pruned = true;
        this.players.delete(this.keyify(player));
    }

    /**
     * @return {Array}
     */
    getPlayersAsArray(): Player[] {
        return Array.from(this.players.values());
    }

    /**
     * @param {string | symbol}   behaviorName
     * @param {Function} listener
     */
    addListener<K>(eventName: string | symbol, listener: (...args: any[]) => void): K {
        if (typeof eventName !== 'string') {
            this.events.add(String(eventName), listener);
            return;
        }
        this.events.add(eventName, listener);
    }

    /**
     * @param {Function} fn Filter function
     * @return {Array}
     */
    filter(fn: (player: Player) => boolean): Player[] {
        return this.getPlayersAsArray().filter(fn);
    }

    /**
     * Load a player for an account
     * @param {GameState} state
     * @param {Account} account
     * @param {string} username
     * @param {boolean} force true to force reload from storage
     * @return {Player}
     */
    async loadPlayer(
        state: any,
        account: any,
        username: string,
        force?: boolean,
    ): Promise<Player> {
        if (this.players.has(username) && !force) {
            return this.getPlayer(username)!;
        }

        if (!this.loader) {
            throw new Error('No entity loader configured for players');
        }

        const data = await this.loader.fetch(username);
        data.name = username;

        const player = new Player(data);
        player.account = account;

        this.events.attach(player);

        this.addPlayer(player);
        return player;
    }

    /**
     * Turn player into a key used by this class's map
     * @param {Player} player
     * @return {string}
     */
    keyify(player: Player): string {
        return player.name.toLowerCase();
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    exists(name: string): boolean {
        return Data.exists('player', name);
    }

    /**
     * Save a player
     * @fires Player#save
     */
    async save(player: Player): Promise<void> {
        if (!this.loader) {
            throw new Error('No entity loader configured for players');
        }

        await this.loader.update(player.name, player.serialize());

        /**
         * @event Player#saved
         */
        player.emit('saved');
    }

    /**
     * @fires Player#saved
     */
    async saveAll(): Promise<void> {
        for (const [name, player] of this.players.entries()) {
            await this.save(player);
        }
    }

    /**
     * @fires Player#updateTick
     */
    tickAll(): void {
        for (const [name, player] of this.players.entries()) {
            /**
             * @event Player#updateTick
             */
            player.emit('updateTick');
        }
    }

    /**
     * Used by Broadcaster
     * @return {Array<Character>}
     */
    getBroadcastTargets(): Player[] {
        return this.getPlayersAsArray();
    }
}

export default PlayerManager;
