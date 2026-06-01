/**
 * Data Services - Central Export
 */

// Tasks
export {
    createTask,
    getTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
    cancelTask,
    carryTask,
    getTasksForDate,
    getTodaysTasks,
    subscribeToTodaysTasks,
    getTaskSummary,
    getTasksByStatus,
    getCarriedTasks,
} from './tasks';

// Focus Sessions
export {
    startFocusSession,
    completeFocusSession,
    cancelFocusSession,
    getFocusSessionsForTask,
} from './focusSessions';

// Behavior Events and Cortex
export {
    createBehaviorEvent,
    listRecentBehaviorEvents,
    createTaskBehaviorEvent,
} from './behaviorEvents';

export {
    getCortexRiskState,
    getCortexDocument,
    getRecentCortexEvents,
    calculateLocalRiskState,
} from './cortex';

// Interventions
export {
    listActiveInterventions,
    updateInterventionStatus,
    acceptIntervention,
    ignoreIntervention,
    completeIntervention,
    createTaskFromIntervention,
} from './interventions';

// Goals
export {
    createGoal,
    getGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateGoalProgress,
    completeMilestone,
    getActiveGoals,
    getAllGoals,
    subscribeToActiveGoals,
    getGoalsByCategory,
    storeAIBreakdown,
} from './goals';

// Daily Logs
export {
    submitDailyLog,
    getDailyLog,
    getTodaysLog,
    updateDailyLog,
    addMentorFeedback,
    getDailyLogHistory,
    subscribeToTodaysLog,
    getReflectionStreak,
    getAverageMood,
} from './dailyLogs';

// Profile
export {
    getProfile,
    updateProfile,
    completeOnboarding,
    updateDisciplineLevel,
    updateScores,
    updateLifeRhythm,
    subscribeToProfile,
} from './profile';

// Analytics
export {
    getTodaySnapshot,
    saveSnapshot,
    getAnalyticsHistory,
    calculateTodayAnalytics,
    getDashboardSummary,
    getChartData,
    calculateScoreUpdates,
} from './analytics';

// Reports
export {
    getReport,
    listReports,
    listReportsByType,
    getLatestReport,
} from './reports';

// Security
export {
    logSecurityEvent,
    getSecurityEvent,
    resolveSecurityEvent,
    getRecentSecurityEvents,
    getUnresolvedEvents,
    getEventsBySeverity,
    subscribeToUnresolvedEvents,
    logPhishingAttempt,
    logSuspiciousUrl,
    logBehaviorAlert,
    getSecuritySummary,
    checkUrlSafety,
} from './security';

// Intelligence (Behavioral Analysis)
export {
    analyzeBehaviorPatterns,
    buildIntelligentContext,
    detectExcuses,
} from './intelligence';
export type { BehavioralPattern } from './intelligence';

// Digital Discipline
export {
    logDigitalUsage,
    getDigitalUsage,
    getTodaysUsage,
    getUsageHistory,
    getUnderGoalStreak,
    getWeeklyAverage,
    subscribeToTodaysUsage,
    getDigitalSummary,
} from './digitalUsage';

// Health & Recovery
export {
    logHealthData,
    getHealthLog,
    getTodaysHealth,
    getHealthHistory,
    getWorkoutStreak,
    getAverageSleep,
    getWellnessSummary,
} from './health';

// Smart Khata - Expenses
export {
    addExpense,
    getExpense,
    getMonthExpenses,
    getCurrentMonthExpenses,
    getExpensesInRange,
    getRecentExpenses,
    updateExpense,
    deleteExpense,
    calculateTotal,
    groupByCategory,
    getDailyTotals,
    getTopCategory,
} from './expenses';

// Smart Khata - Budget
export {
    getOrCreateBudget,
    getCurrentBudget,
    updateBudgetTotal,
    addExpenseToBudget,
    subtractExpenseFromBudget,
    getBudgetForMonth,
    calculateBudgetStatus,
    checkCategoryLimits,
} from './budget';

// Smart Khata - Khata Ledger
export {
    addKhataEntry,
    getKhataEntry,
    getAllKhataEntries,
    getPendingKhataEntries,
    getKhataByPerson,
    groupByPerson,
    settleKhataEntry,
    partialSettleKhataEntry,
    deleteKhataEntry,
    calculateNetBalance,
    getBorrowFrequency,
    getOverdueEntries,
    getPersonBalance,
} from './khata';

