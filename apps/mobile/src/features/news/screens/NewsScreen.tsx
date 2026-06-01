import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { GradientBackground, GlassCard } from '../../../components/ui';
import { ALTASAI_COLORS } from '../../../theme';
import { styles } from '../components/newsStyles';
import { useNewsBriefing } from '../hooks/useNewsBriefing';

export default function NewsScreen() {
  const {
    topics,
    selectedTopic,
    query,
    setQuery,
    saved,
    filteredFeed,
    featured,
    remaining,
    handleBack,
    handleTopic,
    handleSave,
  } = useNewsBriefing();

  return (
    <GradientBackground variant="subtle">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.eyebrow}>AltasAI Lab</Text>
              <Text style={styles.title}>AI Life Impact Briefing</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search lab briefings"
              placeholderTextColor={ALTASAI_COLORS.text.tertiary}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </Animated.View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
            {topics.map((topic) => {
              const active = topic === selectedTopic;
              return (
                <Pressable
                  key={topic}
                  onPress={() => handleTopic(topic)}
                  style={[styles.topicChip, active && styles.topicChipActive]}
                >
                  <Text style={[styles.topicText, active && styles.topicTextActive]}>{topic}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Animated.View entering={FadeInDown.delay(160).duration(600)}>
            <GlassCard style={styles.featuredCard}>
              <View style={styles.featuredMedia}>
                <Text style={styles.featuredMediaText}>{featured.category}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.priority}>{featured.priority}</Text>
                <Text style={styles.metaText}>{featured.source} / {featured.freshness}</Text>
              </View>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <Text style={styles.summary}>{featured.summary}</Text>
              <View style={styles.labNotice}>
                <Text style={styles.labNoticeText}>
                  Future feature: this lab will connect world events to your goals, finance, health, digital usage, and security context. It is not a live news feed.
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.readTime}>{featured.readTime} read</Text>
                <Pressable onPress={() => handleSave(featured.id)} style={styles.saveButton}>
                  <Text style={styles.saveText}>{saved[featured.id] ? 'Saved' : 'Save'}</Text>
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Life impact lab</Text>
            <Text style={styles.sectionCount}>{filteredFeed.length} briefs</Text>
          </View>

          {remaining.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No more stories</Text>
              <Text style={styles.emptyText}>Try another topic or search term.</Text>
            </GlassCard>
          ) : (
            remaining.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(220 + index * 80).duration(500)}>
                <Pressable style={({ pressed }) => [styles.feedCard, pressed && styles.feedCardPressed]}>
                  <View style={styles.feedMarker}>
                    <Text style={styles.feedMarkerText}>{item.category.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.feedBody}>
                    <View style={styles.metaRow}>
                      <Text style={styles.priority}>{item.priority}</Text>
                      <Text style={styles.metaText}>{item.freshness}</Text>
                    </View>
                    <Text style={styles.feedTitle}>{item.title}</Text>
                    <Text style={styles.feedSummary}>{item.summary}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.readTime}>{item.source} / {item.readTime}</Text>
                      <Pressable onPress={() => handleSave(item.id)} style={styles.saveButtonCompact}>
                        <Text style={styles.saveText}>{saved[item.id] ? 'Saved' : 'Save'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
