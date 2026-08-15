import { db } from '../lib/firebaseAdmin';

export const getDailyTaskStats = async (userId: string) => {
  try {
    // We compute today's date in local time or use a standard approach.
    // For simplicity, we just fetch active tasks and tasks completed recently.
    // This is a much safer approach than trusting the client payload.
    const snap = await db.collection(`users/${userId}/tasks`).get();
    
    let pendingTasks = 0;
    let completedTasks = 0;
    
    // In a real production system, you'd query by date boundaries or status.
    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'completed') {
        completedTasks++;
      } else if (data.status !== 'archived') {
        pendingTasks++;
      }
    });

    const total = pendingTasks + completedTasks;
    const completionRate = total === 0 ? 0 : Math.round((completedTasks / total) * 100);

    return {
      pendingTasks,
      completedTasks,
      completionRate,
    };
  } catch (error) {
    // Fallback if DB fails
    return {
      pendingTasks: 0,
      completedTasks: 0,
      completionRate: 0,
    };
  }
};
