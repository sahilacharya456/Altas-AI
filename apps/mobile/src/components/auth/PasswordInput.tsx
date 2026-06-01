import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_SPACING } from '../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';

interface PasswordInputProps extends TextInputProps {
  hasError?: boolean;
}

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z"
      stroke={ALTASAI_COLORS.text.secondary}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={12}
      cy={12}
      r={2.7}
      stroke={ALTASAI_COLORS.text.secondary}
      strokeWidth={1.8}
    />
    {hidden && (
      <Path
        d="M4 20 20 4"
        stroke={ALTASAI_COLORS.error.light}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    )}
  </Svg>
);

export const PasswordInput = ({ hasError, style, ...props }: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.wrapper, hasError && styles.wrapperError]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={ALTASAI_COLORS.text.tertiary}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
        hitSlop={10}
        onPress={() => setIsVisible((value) => !value)}
        style={styles.toggle}
      >
        <EyeIcon hidden={!isVisible} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  wrapperError: {
    borderColor: ALTASAI_COLORS.error.primary,
  },
  input: {
    flex: 1,
    paddingLeft: ALTASAI_SPACING[4],
    paddingRight: ALTASAI_SPACING[2],
    paddingVertical: ALTASAI_SPACING[4],
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.primary,
  },
  toggle: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
