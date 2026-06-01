/**
 * Focus Sessions Data Service
 * Stores execution sessions and behavior-ready events in user subcollections.
 */

import {
    addDocument,
    updateDocument,
    queryCollection,
    where,
    orderBy,
    Timestamp,
} from '../firebase';
import type { BehaviorEvent, FocusSession } from '../../types/firestore';

const FOCUS_COLLECTION = 'focusSessions';
const BEHAVIOR_COLLECTION = 'behaviorEvents';

export const startFocusSession = async (data: {
    userId: string;
    taskId: string;
    goalId?: string;
    plannedMinutes?: number;
}): Promise<string> => {
    return addDocument<FocusSession>(FOCUS_COLLECTION, {
        userId: data.userId,
        taskId: data.taskId,
        ...(data.goalId ? { goalId: data.goalId } : {}),
        startedAt: Timestamp.now(),
        durationMinutes: 0,
        ...(data.plannedMinutes ? { plannedMinutes: data.plannedMinutes } : {}),
        status: 'active',
        createdAt: Timestamp.now(),
    } as Omit<FocusSession, 'id'>);
};

export const completeFocusSession = async (
    sessionId: string,
    data: {
        taskId: string;
        goalId?: string;
        durationMinutes: number;
        quality: 1 | 2 | 3 | 4 | 5;
        notes?: string;
    }
): Promise<void> => {
    const endedAt = Timestamp.now();

    await updateDocument(`${FOCUS_COLLECTION}/${sessionId}`, {
        endedAt,
        durationMinutes: data.durationMinutes,
        quality: data.quality,
        ...(data.notes?.trim() ? { notes: data.notes.trim() } : {}),
        status: 'completed',
    });

    await addDocument<BehaviorEvent>(BEHAVIOR_COLLECTION, {
        userId: '',
        source: 'focus',
        eventType: 'focus_session_completed',
        severity: data.quality <= 2 ? 'medium' : 'low',
        title: 'Focus session completed',
        message: `Completed ${data.durationMinutes} minutes of focused work with quality ${data.quality}/5.`,
        signalStrength: Math.min(100, Math.max(10, data.durationMinutes * 2 + data.quality * 10)),
        metadata: {
            taskId: data.taskId,
            ...(data.goalId ? { goalId: data.goalId } : {}),
            durationMinutes: data.durationMinutes,
            quality: data.quality,
        },
        occurredAt: endedAt,
        createdAt: endedAt,
    } as Omit<BehaviorEvent, 'id'>);
};

export const cancelFocusSession = async (sessionId: string, durationMinutes = 0): Promise<void> => {
    return updateDocument(`${FOCUS_COLLECTION}/${sessionId}`, {
        endedAt: Timestamp.now(),
        durationMinutes,
        status: 'cancelled',
    });
};

export const getFocusSessionsForTask = async (taskId: string): Promise<FocusSession[]> => {
    return queryCollection<FocusSession>(FOCUS_COLLECTION, [
        where('taskId', '==', taskId),
        orderBy('startedAt', 'desc'),
    ]);
};
