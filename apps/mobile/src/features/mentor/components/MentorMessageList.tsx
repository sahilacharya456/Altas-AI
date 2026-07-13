import React from 'react';
import { ScrollView, View } from 'react-native';
import type { RefObject } from 'react';

import type { MentorMessage, MentorModeConfig } from '../types';
import { useMentorVoice } from '../hooks/useMentorVoice';
import { MentorBriefPanel } from './MentorBriefPanel';
import { MentorMessageBubble } from './MentorMessageBubble';
import { MentorProofFeed } from './MentorProofFeed';
import { MentorTypingIndicator } from './MentorTypingIndicator';
import { styles } from './mentorStyles';

interface MentorMessageListProps {
  scrollViewRef: RefObject<ScrollView | null>;
  mode: MentorModeConfig;
  messages: MentorMessage[];
  isAITyping: boolean;
  analyzingLabel?: string;
}

export function MentorMessageList({ scrollViewRef, mode, messages, isAITyping, analyzingLabel }: MentorMessageListProps) {
  const { toggle, isSpeaking, stop } = useMentorVoice();
  const [speakingId, setSpeakingId] = React.useState<string | null>(null);

  const handleSpeakToggle = React.useCallback((id: string, text: string) => {
    if (speakingId === id && isSpeaking) {
      stop();
      setSpeakingId(null);
    } else {
      setSpeakingId(id);
      toggle(text);
    }
  }, [speakingId, isSpeaking, toggle, stop]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      <MentorProofFeed />
      <MentorBriefPanel mode={mode} />

      {messages.map((msg, index) => (
        <MentorMessageBubble
          key={msg.id}
          message={msg}
          index={index}
          onSpeakToggle={msg.role === 'assistant' ? (text) => handleSpeakToggle(msg.id, text) : undefined}
          isSpeaking={speakingId === msg.id && isSpeaking}
        />
      ))}

      {isAITyping && <MentorTypingIndicator label={analyzingLabel} />}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
