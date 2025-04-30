import { EventEmitter } from 'node:events'

// Assuming commander is a type from a package
interface Commander {
    [key: string]: any
}

class GameServer extends EventEmitter {
    /**
     * Start the game server
     * @param commander - Commander instance
     * @fires GameServer#startup
     */
    startup(commander: Commander): void {
    /**
     * @event GameServer#startup
     * @param {commander} commander
     */
        this.emit('startup', commander)
    }

    /**
     * Shutdown the game server
     * @fires GameServer#shutdown
     */
    shutdown(): void {
    /**
     * @event GameServer#shutdown
     */
        this.emit('shutdown')
    }
}

export default GameServer
