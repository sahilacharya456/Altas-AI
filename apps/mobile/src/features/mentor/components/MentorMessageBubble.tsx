import React from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { MentorMessage } from '../types';
import { styles } from './mentorStyles';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mentorAvatar = require('../../../../assets/images/mentor-avatar.png') as number;

interface MentorMessageBubbleProps {
  message: MentorMessage;
  index: number;
}

export function MentorMessageBubble({ message, index }: MentorMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 35, 220)).duration(360)}
      style={[styles.messageBubbleRow, isUser && styles.messageRowRight]}
    >
      {!isUser && (
        <View style={styles.messageAvatar}>
          <Image
            source={mentorAvatar}
            style={styles.messageAvatarImage}
            resizeMode="cover"
            accessibilityLabel="AltasAI mentor avatar"
          />
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {message.offline ? (
          <View style={styles.offlineBadge}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineText}>Offline fallback</Text>
          </View>
        ) : null}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
}
