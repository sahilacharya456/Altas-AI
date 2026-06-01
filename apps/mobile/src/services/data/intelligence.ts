/**
 * Behavioral Intelligence Service
 * Analyzes user patterns for AI mentor intelligence
 */

import { getDailyLogHistory, getReflectionStreak } from './dailyLogs';
import { getCarriedTasks, getTaskSummary } from './tasks';
import { getAllGoals } from './goals';
import { getAllKhataEntries, calculateNetBalance, getOverdueEntries } from './khata';
import { calculateTrustScore } from '../security/analysis';
import { analyzeEmotionalState } from './moodAdaptor';

export interface BehavioralPattern {
    excusePatterns: {
        topExcuse: string;
        count: number;
        frequency: number; // 0-1
    };
    completionTrend: {
        thisWeek: number;
        lastWeek: number;
        direction: 'improving' | 'declining' | 'stable';
    };
    carriedTasksInsight: {
        count: number;
        oldestDays: number;
        repeatOffenders: string[]; // Task titles carried 3+ times
    };
    reflectionConsistency: {
        streak: number;
        averageMood: number;
        energyTrend: 'increasing' | 'decreasing' | 'stable';
    };
}

/**
 * Analyze user behavior for AI intelligence
 */
export const analyzeBehaviorPatterns = async (userId: string): Promise<BehavioralPattern> => {
    // Get last 14 days of reflections
    const logs = await getDailyLogHistory(userId, 14);
    const streak = await getReflectionStreak(userId);

    // Excuse pattern detection
    const allStruggles = logs.flatMap(log => log.struggles || []);
    const struggleFreq: Record<string, number> = {};

    allStruggles.forEach(struggle => {
        const normalized = struggle.toLowerCase().trim();
        struggleFreq[normalized] = (struggleFreq[normalized] || 0) + 1;
    });

    const sortedStruggles = Object.entries(struggleFreq).sort((a, b) => b[1] - a[1]);
    const topExcuseEntry = sortedStruggles[0];
    const topExcuseText = topExcuseEntry ? topExcuseEntry[0] : 'none';
    const topExcuseCount = topExcuseEntry ? topExcuseEntry[1] : 0;

    // Completion trend
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 7);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);

    const thisWeekSummary = await getTaskSummary(userId, thisWeekStart);
    const lastWeekSummary = await getTaskSummary(userId, lastWeekStart);

    const thisWeekRate = thisWeekSummary.completionRate;
    const lastWeekRate = lastWeekSummary.completionRate;

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (thisWeekRate > lastWeekRate + 10) direction = 'improving';
    else if (thisWeekRate < lastWeekRate - 10) direction = 'declining';

    // Carried tasks insight
    const carriedTasks = await getCarriedTasks(userId);


    // Find oldest carried task safely
    const oldestCarried = carriedTasks.length > 0
        ? carriedTasks.reduce((oldest, task) => {
            const taskAge = Date.now() - (task.createdAt as any).toMillis();
            const oldestAge = oldest ? Date.now() - (oldest.createdAt as any).toMillis() : 0;
            return taskAge > oldestAge ? task : oldest;
        })
        : null;

    const oldestDays = oldestCarried
        ? Math.ceil((Date.now() - (oldestCarried.createdAt as any).toMillis()) / (1000 * 60 * 60 * 24))
        : 0;

    // Energy trend from reflections
    const recent7 = logs.slice(0, 7);
    const older7 = logs.slice(7, 14);

    const recentAvgEnergy = recent7.reduce((sum, l) => sum + (l.energyLevel || 0), 0) / (recent7.length || 1);
    const olderAvgEnergy = older7.reduce((sum, l) => sum + (l.energyLevel || 0), 0) / (older7.length || 1);

    let energyTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentAvgEnergy > olderAvgEnergy + 0.5) energyTrend = 'increasing';
    else if (recentAvgEnergy < olderAvgEnergy - 0.5) energyTrend = 'decreasing';

    // Average mood
    const avgMood = logs.reduce((sum, l) => sum + (l.mood || 0), 0) / (logs.length || 1);

    return {
        excusePatterns: {
            topExcuse: topExcuseText,
            count: topExcuseCount,
            frequency: logs.length > 0 ? topExcuseCount / logs.length : 0,
        },
        completionTrend: {
            thisWeek: thisWeekRate,
            lastWeek: lastWeekRate,
            direction,
        },
        carriedTasksInsight: {
            count: carriedTasks.length,
            oldestDays,
            repeatOffenders: carriedTasks.slice(0, 3).map(t => t.title),
        },
        reflectionConsistency: {
            streak,
            averageMood: avgMood,
            energyTrend,
        },
    };
};


