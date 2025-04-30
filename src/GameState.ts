import type Config from './Config'
import AccountManager from './AccountManager'
import AreaManager from './AreaManager'
import AttributeFactory from './AttributeFactory'
import BehaviorManager from './BehaviorManager'
import ChannelManager from './ChannelManager'
import CommandManager from './CommandManager'
import DataSourceRegistry from './DataSourceRegistry'
import EffectFactory from './EffectFactory'
import EntityFactory from './EntityFactory'
import EntityLoaderRegistry from './EntityLoaderRegistry'
import GameServer from './GameServer'
import HelpManager from './HelpManager'
import ItemFactory from './ItemFactory'
import ItemManager from './ItemManager'
import MobFactory from './MobFactory'
import PartyManager from './PartyManager'
import PlayerManager from './PlayerManager'
import QuestFactory from './QuestFactory'
import QuestGoalManager from './QuestGoalManager'
import QuestRewardManager from './QuestRewardManager'
import RoomFactory from './RoomFactory'
import RoomManager from './RoomManager'
import SkillManager from './SkillManager'

/**
 * The GameState is the central store for all game data and subsystem managers
 * It represents the current state of the game world at any given moment
 */
export default class GameState {
    AccountManager: AccountManager
    AreaManager: AreaManager
    AreaBehaviorManager: BehaviorManager
    AreaFactory: EntityFactory
    AttributeFactory: AttributeFactory
    ChannelManager: ChannelManager
    CommandManager: CommandManager
    Config: Config
    DataSourceRegistry: DataSourceRegistry
    EffectFactory: EffectFactory
    EntityLoaderRegistry: EntityLoaderRegistry
    GameServer: GameServer
    HelpManager: HelpManager
    ItemBehaviorManager: BehaviorManager
    ItemFactory: ItemFactory
    ItemManager: ItemManager
    MobBehaviorManager: BehaviorManager
    MobFactory: MobFactory
    PartyManager: PartyManager
    PlayerManager: PlayerManager
    QuestFactory: QuestFactory
    QuestGoalManager: QuestGoalManager
    QuestRewardManager: QuestRewardManager
    RoomBehaviorManager: BehaviorManager
    RoomFactory: RoomFactory
    RoomManager: RoomManager
    SkillManager: SkillManager
    SpellManager: SkillManager // Assuming SpellManager extends or is similar to SkillManager based on code references


    /**
     * Create a new GameState instance
     * @param config - Game configuration
     */
    constructor(config: Config) {
        this.Config = config

        // Initialize the entity loader registry first as other managers depend on it
        this.EntityLoaderRegistry = new EntityLoaderRegistry()
        this.DataSourceRegistry = new DataSourceRegistry()

        // Initialize base factories
        this.AttributeFactory = new AttributeFactory()
        this.EffectFactory = new EffectFactory()

        // Initialize behavior managers
        this.AreaBehaviorManager = new BehaviorManager()
        this.ItemBehaviorManager = new BehaviorManager()
        this.MobBehaviorManager = new BehaviorManager()
        this.RoomBehaviorManager = new BehaviorManager()

        // Initialize entity factories
        this.AreaFactory = new EntityFactory()
        this.ItemFactory = new ItemFactory()
        this.MobFactory = new MobFactory()
        this.RoomFactory = new RoomFactory()

        // Initialize entity managers
        this.AccountManager = new AccountManager()
        this.AreaManager = new AreaManager()
        this.ChannelManager = new ChannelManager()
        this.CommandManager = new CommandManager()
        this.HelpManager = new HelpManager()
        this.ItemManager = new ItemManager()
        this.PartyManager = new PartyManager()
        this.PlayerManager = new PlayerManager()
        this.QuestFactory = new QuestFactory()
        this.QuestGoalManager = new QuestGoalManager()
        this.QuestRewardManager = new QuestRewardManager()
        this.RoomManager = new RoomManager()
        this.SkillManager = new SkillManager()
        this.SpellManager = new SkillManager() // Separate instance for spells

        // Initialize the game server last
        this.GameServer = new GameServer()
    }

    /**
     * Retrieves the current player count
     * @return number of players currently connected
     */
    getPlayerCount(): number {
        return this.PlayerManager.getPlayersAsArray().length
    }

    /**
     * Returns the duration the server has been running in milliseconds
     * @return number
     */
    getUptime(): number {
        return Date.now() - (global as any).serverStartTime
    }

    /**
     * Broadcast a message to all connected players
     * @param message - Message to broadcast
     */
    broadcastToAll(message: string): void {
        const players = this.PlayerManager.getPlayersAsArray()
        for (const player of players) {
            player.socket.write(message)
        }
    }

    /**
     * Save the state of all managers that need to be persisted
     * @return Promise that resolves when all data is saved
     */
    async saveAll(): Promise<void> {
        await this.PlayerManager.saveAll()
    // Add any other managers that need persistent data saved
    }

    /**
     * Gracefully shutdown the game state
     */
    async shutdown(): Promise<void> {
    // Save all data
        await this.saveAll()

        // Shutdown the game server
        this.GameServer.shutdown()
    }
}
