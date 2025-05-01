import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { AttributeFormula } from './Attribute.js';
import Command from './Command.js';
import Data from './Data.js';
import Helpfile from './Helpfile.js';
import Logger from './Logger.js';
import QuestGoal from './QuestGoal.js';
import QuestReward from './QuestReward.js';
import Skill from './Skill.js';
import SkillType from './SkillType.js';

const srcPath = `${__dirname}/`;

// Define interfaces for various data structures used in the code
export interface GameState {
    EntityLoaderRegistry: any
    Config: any
    AttributeFactory: any
    PlayerManager: any
    AreaFactory: any
    ItemFactory: any
    MobFactory: any
    RoomFactory: any
    QuestFactory: any
    CommandManager: any
    ChannelManager: any
    HelpManager: any
    InputEventManager: any
    AreaBehaviorManager: any
    MobBehaviorManager: any
    ItemBehaviorManager: any
    RoomBehaviorManager: any
    EffectFactory: any
    SkillManager: any
    SpellManager: any
    ServerEventManager: any
    AreaManager: any
}

export interface AreaDefinition {
    bundle: string
    manifest: any
    quests: string[]
    items: string[]
    npcs: string[]
    rooms: string[]
}

export interface ScriptListeners {
    [key: string]: Function
}

export interface CommandImport {
    command: Function
    aliases?: string[]
    usage?: string
    [key: string]: any
}

/**
 * Handles loading/parsing/initializing all bundles. AKA where the magic happens
 */
export default class BundleManager {
    state: GameState;
    bundlesPath: string;
    areas: string[];
    loaderRegistry: any;

    /**
     * @param {string} path Directory path for bundles
     * @param {GameState} state Game state instance
     */
    constructor(bundlePath: string, state: GameState) {
        if (!bundlePath || !fs.existsSync(bundlePath)) {
            throw new Error('Invalid bundle path');
        }

        this.state = state;
        this.bundlesPath = bundlePath;
        this.areas = [];
        this.loaderRegistry = this.state.EntityLoaderRegistry;
    }

    /**
     * Load in all bundles
     * @param {boolean} distribute Whether to distribute loaded entities
     */
    async loadBundles(distribute = true): Promise<void> {
        Logger.verbose('LOAD: BUNDLES');

        const bundles = fs.readdirSync(this.bundlesPath);
        for (const bundle of bundles) {
            const bundlePath = this.bundlesPath + bundle;
            if (
                fs.statSync(bundlePath).isFile()
                || bundle === '.'
                || bundle === '..'
            ) {
                continue;
            }

            // only load bundles the user has configured to be loaded
            if (!this.state.Config.get('bundles', []).includes(bundle)) {
                continue;
            }

            await this.loadBundle(bundle, bundlePath);
        }

        try {
            this.state.AttributeFactory.validateAttributes();
        }
        catch (err) {
            Logger.error(err.message);
            process.exit(0);
        }

        Logger.verbose('ENDLOAD: BUNDLES');

        if (!distribute) {
            return;
        }

        // Distribution is done after all areas are loaded in case items use areas from each other
        for (const areaRef of this.areas) {
            const area = this.state.AreaFactory.create(areaRef);
            try {
                area.hydrate(this.state);
            }
            catch (err) {
                Logger.error(err.message);
                process.exit(0);
            }
            this.state.AreaManager.addArea(area);
        }
    }

