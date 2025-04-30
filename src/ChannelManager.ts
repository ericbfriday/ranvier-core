import type { Channel } from './Channel';

/**
 * Contains registered channels
 *
 * TODO: should probably refactor this to just extend `Map`
 */
class ChannelManager {
    channels: Map<string, Channel>;

    constructor() {
        this.channels = new Map();
    }

    /**
     * @param {string} name Channel name
     * @return {Channel}
     */
    get(name: string): Channel | undefined {
        return this.channels.get(name);
    }

    /**
     * @param {Channel} channel
     */
    add(channel: Channel): void {
        this.channels.set(channel.name, channel);
        if (channel.aliases) {
            channel.aliases.forEach(alias => this.channels.set(alias, channel));
        }
    }

    /**
     * @param {Channel} channel
     */
    remove(channel: Channel): void {
        this.channels.delete(channel.name);
    }

    /**
     * @param {string} search
     * @return {Channel}
     */
    find(search: string): Channel | undefined {
        for (const [name, channel] of this.channels.entries()) {
            if (name.indexOf(search) === 0) {
                return channel;
            }
        }
        return undefined;
    }
}

export default ChannelManager;
