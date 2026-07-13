import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'altasai.proofOnboardingSeen';

export const useMentorOnboarding = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        setShouldShow(value !== 'true');
        setChecked(true);
      })
      .catch(() => {
        setShouldShow(false);
        setChecked(true);
      });
  }, []);

  const dismiss = () => {
    setShouldShow(false);
    void AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  return { shouldShow: checked && shouldShow, dismiss };
};
