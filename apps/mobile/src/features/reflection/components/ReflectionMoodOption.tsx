import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '../../../theme';
import type { ReflectionOption } from '../types';
import { styles } from './reflectionStyles';

interface ReflectionMoodOptionProps {
  option: ReflectionOption;
  selected: boolean;
  onSelect: () => void;
  index: number;
}

export function ReflectionMoodOption({
  option,
  selected,
  onSelect,
  index,
}: ReflectionMoodOptionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 100).duration(400)}>
      <Pressable
        onPress={onSelect}
        onPressIn={() => {
          scale.value = withSpring(0.9, theme.animation.spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.animation.spring.gentle);
        }}
      >
        <Animated.View
          style={[styles.moodOption, selected && styles.moodOptionSelected, animatedStyle]}
        >
          <Text style={styles.moodEmoji}>{option.emoji}</Text>
          <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>
            {option.label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
