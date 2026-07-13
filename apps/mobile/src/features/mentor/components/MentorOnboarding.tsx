import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ALTASAI_COLORS } from '../../../theme/colors';
import { ALTASAI_SPACING } from '../../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../../theme/typography';

interface MentorOnboardingProps {
  visible: boolean;
  onDismiss: () => void;
}

interface Card {
  step: number;
  title: string;
  body: string;
  extra?: React.ReactNode;
}

function ProofExamplePill({ icon, text, type }: { icon: string; text: string; type: 'good' | 'weak' | 'bad' }) {
  const colors: Record<string, string> = {
    good: 'rgba(16, 185, 129, 0.14)',
    weak: 'rgba(245, 158, 11, 0.14)',
    bad: 'rgba(239, 68, 68, 0.14)',
  };
  const borders: Record<string, string> = {
    good: 'rgba(16, 185, 129, 0.35)',
    weak: 'rgba(245, 158, 11, 0.35)',
    bad: 'rgba(239, 68, 68, 0.35)',
  };
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ALTASAI_SPACING[2],
      backgroundColor: colors[type],
      borderWidth: 1,
      borderColor: borders[type],
      borderRadius: 6,
      padding: ALTASAI_SPACING[3],
      marginBottom: ALTASAI_SPACING[2],
    }}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={{
        flex: 1,
        fontSize: ALTASAI_TYPOGRAPHY.size.xs,
        color: ALTASAI_COLORS.text.secondary,
        lineHeight: 17,
      }}>
        {text}
      </Text>
    </View>
  );
}

const CARDS: Card[] = [
  {
    step: 1,
    title: 'Prove, don\'t plan.',
    body: 'AltasAI doesn\'t track tasks. It tracks whether you actually did them.\n\nAfter completing a task, you submit proof - a commit, a file, a note, anything real. AltasAI reviews it and tells you if it counts.',
  },
  {
    step: 2,
    title: 'What counts as proof?',
    body: 'Be specific. AltasAI rejects vague claims.',
    extra: (
      <View style={{ marginTop: ALTASAI_SPACING[4] }}>
        <ProofExamplePill icon="OK" text="Wrote 200 lines of auth code - committed to GitHub (abc123f)" type="good" />
        <ProofExamplePill icon="!" text="Worked on it for a while and made some progress" type="weak" />
        <ProofExamplePill icon="X" text="Done" type="bad" />
      </View>
    ),
  },
  {
    step: 3,
    title: 'Start now.',
    body: 'Pick one task from your list. Complete it. Submit proof.\n\nThat\'s the whole loop. AltasAI is waiting.',
  },
];

export function MentorOnboarding({ visible, onDismiss }: MentorOnboardingProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const card = CARDS[cardIndex];
  const isLast = cardIndex === CARDS.length - 1;

  const handleNext = () => {
    if (isLast) { onDismiss(); return; }
    setCardIndex((prev) => prev + 1);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(5, 8, 12, 0.88)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onDismiss} />

        <Animated.View
          entering={FadeInUp.delay(100).duration(420)}
          style={{
            backgroundColor: ALTASAI_COLORS.background.elevated,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.10)',
            paddingTop: ALTASAI_SPACING[6],
            paddingHorizontal: ALTASAI_SPACING[6],
            paddingBottom: ALTASAI_SPACING[8],
          }}
        >
          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: ALTASAI_SPACING[2], marginBottom: ALTASAI_SPACING[5] }}>
            {CARDS.map((_, i) => (
              <View key={i} style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i <= cardIndex ? ALTASAI_COLORS.accent.bright : 'rgba(255,255,255,0.12)',
              }} />
            ))}
          </View>

          {/* Eyebrow */}
          <Text style={{
            fontSize: ALTASAI_TYPOGRAPHY.size.xs,
            color: ALTASAI_COLORS.accent.bright,
            fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
            letterSpacing: 1,
            marginBottom: ALTASAI_SPACING[2],
          }}>
            HOW ALTASAI WORKS - {card.step}/3
          </Text>

          {/* Title */}
          <Text style={{
            fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
            fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
            color: ALTASAI_COLORS.text.primary,
            marginBottom: ALTASAI_SPACING[4],
            lineHeight: 32,
          }}>
            {card.title}
          </Text>

          {/* Body */}
          <Text style={{
            fontSize: ALTASAI_TYPOGRAPHY.size.sm,
            color: ALTASAI_COLORS.text.secondary,
            lineHeight: 22,
          }}>
            {card.body}
          </Text>

          {card.extra}

          {/* CTA */}
          <Pressable
            onPress={handleNext}
            style={{ marginTop: ALTASAI_SPACING[6] }}
          >
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.92)', 'rgba(16, 185, 129, 0.80)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 10,
                paddingVertical: ALTASAI_SPACING[4],
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: ALTASAI_TYPOGRAPHY.size.base,
                fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
                color: '#FFFFFF',
                letterSpacing: 0.3,
              }}>
                {isLast ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Skip */}
          <Pressable onPress={onDismiss} style={{ alignItems: 'center', marginTop: ALTASAI_SPACING[3] }}>
            <Text style={{
              fontSize: ALTASAI_TYPOGRAPHY.size.xs,
              color: ALTASAI_COLORS.text.muted,
            }}>
              Skip for now
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
