import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ALTASAI_COLORS } from '../../../theme/colors';
import { styles } from './mentorStyles';

interface MentorComposerProps {
  message: string;
  isDisabled: boolean;
  onChangeMessage: (message: string) => void;
  onSend: () => void;
}

export function MentorComposer({ message, isDisabled, onChangeMessage, onSend }: MentorComposerProps) {
  const canSend = Boolean(message.trim()) && !isDisabled;

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputShell}>
        <TextInput
          style={styles.textInput}
          placeholder="Message AltasAI..."
          placeholderTextColor={ALTASAI_COLORS.text.tertiary}
          value={message}
          onChangeText={onChangeMessage}
          multiline
          maxLength={500}
          editable={!isDisabled}
          selectionColor={ALTASAI_COLORS.accent.bright}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send mentor message"
          onPress={onSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            canSend && styles.sendButtonActive,
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color="#FFFFFF"
            accessibilityLabel="Send"
          />
        </Pressable>
      </View>
    </View>
  );
}
