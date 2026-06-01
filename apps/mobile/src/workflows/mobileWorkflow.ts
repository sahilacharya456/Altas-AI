export type LoadState = 'idle' | 'loading' | 'ready' | 'empty' | 'error' | 'success';

export interface SmokeTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface WorkflowState {
  screen: 'welcome' | 'onboarding' | 'dashboard' | 'tasks' | 'focus' | 'reflection' | 'mentor' | 'reports' | 'profile';
  loadState: LoadState;
  tasks: SmokeTask[];
  focusRunning: boolean;
  reflectionsSubmitted: number;
  mentorMessages: Array<{ role: 'user' | 'assistant'; text: string; fallback?: boolean }>;
  reportsAvailable: number;
  profileDirty: boolean;
  error: string | null;
}

export const createWorkflowState = (): WorkflowState => ({
  screen: 'welcome',
  loadState: 'idle',
  tasks: [],
  focusRunning: false,
  reflectionsSubmitted: 0,
  mentorMessages: [],
  reportsAvailable: 0,
  profileDirty: false,
  error: null,
});

export const completeOnboarding = (state: WorkflowState): WorkflowState => ({
  ...state,
  screen: 'dashboard',
  loadState: 'ready',
});

export const addTask = (state: WorkflowState, title: string): WorkflowState => {
  if (!title.trim()) return { ...state, loadState: 'error', error: 'Task title is required.' };
  return {
    ...state,
    screen: 'tasks',
    loadState: 'success',
    tasks: [...state.tasks, { id: `task-${state.tasks.length + 1}`, title: title.trim(), status: 'pending' }],
    error: null,
  };
};

export const completeTask = (state: WorkflowState, taskId: string): WorkflowState => ({
  ...state,
  tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: 'completed' } : task),
});

export const setFocusRunning = (state: WorkflowState, focusRunning: boolean): WorkflowState => ({
  ...state,
  screen: 'focus',
  focusRunning,
  loadState: 'ready',
});

export const submitReflection = (state: WorkflowState, text: string): WorkflowState => {
  if (text.trim().length < 10) return { ...state, screen: 'reflection', loadState: 'error', error: 'Reflection needs more detail.' };
  return { ...state, screen: 'reflection', reflectionsSubmitted: state.reflectionsSubmitted + 1, loadState: 'success', error: null };
};

export const submitMentorPrompt = (state: WorkflowState, text: string, apiAvailable: boolean): WorkflowState => {
  if (!text.trim()) return { ...state, screen: 'mentor', loadState: 'error', error: 'Mentor prompt is required.' };
  const assistant = apiAvailable
    ? 'AltasAI internal plan is ready.'
    : 'AltasAI internal fallback is active. Pick one next action and execute for 10 minutes.';
  return {
    ...state,
    screen: 'mentor',
    loadState: 'success',
    mentorMessages: [
      ...state.mentorMessages,
      { role: 'user', text: text.trim() },
      { role: 'assistant', text: assistant, fallback: !apiAvailable },
    ],
    error: null,
  };
};

export const generateReport = (state: WorkflowState, hasSignals: boolean): WorkflowState => ({
  ...state,
  screen: 'reports',
  loadState: hasSignals ? 'success' : 'empty',
  reportsAvailable: hasSignals ? state.reportsAvailable + 1 : state.reportsAvailable,
});

export const saveProfile = (state: WorkflowState): WorkflowState => ({
  ...state,
  screen: 'profile',
  profileDirty: false,
  loadState: 'success',
});
