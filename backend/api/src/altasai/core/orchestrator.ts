import { z } from 'zod';
import { buildMentorPlan } from '../pipelines/mentorPlanner';
import { generateReportInsight } from '../pipelines/reportInsightGenerator';
import type { AltasAIContext, InternalAIResult, MentorResponsePlan } from './types';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { buildFeatures, buildUserStateVector } from '../feature-store/featureBuilder';
import { classifyIntent } from '../nlp/intentClassifier';
import { extractEntities } from '../nlp/entityExtractor';
import { classifyProductivityState } from '../models/productivityStateClassifier';
import { rankTasks } from '../models/taskPriorityRanking';
import { predictDeadlineRisk } from '../models/deadlineRiskRegression';
import { predictFocusPerformance } from '../models/focusPerformancePrediction';
import { assessBurnoutRisk } from '../models/burnoutRiskModel';
import { predictGoalProgress } from '../models/goalProgressPrediction';
import { scoreHabitConsistency } from '../models/habitConsistencyModel';
import { analyzeFinancePatterns } from '../models/financePatternModel';
import { analyzeHealthHabits } from '../models/healthHabitPatternModel';
import { assessSecurityAwareness } from '../models/securityAwarenessModel';
import { detectAnomalies } from '../models/anomalyDetectionModel';
import { generateCortexInsight } from '../models/cortexInsightEngine';
import { runSafetyGuardrail } from '../models/safetyGuardrailModel';
import { mlServiceClient } from '../clients/mlServiceClient';

const enhancedMentorSchema = z.object({
  response: z.string().min(1).max(2400),
  tone: z.string().default('strict'),
  nextActions: z.array(z.string()).max(5).default([]),
});

export interface MentorOrchestrationResult {
  plan: MentorResponsePlan;
  response: string;
  tone: string;
  nextActions: string[];
  provider: 'internal' | 'gemini';
  offline: boolean;
}

export interface AltasAIOrchestrationResult {
  intent: ReturnType<typeof classifyIntent>;
  entities: ReturnType<typeof extractEntities>;
  features: ReturnType<typeof buildFeatures>;
  userStateVector: ReturnType<typeof buildUserStateVector>;
  productivityState: ReturnType<typeof classifyProductivityState>;
  rankedTasks: ReturnType<typeof rankTasks>;
  deadlineRisk: ReturnType<typeof predictDeadlineRisk>;
  focusPrediction: ReturnType<typeof predictFocusPerformance>;
  burnoutRisk: ReturnType<typeof assessBurnoutRisk>;
  goalProgress: ReturnType<typeof predictGoalProgress>;
  habitConsistency: ReturnType<typeof scoreHabitConsistency>;
  financePattern: ReturnType<typeof analyzeFinancePatterns>;
  healthHabitPattern: ReturnType<typeof analyzeHealthHabits>;
  securityAwareness: ReturnType<typeof assessSecurityAwareness>;
  anomalies: ReturnType<typeof detectAnomalies>;
  cortexInsight: ReturnType<typeof generateCortexInsight>;
  safety: ReturnType<typeof runSafetyGuardrail>;
}

export const runAltasAIOrchestrator = (context: AltasAIContext): AltasAIOrchestrationResult => {
  const message = context.message ?? '';
  const now = context.now ?? new Date();
  const features = buildFeatures(context.memory, now);
  const userStateVector = buildUserStateVector(features);
  const rankedTasks = rankTasks(context.memory.tasks, now);
  const productivityState = classifyProductivityState(features, userStateVector);
  const deadlineRisk = predictDeadlineRisk(features);
  const focusPrediction = predictFocusPerformance(features, rankedTasks, now);
  const burnoutRisk = assessBurnoutRisk(features);
  const goalProgress = predictGoalProgress(features);
  const habitConsistency = scoreHabitConsistency(features);
  const financePattern = analyzeFinancePatterns(context.memory.expenses ?? []);
  const healthHabitPattern = analyzeHealthHabits(context.memory.healthLogs ?? []);
  const securityAwareness = assessSecurityAwareness(message);
  const anomalies = detectAnomalies(features);
  const modelResults: Array<InternalAIResult<string>> = [
    productivityState,
    deadlineRisk,
    focusPrediction,
    burnoutRisk,
    goalProgress,
    habitConsistency,
    financePattern,
    healthHabitPattern,
    securityAwareness,
    ...anomalies,
  ];

  return {
    intent: classifyIntent(message),
    entities: extractEntities(message, now),
    features,
    userStateVector,
    productivityState,
    rankedTasks,
    deadlineRisk,
    focusPrediction,
    burnoutRisk,
    goalProgress,
    habitConsistency,
    financePattern,
    healthHabitPattern,
    securityAwareness,
    anomalies,
    cortexInsight: generateCortexInsight(userStateVector, modelResults),
    safety: runSafetyGuardrail(message),
  };
};

