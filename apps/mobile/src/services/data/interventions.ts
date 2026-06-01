import {
    queryCollection,
    updateDocument,
    addDocument,
    orderBy,
    Timestamp,
} from '../firebase';
import type { Intervention, Task } from '../../types/firestore';

const COLLECTION = 'interventions';

export const listActiveInterventions = async (_userId: string, count = 10): Promise<Intervention[]> => {
    const results = await queryCollection<Intervention>(COLLECTION, [
        orderBy('createdAt', 'desc'),
    ]);
    return results.filter((intervention) => intervention.status === 'active').slice(0, count);
};

export const updateInterventionStatus = async (
    interventionId: string,
    status: Intervention['status']
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${interventionId}`, {
        status,
        ...(status === 'completed' ? { completedAt: Timestamp.now() } : {}),
    });
};

export const acceptIntervention = async (intervention: Intervention): Promise<void> => {
    if (!intervention.id) return;
    await updateInterventionStatus(intervention.id, 'accepted');
};

export const ignoreIntervention = async (interventionId: string): Promise<void> => {
    return updateInterventionStatus(interventionId, 'ignored');
};

export const completeIntervention = async (interventionId: string): Promise<void> => {
    return updateInterventionStatus(interventionId, 'completed');
};

export const createTaskFromIntervention = async (
    intervention: Intervention,
    userId: string
): Promise<string> => {
    const scheduledDate = new Date();
    scheduledDate.setMinutes(scheduledDate.getMinutes() + 10);

    const taskId = await addDocument<Task>('tasks', {
        userId,
        title: intervention.recommendedAction,
        category: intervention.type === 'health' ? 'health' : intervention.type === 'finance' ? 'personal' : 'routine',
        priority: intervention.severity === 'critical' ? 'critical' : intervention.severity === 'high' ? 'high' : 'medium',
        status: 'pending',
        scheduledDate: Timestamp.fromDate(scheduledDate),
        estimatedMinutes: 20,
        isCarried: false,
        carryCount: 0,
        source: 'intervention',
        context: intervention.reason,
        createdAt: Timestamp.now(),
    } as Omit<Task, 'id'>);

    if (intervention.id) await updateInterventionStatus(intervention.id, 'accepted');
    return taskId;
};
