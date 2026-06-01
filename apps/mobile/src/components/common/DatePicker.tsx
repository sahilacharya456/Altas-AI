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

interface DatePickerProps {
    label?: string;
    value: Date;
    onChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    minDate = new Date(),
    maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Internal state for the picker selection
    const [selectedDate, setSelectedDate] = useState(value);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from(
        { length: maxDate.getFullYear() - minDate.getFullYear() + 1 },
        (_, i) => minDate.getFullYear() + i
    );

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const days = Array.from(
        { length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) },
        (_, i) => i + 1
    );

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleConfirm = () => {
        onChange(selectedDate);
        setIsOpen(false);
        if (Platform.OS !== 'web') {
            safeNotificationAsync(NotificationFeedbackType.Success);
        }
    };

    const updateDate = (year: number, month: number, day: number) => {
        const newDaysInMonth = new Date(year, month + 1, 0).getDate();
        const newDay = Math.min(day, newDaysInMonth);
        const newDate = new Date(year, month, newDay);
        // Keep time components? Goals usually just date focused, but let's keep it clean at 00:00 or current?
        // For goals "Target Date", usually simplified.
        setSelectedDate(newDate);
        if (Platform.OS !== 'web') {
            safeSelectionAsync();
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
                onPress={() => {
                    setSelectedDate(value);
                    setIsOpen(true);
                }}
                activeOpacity={0.7}
            >
                <Text style={styles.triggerText}>{formatDate(value)}</Text>
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
                            <Text style={styles.headerTitle}>Select Date</Text>
                            <TouchableOpacity onPress={handleConfirm}>
                                <Text style={styles.doneAction}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Date Picker Columns */}
                        <View style={styles.pickerBody}>
                            {/* Month */}
                            <View style={styles.monthColumn}>
                                <Text style={styles.columnLabel}>Month</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {months.map((m, index) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.option, selectedDate.getMonth() === index && styles.optionSelected]}
                                            onPress={() => updateDate(selectedDate.getFullYear(), index, selectedDate.getDate())}
                                        >
                                            <Text
                                                style={[styles.optionText, selectedDate.getMonth() === index && styles.optionTextSelected]}
                                            >
                                                {m}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Day */}
                            <View style={styles.column}>
                                <Text style={styles.columnLabel}>Day</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {days.map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            style={[styles.option, selectedDate.getDate() === d && styles.optionSelected]}
                                            onPress={() => updateDate(selectedDate.getFullYear(), selectedDate.getMonth(), d)}
                                        >
                                            <Text
                                                style={[styles.optionText, selectedDate.getDate() === d && styles.optionTextSelected]}
                                            >
                                                {d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Year */}
                            <View style={styles.column}>
                                <Text style={styles.columnLabel}>Year</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {years.map((y) => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[styles.option, selectedDate.getFullYear() === y && styles.optionSelected]}
                                            onPress={() => updateDate(y, selectedDate.getMonth(), selectedDate.getDate())}
                                        >
                                            <Text
                                                style={[styles.optionText, selectedDate.getFullYear() === y && styles.optionTextSelected]}
                                            >
                                                {y}
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
        gap: ALTASAI_SPACING.sm,
        paddingHorizontal: ALTASAI_SPACING.md,
        paddingVertical: ALTASAI_SPACING.md,
        backgroundColor: ALTASAI_COLORS.background.primary,
    },
    monthColumn: {
        flex: 1.5,
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
        paddingHorizontal: ALTASAI_SPACING.xs,
        paddingVertical: ALTASAI_SPACING.sm,
    },
    optionSelected: {
        borderWidth: 1,
        borderColor: ALTASAI_COLORS.border.accent,
        backgroundColor: ALTASAI_COLORS.accent.glow,
    },
    optionText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: ALTASAI_TYPOGRAPHY.size.lg,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
    },
    optionTextSelected: {
        color: ALTASAI_COLORS.accent.bright,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    },
});
