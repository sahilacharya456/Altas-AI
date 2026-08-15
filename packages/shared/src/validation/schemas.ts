import { z } from 'zod';

export const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['career', 'health', 'fitness', 'study', 'personal', 'routine']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'carried', 'cancelled']).optional(),
  estimatedMinutes: z.number().int().min(0).max(1440).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  scheduledDate: z.date().optional(),
  source: z.enum(['manual', 'ai', 'mentor-agent']).optional(),
  carryCount: z.number().int().min(0).optional(),
  isCarried: z.boolean().optional(),
  userId: z.string().min(1).optional(),
});

export const GoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['career', 'health', 'fitness', 'study', 'personal']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  milestones: z.array(z.string().max(500)).max(50).optional(),
  aiBreakdown: z.array(z.string()).max(50).optional(),
  userId: z.string().min(1).optional(),
});

export const ReflectionSchema = z.object({
  mood: z.number().int().min(1).max(5).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  honestAssessment: z.string().max(1000).optional(),
  wins: z.array(z.string().max(500)).max(20).optional(),
  struggles: z.array(z.string().max(500)).max(20).optional(),
  excusesMade: z.array(z.string().max(500)).max(20).optional(),
  tomorrowPriority: z.string().max(2000).optional(),
  tasksCompleted: z.number().int().min(0).optional(),
  tasksMissed: z.number().int().min(0).optional(),
  date: z.string().optional(),
  userId: z.string().min(1).optional(),
});

export const ExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['food', 'transport', 'study', 'rent', 'entertainment', 'misc']),
  note: z.string().max(500).optional(),
  userId: z.string().min(1).optional(),
});

export const KhataEntrySchema = z.object({
  personName: z.string().min(1).max(200),
  amount: z.number().positive(),
  type: z.enum(['borrowed', 'lent']),
  status: z.enum(['pending', 'partial', 'settled']),
  note: z.string().max(500).optional(),
  userId: z.string().min(1).optional(),
});

export const HealthLogSchema = z.object({
  sleepHours: z.number().min(0).max(12).optional(),
  waterGlasses: z.number().int().min(0).max(20).optional(),
  workoutMinutes: z.number().int().min(0).max(180).optional(),
  workoutType: z.enum(['cardio', 'strength', 'yoga', 'rest', 'other']).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  overallHealth: z.number().int().min(1).max(5).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  routineScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  userId: z.string().min(1).optional(),
});

export const DigitalUsageSchema = z.object({
  screenMinutes: z.number().int().min(0).max(720),
  goalMinutes: z.number().int().min(1).max(720),
  exceeded: z.boolean(),
  distractionScore: z.number().int().min(0).max(100).optional(),
  appCategory: z.enum(['social', 'entertainment', 'work', 'study', 'finance', 'health', 'security', 'other']).optional(),
  notes: z.string().max(500).optional(),
  userId: z.string().min(1).optional(),
});

export const SecurityEventSchema = z.object({
  type: z.enum(['phishing_attempt', 'suspicious_url', 'behavior_alert']),
  resolved: z.boolean().default(false),
  userId: z.string().min(1).optional(),
});

export const InterventionSchema = z.object({
  type: z.enum(['task', 'goal', 'finance', 'health', 'digital', 'security', 'reflection', 'focus', 'system']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1).max(500),
  reason: z.string().min(1).max(2000),
  recommendedAction: z.string().min(1).max(2000),
  sourceSignals: z.array(z.string()).max(20),
  status: z.enum(['active', 'accepted', 'ignored', 'completed', 'expired']).default('active'),
  userId: z.string().min(1).optional(),
});

export const BudgetSchema = z.object({
  month: z.string().max(20),
  totalBudget: z.number().min(0),
  spent: z.number().min(0),
  userId: z.string().min(1).optional(),
});

