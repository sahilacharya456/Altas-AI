/**
 * Firestore Rules Unit Tests
 * Covers all critical security rules for ATLAS AI
 */

import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
    RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'atlas-ai-test';
const OWNER_UID = 'user_owner';
const OTHER_UID = 'user_other';

const VALID_TASK = {
    userId: OWNER_UID,
    title: 'Study TypeScript',
    category: 'study',
    priority: 'high',
    status: 'pending',
    estimatedMinutes: 60,
    isCarried: false,
    carryCount: 0,
    scheduledDate: new Date(),
    createdAt: new Date(),
};

const VALID_GOAL = {
    userId: OWNER_UID,
    title: 'Learn Firebase',
    category: 'study',
    priority: 'high',
    status: 'active',
    progress: 0,
    targetDate: new Date(),
    createdAt: new Date(),
};

const VALID_LOG = {
    userId: OWNER_UID,
    date: new Date(),
    mood: 4,
    energyLevel: 3,
    wins: ['Finished chapter 5'],
    struggles: ['Procrastinated'],
    honestAssessment: 'Decent day overall',
    tasksCompleted: 3,
    tasksMissed: 1,
    tasksCarried: 0,
    focusMinutes: 120,
    createdAt: new Date(),
};

const VALID_HEALTH_LOG = {
    userId: OWNER_UID,
    date: new Date(),
    sleepHours: 7,
    waterGlasses: 8,
    workoutMinutes: 30,
    workoutType: 'cardio',
    energyLevel: 4,
    overallHealth: 4,
    stressLevel: 2,
    routineScore: 82,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const VALID_DIGITAL_USAGE = {
    userId: OWNER_UID,
    date: new Date(),
    screenMinutes: 180,
    goalMinutes: 240,
    exceeded: false,
    distractionScore: 52,
    appCategory: 'study',
    createdAt: new Date(),
    updatedAt: new Date(),
};

const VALID_BUDGET = {
    userId: OWNER_UID,
    month: '2026-05',
    totalBudget: 15000,
    spent: 3000,
    categorySpent: {
        food: 1000,
        transport: 500,
        study: 500,
        rent: 0,
        entertainment: 500,
        misc: 500,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules },
    });
});

afterAll(async () => {
    await testEnv.cleanup();
});

afterEach(async () => {
    await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
    // ── Test 1: Owner CAN read own tasks/goals/logs ──
    describe('Authenticated owner reads', () => {
        test('owner can read own tasks', async () => {
            // Seed data via admin
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/tasks/t1`).set(VALID_TASK);
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/tasks/t1`).get());
        });

        test('owner can read own goals', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/goals/g1`).set(VALID_GOAL);
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/goals/g1`).get());
        });

        test('owner can read own daily logs', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/dailyLogs/2026-05-08`).set(VALID_LOG);
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/dailyLogs/2026-05-08`).get());
        });
    });

    // ── Test 2: Oversized payload DENIED ──
    describe('Payload size limits', () => {
        test('task with 2001-char title is DENIED', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            const oversizedTask = { ...VALID_TASK, title: 'x'.repeat(2001) };
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/tasks/t_big`).set(oversizedTask));
        });

        test('goal with 2001-char description is DENIED', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            const oversizedGoal = { ...VALID_GOAL, description: 'x'.repeat(2001) };
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/goals/g_big`).set(oversizedGoal));
        });
    });

    // ── Test 3: Cross-user write DENIED ──
    describe('Cross-user access', () => {
        test('other user CANNOT write to owner tasks', async () => {
            const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
            await assertFails(otherDb.doc(`users/${OWNER_UID}/tasks/t_hack`).set(VALID_TASK));
        });

        test('other user CANNOT read owner goals', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/goals/g1`).set(VALID_GOAL);
            });
            const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
            await assertFails(otherDb.doc(`users/${OWNER_UID}/goals/g1`).get());
        });
    });

    // ── Test 4: Unauthenticated access DENIED ──
    describe('Unauthenticated access', () => {
        test('unauthenticated CANNOT read tasks', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/tasks/t1`).set(VALID_TASK);
            });
            const unauthDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthDb.doc(`users/${OWNER_UID}/tasks/t1`).get());
        });

        test('unauthenticated CANNOT write tasks', async () => {
            const unauthDb = testEnv.unauthenticatedContext().firestore();
            await assertFails(unauthDb.doc(`users/${OWNER_UID}/tasks/t_anon`).set(VALID_TASK));
        });
    });

    // ── Test 5: Conversation writes BLOCKED ──
    describe('Conversation lockdown', () => {
        test('owner CANNOT write to conversations', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/conversations/c1`).set({
                contextType: 'general',
                messages: [],
                isActive: true,
                createdAt: new Date(),
                lastMessageAt: new Date(),
            }));
        });

        test('owner CAN read own conversations', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/conversations/c1`).set({
                    contextType: 'general', messages: [], isActive: true,
                    createdAt: new Date(), lastMessageAt: new Date(),
                });
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/conversations/c1`).get());
        });
    });

    // ── Test 6: Valid task write ALLOWED ──
    describe('Valid writes', () => {
        test('owner CAN create valid task', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/tasks/t_valid`).set(VALID_TASK));
        });

        test('owner CAN create valid goal', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/goals/g_valid`).set(VALID_GOAL));
        });

        test('owner CAN create valid daily log', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/dailyLogs/2026-05-08`).set(VALID_LOG));
        });
    });

    // ── Test 7: ai_cortex_state client write BLOCKED ──
    describe('Cortex state lockdown', () => {
        test('owner CANNOT write to ai_cortex_state', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/ai_cortex_state`).set({ data: 'test' }));
        });

        test('owner CAN read ai_cortex_state', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/ai_cortex_state`).set({ data: 'cached' });
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/ai_cortex_state`).get());
        });
    });

    describe('Support module validation', () => {
        test('owner CAN create valid health log', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/healthLogs/today`).set(VALID_HEALTH_LOG));
        });

        test('owner CANNOT create health log with impossible sleep', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/healthLogs/bad`).set({
                ...VALID_HEALTH_LOG,
                sleepHours: 20,
            }));
        });

        test('owner CAN create valid digital usage', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/digitalUsage/today`).set(VALID_DIGITAL_USAGE));
        });

        test('owner CANNOT create digital usage with invalid category', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/digitalUsage/bad`).set({
                ...VALID_DIGITAL_USAGE,
                appCategory: 'doomscroll',
            }));
        });

        test('owner CAN create valid budget', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/budgets/current`).set(VALID_BUDGET));
        });

        test('owner CANNOT spoof userId in a budget', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/budgets/spoof`).set({
                ...VALID_BUDGET,
                userId: OTHER_UID,
            }));
        });
    });

    describe('Server-only report artifacts', () => {
        test('owner CANNOT write reports directly', async () => {
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertFails(ownerDb.doc(`users/${OWNER_UID}/reports/daily_2026-05-28`).set({
                userId: OWNER_UID,
                type: 'daily',
                title: 'Daily Command Briefing',
                generatedAt: new Date(),
            }));
        });

        test('owner CAN read server-written reports', async () => {
            await testEnv.withSecurityRulesDisabled(async (ctx) => {
                await ctx.firestore().doc(`users/${OWNER_UID}/reports/daily_2026-05-28`).set({
                    userId: OWNER_UID,
                    type: 'daily',
                    title: 'Daily Command Briefing',
                    generatedAt: new Date(),
                });
            });
            const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
            await assertSucceeds(ownerDb.doc(`users/${OWNER_UID}/reports/daily_2026-05-28`).get());
        });
    });
});
