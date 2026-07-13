import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  MentorComposer,
  MentorHeader,
  MentorMessageList,
  MentorQuickResponses,
} from '../components';
import { MentorOnboarding } from '../components/MentorOnboarding';
import { MentorUpgradePrompt } from '../components/MentorUpgradePrompt';
import { useMentor } from '../hooks/useMentor';
import { useMentorOnboarding } from '../hooks/useMentorOnboarding';
import { ALTASAI_COLORS } from '../../../theme/colors';
import { styles } from '../components/mentorStyles';

export default function MentorScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const {
    message,
    setMessage,
    messages,
    isAITyping,
    analyzingLabel,
    scrollViewRef,
    disciplineConfig,
    isOfflineFallback,
    quickResponses,
    taskSummary,
    showUpgradePrompt,
    upgradeReason,
    dismissUpgradePrompt,
    handleSend,
    handleQuickResponse,
  } = useMentor();

  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useMentorOnboarding();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ALTASAI_COLORS.background.primary, ALTASAI_COLORS.background.secondary, ALTASAI_COLORS.background.tertiary]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <MentorHeader
          mode={disciplineConfig}
          isOfflineFallback={isOfflineFallback}
          taskSummary={taskSummary}
        />

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
            analyzingLabel={analyzingLabel}
          />

          <MentorQuickResponses
            responses={quickResponses}
            isHidden={isAITyping}
            onSelect={handleQuickResponse}
          />

          <View style={{ paddingBottom: tabBarHeight }}>
            <MentorComposer
              message={message}
              isDisabled={isAITyping}
              onChangeMessage={setMessage}
              onSend={handleSend}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <MentorOnboarding visible={showOnboarding} onDismiss={dismissOnboarding} />
      <MentorUpgradePrompt
        visible={showUpgradePrompt}
        reason={upgradeReason}
        onDismiss={dismissUpgradePrompt}
      />
    </View>
  );
}
