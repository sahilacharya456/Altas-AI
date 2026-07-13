import type { SafeUserMemory } from '../../services/memory';

export type AltasIntent =
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'complete_task'
  | 'ask_mentor'
  | 'ask_productivity_advice'
  | 'start_focus'
  | 'stop_focus'
  | 'reflect_day'
  | 'analyze_goal'
  | 'finance_check'
  | 'health_check'
  | 'security_check'
  | 'generate_report'
  | 'ask_next_action'
  | 'ask_motivation'
  | 'ask_planning_help'
  | 'unknown';

export interface ScoredLabel<T extends string = string> {
  label: T;
  confidence: number;
  reasons: string[];
}

export interface InternalAIResult<TLabel extends string = string> {
  label: TLabel;
  score: number;
  confidence: number;
  reasons: string[];
  evidence: string[];
  recommendation: string;
  nextAction: string;
}

export interface ExtractedEntity<T = unknown> {
  type: string;
  value: T;
  raw: string;
  confidence: number;
}

export interface ProductivityPattern {
  label:
    | 'procrastination'
    | 'overloaded_task_list'
    | 'missed_deadlines'
    | 'low_focus_consistency'
    | 'goal_stagnation'
    | 'high_productivity_streak'
    | 'late_night_activity'
    | 'weak_planning'
    | 'burnout_risk'
    | 'stable_execution';
  confidence: number;
  reason: string;
  signals: string[];
}

export interface InterventionRecommendation {
  id: string;
  title: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reason: string;
  triggeredBy: string[];
  expectedBenefit: string;
}

export interface ReflectionAnalysis {
  sentiment: 'negative' | 'neutral' | 'positive';
  moodScore: number;
  stressScore: number;
  motivationScore: number;
  confidenceScore: number;
  blockers: string[];
  wins: string[];
  themes: string[];
}

export interface MentorResponsePlan {
  intent: ScoredLabel<AltasIntent>;
  entities: ExtractedEntity[];
  patterns: ProductivityPattern[];
  recommendations: InterventionRecommendation[];
  userState: string;
  userStateVector?: UserStateVector;
  safety?: SafetyGuardrailResult;
  cortexInsight?: CortexInsight;
  adviceType: 'command' | 'reflection' | 'planning' | 'risk' | 'support';
  safetyConstraints: string[];
  responseStructure: string[];
  fallbackResponse: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AltasAIContext {
  userId: string;
  message?: string;
  memory: SafeUserMemory;
  now?: Date;
  contextType?: 'general' | 'morning' | 'task_review' | 'reflection';
  conversationHistory?: ConversationTurn[];
  clientContext?: {
    pendingTasks: number;
    completedTasks: number;
    completionRate: number;
    activeGoalCount: number;
    topGoalTitle?: string;
    topGoalProgress?: number;
    disciplineLevel?: string;
    focusAreas?: string[];
    currentScores?: { discipline: number; productivity: number; consistency: number };
    lifeRhythm?: { wakeTime?: string; sleepTime?: string; timezone?: string };
  };
}

export interface BuiltFeatures {
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  carriedTasks: number;
  criticalTasks: number;
  taskCompletionRate: number;
  overdueTaskRatio: number;
  focusSessions: number;
  focusMinutes: number;
  focusConsistency: number;
  goalCount: number;
  averageGoalProgress: number;
  reflectionCount: number;
  reflectionMoodScore: number;
  reflectionStressScore: number;
  workloadScore: number;
  consistencyScore: number;
  executionScore: number;
  procrastinationScore: number;
  burnoutSignalScore: number;
  financeRiskScore: number;
  healthHabitScore: number;
  securityRiskScore: number;
  inactivityDays: number;
}

export interface UserStateVector {
  productivityScore: number;
  focusScore: number;
  consistencyScore: number;
  stressSignal: number;
  workloadScore: number;
  goalProgressScore: number;
  taskRiskScore: number;
  reflectionMoodScore: number;
  burnoutRiskScore: number;
  executionReadinessScore: number;
}

export type ProductivityState =
  | 'focused'
  | 'distracted'
  | 'overloaded'
  | 'procrastinating'
  | 'consistent'
  | 'inconsistent'
  | 'burned_out_risk'
  | 'high_momentum'
  | 'low_motivation'
  | 'planning_needed'
  | 'execution_needed';

export interface RankedTask {
  title: string;
  score: number;
  reason: string;
  evidence: string[];
  nextAction: string;
}

export interface CortexInsight {
  topInsight: string;
  topRisk: string;
  topOpportunity: string;
  bestNextAction: string;
  explanation: string;
  confidence: number;
}

export type SafetyLabel =
  | 'allowed'
  | 'privacy_sensitive'
  | 'medical_boundary'
  | 'offensive_cybersecurity'
  | 'crisis_language'
  | 'unsupported_claim';

export interface SafetyGuardrailResult {
  safetyLabel: SafetyLabel;
  allowedResponseType: 'normal' | 'bounded_guidance' | 'supportive_redirect' | 'refusal';
  instruction: string;
  confidence: number;
  evidence: string[];
}