export const ProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  disciplineLevel: z.enum(['mentor', 'strict', 'ruthless']).optional(),
  focusAreas: z.array(z.string()).max(10).optional(),
  lifeRhythm: z.object({
    wakeTime: z.string().max(20).optional(),
    sleepTime: z.string().max(20).optional(),
    timezone: z.string().max(60).optional(),
  }).optional(),
  currentScores: z.object({
    discipline: z.number().min(0).max(100),
    productivity: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
  }).optional(),
  onboardingCompleted: z.boolean().optional(),
  email: z.string().email().optional(),
  userId: z.string().min(1).optional(),
});

export const MentorRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().trim().max(200).optional(),
  contextType: z.enum(['general', 'morning', 'task_review', 'reflection']).optional(),
  clientContext: z.object({
    pendingTasks: z.number().int().min(0).default(0),
    completedTasks: z.number().int().min(0).default(0),
    completionRate: z.number().min(0).max(100).default(0),
    activeGoalCount: z.number().int().min(0).default(0),
    topGoalTitle: z.string().max(200).optional(),
    topGoalProgress: z.number().min(0).max(100).optional(),
    disciplineLevel: z.enum(['mentor', 'strict', 'ruthless']).optional(),
    focusAreas: z.array(z.string()).max(10).optional(),
    currentScores: z.object({
      discipline: z.number().min(0).max(100),
      productivity: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
    }).optional(),
    lifeRhythm: z.object({
      wakeTime: z.string().max(20).optional(),
      sleepTime: z.string().max(20).optional(),
      timezone: z.string().max(60).optional(),
    }).optional(),
  }).optional(),
});

export const ProofReviewSchema = z.object({
  taskId: z.string().min(1).max(200),
  taskTitle: z.string().min(1).max(500),
  proofType: z.enum(['text', 'screenshot', 'github_link', 'file', 'study_notes', 'other']),
  proofContent: z.string().min(1).max(3000),
});

export const GoalBreakdownSchema = z.object({
  goalId: z.string().min(1).max(200),
  goalTitle: z.string().min(1).max(500),
  goalDescription: z.string().max(2000).optional(),
});

export const ReflectionFeedbackSchema = z.object({
  date: z.string().min(1).max(80),
});

export const SecurityAdviceSchema = z.object({
  input: z.string().min(1).max(2000),
});

export const RewardSchema = z.object({
  action: z.string().min(1).max(100),
  reward: z.number().min(-1).max(1),
});

export const SubscriptionCheckoutSchema = z.object({
  tier: z.enum(['pro', 'team']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const SubscriptionPortalSchema = z.object({
  customerId: z.string().min(1),
  returnUrl: z.string().url(),
});

export const RecommendationFeedbackSchema = z.object({
  recommendationId: z.string().min(1),
  source: z.string().min(1),
  action: z.enum(['completed', 'dismissed', 'deferred']),
  rating: z.number().int().min(1).max(5).optional(),
  context: z.record(z.unknown()).optional(),
});

export type TaskInput = z.infer<typeof TaskSchema>;
export type GoalInput = z.infer<typeof GoalSchema>;
export type ReflectionInput = z.infer<typeof ReflectionSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type KhataEntryInput = z.infer<typeof KhataEntrySchema>;
export type HealthLogInput = z.infer<typeof HealthLogSchema>;
export type DigitalUsageInput = z.infer<typeof DigitalUsageSchema>;
export type SecurityEventInput = z.infer<typeof SecurityEventSchema>;
export type InterventionInput = z.infer<typeof InterventionSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type MentorRequestInput = z.infer<typeof MentorRequestSchema>;
export type ProofReviewInput = z.infer<typeof ProofReviewSchema>;
export type GoalBreakdownInput = z.infer<typeof GoalBreakdownSchema>;
export type ReflectionFeedbackInput = z.infer<typeof ReflectionFeedbackSchema>;
export type SecurityAdviceInput = z.infer<typeof SecurityAdviceSchema>;
export type RewardInput = z.infer<typeof RewardSchema>;
export type SubscriptionCheckoutInput = z.infer<typeof SubscriptionCheckoutSchema>;
export type SubscriptionPortalInput = z.infer<typeof SubscriptionPortalSchema>;
export type RecommendationFeedbackInput = z.infer<typeof RecommendationFeedbackSchema>;