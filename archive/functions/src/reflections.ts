/**
 * Reflection Feedback — Cloud Function
 */

import * as functions from 'firebase-functions';
import { db, logger, enforceRateLimit } from './shared';
import { runReflectionAgent } from './ai/agents/reflectionAgent';

export const generateReflectionFeedback = functions.https.onCall(async (data: { date: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    if (!data.date || typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(data.date)) {
        throw new functions.https.HttpsError('invalid-argument', 'Valid date string required (YYYY-MM-DD)');
    }

    const userId = context.auth.uid;
    await enforceRateLimit(userId, 'reflectionFeedback', 10);

    const reflectionRef = db.doc(`users/${userId}/dailyLogs/${data.date}`);
    const reflectionDoc = await reflectionRef.get();
    if (!reflectionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Reflection not found');
    }

    const reflection = reflectionDoc.data();

    try {
        const prompt = `Review this reflection (max 100 words):
- Mood: ${reflection?.mood}/5 | Energy: ${reflection?.energyLevel}/5
- Tasks: ${reflection?.tasksCompleted} done, ${reflection?.tasksMissed} missed
- Wins: ${(reflection?.wins as string[])?.join(', ') || 'None'}
- Struggles: ${(reflection?.struggles as string[])?.join(', ') || 'None'}
- Self-assessment: ${String(reflection?.honestAssessment || '')}`;

        const result = await runReflectionAgent(userId, prompt);
        const feedback = result.output.feedback;
        await reflectionRef.update({ mentorFeedback: feedback });
        return { feedback, pattern: result.output.pattern, tomorrowAction: result.output.tomorrowAction, provider: result.provider, offline: result.offline };
    } catch (error) {
        logger.error('Reflection feedback error', { userId, error });
        throw new functions.https.HttpsError('internal', 'Request failed');
    }
});
