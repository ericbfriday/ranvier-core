import type GameState from './GameState.js';
import type { Player } from './Player.js';
import ChannelAudience from './ChannelAudience.js';

/**
 * Audience class representing everyone in the game, except sender.
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class WorldAudience extends ChannelAudience {
    state: GameState;
    sender: Player;

    getBroadcastTargets(): Player[] {
        return this.state.PlayerManager.filter(player => player !== this.sender);
    }
}

export default WorldAudience;
