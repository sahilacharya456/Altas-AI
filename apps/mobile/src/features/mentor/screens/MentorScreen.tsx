import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  MentorComposer,
  MentorHeader,
  MentorMessageList,
  MentorQuickResponses,
} from '../components';
import { mentorQuickResponses, useMentor } from '../hooks/useMentor';
import { ALTASAI_COLORS } from '../../../theme/colors';
import { styles } from '../components/mentorStyles';

export default function MentorScreen() {
  const {
    message,
    setMessage,
    messages,
    isAITyping,
    scrollViewRef,
    disciplineConfig,
    isOfflineFallback,
    handleSend,
    handleQuickResponse,
  } = useMentor();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ALTASAI_COLORS.background.primary, ALTASAI_COLORS.background.secondary, ALTASAI_COLORS.background.tertiary]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <MentorHeader mode={disciplineConfig} isOfflineFallback={isOfflineFallback} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={84}
        >
          <MentorMessageList
            scrollViewRef={scrollViewRef}
            mode={disciplineConfig}
            messages={messages}
            isAITyping={isAITyping}
          />

          <MentorQuickResponses
            responses={mentorQuickResponses}
            isHidden={isAITyping}
            onSelect={handleQuickResponse}
          />

          <MentorComposer
            message={message}
            isDisabled={isAITyping}
            onChangeMessage={setMessage}
            onSend={handleSend}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
