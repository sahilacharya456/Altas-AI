/**
 * Budget Analysis — Cloud Function
 */

import * as functions from 'firebase-functions';
import { db, logger, enforceRateLimit } from './shared';
import { runFinanceAgent } from './ai/agents/financeAgent';

export const analyzeBudgetDiscipline = functions.https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    await enforceRateLimit(userId, 'budgetAnalysis', 10);

    try {
        const budgetSnapshot = await db.collection(`users/${userId}/budgets`)
            .orderBy('createdAt', 'desc').limit(1).get();

        if (budgetSnapshot.empty) {
            return { success: true, insights: [], message: 'No budget data yet' };
        }

        const budget = budgetSnapshot.docs[0].data();
        const totalSpent = (budget.spent as number) || 0;
        const budgetTotal = (budget.totalBudget as number) || 15000;
        const percentSpent = (totalSpent / budgetTotal) * 100;
        const dayOfMonth = new Date().getDate();
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const expectedPercent = (dayOfMonth / daysInMonth) * 100;
        const overpace = percentSpent - expectedPercent;

        const categoryTotals = (budget.categorySpent as Record<string, number>) || {};
        const categories = Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const prompt = `Analyze this budget:
BUDGET: ₹${budgetTotal.toLocaleString()}
SPENT: ₹${totalSpent.toLocaleString()} (${percentSpent.toFixed(1)}%)
DAY: ${dayOfMonth} of ${daysInMonth} (Expected: ${expectedPercent.toFixed(1)}%)
PACE: ${overpace > 10 ? 'OVERSPENDING' : 'On track'}
TOP CATEGORIES:
${categories.slice(0, 3).map(c => `- ${c.category}: ₹${c.amount.toLocaleString()}`).join('\n')}

Provide 3-5 STRICT insights as JSON:
[{ "type": "warning", "message": "Specific issue", "action": "What to do" }]
Types: "info", "warning", "critical", "encouragement"`;

        const result = await runFinanceAgent(userId, prompt);
        const fallbackInsights = [{
            type: overpace > 15 ? 'critical' : 'warning',
            message: `Spending ${percentSpent.toFixed(0)}% of budget by day ${dayOfMonth}`,
            action: 'Reduce daily spending immediately',
        }];
        const insights = Array.isArray(result.output) && result.output.length ? result.output : fallbackInsights;

        return {
            success: true,
            insights,
            provider: result.provider,
            offline: result.offline,
            summary: {
                totalSpent, budgetTotal,
                percentSpent: Math.round(percentSpent),
                overpace: Math.round(overpace),
                topCategory: categories[0]?.category || 'misc',
            },
        };
    } catch (error: unknown) {
        logger.error('Budget analysis error', { userId, error });
        throw new functions.https.HttpsError('internal', 'Request failed');
    }
});