/**
 * Generate context-aware AI prompt
 */
export const buildIntelligentContext = async (userId: string): Promise<string> => {
    try {
        // 1. Fetch all data in parallel
        const [patterns, goals, khataEntries, trustScore] = await Promise.all([
            analyzeBehaviorPatterns(userId).catch(e => {
                if (__DEV__) console.warn('[Intelligence] Failed to analyze patterns:', e);
                return null;
            }),
            getAllGoals(userId).catch(() => []),
            getAllKhataEntries(userId).catch(() => []),
            calculateTrustScore(userId).catch(() => 50),
        ]);

        // If behaviors failed completely, return basic context
        if (!patterns) {
            return `[SYSTEM CONTEXT START]\nWARN: Partial Data.\nUSER: ${userId}\n[SYSTEM CONTEXT END]`;
        }

        // 2. Analyze Finance
        const finance = calculateNetBalance(khataEntries);
        const overdue = getOverdueEntries(khataEntries);
        const financeStatus = finance.netBalance < 0
            ? `In Debt (₹${Math.abs(finance.netBalance)})`
            : `Positive Balance (₹${finance.netBalance})`;

        // 3. Analyze Emotional State (The Heart)
        const emotionalState = analyzeEmotionalState({
            finance: {
                netBalance: finance.netBalance,
                overdueCount: overdue.length
            },
            security: {
                trustScore: trustScore
            },
            behavior: patterns
        });

        // 4. Analyze Goals
        const activeGoals = goals.filter(g => g.status === 'active');
        const urgentGoals = activeGoals.filter(g => {
            if (!g.targetDate) return false;
            const daysUntil = Math.ceil(((g.targetDate as any).toMillis() - Date.now()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7 && daysUntil > 0;
        });

        // 5. Construct Context String
        return `
[SYSTEM CONTEXT START]
USER STATE SNAPSHOT:

1. FINANCE:
- Net Status: ${financeStatus}
- Overdue Payments: ${overdue.length} ${overdue.length > 0 ? '(CRITICAL)' : ''}
- Outstanding Loans: Used ₹${finance.youOwe} | Owed ₹${finance.owedToYou}

2. SECURITY:
- Digital Trust Score: ${trustScore}/100
- Status: ${trustScore < 60 ? 'VULNERABLE' : 'SECURE'}

3. BEHAVIOR & HABITS:
- Task Completion: ${patterns.completionTrend.thisWeek}% (${patterns.completionTrend.direction})
- Energy Trend: ${patterns.reflectionConsistency.energyTrend}
- Consistency Streak: ${patterns.reflectionConsistency.streak} days

4. EMOTIONAL INTELLIGENCE (THE HEART):
- Detected Mood: ${emotionalState.mood}
- Recommended Tone: ${emotionalState.tone}
- Context: ${emotionalState.reason.join(' ')}

5. ACTIVE GOALS:
- Total Active: ${activeGoals.length}
${urgentGoals.length > 0 ? `- ⚠️ URGENT: ${urgentGoals.map(g => `"${g.title}"`).join(', ')}` : '- No urgent deadlines.'}
[SYSTEM CONTEXT END]

INSTRUCTION: Adapt your persona based on Recent Mood and Recommended Tone.
- IF tone is SUPPORTIVE: Be encouraging, focus on small wins.
- IF tone is EMPATHETIC: Acknowledge stress, prioritize relief.
- IF tone is STRICT: Call out complacency, demand focus.
- IF tone is CHALLENGING: Push for higher performance.
`.trim();
    } catch (error) {
        if (__DEV__) console.error('[Intelligence] Error building context:', error);
        return '[SYSTEM CONTEXT] Error loading detailed context. Proceed with general advise.';
    }
};

/**
 * Detect if user is making excuses
 */
export const detectExcuses = async (userId: string, message: string): Promise<boolean> => {
    const patterns = await analyzeBehaviorPatterns(userId);
    const messageLower = message.toLowerCase();

    // Common excuse keywords
    const excuseKeywords = ['tired', 'busy', 'no time', 'tomorrow', 'next week', 'maybe', 'trying'];

    // Check if message contains top excuse or common keywords
    const containsTopExcuse = messageLower.includes(patterns.excusePatterns.topExcuse);
    const containsExcuseKeyword = excuseKeywords.some(keyword => messageLower.includes(keyword));

    return containsTopExcuse || (containsExcuseKeyword && patterns.completionTrend.direction === 'declining');
};
