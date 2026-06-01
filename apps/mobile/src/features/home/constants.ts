import { ROUTES } from '../../constants/routes';
import type { Task } from '../../types/firestore';
import type { QuickModule } from './types';

// Only MVP-ready routes. Finance and Health are postponed — they link to
// ComingSoonScreen until the features meet the demo bar (see featureFlags.ts).
export const quickModules: QuickModule[] = [
  { code: 'EX', title: 'Execute', subtitle: 'Today tasks', path: ROUTES.MAIN.TASKS },
  { code: 'AI', title: 'Mentor', subtitle: 'Ask AltasAI', path: ROUTES.MAIN.MENTOR },
  { code: 'CX', title: 'Cortex', subtitle: 'Patterns', path: ROUTES.MAIN.CORTEX },
  { code: 'RP', title: 'Reports', subtitle: 'Briefings', path: ROUTES.MAIN.REPORTS },
  { code: 'GL', title: 'Goals', subtitle: 'Long-term', path: ROUTES.MAIN.GOALS },
  { code: 'RX', title: 'Reflect', subtitle: 'Daily log', path: ROUTES.MAIN.REFLECTION },
  { code: 'SH', title: 'Shield', subtitle: 'Security', path: ROUTES.MAIN.SECURITY },
  { code: 'PR', title: 'Profile', subtitle: 'Settings', path: ROUTES.MAIN.PROFILE },
];

export const priorityRank: Record<Task['priority'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};
