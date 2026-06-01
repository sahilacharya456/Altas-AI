import type { FeedItem } from './types';

export const topics = ['For You', 'AI', 'Business', 'Health', 'Security', 'Productivity'];

export const feedItems: FeedItem[] = [
  {
    id: 'ai-agent-workflows',
    source: 'AltasAI Digest',
    category: 'AI',
    title: 'Agent workflows are moving from demos into daily productivity systems',
    summary: 'Teams are pairing AI assistants with task queues, calendars, and review loops to reduce context switching.',
    readTime: '4 min',
    freshness: 'Today',
    priority: 'Top Story',
  },
  {
    id: 'focus-recovery',
    source: 'Discipline Lab',
    category: 'Productivity',
    title: 'The strongest focus blocks now include planned recovery windows',
    summary: 'Short reset breaks after deep work are outperforming long grind sessions for consistency and retention.',
    readTime: '3 min',
    freshness: 'Today',
    priority: 'For You',
  },
  {
    id: 'security-habits',
    source: 'Shield Brief',
    category: 'Security',
    title: 'Personal security habits are becoming part of wellness tracking',
    summary: 'Password hygiene, scam awareness, and device checks are being measured like sleep, training, and budget habits.',
    readTime: '5 min',
    freshness: 'Yesterday',
    priority: 'Deep Dive',
  },
  {
    id: 'spending-patterns',
    source: 'Money Systems',
    category: 'Business',
    title: 'Micro-budget reviews help users catch spending drift earlier',
    summary: 'Weekly category snapshots are easier to act on than large monthly summaries after the money is already gone.',
    readTime: '2 min',
    freshness: 'Yesterday',
    priority: 'Quick Read',
  },
  {
    id: 'health-discipline',
    source: 'Human OS',
    category: 'Health',
    title: 'Sleep timing remains the highest leverage input for discipline scores',
    summary: 'Consistent sleep and wake windows make habit completion more predictable than motivation-based planning.',
    readTime: '4 min',
    freshness: '2 days ago',
    priority: 'For You',
  },
];
