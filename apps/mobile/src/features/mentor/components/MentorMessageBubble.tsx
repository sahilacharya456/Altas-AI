import React from 'react';
import { Image, Pressable, Share, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { MentorAction, MentorMessage } from '../types';
import { styles } from './mentorStyles';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mentorAvatar = require('../../../../assets/images/mentor-avatar.png') as number;

const ACTION_LABELS: Record<MentorAction['type'], string> = {
  create_task: 'Task created',
  create_behavior_event: 'Signal logged',
  recommend_next_action: 'Next action',
};

const STATUS_COLORS: Record<MentorAction['status'], string> = {
  executed: 'rgba(16, 185, 129, 0.18)',
  planned: 'rgba(56, 189, 248, 0.14)',
  blocked: 'rgba(245, 158, 11, 0.14)',
};

const STATUS_BORDER: Record<MentorAction['status'], string> = {
  executed: 'rgba(16, 185, 129, 0.35)',
  planned: 'rgba(56, 189, 248, 0.28)',
  blocked: 'rgba(245, 158, 11, 0.28)',
};

function ActionChip({ action }: { action: MentorAction }) {
  return (
    <View style={[
      styles.actionChip,
      { backgroundColor: STATUS_COLORS[action.status], borderColor: STATUS_BORDER[action.status] },
    ]}>
      <Text style={styles.actionChipLabel}>{ACTION_LABELS[action.type]}</Text>
      <Text style={styles.actionChipTitle} numberOfLines={1}>{action.title}</Text>
    </View>
  );
}

interface MentorMessageBubbleProps {
  message: MentorMessage;
  index: number;
  onSpeakToggle?: (text: string) => void;
  isSpeaking?: boolean;
}

export function MentorMessageBubble({ message, index, onSpeakToggle, isSpeaking }: MentorMessageBubbleProps) {
  const isUser = message.role === 'user';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I proved my work today with AltasAI:\n\n"${message.content.slice(0, 280)}"\n\n- Verified by AltasAI Proof Engine`,
        title: 'My Execution Proof - AltasAI',
      });
    } catch {
      // Share sheet dismissed.
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 35, 220)).duration(360)}
      style={[styles.messageBubbleRow, isUser && styles.messageRowRight]}
    >
      {!isUser && (
        <Pressable
          onPress={() => onSpeakToggle?.(message.content)}
          accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Speak this message'}
          style={[styles.messageAvatar, isSpeaking && styles.messageAvatarSpeaking]}
        >
          <Image
            source={mentorAvatar}
            style={styles.messageAvatarImage}
            resizeMode="cover"
            accessibilityLabel="AltasAI mentor avatar"
          />
          {isSpeaking && <View style={styles.speakingRing} />}
        </Pressable>
      )}
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.aiBubble,
        !isUser && styles.aiBubbleWithAvatar,
      ]}>
        {message.offline ? (
          <View style={styles.offlineBadge}>
            <View style={styles.offlineDot} />
            <Text style={styles.offlineText}>Offline fallback</Text>
          </View>
        ) : null}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
        {!isUser && message.actions && message.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action) => (
              <ActionChip key={action.id} action={action} />
            ))}
          </View>
        )}
        <View style={styles.messageMeta}>
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {!isUser && (
            <Pressable
              onPress={handleShare}
              accessibilityLabel="Share this response"
              hitSlop={8}
            >
              <Text style={styles.shareButton}>Share</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
