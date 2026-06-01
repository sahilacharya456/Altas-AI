import {
  analyzeFinancePatterns,
  analyzeHealthHabits,
  analyzeProductivityPatterns,
  analyzeReflectionText,
  assessBurnoutRisk,
  buildFeatures,
  buildMentorPlan,
  buildUserStateVector,
  classifyIntent,
  classifyProductivityState,
  detectAnomalies,
  extractEntities,
  generateCortexInsight,
  predictDeadlineRisk,
  predictFocusPerformance,
  predictGoalProgress,
  rankTasks,
  recommendInterventions,
  runAltasAIOrchestrator,
  runReportInsight,
  runSafetyGuardrail,
  scoreHabitConsistency,
} from '../altasai';
import type { SafeUserMemory } from '../services/memory';

const memory: SafeUserMemory = {
  profile: { displayName: 'Sahil', disciplineLevel: 'strict', scores: { discipline: 54 } },
  tasks: [
    { title: 'Finish FYP report', status: 'pending', priority: 'critical', scheduledDate: new Date(Date.now() - 60_000), carryCount: 1, isCarried: true },
    { title: 'Record demo', status: 'completed', priority: 'high', scheduledDate: new Date() },
    { title: 'Clean project', status: 'pending', priority: 'high', scheduledDate: new Date() },
  ],
  goals: [{ title: 'Launch portfolio', status: 'active', progress: 10 }],
  reflections: [{ honestAssessment: 'I wasted time scrolling and felt stressed.' }],
  focusSessions: [{ durationMinutes: 25, status: 'completed', createdAt: new Date() }],
  expenses: [{ amount: 500, category: 'food', createdAt: new Date() }],
  healthLogs: [{ routineScore: 42, energyLevel: 2, createdAt: new Date() }],
  digitalUsage: [{ screenMinutes: 420, goalMinutes: 180, createdAt: new Date() }],
  securityEvents: [{ severity: 'high', type: 'suspicious_url', createdAt: new Date() }],
  cortexRisk: null,
  behaviorEvents: [],
};

describe('AltasAI internal intelligence', () => {
  test('classifies project-specific intents from local rules and examples', () => {
    expect(classifyIntent('start focus for 25 minutes').label).toBe('start_focus');
    expect(classifyIntent('show my weekly progress').label).toBe('generate_report');
    expect(classifyIntent('scan this suspicious login link').label).toBe('security_check');
  });

  test('extracts task, deadline, priority, duration, and money entities', () => {
    const entities = extractEntities('remind me to finish my FYP report tomorrow at 9 with high priority');
    expect(entities.some((entity) => entity.type === 'taskTitle' && String(entity.value).includes('finish my FYP report'))).toBe(true);
    expect(entities.some((entity) => entity.type === 'deadline')).toBe(true);
    expect(entities.some((entity) => entity.type === 'priority' && entity.value === 'high')).toBe(true);

    const money = extractEntities('I spent 500 rupees today');
    expect(money.some((entity) => entity.type === 'moneyAmount' && entity.value === 500)).toBe(true);
  });

  test('analyzes reflection sentiment, blockers, and themes', () => {
    const result = analyzeReflectionText('I wasted the day scrolling but completed one small task.');
    expect(result.sentiment).toBe('neutral');
    expect(result.blockers).toContain('scrolling');
    expect(result.themes).toContain('digital_distraction');
  });

  test('detects explainable productivity patterns and recommendations', () => {
    const patterns = analyzeProductivityPatterns({ userId: 'u1', message: 'I am stressed because I have too many tasks', memory });
    expect(patterns.map((pattern) => pattern.label)).toContain('overloaded_task_list');
    const recommendations = recommendInterventions(patterns);
    expect(recommendations[0].reason).toBeTruthy();
    expect(recommendations[0].triggeredBy.length).toBeGreaterThan(0);
  });

  test('builds mentor plan without external Gemini', () => {
    const plan = buildMentorPlan({ userId: 'u1', message: 'what should I do next?', memory });
    expect(['ask_next_action', 'ask_productivity_advice']).toContain(plan.intent.label);
    expect(plan.fallbackResponse).toContain('Move:');
    expect(plan.recommendations.length).toBeGreaterThan(0);
  });

  test('generates non-static report insight from user data', () => {
    const insight = runReportInsight(memory);
    expect(insight.summary).toContain('Completed 1/3');
    expect(insight.bestNextAction).toBeTruthy();
    expect(insight.biggestBlocker).toMatch(/Carried tasks|deadline|overdue|risk/i);
  });

  test('builds user state vector from real user features', () => {
    const features = buildFeatures(memory);
    const vector = buildUserStateVector(features);
    expect(vector.productivityScore).toBeGreaterThanOrEqual(0);
    expect(vector.workloadScore).toBeGreaterThan(0);
    expect(vector.burnoutRiskScore).toBeGreaterThan(0);
  });

  test('runs productivity, risk, focus, burnout, and goal models', () => {
    const features = buildFeatures(memory);
    const vector = buildUserStateVector(features);
    const tasks = rankTasks(memory.tasks);
    expect(classifyProductivityState(features, vector).label).toBeTruthy();
    expect(predictDeadlineRisk(features).score).toBeGreaterThan(0);
    expect(predictFocusPerformance(features, tasks).recommendedDuration).toBeGreaterThan(0);
    expect(assessBurnoutRisk(features).recommendation).toBeTruthy();
    expect(predictGoalProgress(features).progressScore).toBeGreaterThanOrEqual(0);
    expect(scoreHabitConsistency(features).weakPoints.length).toBeGreaterThanOrEqual(0);
  });

  test('runs finance, health, anomaly, safety, and cortex models', () => {
    const features = buildFeatures(memory);
    const vector = buildUserStateVector(features);
    const deadlineRisk = predictDeadlineRisk(features);
    const anomalies = detectAnomalies(features);
    expect(analyzeFinancePatterns(memory.expenses).label).toBeTruthy();
    expect(analyzeHealthHabits(memory.healthLogs).label).toBeTruthy();
    expect(runSafetyGuardrail('How do I hack an account?').safetyLabel).toBe('offensive_cybersecurity');
    expect(generateCortexInsight(vector, [deadlineRisk, ...anomalies]).bestNextAction).toBeTruthy();
  });

  test('runs full AltasAI orchestrator before any external AI provider', () => {
    const result = runAltasAIOrchestrator({ userId: 'u1', message: 'I feel distracted and stressed, what should I do next?', memory });
    expect(result.intent.label).not.toBe('unknown');
    expect(result.userStateVector.executionReadinessScore).toBeGreaterThanOrEqual(0);
    expect(result.cortexInsight.topInsight).toBeTruthy();
    expect(result.safety.safetyLabel).toBe('allowed');
  });
});
