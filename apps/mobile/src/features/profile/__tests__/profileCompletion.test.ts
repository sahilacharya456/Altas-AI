import { getProfileCompletion } from '../utils/profileCompletion';

describe('getProfileCompletion', () => {
  it('marks complete profiles as 100 percent ready', () => {
    expect(getProfileCompletion({
      displayName: 'Sahil',
      disciplineLevel: 'strict',
      focusAreas: ['career'],
      lifeRhythm: { wakeTime: '06:00', sleepTime: '22:00' },
    })).toEqual({
      percent: 100,
      missing: [],
      complete: true,
    });
  });

  it('reports missing profile defaults without crashing', () => {
    expect(getProfileCompletion(null)).toEqual({
      percent: 0,
      missing: ['name', 'discipline level', 'focus areas', 'life rhythm'],
      complete: false,
    });
  });
});
