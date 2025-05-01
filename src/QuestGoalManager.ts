import type QuestGoal from './QuestGoal.js';

/**
 * Simple map of quest goal name => class definition
 */
class QuestGoalManager extends Map<string, typeof QuestGoal> {}

export default QuestGoalManager;
