import type { Socket } from 'node:net'
import * as sty from 'sty'

/**
 * Helper methods for colored output during input-events
 */
class EventUtil {
    /**
     * Generate a function for writing colored output to a socket
     * @param socket - Network socket
     */
    static genWrite(socket: Socket): (string: string) => void {
        return (string: string) => socket.write(sty.parse(string))
    }

    /**
     * Generate a function for writing colored output to a socket with a newline
     * @param socket - Network socket
     */
    static genSay(socket: Socket): (string: string) => void {
        return (string: string) => socket.write(sty.parse(`${string}\r\n`))
    }
}

export default EventUtil
