import type { GameEntity } from './GameEntity.js';
import ChannelAudience from './ChannelAudience.js';

/**
 * Audience class representing other players in the same room as the sender
 * Could even be used to broadcast to NPCs if you want them to pick up on dialogue,
 * just make them broadcastables.
 *
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
export class RoomAudience extends ChannelAudience {
    getBroadcastTargets(): GameEntity[] {
        return this.sender.room
            .getBroadcastTargets()
            .filter(target => target !== this.sender);
    }
}

export default RoomAudience;
