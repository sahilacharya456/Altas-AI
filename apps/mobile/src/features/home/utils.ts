import type { RiskLevel } from '../../components/feedback';
import type { Task } from '../../types/firestore';

export const getTaskDate = (value: Task['scheduledDate']) => {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return value.toDate();
  }
  return new Date();
};

export const formatTaskTime = (task: Task) => {
  const date = getTaskDate(task.scheduledDate);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getRiskLevel = (risk: number): RiskLevel => {
  if (risk >= 80) return 'critical';
  if (risk >= 60) return 'high';
  if (risk >= 35) return 'medium';
  return 'low';
};
