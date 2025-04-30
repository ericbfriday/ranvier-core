import type Player from './Player'
import CommandType from './CommandType'
import PlayerRoles from './PlayerRoles'

interface CommandDefinition {
    type?: typeof CommandType
    command: (args: string, player: Player, arg0: string) => any
    aliases?: string[]
    usage?: string
    requiredRole?: typeof PlayerRoles
    metadata?: Record<string, any>
}

/**
 * In game command. See the {@link http://ranviermud.com/extending/commands/|Command guide}
 * @property {string} bundle Bundle this command came from
 * @property {CommandType} type
 * @property {string} name
 * @property {Function} func Actual function that gets run when the command is executed
 * @property {Array<string>} aliases
 * @property {string} usage
 * @property {PlayerRoles} requiredRole
 * @property {object} metadata General use configuration object
 */
class Command {
    bundle: string
    type: typeof CommandType
    name: string
    func: (args: string, player: Player, arg0: string) => any
    aliases?: string[]
    usage: string
    requiredRole: typeof PlayerRoles
    file: string
    metadata: Record<string, any>

    /**
     * @param {string} bundle Bundle the command came from
     * @param {string} name   Name of the command
     * @param {object} def
     * @param {CommandType} def.type=CommandType.COMMAND
     * @param {Function} def.command
     * @param {Array<string>} def.aliases
     * @param {string} def.usage=this.name
     * @param {PlayerRoles} requiredRole=PlayerRoles.PLAYER
     * @param {string} file File the command comes from
     */
    constructor(
        bundle: string,
        name: string,
        def: CommandDefinition,
        file: string,
    ) {
        this.bundle = bundle
        this.type = def.type || CommandType.COMMAND
        this.name = name
        this.func = def.command
        this.aliases = def.aliases
        this.usage = def.usage || this.name
        this.requiredRole = def.requiredRole || PlayerRoles.PLAYER
        this.file = file
        this.metadata = def.metadata || {}
    }

    /**
     * @param {string} args   A string representing anything after the command itself from what the user typed
     * @param {Player} player Player that executed the command
     * @param {string} arg0   The actual command the user typed, useful when checking which alias was used for a command
     * @return {*}
     */
    execute(args: string, player: Player, arg0: string): any {
        return this.func(args, player, arg0)
    }
}

export default Command
