import type { Player } from './Player.js';
import ChannelAudience = require('./ChannelAudience');

/**
 * Audience class representing other players in the same group as the sender
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class PartyAudience extends ChannelAudience {
    getBroadcastTargets(): Player[] {
        if (!this.sender.party) {
            return [];
        }

        return this.sender.party
            .getBroadcastTargets()
            .filter(player => player !== this.sender);
    }
}

export default PartyAudience;
