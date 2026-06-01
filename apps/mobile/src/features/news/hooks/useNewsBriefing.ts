import { useMemo, useState } from 'react';
import { router } from 'expo-router';

import { safeImpactAsync, ImpactFeedbackStyle } from '../../../utils/haptics';
import { feedItems, topics } from '../constants';

export function useNewsBriefing() {
  const [selectedTopic, setSelectedTopic] = useState('For You');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const filteredFeed = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return feedItems.filter((item) => {
      const topicMatches = selectedTopic === 'For You' || item.category === selectedTopic;
      const queryMatches =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.summary.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery);

      return topicMatches && queryMatches;
    });
  }, [query, selectedTopic]);

  const featured = filteredFeed[0] ?? feedItems[0];
  const remaining = filteredFeed.filter((item) => item.id !== featured.id);

  const handleBack = () => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTopic = (topic: string) => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    setSelectedTopic(topic);
  };

  const handleSave = (id: string) => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    setSaved((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return {
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
  };
}
