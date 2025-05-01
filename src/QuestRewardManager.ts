import type QuestReward from './QuestReward.js';

/**
 * Simple map of quest reward name => class instance
 */
export class QuestRewardManager extends Map<string, typeof QuestReward> {}

export default QuestRewardManager;
