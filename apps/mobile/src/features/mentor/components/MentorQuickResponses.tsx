import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { styles } from './mentorStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MentorQuickResponsesProps {
  responses: string[];
  isHidden: boolean;
  onSelect: (response: string) => void;
}

export function MentorQuickResponses({ responses, isHidden, onSelect }: MentorQuickResponsesProps) {
  if (isHidden) return null;

  return (
    <Animated.View entering={FadeIn.duration(260)} style={styles.quickResponses}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickResponsesContent}
      >
        {responses.map((response, index) => (
          <AnimatedPressable
            key={response}
            entering={FadeInUp.delay(80 + index * 45).duration(320)}
            onPress={() => onSelect(response)}
            style={styles.quickResponseButton}
          >
            <Text style={styles.quickResponseText}>{response}</Text>
          </AnimatedPressable>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
