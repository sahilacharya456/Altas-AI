import type { UserProfile } from '../../../types/firestore';

export const getProfileCompletion = (profile: Pick<UserProfile, 'displayName' | 'disciplineLevel' | 'focusAreas' | 'lifeRhythm'> | null) => {
  const missing: string[] = [];
  if (!profile?.displayName?.trim()) missing.push('name');
  if (!profile?.disciplineLevel) missing.push('discipline level');
  if (!profile?.focusAreas?.length) missing.push('focus areas');
  if (!profile?.lifeRhythm?.wakeTime || !profile?.lifeRhythm?.sleepTime) missing.push('life rhythm');

  const total = 4;
  return {
    percent: Math.round(((total - missing.length) / total) * 100),
    missing,
    complete: missing.length === 0,
  };
};
