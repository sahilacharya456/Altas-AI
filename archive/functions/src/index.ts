/**
 * ATLAS AI Cloud Functions — Entry Point
 * Split by domain for cold start optimization.
 * firebase-admin is initialized once in shared.ts.
 */

// Chat
export { chatWithMentor } from './mentor';

// Goals
export { generateGoalBreakdown } from './goals';

// Reflections
export { generateReflectionFeedback } from './reflections';

// Budget
export { analyzeBudgetDiscipline } from './budget';

// AI Engine
export {
    generateDailyBriefing,
    generateDailyReport,
    generateMonthlyReportPlaceholder,
    generateWeeklyReport,
    generateInterventions,
    generateSecurityAdvice,
} from './aiCallables';

// Intervention Engine
export {
    onInterventionTaskWrite,
    onInterventionDailyLogWrite,
    onInterventionBudgetWrite,
    onInterventionDigitalWrite,
    onInterventionSecurityWrite,
} from './interventionEngine';

// Cortex State Triggers
export { onTaskWrite, onGoalWrite, onDailyLogWrite } from './triggers';

// Manual test helper (not deployed as a Cloud Function, used in shell/tests)
export { testCortexRebuild } from './cortex';
