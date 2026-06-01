/**
 * Goal Breakdown — Cloud Function
 */

import * as functions from 'firebase-functions';
import { db, logger, enforceRateLimit } from './shared';
import { runPlannerAgent } from './ai/agents/plannerAgent';

export const generateGoalBreakdown = functions.https.onCall(async (data: { goalId: string; goalTitle: string; goalDescription?: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    if (!data.goalId || typeof data.goalId !== 'string' || !data.goalTitle || typeof data.goalTitle !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'goalId and goalTitle are required strings');
    }
    if (data.goalTitle.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'Goal title too long');
    }

    const userId = context.auth.uid;
    await enforceRateLimit(userId, 'goalBreakdown', 10);

    try {
        const result = await runPlannerAgent(userId, `Goal: ${data.goalTitle}\nDescription: ${data.goalDescription || ''}`);
        const milestones = result.output.milestones;
        await db.doc(`users/${userId}/goals/${data.goalId}`).update({ aiBreakdown: milestones });
        return { milestones, provider: result.provider, offline: result.offline };
    } catch (error) {
        logger.error('Goal breakdown error', { userId, error });
        throw new functions.https.HttpsError('internal', 'Request failed');
    }
});
