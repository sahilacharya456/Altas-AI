import { Timestamp } from 'firebase/firestore';
import { buildLocalTaskFallback, isTaskCreateLocalFallbackError } from '../utils/taskFallback';

describe('task create local fallback', () => {
  test('classifies Firestore/network create failures as local fallback eligible', () => {
    expect(isTaskCreateLocalFallbackError(new Error('Missing or insufficient permissions.'))).toBe(true);
    expect(isTaskCreateLocalFallbackError(new Error('Network request failed'))).toBe(true);
    expect(isTaskCreateLocalFallbackError(new Error('Validation failed'))).toBe(false);
  });

  test('builds a session-local pending task with Firestore-safe timestamps', () => {
    const scheduledDate = new Date('2026-06-20T09:30:00.000Z');
    const now = Timestamp.fromDate(new Date('2026-06-20T08:00:00.000Z'));

    const task = buildLocalTaskFallback({
      userId: 'user-1',
      title: 'Write fallback tests',
      category: 'study',
      priority: 'high',
      status: 'pending',
      estimatedMinutes: 45,
      scheduledDate,
      source: 'manual',
    }, 'local_test', now);

    expect(task).toMatchObject({
      id: 'local_test',
      userId: 'user-1',
      title: 'Write fallback tests',
      category: 'study',
      priority: 'high',
      status: 'pending',
      estimatedMinutes: 45,
      isCarried: false,
      carryCount: 0,
      source: 'manual',
    });
    expect(task.scheduledDate.toDate().toISOString()).toBe('2026-06-20T09:30:00.000Z');
    expect(task.createdAt).toBe(now);
  });
});
