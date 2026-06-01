import {
    addDocument,
    queryCollection,
    orderBy,
    limit,
    Timestamp,
} from '../firebase';
import type { BehaviorEvent, Task } from '../../types/firestore';

const COLLECTION = 'behaviorEvents';

export const createBehaviorEvent = async (
    event: Omit<BehaviorEvent, 'id' | 'createdAt' | 'userId'>
): Promise<string> => {
    return addDocument<BehaviorEvent>(COLLECTION, {
        userId: '',
        ...event,
        createdAt: Timestamp.now(),
    } as Omit<BehaviorEvent, 'id'>);
};

export const listRecentBehaviorEvents = async (userId: string, count = 25): Promise<BehaviorEvent[]> => {
    return queryCollection<BehaviorEvent>(COLLECTION, [
        orderBy('createdAt', 'desc'),
        limit(count),
    ]);
};

export const createTaskBehaviorEvent = async (
    task: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'carryCount'>,
    eventType: string,
    message: string
): Promise<string> => {
    const severity = task.priority === 'critical'
        ? 'critical'
        : task.priority === 'high'
            ? 'high'
            : task.carryCount && task.carryCount > 0
                ? 'medium'
                : 'low';

    return createBehaviorEvent({
        source: 'tasks',
        eventType,
        severity,
        title: task.title,
        message,
        metadata: {
            taskId: task.id,
            status: task.status,
            priority: task.priority,
            carryCount: task.carryCount ?? 0,
        },
    });
};
