import { db, Timestamp } from '../lib/firebaseAdmin';
import { logger } from '../utils/logger';
import { mlServiceClient } from '../altasai/clients/mlServiceClient';
import { detectGhostTasks, type GhostTaskSummary } from './ghostTask';

export interface ReflectionAnalysis {
  sentimentScore: number;
  emotionLabels: string[];
  stressScore: number;
  motivationScore: number;
  confidenceScore: number;
  burnoutRiskSignal: number;
  blockers: string[];
  wins: string[];
  themes: string[];
  recommendedIntervention: string;
}

export interface SafeUserMemory {
  profile: {
    displayName?: string;
    disciplineLevel?: string;
    scores?: unknown;
  } | null;
  tasks: Array<Record<string, unknown>>;
  goals: Array<Record<string, unknown>>;
  reflections: Array<Record<string, unknown>>;
  focusSessions: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  healthLogs: Array<Record<string, unknown>>;
  digitalUsage: Array<Record<string, unknown>>;
  securityEvents: Array<Record<string, unknown>>;
  cortexRisk: Record<string, unknown> | null;
  behaviorEvents: Array<Record<string, unknown>>;
  ragContext?: string;
  reflectionAnalysis?: ReflectionAnalysis;
  ghostTasks?: GhostTaskSummary;
}

const compactDoc = (data: Record<string, unknown>): Record<string, unknown> => {
  const copy = { ...data };
  delete copy.userId;
  delete copy.email;
  delete copy.rawPrompt;
  delete copy.rawResponse;
  return copy;
};

