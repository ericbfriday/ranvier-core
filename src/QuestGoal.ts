import type { Player } from './Player.js';
import type { Quest } from './Quest.js';
import { EventEmitter } from 'node:events';

export interface QuestProgress {
    percent: number
    display: string
}

/**
 * Representation of a goal of a quest.
 * The {@link http://ranviermud.com/extending/areas/quests/|Quest guide} has instructions on to
 * create new quest goals for quests
 * @extends EventEmitter
 */
abstract class QuestGoal extends EventEmitter {
    config: Record<string, any>;
    quest: Quest;
    state: Record<string, any>;
    player: Player;

    /**
     * @param {Quest} quest Quest this goal is for
     * @param {object} config
     * @param {Player} player
     */
    constructor(quest: Quest, config: Record<string, any>, player: Player) {
        super();

        this.config = Object.assign(
            {
                // no defaults currently
            },
            config,
        );
        this.quest = quest;
        this.state = {};
        this.player = player;
    }

    /**
     * @return {{ percent: number, display: string}}
     */
    getProgress(): QuestProgress {
        return {
            percent: 0,
            display:
        '[WARNING] Quest does not have progress display configured. Please tell an admin',
        };
    }

    /**
     * Put any cleanup activities after the quest is finished here
     */
    complete(): void {}

    serialize(): {
        state: Record<string, any>
        progress: QuestProgress
        config: Record<string, any>
    } {
        return {
            state: this.state,
            progress: this.getProgress(),
            config: this.config,
        };
    }

    hydrate(state: Record<string, any>): void {
        this.state = state;
    }
}

export default QuestGoal;
