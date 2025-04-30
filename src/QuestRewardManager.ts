import type QuestReward from './QuestReward'

/**
 * Simple map of quest reward name => class instance
 */
class QuestRewardManager extends Map<string, typeof QuestReward> {}

export default QuestRewardManager
