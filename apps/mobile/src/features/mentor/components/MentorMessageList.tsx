import React from 'react';
import { ScrollView, View } from 'react-native';
import type { RefObject } from 'react';

import type { MentorMessage, MentorModeConfig } from '../types';
import { MentorBriefPanel } from './MentorBriefPanel';
import { MentorMessageBubble } from './MentorMessageBubble';
import { MentorTypingIndicator } from './MentorTypingIndicator';
import { styles } from './mentorStyles';

interface MentorMessageListProps {
  scrollViewRef: RefObject<ScrollView | null>;
  mode: MentorModeConfig;
  messages: MentorMessage[];
  isAITyping: boolean;
}

export function MentorMessageList({ scrollViewRef, mode, messages, isAITyping }: MentorMessageListProps) {
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesList}
      contentContainerStyle={styles.messagesContent}
      showsVerticalScrollIndicator={false}
    >
      <MentorBriefPanel mode={mode} />

      {messages.map((msg, index) => (
        <MentorMessageBubble key={msg.id} message={msg} index={index} />
      ))}

      {isAITyping && <MentorTypingIndicator />}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