    /**
     * @param {string} bundle Bundle name
     * @param {string} bundlePath Path to bundle directory
     */
    async loadBundle(bundle: string, bundlePath: string): Promise<void> {
        const features = [
            // quest goals/rewards have to be loaded before areas that have quests which use those goals
            { path: 'quest-goals/', fn: 'loadQuestGoals' },
            { path: 'quest-rewards/', fn: 'loadQuestRewards' },

            { path: 'attributes.js', fn: 'loadAttributes' },

            // any entity in an area, including the area itself, can have behaviors so load them first
            { path: 'behaviors/', fn: 'loadBehaviors' },

            { path: 'channels.js', fn: 'loadChannels' },
            { path: 'commands/', fn: 'loadCommands' },
            { path: 'effects/', fn: 'loadEffects' },
            { path: 'input-events/', fn: 'loadInputEvents' },
            { path: 'server-events/', fn: 'loadServerEvents' },
            { path: 'player-events.js', fn: 'loadPlayerEvents' },
            { path: 'skills/', fn: 'loadSkills' },
        ];

        Logger.verbose(`LOAD: BUNDLE [\x1B[1;33m${bundle}\x1B[0m] START`);
        for (const feature of features) {
            const featurePath = `${bundlePath}/${feature.path}`;
            if (fs.existsSync(featurePath)) {
                (this as any)[feature.fn](bundle, featurePath);
            }
        }

        await this.loadAreas(bundle);
        await this.loadHelp(bundle);

        Logger.verbose(`ENDLOAD: BUNDLE [\x1B[1;32m${bundle}\x1B[0m]`);
    }

    /**
     * Load quest goal definitions
     * @param {string} bundle Bundle name
     * @param {string} goalsDir Path to quest goals directory
     */
    loadQuestGoals(bundle: string, goalsDir: string): void {
        Logger.verbose(`\tLOAD: Quest Goals...`);
        const files = fs.readdirSync(goalsDir);

        for (const goalFile of files) {
            const goalPath = goalsDir + goalFile;
            if (!Data.isScriptFile(goalPath, goalFile)) {
                continue;
            }

            const goalName = path.basename(goalFile, path.extname(goalFile));
            const loader = require(goalPath);
            const goalImport = QuestGoal.isPrototypeOf(loader)
                ? loader
                : loader(srcPath);
            Logger.verbose(`\t\t${goalName}`);

            this.state.QuestGoalManager.set(goalName, goalImport);
        }

        Logger.verbose(`\tENDLOAD: Quest Goals...`);
    }

    /**
     * Load quest reward definitions
     * @param {string} bundle Bundle name
     * @param {string} rewardsDir Path to quest rewards directory
     */
    loadQuestRewards(bundle: string, rewardsDir: string): void {
        Logger.verbose(`\tLOAD: Quest Rewards...`);
        const files = fs.readdirSync(rewardsDir);

        for (const rewardFile of files) {
            const rewardPath = rewardsDir + rewardFile;
            if (!Data.isScriptFile(rewardPath, rewardFile)) {
                continue;
            }

            const rewardName = path.basename(rewardFile, path.extname(rewardFile));
            const loader = require(rewardPath);
            const rewardImport = QuestReward.isPrototypeOf(loader)
                ? loader
                : loader(srcPath);
            Logger.verbose(`\t\t${rewardName}`);

            this.state.QuestRewardManager.set(rewardName, rewardImport);
        }

        Logger.verbose(`\tENDLOAD: Quest Rewards...`);
    }

    /**
     * Load attribute definitions
     * @param {string} bundle Bundle name
     * @param {string} attributesFile Path to attributes file
     */
    loadAttributes(bundle: string, attributesFile: string): void {
        Logger.verbose(`\tLOAD: Attributes...`);

        const attributes = require(attributesFile);
        const error = `\tAttributes file [${attributesFile}] from bundle [${bundle}]`;
        if (!Array.isArray(attributes)) {
            Logger.error(`${error} does not define an array of attributes`);
            return;
        }

        for (const attribute of attributes) {
            if (typeof attribute !== 'object') {
                Logger.error(`${error} not an object`);
                continue;
            }

            if (!('name' in attribute) || !('base' in attribute)) {
                Logger.error(
                    `${error} does not include required properties name and base`,
                );
                continue;
            }

            let formula = null;
            if (attribute.formula) {
                formula = new AttributeFormula(
                    attribute.formula.requires,
                    attribute.formula.fn,
                );
            }

            Logger.verbose(`\t\t-> ${attribute.name}`);

            this.state.AttributeFactory.add(
                attribute.name,
                attribute.base,
                formula,
                attribute.metadata,
            );
        }

        Logger.verbose(`\tENDLOAD: Attributes...`);
    }

