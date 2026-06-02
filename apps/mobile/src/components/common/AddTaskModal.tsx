import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };
import { Button } from './Button';
import { Input } from './Input';
import { TimePicker } from './TimePicker';
import { Task } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { getErrorMessage } from '../../utils/errors';

interface AddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (task: {
        title: string;
        priority: Task['priority'];
        category: Task['category'];
        estimatedMinutes: number;
        scheduledDate: Date;
    }) => Promise<string | void>;
}

const PRIORITIES: { id: Task['priority']; label: string; color: string }[] = [
    { id: 'low', label: 'Low', color: theme.colors.text.tertiary },
    { id: 'medium', label: 'Medium', color: theme.colors.primary.DEFAULT },
    { id: 'high', label: 'High', color: '#FF9500' },
    { id: 'critical', label: 'Critical', color: '#FF3B5C' },
];

const CATEGORIES: { id: Task['category']; label: string; icon: string }[] = [
    { id: 'career', label: 'Career', icon: '💼' },
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'fitness', label: 'Fitness', icon: '🏋️' },
    { id: 'study', label: 'Study', icon: '📚' },
    { id: 'personal', label: 'Personal', icon: '🌱' },
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [category, setCategory] = useState<Task['category']>('career');
    const [estimatedMinutes, setEstimatedMinutes] = useState('30');
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const showToast = useToastStore((state) => state.showToast);

    const handleSubmit = async () => {
        if (!title.trim()) {
            const message = 'Mission title is required.';
            setFeedback({ type: 'error', message });
            showToast(message, 'error');
            return;
        }

        try {
            setIsLoading(true);
            setFeedback(null);
            const result = await onSubmit({
                title: title.trim(),
                priority,
                category,
                estimatedMinutes: parseInt(estimatedMinutes) || 30,
                scheduledDate,
            });
            const message = String(result).startsWith('local_')
                ? 'Mission saved locally. Cloud sync is blocked.'
                : 'Mission created successfully.';
            setFeedback({ type: 'success', message });
            showToast(message, 'success');
            resetForm();
            onClose();
        } catch (error) {
            if (__DEV__) console.error('[AddTaskModal] Failed to create task:', error);
            const message = getErrorMessage(error, 'Mission could not be created. Please try again.');
            setFeedback({ type: 'error', message });
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setPriority('medium');
        setCategory('career');
        setEstimatedMinutes('30');
        setScheduledDate(new Date());
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>New Mission</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close modal">
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        {feedback ? (
                            <View style={[styles.feedbackBox, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
                                <Text style={styles.feedbackText}>{feedback.message}</Text>
                            </View>
                        ) : null}

                        <View style={styles.section}>
                            <Text style={styles.label}>Title</Text>
                            <Input
                                placeholder="What needs to be done?"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Priority</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollList}>
                                {PRIORITIES.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[
                                            styles.priorityChip,
                                            priority === p.id && { backgroundColor: p.color + '20', borderColor: p.color }
                                        ]}
                                        onPress={() => setPriority(p.id)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Set priority to ${p.label}`}
                                        accessibilityState={{ selected: priority === p.id }}
                                    >
                                        <Text
                                            style={[
                                                styles.priorityText,
                                                { color: p.color },
                                                priority === p.id && { fontWeight: '700' }
                                            ]}
                                        >
                                            {p.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollList}>
                                {CATEGORIES.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[
                                            styles.categoryChip,
                                            category === c.id && styles.categoryChipSelected
                                        ]}
                                        onPress={() => setCategory(c.id)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Set category to ${c.label}`}
                                        accessibilityState={{ selected: category === c.id }}
                                    >
                                        <Text style={styles.categoryIcon}>{c.icon}</Text>
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                category === c.id && styles.categoryTextSelected
                                            ]}
                                        >
                                            {c.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Duration (min)</Text>
                                <Input
                                    value={estimatedMinutes}
                                    onChangeText={setEstimatedMinutes}
                                    keyboardType="number-pad"
                                    placeholder="30"
                                />
                            </View>

                            <View style={[styles.section, { flex: 1.5 }]}>
                                <Text style={styles.label}>Time</Text>
                                <TimePicker
                                    value={`${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`}
                                    onChange={(time: string) => {
                                        const [hours, minutes] = time.split(':').map(Number);
                                        const newDate = new Date(scheduledDate);
                                        newDate.setHours(hours ?? 0, minutes ?? 0);
                                        setScheduledDate(newDate);
                                    }}
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="Create Mission"
                            onPress={handleSubmit}
                            isLoading={isLoading}
                            disabled={isLoading}
                            variant="primary"
                            fullWidth
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: '#1A1A23',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: theme.colors.text.tertiary,
    },
    form: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    feedbackBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 18,
    },
    feedbackError: {
        backgroundColor: 'rgba(255, 59, 92, 0.12)',
        borderColor: '#FF3B5C',
    },
    feedbackSuccess: {
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        borderColor: '#34D399',
    },
    feedbackText: {
        color: theme.colors.text.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scrollList: {
        flexDirection: 'row',
    },
    priorityChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        minHeight: 44,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginRight: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    categoryChipSelected: {
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366F1',
    },
    categoryIcon: {
        marginRight: 6,
        fontSize: 16,
    },
    categoryText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    categoryTextSelected: {
        color: '#6366F1',
        fontWeight: '700',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#1A1A23',
    },
});
