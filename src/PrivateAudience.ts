import type Player from './Player.js';
import ChannelAudience from './ChannelAudience.js';

/**
 * Audience class representing a specific targeted player.
 * Example: `tell` command or `whisper` command.
 * @memberof ChannelAudience
 * @extends ChannelAudience
 */
class PrivateAudience extends ChannelAudience {
    getBroadcastTargets(): Player[] {
        const targetPlayerName = this.message.split(' ')[0];
        const targetPlayer = this.state.PlayerManager.getPlayer(targetPlayerName);
        if (targetPlayer) {
            return [targetPlayer];
        }
        return [];
    }

    alterMessage(message: string): string {
    // Strips target name from message
        return message.split(' ').slice(1).join(' ');
    }
}

export default PrivateAudience;