    /**
     * Load/initialize player. See the Player Event guide
     * @param {string} bundle Bundle name
     * @param {string} eventsFile Event js file to load
     */
    loadPlayerEvents(bundle: string, eventsFile: string): void {
        Logger.verbose(`\tLOAD: Player Events...`);

        const loader = require(eventsFile);
        const playerListeners = this._getLoader(loader, srcPath).listeners;

        for (const [eventName, listener] of Object.entries(playerListeners)) {
            Logger.verbose(`\t\tEvent: ${eventName}`);
            this.state.PlayerManager.addListener(eventName, listener(this.state));
        }

        Logger.verbose(`\tENDLOAD: Player Events...`);
    }

    /**
     * Load areas from a bundle
     * @param {string} bundle Bundle name
     */
    async loadAreas(bundle: string): Promise<string[]> {
        Logger.verbose(`\tLOAD: Areas...`);

        const areaLoader = this.loaderRegistry.get('areas');
        areaLoader.setBundle(bundle);
        let areas: Record<string, any> = {};

        if (!(await areaLoader.hasData())) {
            return [];
        }

        areas = await areaLoader.fetchAll();

        for (const name in areas) {
            const manifest = areas[name];
            this.areas.push(name);
            await this.loadArea(bundle, name, manifest);
        }

        Logger.verbose(`\tENDLOAD: Areas`);
        return this.areas;
    }

    /**
     * Load a specific area
     * @param {string} bundle Bundle name
     * @param {string} areaName Area name
     * @param {object} manifest Area manifest data
     */
    async loadArea(
        bundle: string,
        areaName: string,
        manifest: any,
    ): Promise<void> {
        const definition: AreaDefinition = {
            bundle,
            manifest,
            quests: [],
            items: [],
            npcs: [],
            rooms: [],
        };

        const scriptPath = this._getAreaScriptPath(bundle, areaName);

        if (manifest.script) {
            const areaScriptPath = `${scriptPath}/${manifest.script}.js`;
            if (!fs.existsSync(areaScriptPath)) {
                Logger.warn(
                    `\t\t\t[${areaName}] has non-existent script "${manifest.script}"`,
                );
            }

            Logger.verbose(
                `\t\t\tLoading Area Script for [${areaName}]: ${manifest.script}`,
            );
            this.loadEntityScript(this.state.AreaFactory, areaName, areaScriptPath);
        }

        Logger.verbose(`\t\tLOAD: Quests...`);
        definition.quests = await this.loadQuests(bundle, areaName);
        Logger.verbose(`\t\tLOAD: Items...`);
        definition.items = await this.loadEntities(
            bundle,
            areaName,
            'items',
            this.state.ItemFactory,
        );
        Logger.verbose(`\t\tLOAD: NPCs...`);
        definition.npcs = await this.loadEntities(
            bundle,
            areaName,
            'npcs',
            this.state.MobFactory,
        );
        Logger.verbose(`\t\tLOAD: Rooms...`);
        definition.rooms = await this.loadEntities(
            bundle,
            areaName,
            'rooms',
            this.state.RoomFactory,
        );
        Logger.verbose('\t\tDone.');

        for (const npcRef of definition.npcs) {
            const npc = this.state.MobFactory.getDefinition(npcRef);
            if (!npc.quests) {
                continue;
            }

            // Update quest definitions with their questor
            // TODO: This currently means a given quest can only have a single questor, perhaps not optimal
            for (const qid of npc.quests) {
                const quest = this.state.QuestFactory.get(qid);
                if (!quest) {
                    Logger.error(
                        `\t\t\tError: NPC is questor for non-existent quest [${qid}]`,
                    );
                    continue;
                }
                quest.npc = npcRef;
                this.state.QuestFactory.set(qid, quest);
            }
        }

        this.state.AreaFactory.setDefinition(areaName, definition);
    }

