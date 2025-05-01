import type GameState from './GameState.js';
import type { Player } from './Player.js';
import type Quest from './Quest.js';

/**
 * Representation of a quest reward
 * The {@link http://ranviermud.com/extending/areas/quests/|Quest guide} has instructions on to
 * create new reward type for quests
 */
abstract class QuestReward {
    /**
     * Assign the reward to the player
     * @param {GameState} GameState
     * @param {Quest} quest   quest this reward is being given from
     * @param {object} config
     * @param {Player} player
     */
    static reward(
        GameState: GameState,
        quest: Quest,
        config: Record<string, any>,
        player: Player,
    ): void {
        throw new Error('Quest reward not implemented');
    }

    /**
     * Render the reward
     * @return string
     */
    static display(
        GameState: GameState,
        quest: Quest,
        config: Record<string, any>,
        player: Player,
    ): string {
        throw new Error('Quest reward display not implemented');
    }
}

export default QuestReward;
