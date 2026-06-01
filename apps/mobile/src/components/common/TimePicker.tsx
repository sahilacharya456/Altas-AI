import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { safeNotificationAsync, safeSelectionAsync, NotificationFeedbackType } from '../../utils/haptics';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../theme';

interface TimePickerProps {
  label?: string;
  value: string; // "HH:MM" format
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Defensive check for value type to prevent crashes if a Date or non-string is passed
  const timeString = typeof value === 'string' ? value : '00:00';
  const [selectedHour, setSelectedHour] = useState(parseInt(timeString.split(':')[0] ?? '0', 10));
  const [selectedMinute, setSelectedMinute] = useState(parseInt(timeString.split(':')[1] ?? '0', 10));

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const formatTime = (h: number, m: number): string => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const hour = h ?? 0;
    const minute = m ?? 0;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleConfirm = () => {
    const newTime = formatTime(selectedHour, selectedMinute);
    onChange(newTime);
    setIsOpen(false);
    if (Platform.OS !== 'web') {
      safeNotificationAsync(NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>{formatDisplayTime(value)}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.headerAction}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Time</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.doneAction}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.pickerBody}>
              {/* Hours */}
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Hour</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {hours.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.option, selectedHour === h && styles.optionSelected]}
                      onPress={() => {
                        setSelectedHour(h);
                        if (Platform.OS !== 'web') {
                          safeSelectionAsync();
                        }
                      }}
                    >
                      <Text
                        style={[styles.optionText, selectedHour === h && styles.optionTextSelected]}
                      >
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Separator */}
              <View style={styles.separator}>
                <Text style={styles.separatorText}>:</Text>
              </View>

              {/* Minutes */}
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Minute</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {minutes.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.option, selectedMinute === m && styles.optionSelected]}
                      onPress={() => {
                        setSelectedMinute(m);
                        if (Platform.OS !== 'web') {
                          safeSelectionAsync();
                        }
                      }}
                    >
                      <Text
                        style={[styles.optionText, selectedMinute === m && styles.optionTextSelected]}
                      >
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: ALTASAI_SPACING.xs,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  trigger: {
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    borderRadius: ALTASAI_RADIUS.xl,
    backgroundColor: ALTASAI_COLORS.surface.raised,
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingVertical: ALTASAI_SPACING.md,
  },
  triggerText: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    overflow: 'hidden',
    borderTopLeftRadius: ALTASAI_RADIUS['2xl'],
    borderTopRightRadius: ALTASAI_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.background.secondary,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: ALTASAI_COLORS.border.secondary,
    paddingHorizontal: ALTASAI_SPACING.md,
  },
  headerAction: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  doneAction: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  headerTitle: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  pickerBody: {
    height: 220,
    flexDirection: 'row',
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingVertical: ALTASAI_SPACING.md,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    marginBottom: ALTASAI_SPACING.xs,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center',
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.lg,
    paddingVertical: ALTASAI_SPACING.sm,
  },
  optionSelected: {
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.accent,
    backgroundColor: ALTASAI_COLORS.accent.glow,
  },
  optionText: {
    color: ALTASAI_COLORS.text.primary,
    textAlign: 'center',
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  optionTextSelected: {
    color: ALTASAI_COLORS.accent.bright,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  separator: {
    justifyContent: 'center',
    paddingHorizontal: ALTASAI_SPACING.md,
  },
  separatorText: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
});