    /**
     * Load an entity (item/npc/room) from file
     * @param {string} bundle Bundle name
     * @param {string} areaName Area name
     * @param {string} type Entity type
     * @param {EntityFactory} factory Factory instance
     * @return {Array<entityReference>} Array of entity references
     */
    async loadEntities(
        bundle: string,
        areaName: string,
        type: string,
        factory: any,
    ): Promise<string[]> {
        const loader = this.loaderRegistry.get(type);
        loader.setBundle(bundle);
        loader.setArea(areaName);

        if (!(await loader.hasData())) {
            return [];
        }

        const entities = await loader.fetchAll();
        if (!entities) {
            Logger.warn(`\t\t\t${type} has an invalid value [${entities}]`);
            return [];
        }

        const scriptPath = this._getAreaScriptPath(bundle, areaName);

        return entities.map((entity: any) => {
            const entityRef = factory.createEntityRef(areaName, entity.id);
            factory.setDefinition(entityRef, entity);
            if (entity.script) {
                const entityScript = `${scriptPath}/${type}/${entity.script}.js`;
                if (!fs.existsSync(entityScript)) {
                    Logger.warn(
                        `\t\t\t[${entityRef}] has non-existent script "${entity.script}"`,
                    );
                }
                else {
                    Logger.verbose(
                        `\t\t\tLoading Script [${entityRef}] ${entity.script}`,
                    );
                    this.loadEntityScript(factory, entityRef, entityScript);
                }
            }

            return entityRef;
        });
    }

    /**
     * Load entity scripts
     * @param {EntityFactory} factory Instance of EntityFactory that the item/npc will be loaded into
     * @param {EntityReference} entityRef Entity reference
     * @param {string} scriptPath Path to script
     */
    loadEntityScript(factory: any, entityRef: string, scriptPath: string): void {
        const loader = require(scriptPath);
        const scriptListeners = this._getLoader(loader, srcPath).listeners;

        for (const [eventName, listener] of Object.entries(scriptListeners)) {
            Logger.verbose(`\t\t\t\tEvent: ${eventName}`);
            factory.addScriptListener(entityRef, eventName, listener(this.state));
        }
    }

    /**
     * Load quests for an area
     * @param {string} bundle Bundle name
     * @param {string} areaName Area name
     * @return {Promise<Array<string>>} Array of quest references
     */
    async loadQuests(bundle: string, areaName: string): Promise<string[]> {
        const loader = this.loaderRegistry.get('quests');
        loader.setBundle(bundle);
        loader.setArea(areaName);
        let quests: any[] = [];
        try {
            quests = await loader.fetchAll();
        }
        catch (err) {}

        return quests.map((quest) => {
            Logger.verbose(`\t\t\tLoading Quest [${areaName}:${quest.id}]`);
            this.state.QuestFactory.add(areaName, quest.id, quest);
            return this.state.QuestFactory.makeQuestKey(areaName, quest.id);
        });
    }

    /**
     * Load commands for a bundle
     * @param {string} bundle Bundle name
     * @param {string} commandsDir Path to commands directory
     */
    loadCommands(bundle: string, commandsDir: string): void {
        Logger.verbose(`\tLOAD: Commands...`);
        const files = fs.readdirSync(commandsDir);

        for (const commandFile of files) {
            const commandPath = commandsDir + commandFile;
            if (!Data.isScriptFile(commandPath, commandFile)) {
                continue;
            }

            const commandName = path.basename(commandFile, path.extname(commandFile));
            const command = this.createCommand(commandPath, commandName, bundle);
            this.state.CommandManager.add(command);
        }

        Logger.verbose(`\tENDLOAD: Commands...`);
    }

    /**
     * Create a command instance
     * @param {string} commandPath Path to command file
     * @param {string} commandName Command name
     * @param {string} bundle Bundle name
     * @return {Command} Command instance
     */
    createCommand(
        commandPath: string,
        commandName: string,
        bundle: string,
    ): Command {
        const loader = require(commandPath);
        const cmdImport: CommandImport = this._getLoader(
            loader,
            srcPath,
            this.bundlesPath,
        );
        cmdImport.command = cmdImport.command(this.state);

        return new Command(bundle, commandName, cmdImport, commandPath);
    }

