import type GameState from './GameState';
import type Player from './Player';
import ChannelAudience from './ChannelAudience';

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
