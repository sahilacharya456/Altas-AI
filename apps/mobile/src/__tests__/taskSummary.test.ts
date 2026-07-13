import { buildTaskSummary } from '../utils/taskSummary';

describe('buildTaskSummary', () => {
  it('counts status-carried and isCarried tasks as carried debt', () => {
    const summary = buildTaskSummary([
      { status: 'completed', isCarried: false },
      { status: 'pending', isCarried: true },
      { status: 'carried', isCarried: false },
      { status: 'in_progress', isCarried: false },
    ]);

    expect(summary).toEqual({
      total: 4,
      completed: 1,
      pending: 2,
      carried: 2,
      completionRate: 25,
    });
  });

  it('returns a zero summary for an empty list', () => {
    expect(buildTaskSummary([])).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      carried: 0,
      completionRate: 0,
    });
  });
});