    /**
     * Load channels for a bundle
     * @param {string} bundle Bundle name
     * @param {string} channelsFile Path to channels file
     */
    loadChannels(bundle: string, channelsFile: string): void {
        Logger.verbose(`\tLOAD: Channels...`);

        const loader = require(channelsFile);
        let channels = this._getLoader(loader, srcPath);

        if (!Array.isArray(channels)) {
            channels = [channels];
        }

        channels.forEach((channel: any) => {
            channel.bundle = bundle;
            this.state.ChannelManager.add(channel);
        });

        Logger.verbose(`\tENDLOAD: Channels...`);
    }

    /**
     * Load help files for a bundle
     * @param {string} bundle Bundle name
     */
    async loadHelp(bundle: string): Promise<void> {
        Logger.verbose(`\tLOAD: Help...`);
        const loader = this.loaderRegistry.get('help');
        loader.setBundle(bundle);

        if (!(await loader.hasData())) {
            return;
        }

        const records = await loader.fetchAll();
        for (const helpName in records) {
            try {
                const hfile = new Helpfile(bundle, helpName, records[helpName]);

                this.state.HelpManager.add(hfile);
            }
            catch (e: any) {
                Logger.warn(`\t\t${e.message}`);
                continue;
            }
        }

        Logger.verbose(`\tENDLOAD: Help...`);
    }

    /**
     * Load input events for a bundle
     * @param {string} bundle Bundle name
     * @param {string} inputEventsDir Path to input events directory
     */
    loadInputEvents(bundle: string, inputEventsDir: string): void {
        Logger.verbose(`\tLOAD: Events...`);
        const files = fs.readdirSync(inputEventsDir);

        for (const eventFile of files) {
            const eventPath = inputEventsDir + eventFile;
            if (!Data.isScriptFile(eventPath, eventFile)) {
                continue;
            }

            const eventName = path.basename(eventFile, path.extname(eventFile));
            const loader = require(eventPath);
            const eventImport = this._getLoader(loader, srcPath);

            if (typeof eventImport.event !== 'function') {
                throw new TypeError(
                    `Bundle ${bundle} has an invalid input event '${eventName}'. Expected a function, got: ${eventImport.event}`,
                );
            }

            this.state.InputEventManager.add(
                eventName,
                eventImport.event(this.state),
            );
        }

        Logger.verbose(`\tENDLOAD: Events...`);
    }

    /**
     * Load behaviors for a bundle
     * @param {string} bundle Bundle name
     * @param {string} behaviorsDir Path to behaviors directory
     */
    loadBehaviors(bundle: string, behaviorsDir: string): void {
        Logger.verbose(`\tLOAD: Behaviors...`);

        const loadEntityBehaviors = (
            type: string,
            manager: any,
            state: GameState,
        ) => {
            const typeDir = `${behaviorsDir + type}/`;

            if (!fs.existsSync(typeDir)) {
                return;
            }

            Logger.verbose(`\t\tLOAD: BEHAVIORS [${type}]...`);
            const files = fs.readdirSync(typeDir);

            for (const behaviorFile of files) {
                const behaviorPath = typeDir + behaviorFile;
                if (!Data.isScriptFile(behaviorPath, behaviorFile)) {
                    continue;
                }

                const behaviorName = path.basename(
                    behaviorFile,
                    path.extname(behaviorFile),
                );
                Logger.verbose(`\t\t\tLOAD: BEHAVIORS [${type}] ${behaviorName}...`);
                const loader = require(behaviorPath);
                const behaviorListeners = this._getLoader(loader, srcPath).listeners;

                for (const [eventName, listener] of Object.entries(behaviorListeners)) {
                    manager.addListener(behaviorName, eventName, listener(state));
                }
            }
        };

        loadEntityBehaviors('area', this.state.AreaBehaviorManager, this.state);
        loadEntityBehaviors('npc', this.state.MobBehaviorManager, this.state);
        loadEntityBehaviors('item', this.state.ItemBehaviorManager, this.state);
        loadEntityBehaviors('room', this.state.RoomBehaviorManager, this.state);

        Logger.verbose(`\tENDLOAD: Behaviors...`);
    }

