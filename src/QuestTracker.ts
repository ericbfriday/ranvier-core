import type { GameState } from './GameState';
import type { Player } from './Player';
import type { Quest } from './Quest';

interface CompletedQuest {
    started: string
    completedAt: string
}

/**
 * Keeps track of player quest progress
 *
 * @property {Player} player
 * @property {Map}    completedQuests
 * @property {Map}    activeQuests
 */
class QuestTracker {
    player: Player;
    activeQuests: Map<string, Quest>;
    completedQuests: Map<string, CompletedQuest>;

    /**
     * @param {Player} player
     * @param {Array}  active
     * @param {Array}  completed
     */
    constructor(
        player: Player,
        active: [string, Quest][],
        completed: [string, CompletedQuest][],
    ) {
        this.player = player;

        this.activeQuests = new Map(active);
        this.completedQuests = new Map(completed);
    }

    /**
     * Proxy events to all active quests
     * @param {string} event
     * @param {...*}   args
     */
    emit(event: string, ...args: any[]): void {
        for (const [_qid, quest] of this.activeQuests) {
            quest.emit(event, ...args);
        }
    }

    /**
     * @param {string} qid
     * @return {boolean}
     */
    isActive(qid: string): boolean {
        return this.activeQuests.has(qid);
    }

    /**
     * @param {string} qid
     * @return {boolean}
     */
    isComplete(qid: string): boolean {
        return this.completedQuests.has(qid);
    }

    get(qid: string): Quest | undefined {
        return this.activeQuests.get(qid);
    }

    /**
     * @param {string} qid
     */
    complete(qid: string): void {
        if (!this.isActive(qid)) {
            throw new Error('Quest not started');
        }

        const quest = this.activeQuests.get(qid)!;

        this.completedQuests.set(qid, {
            started: quest.started,
            completedAt: new Date().toJSON(),
        });

        this.activeQuests.delete(qid);
    }

    /**
     * @param {Quest} quest
     */
    start(quest: Quest): void {
        const qid = quest.entityReference;
        if (this.activeQuests.has(qid)) {
            throw new Error('Quest already started');
        }

        quest.started = new Date().toJSON();
        this.activeQuests.set(qid, quest);
        quest.emit('start');
    }

    /**
     * @param {GameState} state
     * @param {object}    questData Data pulled from the pfile
     */
    hydrate(state: GameState): void {
        for (const [qid, data] of this.activeQuests) {
            const quest = state.QuestFactory.create(
                state,
                qid,
                this.player,
                data.state,
            );
            quest.started = data.started;
            quest.hydrate();

            this.activeQuests.set(qid, quest);
        }
    }

    /**
     * @return {object}
     */
    serialize(): {
        completed: [string, CompletedQuest][]
        active: [string, any][]
    } {
        return {
            completed: [...this.completedQuests],
            active: [...this.activeQuests].map(([qid, quest]) => [
                qid,
                quest.serialize(),
            ]),
        };
    }
}

export default QuestTracker;
