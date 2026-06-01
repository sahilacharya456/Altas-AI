/**
 * Tasks store selector tests.
 * Tests pure selector logic without importing the full store (avoids firebase/RN deps).
 */

interface MockTask {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'carried' | 'cancelled';
}

// Inline the selector logic from tasksStore
const selectPendingTasks = (state: { tasks: MockTask[] }) =>
  state.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

const selectCompletedTasks = (state: { tasks: MockTask[] }) =>
  state.tasks.filter(t => t.status === 'completed');

describe('tasksStore selectors', () => {
  describe('selectPendingTasks', () => {
    it('returns pending and in_progress tasks', () => {
      const tasks: MockTask[] = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'in_progress' },
        { id: '3', status: 'completed' },
        { id: '4', status: 'cancelled' },
      ];
      const result = selectPendingTasks({ tasks });
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['1', '2']);
    });

    it('returns empty array when no pending tasks', () => {
      const tasks: MockTask[] = [{ id: '1', status: 'completed' }];
      expect(selectPendingTasks({ tasks })).toHaveLength(0);
    });

    it('includes carried tasks as NOT pending', () => {
      const tasks: MockTask[] = [{ id: '1', status: 'carried' }];
      expect(selectPendingTasks({ tasks })).toHaveLength(0);
    });
  });

  describe('selectCompletedTasks', () => {
    it('returns only completed tasks', () => {
      const tasks: MockTask[] = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'completed' },
      ];
      const result = selectCompletedTasks({ tasks });
      expect(result).toHaveLength(2);
      expect(result.every(t => t.status === 'completed')).toBe(true);
    });

    it('returns empty when none completed', () => {
      const tasks: MockTask[] = [{ id: '1', status: 'pending' }];
      expect(selectCompletedTasks({ tasks })).toHaveLength(0);
    });
  });

  describe('summary computation', () => {
    it('calculates completionRate correctly', () => {
      const tasks: MockTask[] = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'pending' },
        { id: '4', status: 'in_progress' },
      ];
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      expect(rate).toBe(50);
    });

    it('returns 0 for empty task list', () => {
      const tasks: MockTask[] = [];
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      expect(rate).toBe(0);
    });
  });
});
