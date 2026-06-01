import {
  Easing,
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ALTASAI_MOTION } from '../theme/motion';

export const altasaiFadeIn = (delay = 0) =>
  FadeIn.delay(delay).duration(ALTASAI_MOTION.duration.standard);

export const altasaiSlideUp = (delay = 0) =>
  SlideInUp.delay(delay)
    .duration(ALTASAI_MOTION.duration.normal)
    .easing(Easing.out(Easing.cubic));

export const altasaiCardEntrance = (index = 0) =>
  altasaiSlideUp(index * ALTASAI_MOTION.presets.cardEntrance.stagger);

export const buttonPressSpring = {
  damping: 18,
  stiffness: 360,
  mass: 0.55,
} as const;

export const usePressScale = (pressedScale: number = ALTASAI_MOTION.presets.scalePress.pressed) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    scale.value = withTiming(pressedScale, { duration: ALTASAI_MOTION.duration.instant });
  };

  const pressOut = () => {
    scale.value = withSpring(1, buttonPressSpring);
  };

  return { animatedStyle, pressIn, pressOut };
};