    /**
     * Load effects for a bundle
     * @param {string} bundle Bundle name
     * @param {string} effectsDir Path to effects directory
     */
    loadEffects(bundle: string, effectsDir: string): void {
        Logger.verbose(`\tLOAD: Effects...`);
        const files = fs.readdirSync(effectsDir);

        for (const effectFile of files) {
            const effectPath = effectsDir + effectFile;
            if (!Data.isScriptFile(effectPath, effectFile)) {
                continue;
            }

            const effectName = path.basename(effectFile, path.extname(effectFile));
            const loader = require(effectPath);

            Logger.verbose(`\t\t${effectName}`);
            this.state.EffectFactory.add(
                effectName,
                this._getLoader(loader, srcPath),
                this.state,
            );
        }

        Logger.verbose(`\tENDLOAD: Effects...`);
    }

    /**
     * Load skills for a bundle
     * @param {string} bundle Bundle name
     * @param {string} skillsDir Path to skills directory
     */
    loadSkills(bundle: string, skillsDir: string): void {
        Logger.verbose(`\tLOAD: Skills...`);
        const files = fs.readdirSync(skillsDir);

        for (const skillFile of files) {
            const skillPath = skillsDir + skillFile;
            if (!Data.isScriptFile(skillPath, skillFile)) {
                continue;
            }

            const skillName = path.basename(skillFile, path.extname(skillFile));
            const loader = require(skillPath);
            const skillImport = this._getLoader(loader, srcPath);
            if (skillImport.run) {
                skillImport.run = skillImport.run(this.state);
            }

            Logger.verbose(`\t\t${skillName}`);
            const skill = new Skill(skillName, skillImport, this.state);

            if (skill.type === SkillType.SKILL) {
                this.state.SkillManager.add(skill);
            }
            else {
                this.state.SpellManager.add(skill);
            }
        }

        Logger.verbose(`\tENDLOAD: Skills...`);
    }

    /**
     * Load server events for a bundle
     * @param {string} bundle Bundle name
     * @param {string} serverEventsDir Path to server events directory
     */
    loadServerEvents(bundle: string, serverEventsDir: string): void {
        Logger.verbose(`\tLOAD: Server Events...`);
        const files = fs.readdirSync(serverEventsDir);

        for (const eventsFile of files) {
            const eventsPath = serverEventsDir + eventsFile;
            if (!Data.isScriptFile(eventsPath, eventsFile)) {
                continue;
            }

            const eventsName = path.basename(eventsFile, path.extname(eventsFile));
            Logger.verbose(`\t\t\tLOAD: SERVER-EVENTS ${eventsName}...`);
            const loader = require(eventsPath);
            const eventsListeners = this._getLoader(loader, srcPath).listeners;

            for (const [eventName, listener] of Object.entries(eventsListeners)) {
                this.state.ServerEventManager.add(eventName, listener(this.state));
            }
        }

        Logger.verbose(`\tENDLOAD: Server Events...`);
    }

    /**
     * For a given bundle js file require check if it needs to be backwards compatibly loaded with a loader(srcPath)
     * or can just be loaded on its own
     * @private
     * @param {Function | object | Array} loader Loader function or object
     * @param {...any} args Arguments to pass to the loader function
     * @return {any} Loaded content
     */
    _getLoader(loader: any, ...args: any[]): any {
        if (typeof loader === 'function') {
            // backwards compatible for old module loader(srcPath)
            return loader(...args);
        }

        return loader;
    }

    /**
     * Get the script path for an area
     * @private
     * @param {string} bundle Bundle name
     * @param {string} areaName Area name
     * @return {string} Path to area scripts
     */
    _getAreaScriptPath(bundle: string, areaName: string): string {
        return `${this.bundlesPath}/${bundle}/areas/${areaName}/scripts`;
    }
}
