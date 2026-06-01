import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ALTASAI_COLORS,
  ALTASAI_GRADIENTS,
  ALTASAI_LAYOUT,
  ALTASAI_SPACING,
} from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  safe?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
}

export const ScreenContainer = ({
  children,
  scroll = true,
  safe = true,
  padded = true,
  contentStyle,
  style,
  scrollProps,
}: ScreenContainerProps) => {
  const Wrapper = safe ? SafeAreaView : View;
  const content = [styles.content, padded && styles.padded, contentStyle];

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={ALTASAI_GRADIENTS.appBackground as unknown as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      <Wrapper style={styles.safe}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={content}
            {...scrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={content}>{children}</View>
        )}
      </Wrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  safe: {
    flex: 1,
  },
  content: {
    gap: ALTASAI_SPACING.md,
    paddingBottom: ALTASAI_SPACING['3xl'],
  },
  padded: {
    paddingHorizontal: ALTASAI_LAYOUT.screenPadding,
    paddingTop: ALTASAI_SPACING.md,
  },
});
