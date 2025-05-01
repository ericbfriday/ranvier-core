import { EventEmitter } from 'node:events';

/**
 * Base class for anything that should be sending or receiving data from the player
 */
export class TransportStream extends EventEmitter {
    socket: any;

    get readable(): boolean {
        return true;
    }

    get writable(): boolean {
        return true;
    }

    write(): void {
    /* noop */
    }

    /**
     * A subtype-safe way to execute commands on a specific type of stream that invalid types will ignore. For given input
     * for command (example, `"someCommand"` ill look for a method called `executeSomeCommand` on the `TransportStream`
     * @param {string} command
     * @param {...any} args
     * @return {any}
     */
    command(command: string, ...args: any[]): any {
        if (!command || !command.length) {
            throw new RangeError('Must specify a command to the stream');
        }
        const methodName = `execute${command[0].toUpperCase()}${command.substr(1)}`;
        if (typeof (this as any)[methodName] === 'function') {
            return (this as any)[methodName](...args);
        }
    }

    address(): null {
        return null;
    }

    end(): void {
    /* noop */
    }

    setEncoding(): void {
    /* noop */
    }

    pause(): void {
    /* noop */
    }

    resume(): void {
    /* noop */
    }

    destroy(): void {
    /* noop */
    }

    /**
     * Attach a socket to this stream
     * @param {any} socket
     */
    attach(socket: any): void {
        this.socket = socket;

        this.socket.on('close', () => {
            this.emit('close');
        });
    }
}

export default TransportStream;
