import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import { safeNotificationAsync, safeSelectionAsync, NotificationFeedbackType } from '../../utils/haptics';

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
        <View className="w-full">
            {label && (
                <Text className="text-text-secondary text-sm mb-2 font-medium">
                    {label}
                </Text>
            )}

            <TouchableOpacity
                className="bg-surface border border-border rounded-xl px-4 py-4"
                onPress={() => {
                    setSelectedDate(value);
                    setIsOpen(true);
                }}
                activeOpacity={0.7}
            >
                <Text className="text-text text-lg">{formatDate(value)}</Text>
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOpen(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-background rounded-t-3xl">
                        {/* Header */}
                        <View className="flex-row justify-between items-center p-4 border-b border-border">
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Text className="text-text-secondary text-base">Cancel</Text>
                            </TouchableOpacity>
                            <Text className="text-text font-semibold text-lg">Select Date</Text>
                            <TouchableOpacity onPress={handleConfirm}>
                                <Text className="text-primary font-semibold text-base">Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Date Picker Columns */}
                        <View className="flex-row h-52 px-4 py-4">
                            {/* Month */}
                            <View className="flex-[1.5]">
                                <Text className="text-text-secondary text-center text-sm mb-2">Month</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {months.map((m, index) => (
                                        <TouchableOpacity
                                            key={m}
                                            className={`py-3 px-2 ${selectedDate.getMonth() === index ? 'bg-primary/20 rounded-lg' : ''}`}
                                            onPress={() => updateDate(selectedDate.getFullYear(), index, selectedDate.getDate())}
                                        >
                                            <Text
                                                className={`text-center text-lg ${selectedDate.getMonth() === index ? 'text-primary font-semibold' : 'text-text'
                                                    }`}
                                            >
                                                {m}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Day */}
                            <View className="flex-1 mx-2">
                                <Text className="text-text-secondary text-center text-sm mb-2">Day</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {days.map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            className={`py-3 ${selectedDate.getDate() === d ? 'bg-primary/20 rounded-lg' : ''}`}
                                            onPress={() => updateDate(selectedDate.getFullYear(), selectedDate.getMonth(), d)}
                                        >
                                            <Text
                                                className={`text-center text-lg ${selectedDate.getDate() === d ? 'text-primary font-semibold' : 'text-text'
                                                    }`}
                                            >
                                                {d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Year */}
                            <View className="flex-1">
                                <Text className="text-text-secondary text-center text-sm mb-2">Year</Text>
                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {years.map((y) => (
                                        <TouchableOpacity
                                            key={y}
                                            className={`py-3 ${selectedDate.getFullYear() === y ? 'bg-primary/20 rounded-lg' : ''}`}
                                            onPress={() => updateDate(y, selectedDate.getMonth(), selectedDate.getDate())}
                                        >
                                            <Text
                                                className={`text-center text-lg ${selectedDate.getFullYear() === y ? 'text-primary font-semibold' : 'text-text'
                                                    }`}
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
