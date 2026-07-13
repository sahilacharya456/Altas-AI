import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ALTASAI_COLORS } from '../../../theme/colors';
import { ALTASAI_SPACING } from '../../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../../theme/typography';
import { callBackendGet } from '../../../services/ai/backendClient';

interface FeedItem {
  id: string;
  categoryLabel: string;
  taskTitleMasked: string;
  score: number;
  proofType: string;
  disciplineMode: string;
  publishedAt: string | null;
}

interface FeedResponse {
  items: FeedItem[];
}

const SCORE_COLOR = (score: number): string => {
  if (score >= 90) return ALTASAI_COLORS.success.primary;
  if (score >= 70) return ALTASAI_COLORS.accent.bright;
  return ALTASAI_COLORS.warning.light;
};

const PROOF_TYPE_ICON: Record<string, string> = {
  github_link: 'GH',
  file: 'FL',
  study_notes: 'SN',
  text: 'TX',
  other: 'EV',
};

const MIN_ITEMS_TO_SHOW = 3;

export function MentorProofFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    callBackendGet<FeedResponse>('/api/proof-feed/recent')
      .then((data) => {
        setItems(data.items ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || items.length < MIN_ITEMS_TO_SHOW) return null;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(480)} style={{ marginBottom: ALTASAI_SPACING[4] }}>
      <Text style={{
        fontSize: ALTASAI_TYPOGRAPHY.size.xs,
        color: ALTASAI_COLORS.text.tertiary,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
        letterSpacing: 0.8,
        marginBottom: ALTASAI_SPACING[2],
        paddingHorizontal: ALTASAI_SPACING[1],
      }}>
        COMMUNITY EXECUTION
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: ALTASAI_SPACING[2], paddingHorizontal: ALTASAI_SPACING[1] }}
      >
        {items.map((item) => (
          <View key={item.id} style={{
            backgroundColor: 'rgba(20, 25, 34, 0.90)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: ALTASAI_SPACING[3],
            width: 148,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: ALTASAI_SPACING[2] }}>
              <Text style={{
                fontSize: ALTASAI_TYPOGRAPHY.size.xs,
                color: ALTASAI_COLORS.accent.bright,
                fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
              }}>
                {item.categoryLabel}
              </Text>
              <Text style={{ fontSize: ALTASAI_TYPOGRAPHY.size.xs, color: ALTASAI_COLORS.text.muted }}>
                {PROOF_TYPE_ICON[item.proofType] ?? 'EV'}
              </Text>
            </View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: ALTASAI_TYPOGRAPHY.size.xs,
                color: ALTASAI_COLORS.text.secondary,
                marginBottom: ALTASAI_SPACING[2],
                lineHeight: 16,
              }}
            >
              {item.taskTitleMasked}
            </Text>
            <Text style={{
              fontSize: 11,
              fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
              color: SCORE_COLOR(item.score),
            }}>
              {item.score}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
