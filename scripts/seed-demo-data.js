#!/usr/bin/env node

/**
 * Seed minimal Atlas demo data into the Firestore emulator.
 *
 * Requirements:
 * - Firebase emulators running: firebase emulators:start --only firestore,auth
 * - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
 *
 * This script intentionally refuses to run against production Firestore.
 */

const admin = require('firebase-admin');

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Refusing to seed: FIRESTORE_EMULATOR_HOST is not set.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'atlas-ai-test' });
}

const db = admin.firestore();
const uid = process.env.ATLAS_DEMO_UID || 'demo_user';
const now = admin.firestore.Timestamp.now();

async function main() {
  const user = db.collection('users').doc(uid);
  await user.collection('profile').doc('data').set({
    userId: uid,
    email: 'demo@atlas.local',
    displayName: 'Atlas Demo',
    disciplineLevel: 'strict',
    focusAreas: ['study', 'health'],
    lifeRhythm: { wakeTime: '07:00', sleepTime: '23:00', timezone: 'Asia/Karachi' },
    currentScores: { discipline: 72, productivity: 68, consistency: 61 },
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  await user.collection('tasks').doc('demo_task_1').set({
    userId: uid,
    title: 'Finish Atlas demo focus block',
    category: 'study',
    priority: 'high',
    status: 'pending',
    scheduledDate: now,
    estimatedMinutes: 45,
    isCarried: false,
    carryCount: 0,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  await user.collection('dailyLogs').doc('demo_today').set({
    userId: uid,
    date: now,
    mood: 4,
    energyLevel: 3,
    wins: ['Started production readiness work'],
    struggles: ['Too many open loops'],
    honestAssessment: 'Need to keep execution narrow.',
    tasksCompleted: 1,
    tasksMissed: 0,
    tasksCarried: 0,
    focusMinutes: 45,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  console.log(`Seeded demo data for ${uid}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
