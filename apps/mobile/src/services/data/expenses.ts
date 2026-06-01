/**
 * Smart Khata - Expense Tracking Service
 * Manage daily expenses with category tracking
 */

import { Timestamp, where, orderBy, limit } from '../firebase';
import {
    getDocument,
    setDocument,
    queryCollection,
    deleteDocument,
} from '../firebase/firestore';
import type { Expense, ExpenseCategory } from '../../types/firestore';

const COLLECTION = 'expenses';

/**
 * Get date string for document ID
 */
const getDateId = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Generate expense document ID
 */
const getExpenseId = (userId: string, date: Date): string => {
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${userId}_${getDateId(date)}_${randomId}`;
};

/**
 * Add new expense
 */
export const addExpense = async (
    userId: string,
    data: {
        amount: number;
        category: ExpenseCategory;
        note?: string;
        date?: Date;
    }
): Promise<string> => {
    const expenseDate = data.date || new Date();
    const docId = getExpenseId(userId, expenseDate);

    await setDocument<Expense>(`${COLLECTION}/${docId}`, {
        userId,
        amount: data.amount,
        category: data.category,
        note: data.note,
        date: Timestamp.fromDate(expenseDate),
    } as Omit<Expense, 'id'>);

    return docId;
};

/**
 * Get expense by ID
 */
export const getExpense = async (expenseId: string): Promise<Expense | null> => {
    return getDocument<Expense>(`${COLLECTION}/${expenseId}`);
};

/**
 * Get expenses for a specific month
 */
export const getMonthExpenses = async (
    userId: string,
    year: number,
    month: number // 0-indexed (0 = Jan)
): Promise<Expense[]> => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return queryCollection<Expense>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc'),
    ]);
};

/**
 * Get current month expenses
 */
export const getCurrentMonthExpenses = async (userId: string): Promise<Expense[]> => {
    const now = new Date();
    return getMonthExpenses(userId, now.getFullYear(), now.getMonth());
};

/**
 * Get expenses for date range
 */
export const getExpensesInRange = async (
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<Expense[]> => {
    return queryCollection<Expense>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc'),
    ]);
};

/**
 * Get recent expenses (last N days)
 */
export const getRecentExpenses = async (
    userId: string,
    days: number = 30
): Promise<Expense[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return queryCollection<Expense>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(100),
    ]);
};

/**
 * Update expense
 */
export const updateExpense = async (
    expenseId: string,
    data: Partial<Pick<Expense, 'amount' | 'category' | 'note'>>
): Promise<void> => {
    return setDocument<Partial<Expense>>(`${COLLECTION}/${expenseId}`, data, true);
};

/**
 * Delete expense
 */
export const deleteExpense = async (expenseId: string): Promise<void> => {
    return deleteDocument(`${COLLECTION}/${expenseId}`);
};

/**
 * Calculate total for expenses
 */
export const calculateTotal = (expenses: Expense[]): number => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
};

/**
 * Group expenses by category
 */
export const groupByCategory = (expenses: Expense[]): Record<ExpenseCategory, number> => {
    const grouped: Record<ExpenseCategory, number> = {
        food: 0,
        transport: 0,
        study: 0,
        rent: 0,
        entertainment: 0,
        misc: 0,
    };

    expenses.forEach(exp => {
        grouped[exp.category] = (grouped[exp.category] || 0) + exp.amount;
    });

    return grouped;
};

/**
 * Get daily totals for chart
 */
export const getDailyTotals = (expenses: Expense[]): { date: string; total: number }[] => {
    const dailyMap = new Map<string, number>();

    expenses.forEach(exp => {
        const dateStr = exp.date.toDate().toISOString().split('T')[0];
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + exp.amount);
    });

    return Array.from(dailyMap.entries())
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get top spending category
 */
export const getTopCategory = (expenses: Expense[]): {
    category: ExpenseCategory;
    amount: number;
    percent: number;
} => {
    const grouped = groupByCategory(expenses);
    const total = calculateTotal(expenses);

    let topCategory: ExpenseCategory = 'misc';
    let topAmount = 0;

    Object.entries(grouped).forEach(([cat, amount]) => {
        if (amount > topAmount) {
            topCategory = cat as ExpenseCategory;
            topAmount = amount;
        }
    });

    return {
        category: topCategory,
        amount: topAmount,
        percent: total > 0 ? Math.round((topAmount / total) * 100) : 0,
    };
};
