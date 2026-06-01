import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../utils/haptics';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_RADIUS, ALTASAI_TYPOGRAPHY } from '../../theme';

interface SelectCardProps {
  title: string;
  description?: string;
  icon?: string;
  selected?: boolean;
  recommended?: boolean;
  color?: string;
  onPress?: () => void;
}

export const SelectCard: React.FC<SelectCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  recommended = false,
  color,
  onPress,
}) => {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      safeImpactAsync(ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && { borderColor: color || ALTASAI_COLORS.accent.primary },
        selected && styles.containerSelected,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {selected && color && (
        <View style={[styles.accentBar, { backgroundColor: color }]} />
      )}

      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </View>
      )}

      <View style={styles.contentRow}>
        {icon && (
          <Text style={styles.icon}>{icon}</Text>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>

        <View style={[
          styles.radio,
          selected && { borderColor: color || ALTASAI_COLORS.accent.primary },
        ]}>
          {selected && (
            <View style={[
              styles.radioInner,
              { backgroundColor: color || ALTASAI_COLORS.accent.primary },
            ]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ALTASAI_COLORS.surface.base,
    borderWidth: 2,
    borderColor: ALTASAI_COLORS.border.secondary,
    borderRadius: ALTASAI_RADIUS['2xl'],
    padding: ALTASAI_SPACING[4],
    position: 'relative',
    overflow: 'hidden',
  },
  containerSelected: {
    backgroundColor: ALTASAI_COLORS.surface.raised,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  recommendedBadge: {
    position: 'absolute',
    top: ALTASAI_SPACING[2],
    right: ALTASAI_SPACING[2],
    backgroundColor: ALTASAI_COLORS.accent.dim,
    paddingHorizontal: ALTASAI_SPACING[2],
    paddingVertical: 2,
    borderRadius: ALTASAI_RADIUS.full,
  },
  recommendedText: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: 10,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: ALTASAI_SPACING[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
  },
  description: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ALTASAI_COLORS.border.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ALTASAI_SPACING[3],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