// Firestore query errors (missing index, permission denied, network) must not
// crash the entire AI pipeline. Each collection is fetched independently with
// a catch so partial failures degrade gracefully instead of blocking all routes.
export const retrieveSafeMemory = async (userId: string): Promise<SafeUserMemory> => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [
    profileDoc,
    tasksSnapshot,
    goalsSnapshot,
    logsSnapshot,
    focusSnapshot,
    expensesSnapshot,
    healthSnapshot,
    digitalSnapshot,
    securitySnapshot,
    cortexDoc,
    eventsSnapshot,
  ] = await Promise.all([
    db.doc(`users/${userId}/profile/data`).get()
      .catch((e) => { logger.warn('memory.profile_fetch_failed', { userId, error: String(e) }); return null; }),
    db.collection(`users/${userId}/tasks`)
      .where('scheduledDate', '>=', Timestamp.fromDate(start))
      .where('scheduledDate', '<', Timestamp.fromDate(end))
      .limit(12)
      .get()
      .catch((e) => { logger.warn('memory.tasks_fetch_failed', { userId, error: String(e) }); return null; }),
    db.collection(`users/${userId}/goals`).where('status', '==', 'active').limit(8).get()
      .catch((e) => { logger.warn('memory.goals_fetch_failed', { userId, error: String(e) }); return null; }),
    db.collection(`users/${userId}/dailyLogs`)
      .where('date', '>=', Timestamp.fromDate(twoWeeksAgo))
      .orderBy('date', 'desc')
      .limit(7)
      .get()
      .catch((e) => { logger.warn('memory.logs_fetch_failed', { userId, error: String(e) }); return null; }),
    db.collection(`users/${userId}/focusSessions`).orderBy('createdAt', 'desc').limit(12).get().catch(() => null),
    db.collection(`users/${userId}/expenses`).orderBy('createdAt', 'desc').limit(20).get().catch(() => null),
    db.collection(`users/${userId}/healthLogs`).orderBy('createdAt', 'desc').limit(10).get().catch(() => null),
    db.collection(`users/${userId}/digitalUsage`).orderBy('createdAt', 'desc').limit(10).get().catch(() => null),
    db.collection(`users/${userId}/securityEvents`).orderBy('createdAt', 'desc').limit(10).get().catch(() => null),
    db.doc(`users/${userId}/cortex/riskState`).get()
      .catch((e) => { logger.warn('memory.cortex_fetch_failed', { userId, error: String(e) }); return null; }),
    db.collection(`users/${userId}/behaviorEvents`).orderBy('createdAt', 'desc').limit(8).get()
      .catch(() => null),
  ]);

  const profileData = profileDoc && 'exists' in profileDoc && profileDoc.exists ? profileDoc.data() : null;

  const tasks = tasksSnapshot ? tasksSnapshot.docs.map((doc) => compactDoc(doc.data())) : [];
  const goals = goalsSnapshot ? goalsSnapshot.docs.map((doc) => compactDoc(doc.data())) : [];
  const reflections = logsSnapshot ? logsSnapshot.docs.map((doc) => compactDoc(doc.data())) : [];
  const behaviorEvents = eventsSnapshot ? eventsSnapshot.docs.map((doc) => compactDoc(doc.data())) : [];

  // Build reflection text for ML analysis
  const reflectionText = reflections
    .map((r) => [r.notes, r.wins, r.wentWell, r.wentWrong, r.missedReason].filter(Boolean).join(' '))
    .join(' ')
    .trim()
    .slice(0, 3000);

  // Run ML reflection analysis + RAG index+query + Ghost Task detection in parallel (non-blocking)
  const [reflectionAnalysis, ghostTasks, ragContext] = await Promise.all([
    reflectionText
      ? mlServiceClient.analyzeReflection(reflectionText)
          .then((r) => r.ok ? r.data : undefined)
          .catch(() => undefined)
      : Promise.resolve(undefined),

    // Ghost task detection — runs independently of ML service
    detectGhostTasks(userId).catch(() => undefined),

    (async () => {
      // Index user's memory into their personal RAG store
      const ragDocuments = [
        ...reflections.map((r, i) => ({
          id: `reflection-${i}`,
          text: [r.notes, r.wins, r.wentWell, r.wentWrong, r.missedReason].filter(Boolean).join(' '),
          metadata: { type: 'reflection', date: String(r.date ?? '') },
        })),
        ...goals.map((g, i) => ({
          id: `goal-${i}`,
          text: `${String(g.title ?? '')} ${String(g.description ?? '')}`.trim(),
          metadata: { type: 'goal', progress: Number(g.progress ?? 0) },
        })),
        ...behaviorEvents.map((b, i) => ({
          id: `event-${i}`,
          text: `${String(b.title ?? '')} ${String(b.message ?? '')}`.trim(),
          metadata: { type: 'behavior', eventType: String(b.eventType ?? '') },
        })),
      ].filter((doc) => doc.text.length > 10);

      if (ragDocuments.length > 0) {
        await mlServiceClient.indexUserMemory(userId, ragDocuments).catch(() => null);
      }

      // Query RAG with a general context summary — result used as memory for the AI prompt
      const ragResult = await mlServiceClient.queryRagForUser(userId, 'execution patterns goals productivity blockers', 4)
        .catch(() => null);
      return ragResult?.ok && ragResult.data?.hasResults ? ragResult.data.contextForMentor : undefined;
    })(),
  ]);

  return {
    profile: profileData ? {
      displayName: profileData.displayName,
      disciplineLevel: profileData.disciplineLevel,
      scores: profileData.currentScores,
    } : null,
    tasks,
    goals,
    reflections,
    focusSessions: focusSnapshot ? focusSnapshot.docs.map((doc) => compactDoc(doc.data())) : [],
    expenses: expensesSnapshot ? expensesSnapshot.docs.map((doc) => compactDoc(doc.data())) : [],
    healthLogs: healthSnapshot ? healthSnapshot.docs.map((doc) => compactDoc(doc.data())) : [],
    digitalUsage: digitalSnapshot ? digitalSnapshot.docs.map((doc) => compactDoc(doc.data())) : [],
    securityEvents: securitySnapshot ? securitySnapshot.docs.map((doc) => compactDoc(doc.data())) : [],
    cortexRisk: cortexDoc && 'exists' in cortexDoc && cortexDoc.exists ? compactDoc(cortexDoc.data() ?? {}) : null,
    behaviorEvents,
    ragContext,
    reflectionAnalysis,
    ghostTasks,
  };
};
