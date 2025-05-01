import type QuestReward from './QuestReward.js';

/**
 * Simple map of quest reward name => class instance
 */
class QuestRewardManager extends Map<string, typeof QuestReward> {}

export default QuestRewardManager;
