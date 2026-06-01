import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const describeRules = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;
const projectId = `altasai-rules-${Date.now()}`;

const taskPayload = (userId: string) => ({
  userId,
  title: 'Finish FYP report',
  description: 'Draft final section',
  category: 'study',
  priority: 'high',
  status: 'pending',
  estimatedMinutes: 45,
  tags: ['fyp'],
});

const goalPayload = (userId: string) => ({
  userId,
  title: 'Launch AltasAI',
  description: 'Portfolio release',
  category: 'career',
  priority: 'critical',
  status: 'active',
  progress: 25,
  milestones: [],
  aiBreakdown: [],
});

const reflectionPayload = (userId: string) => ({
  userId,
  mood: 3,
  energyLevel: 3,
  wins: ['finished one task'],
  struggles: ['distraction'],
  excusesMade: [],
  honestAssessment: 'I stayed honest about my day.',
  tomorrowPriority: 'Finish the report.',
  tasksCompleted: 1,
  tasksMissed: 0,
});

describeRules('Firestore security rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, '../../../../firestore.rules'), 'utf8'),
      },
    });
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('users can read and write only their own profile document', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const userB = testEnv.authenticatedContext('userB').firestore();

    await assertSucceeds(setDoc(doc(userA, 'users/userA/profile/data'), { displayName: 'A' }));
    await assertSucceeds(getDoc(doc(userA, 'users/userA/profile/data')));
    await assertFails(getDoc(doc(userB, 'users/userA/profile/data')));
    await assertFails(setDoc(doc(userA, 'users/userB/profile/data'), { displayName: 'Impersonation' }));
  });

  test('unauthenticated users are denied', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/userA/tasks/task1')));
    await assertFails(setDoc(doc(db, 'users/userA/tasks/task1'), taskPayload('userA')));
  });

  test('tasks, goals, and reflections enforce ownership and schema', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();

    await assertSucceeds(setDoc(doc(userA, 'users/userA/tasks/task1'), taskPayload('userA')));
    await assertFails(setDoc(doc(userA, 'users/userB/tasks/task1'), taskPayload('userB')));
    await assertFails(setDoc(doc(userA, 'users/userA/tasks/bad'), { userId: 'userA', title: '' }));

    await assertSucceeds(setDoc(doc(userA, 'users/userA/goals/goal1'), goalPayload('userA')));
    await assertFails(setDoc(doc(userA, 'users/userB/goals/goal1'), goalPayload('userB')));

    await assertSucceeds(setDoc(doc(userA, 'users/userA/dailyLogs/log1'), reflectionPayload('userA')));
    await assertFails(deleteDoc(doc(userA, 'users/userA/dailyLogs/log1')));
  });

  test('client cannot write server-owned AI collections', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const serverOwned = [
      'users/userA/conversations/c1',
      'users/userA/reports/r1',
      'users/userA/aiFeedback/f1',
      'users/userA/aiGatewayLogs/g1',
      'users/userA/aiReports/r1',
      'users/userA/cortex/riskState',
      'ai_parse_errors/e1',
      'rateLimits/userA',
    ];

    for (const target of serverOwned) {
      await assertFails(setDoc(doc(userA, target), { userId: 'userA', title: 'client write' }));
    }
  });

  test('interventions are client-readable, status-updatable only, and not freely mutable', async () => {
    const userA = testEnv.authenticatedContext('userA').firestore();
    const interventionRef = doc(userA, 'users/userA/interventions/i1');
    await assertSucceeds(setDoc(interventionRef, {
      userId: 'userA',
      type: 'task',
      severity: 'high',
      title: 'Reduce task load',
      reason: 'Too many active tasks.',
      recommendedAction: 'Pick three tasks.',
      sourceSignals: ['tasks.open_count'],
      status: 'active',
    }));

    await assertSucceeds(updateDoc(interventionRef, { status: 'accepted', updatedAt: new Date() }));
    await assertFails(updateDoc(interventionRef, { reason: 'client changed model reason' }));
  });
});
