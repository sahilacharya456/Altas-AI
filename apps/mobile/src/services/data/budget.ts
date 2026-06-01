/**
 * Smart Khata - Budget Management Service
 * Monthly budget tracking with category limits
 */

import { Timestamp } from '../firebase';
import {
    getDocument,
    setDocument,
} from '../firebase/firestore';
import type { MonthlyBudget, ExpenseCategory } from '../../types/firestore';
import { increment } from '../firebase/firestore';
import { createBehaviorEvent } from './behaviorEvents';

const COLLECTION = 'budgets';

/**
 * Get budget document ID for a month
 */
const getBudgetId = (userId: string, year: number, month: number): string => {
    const monthStr = String(month + 1).padStart(2, '0');
    return `${userId}_${year}-${monthStr}`;
};

/**
 * Get current month's budget ID
 */
const getCurrentBudgetId = (userId: string): string => {
    const now = new Date();
    return getBudgetId(userId, now.getFullYear(), now.getMonth());
};

/**
 * Create or get budget for a month
 */
export const getOrCreateBudget = async (
    userId: string,
    year: number,
    month: number,
    totalBudget?: number
): Promise<MonthlyBudget> => {
    const budgetId = getBudgetId(userId, year, month);
    const existing = await getDocument<MonthlyBudget>(`${COLLECTION}/${budgetId}`);

    if (existing) {
        return existing;
    }

    // Create new budget
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const newBudget: Omit<MonthlyBudget, 'id'> = {
        userId,
        month: monthStr,
        totalBudget: totalBudget || 15000, // Default budget
        spent: 0,
        categorySpent: {
            food: 0,
            transport: 0,
            study: 0,
            rent: 0,
            entertainment: 0,
            misc: 0,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await setDocument<MonthlyBudget>(`${COLLECTION}/${budgetId}`, newBudget);

    return { ...newBudget, id: budgetId };
};

/**
 * Get current month's budget
 */
export const getCurrentBudget = async (userId: string): Promise<MonthlyBudget> => {
    const now = new Date();
    return getOrCreateBudget(userId, now.getFullYear(), now.getMonth());
};

/**
 * Update total budget
 */
export const updateBudgetTotal = async (
    userId: string,
    totalBudget: number,
    categoryLimits?: MonthlyBudget['categoryLimits']
): Promise<void> => {
    const budgetId = getCurrentBudgetId(userId);

    await setDocument<Partial<MonthlyBudget>>(`${COLLECTION}/${budgetId}`, {
        totalBudget,
        categoryLimits,
        updatedAt: Timestamp.now(),
    });
};

/**
 * Add expense to budget (increment spent)
 */
export const addExpenseToBudget = async (
    userId: string,
    amount: number,
    category: ExpenseCategory
): Promise<void> => {
    const budgetId = getCurrentBudgetId(userId);

    // Ensure budget exists
    await getOrCreateBudget(userId, new Date().getFullYear(), new Date().getMonth());

    // Increment spent totals
    await setDocument<Partial<MonthlyBudget>>(`${COLLECTION}/${budgetId}`, {
        spent: increment(amount) as any,
        [`categorySpent.${category}`]: increment(amount) as any,
        updatedAt: Timestamp.now(),
    }, true); // merge: true is CRITICAL for increment() to work

    const updatedBudget = await getDocument<MonthlyBudget>(`${COLLECTION}/${budgetId}`);
    if (!updatedBudget) return;

    const status = calculateBudgetStatus(updatedBudget);
    if (status.isOverBudget || status.pace === 'over') {
        await createBehaviorEvent({
            source: 'finance',
            eventType: status.isOverBudget ? 'budget_over_limit' : 'budget_pace_risk',
            severity: status.isOverBudget ? 'high' : 'medium',
            title: status.isOverBudget ? 'Budget limit crossed' : 'Spending pace risk',
            message: status.isOverBudget
                ? 'Monthly spending is above the configured budget. AltasAI should reduce non-essential spending pressure.'
                : 'Spending is ahead of the expected monthly pace. AltasAI should watch for drift.',
            metadata: {
                amount,
                category,
                spent: updatedBudget.spent,
                totalBudget: updatedBudget.totalBudget,
                percentSpent: Math.round(status.percentSpent),
                pace: status.pace,
            },
        });
    }
};

/**
 * Subtract expense from budget (for deletions)
 */
export const subtractExpenseFromBudget = async (
    userId: string,
    amount: number,
    category: ExpenseCategory
): Promise<void> => {
    const budgetId = getCurrentBudgetId(userId);

    await setDocument<Partial<MonthlyBudget>>(`${COLLECTION}/${budgetId}`, {
        spent: increment(-amount) as any,
        [`categorySpent.${category}`]: increment(-amount) as any,
        updatedAt: Timestamp.now(),
    }, true); // merge: true is CRITICAL for increment() to work
};

/**
 * Get budget for specific month
 */
export const getBudgetForMonth = async (
    userId: string,
    year: number,
    month: number
): Promise<MonthlyBudget | null> => {
    const budgetId = getBudgetId(userId, year, month);
    return getDocument<MonthlyBudget>(`${COLLECTION}/${budgetId}`);
};

/**
 * Calculate budget status
 */
export const calculateBudgetStatus = (budget: MonthlyBudget): {
    percentSpent: number;
    remaining: number;
    isOverBudget: boolean;
    daysInMonth: number;
    daysPassed: number;
    expectedSpendPercent: number;
    pace: 'under' | 'on-track' | 'over';
} => {
    const now = new Date();
    const [year, month] = budget.month.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = now.getMonth() === month - 1 ? now.getDate() : daysInMonth;

    const percentSpent = (budget.spent / budget.totalBudget) * 100;
    const remaining = budget.totalBudget - budget.spent;
    const isOverBudget = budget.spent > budget.totalBudget;
    const expectedSpendPercent = (daysPassed / daysInMonth) * 100;

    let pace: 'under' | 'on-track' | 'over';
    if (percentSpent > expectedSpendPercent + 10) {
        pace = 'over';
    } else if (percentSpent < expectedSpendPercent - 10) {
        pace = 'under';
    } else {
        pace = 'on-track';
    }

    return {
        percentSpent,
        remaining,
        isOverBudget,
        daysInMonth,
        daysPassed,
        expectedSpendPercent,
        pace,
    };
};

/**
 * Check category limit violations
 */
export const checkCategoryLimits = (budget: MonthlyBudget): {
    category: ExpenseCategory;
    spent: number;
    limit: number;
    exceeded: boolean;
}[] => {
    if (!budget.categoryLimits) return [];

    const violations: {
        category: ExpenseCategory;
        spent: number;
        limit: number;
        exceeded: boolean;
    }[] = [];

    Object.entries(budget.categoryLimits).forEach(([cat, limit]) => {
        const category = cat as ExpenseCategory;
        const spent = budget.categorySpent[category] || 0;

        if (limit && spent > limit) {
            violations.push({
                category,
                spent,
                limit,
                exceeded: true,
            });
        }
    });

    return violations;
};