export const runAltasAIOrchestratorWithML = async (context: AltasAIContext) => {
  const internal = runAltasAIOrchestrator(context);
  const message = context.message ?? '';
  const ml = {
    intent: message ? await mlServiceClient.predictIntent(message) : { ok: false, fallbackReason: 'No message supplied' },
    entities: message ? await mlServiceClient.predictEntities(message) : { ok: false, fallbackReason: 'No message supplied' },
    recommendation: await mlServiceClient.recommendAction(context.userId, {
      tasks: context.memory.tasks,
      goals: context.memory.goals,
      focusSessions: context.memory.focusSessions,
      reflections: context.memory.reflections,
    }),
  };

  return {
    ...internal,
    mlService: {
      used: Object.values(ml).some((result) => result.ok),
      fallbackUsed: Object.values(ml).some((result) => !result.ok),
      intent: ml.intent.ok ? ml.intent.data : internal.intent,
      entities: ml.entities.ok ? ml.entities.data : internal.entities,
      recommendation: ml.recommendation.ok ? ml.recommendation.data : undefined,
      fallbackReasons: Object.values(ml)
        .filter((result) => !result.ok)
        .map((result) => result.fallbackReason)
        .filter(Boolean),
    },
  };
};

const buildEnhancementPrompt = (message: string, plan: MentorResponsePlan): string => `
You are only improving wording for an AltasAI internal mentor plan.
Do not change the diagnosis, recommendations, priority, or safety constraints.

User message:
${message}

Internal plan:
${JSON.stringify(plan).slice(0, 7000)}

Return only:
{"response":"clear mentor response using the internal plan","tone":"strict","nextActions":[""]}
`;

export const runMentorOrchestration = async (
  context: AltasAIContext,
  options: { enhanceWithGemini?: boolean } = {}
): Promise<MentorOrchestrationResult> => {
  const orchestration = runAltasAIOrchestrator(context);
  const plan = buildMentorPlan(context, orchestration);
  const internal = {
    response: plan.fallbackResponse,
    tone: plan.adviceType === 'support' ? 'calm' : 'strict',
    nextActions: plan.recommendations.map((recommendation) => recommendation.action),
  };

  if (!options.enhanceWithGemini || !context.message) {
    return { plan, ...internal, provider: 'internal', offline: true };
  }

  const model = await generateGeminiText({
    systemInstruction: [
      'You are AltasAI wording enhancer.',
      'The internal AltasAI plan is authoritative.',
      'Return valid JSON only.',
    ].join('\n'),
    prompt: buildEnhancementPrompt(context.message, plan),
    maxOutputTokens: 650,
    temperature: 0.35,
  });

  if (model.offline) {
    return { plan, ...internal, provider: 'internal', offline: true };
  }

  const parsed = parseJsonWithSchema(model.text, enhancedMentorSchema, internal);
  return {
    plan,
    response: parsed.response ?? internal.response,
    tone: parsed.tone ?? internal.tone,
    nextActions: parsed.nextActions?.length ? parsed.nextActions : internal.nextActions,
    provider: 'gemini',
    offline: false,
  };
};

export const runReportInsight = generateReportInsight;
