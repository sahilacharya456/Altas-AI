/**
 * Smart Khata - Borrow/Lend Ledger Service
 * Track money lent and borrowed
 */

import { Timestamp } from '../firebase';
import {
    getDocument,
    setDocument,
    queryCollection,
    deleteDocument,
} from '../firebase/firestore';
import type { KhataEntry } from '../../types/firestore';
import { createBehaviorEvent } from './behaviorEvents';

const COLLECTION = 'khata';

/**
 * Generate khata entry ID
 */
const getKhataId = (userId: string): string => {
    const randomId = Math.random().toString(36).substring(2, 10);
    return `${userId}_${randomId}`;
};

/**
 * Add new khata entry (borrow or lend)
 */
export const addKhataEntry = async (
    userId: string,
    data: {
        personName: string;
        amount: number;
        type: 'borrowed' | 'lent';
        dueDate?: Date;
        note?: string;
    }
): Promise<string> => {
    const docId = getKhataId(userId);

    await setDocument<KhataEntry>(`${COLLECTION}/${docId}`, {
        userId,
        personName: data.personName.trim(),
        amount: data.amount,
        type: data.type,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : undefined,
        status: 'pending',
        amountSettled: 0,
        note: data.note,
    } as Omit<KhataEntry, 'id'>);

    await createBehaviorEvent({
        source: 'finance',
        eventType: data.type === 'borrowed' ? 'debt_created' : 'repayment_reminder_created',
        severity: data.type === 'borrowed' ? 'medium' : 'low',
        title: data.type === 'borrowed' ? 'Borrowed money logged' : 'Money lent logged',
        message: data.type === 'borrowed'
            ? 'A borrowed amount was logged. AltasAI should track repayment pressure as a discipline signal.'
            : 'A lent amount was logged. AltasAI should track follow-up reminders without turning finance into noise.',
        metadata: {
            khataId: docId,
            amount: data.amount,
            type: data.type,
            hasDueDate: Boolean(data.dueDate),
        },
    });

    return docId;
};

/**
 * Get khata entry by ID
 */
export const getKhataEntry = async (entryId: string): Promise<KhataEntry | null> => {
    return getDocument<KhataEntry>(`${COLLECTION}/${entryId}`);
};

/**
 * Get all khata entries for user
 */
export const getAllKhataEntries = async (_userId: string): Promise<KhataEntry[]> => {
    const entries = await queryCollection<KhataEntry>(COLLECTION);
    return sortByCreatedAtDesc(entries);
};

/**
 * Get pending khata entries
 */
export const getPendingKhataEntries = async (userId: string): Promise<KhataEntry[]> => {
    const entries = await getAllKhataEntries(userId);
    return entries.filter((entry) => entry.status === 'pending');
};

/**
 * Get entries for specific person
 */
export const getKhataByPerson = async (
    userId: string,
    personName: string
): Promise<KhataEntry[]> => {
    const entries = await getAllKhataEntries(userId);
    return entries.filter((entry) => entry.personName === personName.trim());
};

const sortByCreatedAtDesc = (entries: KhataEntry[]): KhataEntry[] =>
    [...entries].sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
    });

/**
 * Group entries by person
 */
export const groupByPerson = (entries: KhataEntry[]): Map<string, KhataEntry[]> => {
    const grouped = new Map<string, KhataEntry[]>();

    entries.forEach(entry => {
        const existing = grouped.get(entry.personName) || [];
        grouped.set(entry.personName, [...existing, entry]);
    });

    return grouped;
};

/**
 * Settle khata entry (full payment)
 */
export const settleKhataEntry = async (entryId: string): Promise<void> => {
    const entry = await getKhataEntry(entryId);
    if (!entry) throw new Error('Khata entry not found');

    await setDocument<Partial<KhataEntry>>(`${COLLECTION}/${entryId}`, {
        status: 'settled',
        amountSettled: entry.amount,
        settledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    }, true); // merge: true to preserve existing fields

    await createBehaviorEvent({
        source: 'finance',
        eventType: 'khata_repaid',
        severity: 'low',
        title: 'Khata entry settled',
        message: 'A borrow/lend entry was settled. AltasAI can treat this as a financial discipline win.',
        metadata: {
            khataId: entryId,
            amount: entry.amount,
            type: entry.type,
        },
    });
};

/**
 * Partial settlement
 */
export const partialSettleKhataEntry = async (
    entryId: string,
    amountPaid: number
): Promise<void> => {
    const entry = await getKhataEntry(entryId);
    if (!entry) throw new Error('Khata entry not found');

    const newAmountSettled = entry.amountSettled + amountPaid;
    const newStatus = newAmountSettled >= entry.amount ? 'settled' : 'partial';

    await setDocument<Partial<KhataEntry>>(`${COLLECTION}/${entryId}`, {
        amountSettled: newAmountSettled,
        status: newStatus,
        settledAt: newStatus === 'settled' ? Timestamp.now() : undefined,
        updatedAt: Timestamp.now(),
    }, true); // merge: true to preserve existing fields
};

/**
 * Delete khata entry
 */
export const deleteKhataEntry = async (entryId: string): Promise<void> => {
    return deleteDocument(`${COLLECTION}/${entryId}`);
};

/**
 * Calculate net balance (what you're owed - what you owe)
 */
export const calculateNetBalance = (entries: KhataEntry[]): {
    youOwe: number; // Total you borrowed (pending)
    owedToYou: number; // Total lent to others (pending)
    netBalance: number; // Negative = you owe, Positive = owed to you
} => {
    let youOwe = 0;
    let owedToYou = 0;

    entries.forEach(entry => {
        const pendingAmount = entry.amount - entry.amountSettled;

        if (entry.status !== 'settled' && pendingAmount > 0) {
            if (entry.type === 'borrowed') {
                youOwe += pendingAmount;
            } else {
                owedToYou += pendingAmount;
            }
        }
    });

    return {
        youOwe,
        owedToYou,
        netBalance: owedToYou - youOwe,
    };
};

/**
 * Get borrow frequency (for AI analysis)
 */
export const getBorrowFrequency = (entries: KhataEntry[], days: number = 30): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return entries.filter(
        entry =>
            entry.type === 'borrowed' &&
            entry.createdAt.toDate() >= cutoffDate
    ).length;
};

/**
 * Get overdue entries
 */
export const getOverdueEntries = (entries: KhataEntry[]): KhataEntry[] => {
    const now = new Date();

    return entries.filter(entry =>
        entry.status !== 'settled' &&
        entry.dueDate &&
        entry.dueDate.toDate() < now
    );
};

/**
 * Calculate person-wise balance
 */
export const getPersonBalance = (entries: KhataEntry[]): {
    personName: string;
    netBalance: number; // Positive = they owe you, Negative = you owe them
    pendingEntries: KhataEntry[];
}[] => {
    const grouped = groupByPerson(entries);
    const balances: {
        personName: string;
        netBalance: number;
        pendingEntries: KhataEntry[];
    }[] = [];

    grouped.forEach((personEntries, personName) => {
        let netBalance = 0;
        const pendingEntries: KhataEntry[] = [];

        personEntries.forEach(entry => {
            if (entry.status !== 'settled') {
                const pendingAmount = entry.amount - entry.amountSettled;

                if (entry.type === 'lent') {
                    netBalance += pendingAmount; // They owe you
                } else {
                    netBalance -= pendingAmount; // You owe them
                }

                pendingEntries.push(entry);
            }
        });

        if (pendingEntries.length > 0) {
            balances.push({
                personName,
                netBalance,
                pendingEntries,
            });
        }
    });

    return balances.sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
};
