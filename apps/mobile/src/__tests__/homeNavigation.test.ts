import { quickModules } from '../features/home/constants';

/**
 * Verifies the home dashboard Quick Modules grid only exposes MVP-ready routes.
 * Prevents Finance/Khata, Health, News etc. from appearing on the home screen
 * until those features meet the demo bar.
 */
describe('Home dashboard quickModules', () => {
  const POSTPONED_PATHS = [
    '/(main)/khata',
    '/(main)/health',
    '/(main)/news',
    '/(main)/scan-link',
    '/(main)/device-safety',
    '/(main)/add-expense',
    '/(main)/expense-history',
    '/(main)/ledger',
    '/(main)/budget-insights',
    '/(main)/digital',
    '/(main)/behavior-timeline',
  ];

  const MVP_PATHS = [
    '/(main)/tasks',
    '/(main)/mentor',
    '/(main)/cortex',
    '/(main)/reports',
    '/(main)/goals',
    '/(main)/reflection',
    '/(main)/security',
    '/(main)/profile',
  ];

  test('does not expose any postponed routes in the home grid', () => {
    const modulePaths = quickModules.map(m => m.path);
    const leaking = modulePaths.filter(p => POSTPONED_PATHS.includes(p));
    expect(leaking).toEqual([]);
  });

  test('exposes all expected MVP routes in the home grid', () => {
    const modulePaths = quickModules.map(m => m.path);
    for (const expected of MVP_PATHS) {
      expect(modulePaths).toContain(expected);
    }
  });

  test('all quick module entries have required fields', () => {
    for (const mod of quickModules) {
      expect(mod.code).toBeTruthy();
      expect(mod.title).toBeTruthy();
      expect(mod.path).toBeTruthy();
    }
  });
});
