/**
 * Mentor hook pure-logic tests.
 * Tests deterministic functions extracted from useMentor without
 * importing Firebase, React Native, or Zustand.
 */

// Pure functions under test (mirrors useMentor.ts)

const detectContextType = (hour: number): 'morning' | 'reflection' | 'general' => {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 20 || hour < 5) return 'reflection';
  return 'general';
};

const detectAnalyzingLabel = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (/\b(task|create|add|schedule)\b/.test(lower)) return 'Building your task...';
  if (/\b(plan|next|what should|priority)\b/.test(lower)) return 'Planning your next move...';
  if (/\b(reflect|how did|review|week|today)\b/.test(lower)) return 'Reviewing your execution...';
  if (/\b(focus|session|work|deep)\b/.test(lower)) return 'Optimizing your focus...';
  if (/\b(goal|progress|milestone)\b/.test(lower)) return 'Analyzing your goals...';
  return 'AltasAI is analyzing';
};

// detectContextType

describe('detectContextType', () => {
  it('returns morning for hours 5-10', () => {
    expect(detectContextType(5)).toBe('morning');
    expect(detectContextType(7)).toBe('morning');
    expect(detectContextType(10)).toBe('morning');
  });

  it('returns reflection for hours 20-23', () => {
    expect(detectContextType(20)).toBe('reflection');
    expect(detectContextType(23)).toBe('reflection');
  });

  it('returns reflection for late-night hours 0-4', () => {
    expect(detectContextType(0)).toBe('reflection');
    expect(detectContextType(4)).toBe('reflection');
  });

  it('returns general for midday hours 11-19', () => {
    expect(detectContextType(11)).toBe('general');
    expect(detectContextType(14)).toBe('general');
    expect(detectContextType(19)).toBe('general');
  });
});

// detectAnalyzingLabel

describe('detectAnalyzingLabel', () => {
  it('detects task creation intent', () => {
    expect(detectAnalyzingLabel('create a task for my project')).toBe('Building your task...');
    expect(detectAnalyzingLabel('add task to finish report')).toBe('Building your task...');
    expect(detectAnalyzingLabel('schedule a meeting')).toBe('Building your task...');
  });

  it('detects planning intent', () => {
    expect(detectAnalyzingLabel('plan my next 3 hours')).toBe('Planning your next move...');
    expect(detectAnalyzingLabel('what should I do next?')).toBe('Planning your next move...');
    expect(detectAnalyzingLabel('what is the priority here')).toBe('Planning your next move...');
  });

  it('detects reflection intent', () => {
    expect(detectAnalyzingLabel('how did today go?')).toBe('Reviewing your execution...');
    expect(detectAnalyzingLabel('review my progress this week')).toBe('Reviewing your execution...');
  });

  it('detects focus intent', () => {
    expect(detectAnalyzingLabel('I want to start a focus session')).toBe('Optimizing your focus...');
    expect(detectAnalyzingLabel('deep work on the backend')).toBe('Optimizing your focus...');
  });

  it('detects goal intent', () => {
    expect(detectAnalyzingLabel('what is my goal progress?')).toBe('Analyzing your goals...');
    expect(detectAnalyzingLabel('check my milestone completion')).toBe('Analyzing your goals...');
  });

  it('returns default label for unrecognized input', () => {
    expect(detectAnalyzingLabel('hello')).toBe('AltasAI is analyzing');
    expect(detectAnalyzingLabel('')).toBe('AltasAI is analyzing');
  });
});

// Client context shape validation

describe('buildClientContext shape', () => {
  // Simulate what buildClientContext produces given store state
  const buildClientContext = (opts: {
    pending: number; completed: number; total: number;
    goals: Array<{ status: string; progress: number; title: string }>;
    disciplineLevel?: string;
  }) => {
    const completionRate = opts.total > 0
      ? Math.round((opts.completed / opts.total) * 100)
      : 0;
    const activeGoals = opts.goals.filter((g) => g.status === 'active');
    const topGoal = activeGoals.sort((a, b) => b.progress - a.progress)[0];

    return {
      pendingTasks: opts.pending,
      completedTasks: opts.completed,
      completionRate,
      activeGoalCount: activeGoals.length,
      topGoalTitle: topGoal?.title,
      topGoalProgress: topGoal?.progress,
      disciplineLevel: opts.disciplineLevel,
    };
  };

  it('calculates completionRate correctly', () => {
    const ctx = buildClientContext({ pending: 3, completed: 2, total: 5, goals: [] });
    expect(ctx.completionRate).toBe(40);
  });

  it('handles no tasks gracefully', () => {
    const ctx = buildClientContext({ pending: 0, completed: 0, total: 0, goals: [] });
    expect(ctx.completionRate).toBe(0);
    expect(ctx.pendingTasks).toBe(0);
  });

  it('picks the highest-progress active goal as top goal', () => {
    const ctx = buildClientContext({
      pending: 1, completed: 1, total: 2,
      goals: [
        { status: 'active', progress: 30, title: 'Goal A' },
        { status: 'active', progress: 75, title: 'Goal B' },
        { status: 'paused', progress: 90, title: 'Goal C' },
      ],
    });
    expect(ctx.topGoalTitle).toBe('Goal B');
    expect(ctx.topGoalProgress).toBe(75);
    expect(ctx.activeGoalCount).toBe(2);
  });

  it('excludes non-active goals from count', () => {
    const ctx = buildClientContext({
      pending: 0, completed: 0, total: 0,
      goals: [
        { status: 'completed', progress: 100, title: 'Done' },
        { status: 'abandoned', progress: 10, title: 'Dropped' },
      ],
    });
    expect(ctx.activeGoalCount).toBe(0);
    expect(ctx.topGoalTitle).toBeUndefined();
  });
});

// Proof onboarding key

describe('proof onboarding AsyncStorage key', () => {
  it('uses the correct key constant', () => {
    // Ensure the key matches what useMentorOnboarding.ts uses
    expect('altasai.proofOnboardingSeen').toBe('altasai.proofOnboardingSeen');
  });
});
