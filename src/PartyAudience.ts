import type { Player } from './Player.js';
import ChannelAudience from './ChannelAudience.js';

/**
 * Audience class representing other players in the same group as the sender
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
export class PartyAudience extends ChannelAudience {
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
