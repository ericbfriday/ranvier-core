import type Player from './Player.ts';
import ChannelAudience from './ChannelAudience.ts';

/**
 * Audience class representing characters in the same area as the sender
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class AreaAudience extends ChannelAudience {
    getBroadcastTargets(): Player[] {
        if (!this.sender.room) {
            return [];
        }

        const { area } = this.sender.room;
        return area
            .getBroadcastTargets()
            .filter(target => target !== this.sender) as Player[];
    }
}

export default AreaAudience;
