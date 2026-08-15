/**
 * Ghost Task Detector
 *
 * A "Ghost Task" is a task the user has repeatedly scheduled but never executes.
 * Carry count ≥ 3 without completion = behavioral avoidance signal.
 *
 * This service is called during memory assembly so the AI mentor always has
 * visibility into the user's avoidance patterns — enabling confrontational
 * coaching grounded in real data, not vague feelings.
 *
 * No other productivity app surfaces this signal to an AI coach automatically.
 */

import { db, Timestamp } from '../lib/firebaseAdmin';
import { logger } from '../utils/logger';

export interface GhostTask {
  id: string;
  title: string;
  category: string;
  carryCount: number;
  firstScheduled: Date | null;
  daysSinceCreated: number;
}

export interface GhostTaskSummary {
  count: number;
  tasks: GhostTask[];
  /** Dominant category of avoidance (e.g. "career", "health") */
  ghostDomain: string | null;
  /** Average carry count across all ghost tasks */
  avgCarryCount: number;
  /** Formatted string ready to inject into AI prompt */
  contextForMentor: string;
}

const GHOST_THRESHOLD = 3; // carried 3+ times without completion
const MAX_GHOST_TASKS = 10;

export const detectGhostTasks = async (userId: string): Promise<GhostTaskSummary> => {
  try {
    const snapshot = await db
      .collection(`users/${userId}/tasks`)
      .where('isCarried', '==', true)
      .where('carryCount', '>=', GHOST_THRESHOLD)
      .where('status', '!=', 'completed')
      .orderBy('carryCount', 'desc')
      .limit(MAX_GHOST_TASKS)
      .get();

    if (snapshot.empty) {
      return { count: 0, tasks: [], ghostDomain: null, avgCarryCount: 0, contextForMentor: '' };
    }

    const now = Date.now();
    const tasks: GhostTask[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
      const daysSinceCreated = createdAt
        ? Math.floor((now - createdAt.getTime()) / 86_400_000)
        : 0;

      return {
        id: doc.id,
        title: typeof data.title === 'string' ? data.title.slice(0, 120) : 'Untitled',
        category: typeof data.category === 'string' ? data.category : 'personal',
        carryCount: Number(data.carryCount ?? GHOST_THRESHOLD),
        firstScheduled: createdAt,
        daysSinceCreated,
      };
    });

    // Find the most common avoidance category
    const categoryCounts: Record<string, number> = {};
    for (const task of tasks) {
      categoryCounts[task.category] = (categoryCounts[task.category] ?? 0) + 1;
    }
    const ghostDomain =
      Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

    const avgCarryCount =
      tasks.reduce((sum, t) => sum + t.carryCount, 0) / tasks.length;

    const contextForMentor = [
      `GHOST TASKS DETECTED (tasks carried ${GHOST_THRESHOLD}+ times, never completed):`,
      ...tasks.map(
        (t) =>
          `- "${t.title}" [${t.category}] carried ${t.carryCount}x over ${t.daysSinceCreated} days`,
      ),
      `Ghost domain: ${ghostDomain ?? 'none'} | Avg carry: ${avgCarryCount.toFixed(1)}x`,
      `These are behavioral avoidance signals. The mentor must confront them directly.`,
    ].join('\n');

    return { count: tasks.length, tasks, ghostDomain, avgCarryCount, contextForMentor };
  } catch (error) {
    logger.warn('ghostTask.detect_failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { count: 0, tasks: [], ghostDomain: null, avgCarryCount: 0, contextForMentor: '' };
  }
};
