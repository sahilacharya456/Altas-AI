import { z } from 'zod';
import { buildMentorPlan } from '../pipelines/mentorPlanner';
import { generateReportInsight } from '../pipelines/reportInsightGenerator';
import type { AltasAIContext, InternalAIResult, MentorResponsePlan } from './types';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { buildClientContextBlock, buildContextTypePreamble, buildDisciplineInstruction, systemBase } from '../../services/prompts';
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
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';

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

const buildConversationBlock = (history: AltasAIContext['conversationHistory']): string => {
  if (!history?.length) return '';
  const turns = history
    .map((t) => `${t.role === 'user' ? 'User' : 'ATLAS'}: ${t.content}`)
    .join('\n');
  return `CONVERSATION HISTORY (most recent ${history.length} turns):\n${turns}`;
};

const buildEnhancementPrompt = (context: AltasAIContext, plan: MentorResponsePlan): string => {
  const disciplineVoice = buildDisciplineInstruction(context.memory?.profile?.disciplineLevel as string | undefined);
  const contextPreamble = buildContextTypePreamble(context.contextType);
  const clientBlock = buildClientContextBlock(context.clientContext);
  const historyBlock = buildConversationBlock(context.conversationHistory);

  return `
The internal AltasAI plan below is authoritative. Your only job is to write the mentor response text.
Do NOT change the diagnosis, recommendations, priority, or safety constraints.
Max 180 words.

${disciplineVoice}
${contextPreamble ? `\nSession context: ${contextPreamble}` : ''}
${clientBlock ? `\n${clientBlock}` : ''}
${historyBlock ? `\n${historyBlock}` : ''}

User message:
${context.message}

Internal plan:
${JSON.stringify(plan).slice(0, 6400)}

Return only:
{"response":"ATLAS mentor response that is aware of the conversation history and grounded in the plan","tone":"strict","nextActions":["concrete action 1","concrete action 2"]}
`.trim();
};

export const runMentorOrchestration = async (
  context: AltasAIContext,
  options: { enhanceWithGemini?: boolean; useML?: boolean } = {}
): Promise<MentorOrchestrationResult> => {
  if (!isProjectScopedInput(context.message)) {
    return {
      plan: {
        intent: { label: 'unknown', confidence: 1, reasons: [OUT_OF_CONTEXT_RESPONSE] },
        entities: [],
        patterns: [],
        recommendations: [],
        userState: OUT_OF_CONTEXT_RESPONSE,
        adviceType: 'support',
        safetyConstraints: ['Only answer within the AltasAI project domain.'],
        responseStructure: ['refusal'],
        fallbackResponse: OUT_OF_CONTEXT_RESPONSE,
      },
      response: OUT_OF_CONTEXT_RESPONSE,
      tone: 'strict',
      nextActions: [],
      provider: 'internal',
      offline: true,
    };
  }

  // Use ML-enhanced orchestration for the mentor (better intent + personalized recommendation)
  const mlResult = options.useML !== false ? await runAltasAIOrchestratorWithML(context) : null;
  const orchestration = mlResult ?? runAltasAIOrchestrator(context);

  // If ML provided a better intent, use it
  if (mlResult?.mlService?.intent && mlResult.mlService.used) {
    const mlIntent = mlResult.mlService.intent as { label?: string; confidence?: number };
    if (mlIntent.label && mlIntent.label !== 'unknown') {
      orchestration.intent = {
        label: mlIntent.label as typeof orchestration.intent.label,
        confidence: mlIntent.confidence ?? orchestration.intent.confidence,
        reasons: orchestration.intent.reasons,
      };
    }
  }
  const plan = buildMentorPlan(context, orchestration);
  const internal = {
    response: plan.fallbackResponse,
    tone: plan.adviceType === 'support' ? 'calm' : 'strict',
    nextActions: plan.recommendations.map((recommendation) => recommendation.action),
  };

  if (!options.enhanceWithGemini || !context.message) {
    return { plan, ...internal, provider: 'internal', offline: false };
  }

  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: buildEnhancementPrompt(context, plan),
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
