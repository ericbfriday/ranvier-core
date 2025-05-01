import type { Player } from './Player.js';
import ChannelAudience from './ChannelAudience.js';

export interface RoleAudienceOptions {
    minRole: number
    [key: string]: any
}

export class RoleAudience extends ChannelAudience {
    minRole: number;

    constructor(options: RoleAudienceOptions) {
        super();
        // eslint-disable-next-line no-prototype-builtins
        if (!options.hasOwnProperty('minRole')) {
            throw new Error('No role given for role audience');
        }
        this.minRole = options.minRole;
    }

    getBroadcastTargets(): Player[] {
        return this.state.PlayerManager.filter(
            player => player.role >= this.minRole && player !== this.sender,
        );
    }
}

export default RoleAudience;
