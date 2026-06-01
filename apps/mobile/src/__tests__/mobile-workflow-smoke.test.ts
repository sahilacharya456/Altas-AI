import { ROUTES } from '../constants/routes';
import { resolveInitialRoute } from '../navigation/resolveInitialRoute';
import {
  addTask,
  completeOnboarding,
  completeTask,
  createWorkflowState,
  generateReport,
  saveProfile,
  setFocusRunning,
  submitMentorPrompt,
  submitReflection,
} from '../workflows/mobileWorkflow';

describe('mobile workflow smoke contracts', () => {
  test('protects routes for unauthenticated and onboarding users', () => {
    expect(resolveInitialRoute({
      isInitialized: true,
      isLoading: false,
      isAuthenticated: false,
      profile: null,
    })).toBe(ROUTES.AUTH.WELCOME);

    expect(resolveInitialRoute({
      isInitialized: true,
      isLoading: false,
      isAuthenticated: true,
      profile: { onboardingCompleted: false },
    })).toBe(ROUTES.AUTH.ONBOARDING);
  });

  test('moves authenticated onboarding completion to dashboard state', () => {
    const state = completeOnboarding(createWorkflowState());
    expect(state.screen).toBe('dashboard');
    expect(state.loadState).toBe('ready');
  });

  test('creates and completes a task with visible list state', () => {
    const created = addTask(createWorkflowState(), 'Finish AltasAI audit');
    expect(created.tasks).toHaveLength(1);
    expect(created.loadState).toBe('success');

    const completed = completeTask(created, created.tasks[0].id);
    expect(completed.tasks[0].status).toBe('completed');
  });

  test('starts and stops focus mode', () => {
    const running = setFocusRunning(createWorkflowState(), true);
    expect(running.focusRunning).toBe(true);
    expect(setFocusRunning(running, false).focusRunning).toBe(false);
  });

  test('validates and submits reflections', () => {
    expect(submitReflection(createWorkflowState(), 'short').loadState).toBe('error');
    const submitted = submitReflection(createWorkflowState(), 'I completed one task but felt distracted.');
    expect(submitted.reflectionsSubmitted).toBe(1);
    expect(submitted.loadState).toBe('success');
  });

  test('keeps mentor useful when backend wording enhancement fails', () => {
    const state = submitMentorPrompt(createWorkflowState(), 'What should I do next?', false);
    expect(state.mentorMessages.at(-1)?.fallback).toBe(true);
    expect(state.mentorMessages.at(-1)?.text).toContain('internal fallback');
  });

  test('renders empty and generated report states', () => {
    expect(generateReport(createWorkflowState(), false).loadState).toBe('empty');
    const generated = generateReport(createWorkflowState(), true);
    expect(generated.loadState).toBe('success');
    expect(generated.reportsAvailable).toBe(1);
  });

  test('saves profile edit state', () => {
    const state = saveProfile({ ...createWorkflowState(), screen: 'profile', profileDirty: true });
    expect(state.profileDirty).toBe(false);
    expect(state.loadState).toBe('success');
  });
});
