import type { SafeUserMemory } from '../../services/memory';
import { buildFeatures, buildUserStateVector } from '../feature-store/featureBuilder';
import { rankTasks } from '../models/taskPriorityRanking';
import { detectAnomalies } from '../models/anomalyDetectionModel';
import { generateCortexInsight } from '../models/cortexInsightEngine';
import { predictDeadlineRisk } from '../models/deadlineRiskRegression';

export interface ReportInsight {
  productivityScore: number;
  focusScore: number;
  consistencyScore: number;
  goalProgressScore: number;
  strongestPattern: string;
  biggestBlocker: string;
  bestNextAction: string;
  summary: string;
  strongestPatternEvidence: string[];
}

export const generateReportInsight = (memory: SafeUserMemory): ReportInsight => {
  const features = buildFeatures(memory);
  const vector = buildUserStateVector(features);
  const rankedTasks = rankTasks(memory.tasks);
  const deadlineRisk = predictDeadlineRisk(features);
  const anomalies = detectAnomalies(features);
  const cortex = generateCortexInsight(vector, [deadlineRisk, ...anomalies]);
  const totalTasks = memory.tasks.length;
  const completedTasks = memory.tasks.filter((task) => String(task.status) === 'completed').length;
  const carriedTasks = memory.tasks.filter((task) => Boolean(task.isCarried) || Number(task.carryCount ?? 0) > 0).length;
  const goals = memory.goals;
  const avgGoalProgress = goals.length
    ? goals.reduce((sum, goal) => sum + Number(goal.progress ?? 0), 0) / goals.length
    : 0;
  const reflections = memory.reflections.length;

  const productivityScore = vector.productivityScore || (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 45);
  const focusScore = vector.focusScore;
  const consistencyScore = vector.consistencyScore;
  const goalProgressScore = vector.goalProgressScore || Math.round(Math.max(0, Math.min(100, avgGoalProgress || 40)));
  const strongestPattern = anomalies[0]?.label ?? (carriedTasks > 0 ? 'carry_debt' : completedTasks >= 3 ? 'execution_momentum' : 'planning_gap');
  const biggestBlocker = deadlineRisk.score >= 65 ? deadlineRisk.recommendation : carriedTasks > 0 ? 'Carried tasks are creating execution debt.' : totalTasks === 0 ? 'No task signal exists yet.' : 'Context switching risk.';
  const bestNextAction = cortex.bestNextAction || (rankedTasks[0]
    ? rankedTasks[0].nextAction
    : carriedTasks > 0
    ? 'Clear or rescope the oldest carried task.'
    : totalTasks === 0
      ? 'Create one high-impact task for today.'
      : 'Start a short focus block on the highest-priority task.');

  return {
    productivityScore,
    focusScore,
    consistencyScore,
    goalProgressScore,
    strongestPattern,
    biggestBlocker,
    bestNextAction,
    summary: `Completed ${completedTasks}/${totalTasks} current tasks. ${biggestBlocker} ${bestNextAction}`,
    strongestPatternEvidence: [
      `deadlineRisk=${deadlineRisk.score}`,
      `workload=${features.workloadScore}`,
      `readiness=${vector.executionReadinessScore}`,
    ],
  };
};
