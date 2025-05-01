import type QuestGoal from './QuestGoal.js';

/**
 * Simple map of quest goal name => class definition
 */
export class QuestGoalManager extends Map<string, typeof QuestGoal> {}

export default QuestGoalManager;
