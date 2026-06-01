import { Platform } from 'react-native';

// API Configuration
// Update BASE_URL based on your environment

const getDevBaseUrl = (): string => {
  // Allow manual override via Expo environment variables
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Resolve host based on running platform
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001'; // Android Emulator loopback
  }
  
  return 'http://localhost:3001'; // iOS Simulator or Expo Web
};

const DEV_BASE_URL = getDevBaseUrl();

const PROD_BASE_URL = 'https://api.altasai.app';

export const API_CONFIG = {
  BASE_URL: __DEV__ ? DEV_BASE_URL : PROD_BASE_URL,
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    ONBOARDING: '/auth/onboarding',
  },
  // Tasks
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    GET: (id: string) => `/tasks/${id}`,
    UPDATE: (id: string) => `/tasks/${id}`,
    DELETE: (id: string) => `/tasks/${id}`,
    COMPLETE: (id: string) => `/tasks/${id}/complete`,
    CARRY: (id: string) => `/tasks/${id}/carry`,
    SUMMARY_TODAY: '/tasks/summary/today',
  },
  // Goals
  GOALS: {
    LIST: '/goals',
    CREATE: '/goals',
    GET: (id: string) => `/goals/${id}`,
    UPDATE: (id: string) => `/goals/${id}`,
    DELETE: (id: string) => `/goals/${id}`,
    BREAKDOWN: (id: string) => `/goals/${id}/breakdown`,
  },
  // Mentor AI
  MENTOR: {
    CHAT: '/mentor/chat',
    CONVERSATIONS: '/mentor/conversations',
    CONVERSATION: (id: string) => `/mentor/conversations/${id}`,
  },
  // Health
  HEALTH: {
    RECORDS: '/health',
    WORKOUTS: '/health/workouts',
    MEALS: '/health/meals',
  },
  // Digital
  DIGITAL: {
    USAGE: '/digital/usage',
    SYNC: '/digital/sync',
    LIMITS: '/digital/limits',
  },
  // Reflection
  REFLECTION: {
    SUBMIT: '/reflection',
    HISTORY: '/reflection/history',
    GET: (date: string) => `/reflection/${date}`,
    STREAK: '/reflection/streak',
  },
  // Career
  CAREER: {
    PROFILE: '/career/profile',
    ROADMAP: '/career/roadmap',
    JOBS: '/career/jobs',
    SCHOLARSHIPS: '/career/scholarships',
  },
  // Analytics
  ANALYTICS: {
    SUMMARY: '/analytics/summary',
    DAILY: '/analytics/daily',
  },
  // Security
  SECURITY: {
    SCAN_URL: '/security/scan/url',
    SCAN_APP: '/security/scan/app',
    HISTORY: '/security/history',
  },
} as const;

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.VERSION}${endpoint}`;
};
