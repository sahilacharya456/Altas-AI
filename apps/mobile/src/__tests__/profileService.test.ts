const timestamp = { seconds: 1, nanoseconds: 0 };

jest.mock('../services/firebase', () => ({
  Timestamp: {
    now: jest.fn(() => timestamp),
  },
  getDocument: jest.fn(),
  setDocument: jest.fn(),
  subscribeToDocument: jest.fn(),
}));

describe('profile data service defaults', () => {
  test('buildProfileUpdatePayload creates Firestore-safe defaults for missing profiles', async () => {
    const { buildProfileUpdatePayload } = await import('../services/data/profile');

    expect(buildProfileUpdatePayload(null, { displayName: '  Sahil  ' })).toEqual({
      email: '',
      displayName: 'Sahil',
      createdAt: timestamp,
      disciplineLevel: 'strict',
      focusAreas: [],
      lifeRhythm: {
        wakeTime: '06:00',
        sleepTime: '22:00',
      },
      currentScores: {
        discipline: 50,
        productivity: 50,
        consistency: 50,
      },
      onboardingCompleted: false,
    });
  });

  test('buildProfileUpdatePayload preserves current profile fields while merging edits', async () => {
    const { buildProfileUpdatePayload } = await import('../services/data/profile');
    const createdAt = { seconds: 10, nanoseconds: 0 };

    expect(buildProfileUpdatePayload({
      email: 'user@example.com',
      displayName: 'Old Name',
      createdAt: createdAt as any,
      disciplineLevel: 'mentor',
      focusAreas: ['study'],
      lifeRhythm: { wakeTime: '07:00', sleepTime: '23:00', timezone: 'Asia/Karachi' },
      currentScores: { discipline: 60, productivity: 70, consistency: 80 },
      onboardingCompleted: true,
    }, {
      lifeRhythm: { wakeTime: '06:30' },
      focusAreas: ['career', 'study'],
    })).toMatchObject({
      email: 'user@example.com',
      displayName: 'Old Name',
      createdAt,
      disciplineLevel: 'mentor',
      focusAreas: ['career', 'study'],
      lifeRhythm: { wakeTime: '06:30', sleepTime: '23:00', timezone: 'Asia/Karachi' },
      currentScores: { discipline: 60, productivity: 70, consistency: 80 },
      onboardingCompleted: true,
    });
  });
});
