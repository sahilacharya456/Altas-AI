/**
 * Execution DNA Archetype Engine
 *
 * Analyzes the user's behavioral task data to produce a personalized
 * "Execution DNA" profile:
 *   - Completion rates per task category
 *   - Peak execution day-of-week and hour-of-day
 *   - Ghost domain (most avoided category)
 *   - A named archetype label (e.g., "Sprint Avoider", "Morning Executioner")
 *
 * This is injected into the weekly report, making every report uniquely
 * fingerprinted to that individual's behavioral pattern.
 *
 * No productivity tool on the market automatically generates and names
 * a user's execution archetype from real task completion data.
 */

import { db, Timestamp } from '../lib/firebaseAdmin';
import { logger } from '../utils/logger';

export interface ExecutionDNA {
  archetype: string;
  archetypeDescription: string;
  categoryRates: Record<string, { completed: number; total: number; rate: number }>;
  peakDay: string | null;
  peakHour: number | null;
  ghostDomain: string | null;
  strongDomain: string | null;
  contextForReport: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ARCHETYPES: Array<{ label: string; description: string; condition: (dna: Partial<ExecutionDNA> & { avgRate: number }) => boolean }> = [
  {
    label: 'Morning Executioner',
    description: 'You do your best work before noon. Your execution rate drops sharply after lunch.',
    condition: (d) => (d.peakHour ?? 12) < 12 && d.avgRate >= 65,
  },
  {
    label: 'Night Architect',
    description: 'You plan and execute primarily in late hours. Mornings are your planning void.',
    condition: (d) => (d.peakHour ?? 0) >= 20,
  },
  {
    label: 'Sprint Avoider',
    description: 'You start tasks but rarely complete them in the scheduled window, relying on carries.',
    condition: (d) => d.avgRate < 45,
  },
  {
    label: 'Domain Champion',
    description: `You dominate one category but systematically avoid another.`,
    condition: (d) => Boolean(d.strongDomain) && Boolean(d.ghostDomain) && d.strongDomain !== d.ghostDomain,
  },
  {
    label: 'Consistent Executor',
    description: 'Balanced execution across categories and time. Rare and highly disciplined.',
    condition: (d) => d.avgRate >= 75,
  },
  {
    label: 'Deadline Rusher',
    description: 'Your execution peaks toward the end of the week. You work on pressure.',
    condition: (d) => ['Thursday', 'Friday', 'Saturday'].includes(d.peakDay ?? ''),
  },
  {
    label: 'Early Week Builder',
    description: 'Monday and Tuesday are your power days. Energy declines midweek.',
    condition: (d) => ['Monday', 'Tuesday'].includes(d.peakDay ?? ''),
  },
];

export const buildExecutionDNA = async (userId: string): Promise<ExecutionDNA> => {
  const EMPTY: ExecutionDNA = {
    archetype: 'Uncharted',
    archetypeDescription: 'Not enough execution data yet to identify your pattern.',
    categoryRates: {},
    peakDay: null,
    peakHour: null,
    ghostDomain: null,
    strongDomain: null,
    contextForReport: '',
  };

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db
      .collection(`users/${userId}/tasks`)
      .where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      .limit(300)
      .get();

    if (snapshot.size < 5) return EMPTY;

    const categoryRates: Record<string, { completed: number; total: number }> = {};
    const dayCompletions: Record<number, number> = {}; // 0=Sun … 6=Sat
    const hourCompletions: Record<number, number> = {}; // 0–23

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const category = typeof data.category === 'string' ? data.category : 'personal';
      const status = typeof data.status === 'string' ? data.status : '';
      const isCompleted = status === 'completed';

      if (!categoryRates[category]) categoryRates[category] = { completed: 0, total: 0 };
      categoryRates[category].total++;
      if (isCompleted) {
        categoryRates[category].completed++;

        const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;
        if (updatedAt) {
          const day = updatedAt.getDay();
          const hour = updatedAt.getHours();
          dayCompletions[day] = (dayCompletions[day] ?? 0) + 1;
          hourCompletions[hour] = (hourCompletions[hour] ?? 0) + 1;
        }
      }
    }

    const ratedCategories = Object.entries(categoryRates)
      .filter(([, v]) => v.total >= 2)
      .map(([cat, v]) => ({ cat, rate: v.completed / v.total }));

    const ghostDomain = ratedCategories.sort((a, b) => a.rate - b.rate)[0]?.cat ?? null;
    const strongDomain = ratedCategories.sort((a, b) => b.rate - a.rate)[0]?.cat ?? null;

    const peakDayNum = Object.entries(dayCompletions).sort(([, a], [, b]) => b - a)[0];
    const peakDay = peakDayNum ? DAYS[Number(peakDayNum[0])] : null;

    const peakHourEntry = Object.entries(hourCompletions).sort(([, a], [, b]) => b - a)[0];
    const peakHour = peakHourEntry ? Number(peakHourEntry[0]) : null;

    const totalCompleted = Object.values(categoryRates).reduce((s, v) => s + v.completed, 0);
    const totalTasks = Object.values(categoryRates).reduce((s, v) => s + v.total, 0);
    const avgRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    const dnaInput = { peakDay, peakHour, ghostDomain, strongDomain, avgRate };

    const matched = ARCHETYPES.find((a) => a.condition(dnaInput));
    const archetype = matched?.label ?? 'Adaptive Executor';
    const archetypeDescription = matched?.description ?? 'Your execution pattern is unique and does not fit a single archetype.';

    const categoryRatesFormatted: ExecutionDNA['categoryRates'] = {};
    for (const [cat, v] of Object.entries(categoryRates)) {
      categoryRatesFormatted[cat] = { ...v, rate: Math.round((v.completed / v.total) * 100) };
    }

    const categoryLines = Object.entries(categoryRatesFormatted)
      .sort(([, a], [, b]) => b.rate - a.rate)
      .map(([cat, v]) => `  ${cat}: ${v.rate}% (${v.completed}/${v.total})`);

    const contextForReport = [
      `EXECUTION DNA ARCHETYPE: "${archetype}"`,
      `→ ${archetypeDescription}`,
      `Overall completion rate (30d): ${Math.round(avgRate)}%`,
      `Peak execution: ${peakDay ?? 'unknown'} around ${peakHour !== null ? `${peakHour}:00` : 'unknown'}`,
      `Strong domain: ${strongDomain ?? 'none'} | Ghost domain: ${ghostDomain ?? 'none'}`,
      `Category breakdown:`,
      ...categoryLines,
    ].join('\n');

    return {
      archetype,
      archetypeDescription,
      categoryRates: categoryRatesFormatted,
      peakDay,
      peakHour,
      ghostDomain,
      strongDomain,
      contextForReport,
    };
  } catch (error) {
    logger.warn('executionDNA.build_failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return EMPTY;
  }
};
