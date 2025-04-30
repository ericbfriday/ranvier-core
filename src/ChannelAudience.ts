import type GameState from './GameState'
import type Player from './Player'

export interface AudienceOptions {
    state: GameState
    sender: Player
    message: string
}

/**
 * Classes representing various channel audiences
 *
 * See the {@link http://ranviermud.com/extending/channels/|Channel guide} for usage
 * @namespace ChannelAudience
 */

/**
 * Base channel audience class
 */
export default class ChannelAudience {
    state: GameState | null = null
    sender: Player | null = null
    message: string = ''

    /**
     * Configure the current state for the audience. Called by {@link Channel#send}
     * @param {object} options
     * @param {GameState} options.state
     * @param {Player} options.sender
     * @param {string} options.message
     */
    configure(options: AudienceOptions): void {
        this.state = options.state
        this.sender = options.sender
        this.message = options.message
    }

    /**
     * Find targets for this audience
     * @return {Array<Player>}
     */
    getBroadcastTargets(): Player[] {
        if (!this.state) {
            return []
        }
        return this.state.PlayerManager.getPlayersAsArray()
    }

    /**
     * Modify the message to be sent
     * @param {string} message
     * @return {string}
     */
    alterMessage(message: string): string {
        return message
    }
}
