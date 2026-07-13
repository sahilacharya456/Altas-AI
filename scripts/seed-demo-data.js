#!/usr/bin/env node

/**
 * Seed AltasAI demo data into the Firestore emulator only.
 *
 * Requirements:
 * - Firebase emulators running: firebase emulators:start --only firestore,auth
 * - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 *
 * This script refuses to run without FIRESTORE_EMULATOR_HOST and only accepts
 * localhost emulator hosts. It never writes to production Firestore.
 */

const admin = require('firebase-admin');

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not set.');
  process.exit(1);
}

if (!/^(127\.0\.0\.1|localhost|\[::1\]|::1):\d+$/.test(emulatorHost)) {
  console.error(`Refusing to seed: FIRESTORE_EMULATOR_HOST must be localhost, got "${emulatorHost}".`);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'altasai-emulator' });
}

const db = admin.firestore();
const uid = process.env.ALTASAI_DEMO_UID || 'demo_user';

const nowDate = new Date();
const tomorrowDate = new Date(nowDate);
tomorrowDate.setDate(nowDate.getDate() + 1);
tomorrowDate.setHours(9, 0, 0, 0);

const yesterdayDate = new Date(nowDate);
yesterdayDate.setDate(nowDate.getDate() - 1);
yesterdayDate.setHours(8, 30, 0, 0);

const todayId = nowDate.toISOString().slice(0, 10);
const now = admin.firestore.Timestamp.fromDate(nowDate);
const tomorrow = admin.firestore.Timestamp.fromDate(tomorrowDate);
const yesterday = admin.firestore.Timestamp.fromDate(yesterdayDate);

async function seedUserProfile(user) {
  await user.collection('profile').doc('data').set({
    userId: uid,
    email: 'demo@altasai.local',
    displayName: 'AltasAI Demo',
    disciplineLevel: 'strict',
    focusAreas: ['career', 'study', 'health'],
    lifeRhythm: {
      wakeTime: '06:30',
      sleepTime: '22:30',
      workStartTime: '09:00',
      workEndTime: '17:30',
      timezone: 'Asia/Karachi',
    },
    currentScores: { discipline: 72, productivity: 68, consistency: 61 },
    onboardingCompleted: true,
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });
}

async function seedTasks(user) {
  await user.collection('tasks').doc('demo_task_focus').set({
    userId: uid,
    title: 'Complete AltasAI proof review fixture',
    description: 'Use this task to test proof submission and mentor fallback behavior.',
    category: 'study',
    priority: 'high',
    status: 'pending',
    scheduledDate: tomorrow,
    estimatedMinutes: 45,
    isCarried: false,
    carryCount: 0,
    source: 'manual',
    tags: ['demo', 'proof'],
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });

  await user.collection('tasks').doc('demo_task_carried').set({
    userId: uid,
    title: 'Clean up one stale planning note',
    description: 'Carried task fixture for summary and debt checks.',
    category: 'personal',
    priority: 'medium',
    status: 'pending',
    scheduledDate: tomorrow,
    estimatedMinutes: 25,
    isCarried: true,
    carryCount: 2,
    source: 'manual',
    tags: ['demo', 'carried'],
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });

  await user.collection('tasks').doc('demo_task_done').set({
    userId: uid,
    title: 'Finish yesterday focus block',
    description: 'Completed task fixture for analytics cards.',
    category: 'career',
    priority: 'medium',
    status: 'completed',
    scheduledDate: yesterday,
    estimatedMinutes: 30,
    actualMinutes: 32,
    isCarried: false,
    carryCount: 0,
    source: 'manual',
    completedAt: now,
    proofStatus: 'verified',
    proofScore: 88,
    proofFeedback: 'Specific evidence accepted.',
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });
}

async function seedGoals(user) {
  await user.collection('goals').doc('demo_goal_execution').set({
    userId: uid,
    title: 'Ship a stable AltasAI daily loop',
    description: 'Demo goal with milestones that can be converted into tasks.',
    category: 'career',
    priority: 'high',
    targetDate: tomorrow,
    status: 'active',
    progress: 40,
    milestones: [
      { title: 'Create one task from a milestone', completed: false },
      { title: 'Complete one focus session', completed: true, completedAt: yesterday },
      { title: 'Submit proof for a completed task', completed: false },
    ],
    aiBreakdown: [
      'Confirm launch config',
      'Run one Android-device smoke pass',
      'Document remaining setup gaps',
    ],
    linkedTaskIds: ['demo_task_focus'],
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });
}

async function seedDailyLoop(user) {
  await user.collection('focusSessions').doc('demo_focus_session').set({
    userId: uid,
    taskId: 'demo_task_done',
    goalId: 'demo_goal_execution',
    startedAt: yesterday,
    endedAt: now,
    durationMinutes: 32,
    plannedMinutes: 30,
    status: 'completed',
    quality: 4,
    notes: 'Focused session completed without switching tasks.',
    createdAt: yesterday,
    updatedAt: now,
  }, { merge: true });

  await user.collection('dailyLogs').doc(`${uid}_${todayId}`).set({
    userId: uid,
    date: now,
    mood: 4,
    energyLevel: 3,
    wins: ['Finished a focused AltasAI stabilization pass'],
    struggles: ['Too many open loops before prioritization'],
    excusesMade: ['Waited too long to narrow scope'],
    honestAssessment: 'Execution improves when the next action is visible and small.',
    tomorrowPriority: 'Run Android device smoke QA',
    tasksCompleted: 1,
    tasksMissed: 0,
    tasksCarried: 1,
    focusMinutes: 32,
    productivityScore: 68,
    disciplineScore: 72,
    mentorFeedback: 'Protect the first focused block and finish one proof-backed task.',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
}

async function seedMentorAndProof(user) {
  await user.collection('conversations').doc('demo_mentor_thread').set({
    contextType: 'reflection',
    isActive: true,
    messages: [
      { role: 'user', content: 'What should I do next?', timestamp: nowDate },
      { role: 'assistant', content: 'Pick one task, start a 25-minute block, then submit proof.', timestamp: nowDate, offline: true, provider: 'internal' },
    ],
    createdAt: yesterday,
    lastMessageAt: now,
    updatedAt: now,
  }, { merge: true });

  const proofItems = [
    { id: 'demo_feed_1', category: 'study', proofType: 'text', taskTitleMasked: 'Completed proof review...', score: 88 },
    { id: 'demo_feed_2', category: 'career', proofType: 'github_link', taskTitleMasked: 'Fixed reflection fallback...', score: 91 },
    { id: 'demo_feed_3', category: 'health', proofType: 'study_notes', taskTitleMasked: 'Logged recovery routine...', score: 79 },
  ];

  for (const item of proofItems) {
    await db.collection('proofFeed').doc(item.id).set({
      category: item.category,
      categoryLabel: item.category[0].toUpperCase() + item.category.slice(1),
      proofType: item.proofType,
      taskTitleMasked: item.taskTitleMasked,
      score: item.score,
      disciplineMode: 'strict',
      publishedAt: now,
    }, { merge: true });
  }
}

async function main() {
  const user = db.collection('users').doc(uid);
  await seedUserProfile(user);
  await seedTasks(user);
  await seedGoals(user);
  await seedDailyLoop(user);
  await seedMentorAndProof(user);

  console.log(`Seeded AltasAI emulator demo data for ${uid} (${todayId}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
