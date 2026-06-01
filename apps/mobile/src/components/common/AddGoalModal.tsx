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
import { DatePicker } from './DatePicker';
import { Goal } from '../../types/firestore';
import { useToastStore } from '../../stores/toastStore';
import { getErrorMessage } from '../../utils/errors';

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (goal: {
        title: string;
        description: string;
        priority: Goal['priority'];
        category: Goal['category'];
        targetDate: Date;
    }) => Promise<string | void>;
}

const PRIORITIES: { id: Goal['priority']; label: string; color: string }[] = [
    { id: 'low', label: 'Low', color: theme.colors.text.tertiary },
    { id: 'medium', label: 'Medium', color: theme.colors.primary.DEFAULT },
    { id: 'high', label: 'High', color: '#FF9500' },
    { id: 'critical', label: 'Critical', color: '#FF3B5C' },
];

const CATEGORIES: { id: Goal['category']; label: string; icon: string }[] = [
    { id: 'career', label: 'Career', icon: '💼' },
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'fitness', label: 'Fitness', icon: '🏋️' },
    { id: 'study', label: 'Study', icon: '📚' },
    { id: 'personal', label: 'Personal', icon: '🌱' },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Goal['priority']>('medium');
    const [category, setCategory] = useState<Goal['category']>('career');
    const [targetDate, setTargetDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const showToast = useToastStore((state) => state.showToast);

    const handleSubmit = async () => {
        if (!title.trim()) {
            const message = 'Goal title is required.';
            setFeedback({ type: 'error', message });
            showToast(message, 'error');
            return;
        }

        try {
            setIsLoading(true);
            setFeedback(null);
            const result = await onSubmit({
                title: title.trim(),
                description: description.trim(),
                priority,
                category,
                targetDate,
            });
            const message = String(result).startsWith('local_')
                ? 'Goal saved locally. Cloud sync is blocked.'
                : 'Goal created successfully.';
            setFeedback({ type: 'success', message });
            showToast(message, 'success');
            resetForm();
            onClose();
        } catch (error) {
            if (__DEV__) console.error('[AddGoalModal] Failed to create goal:', error);
            const message = getErrorMessage(error, 'Goal could not be created. Please try again.');
            setFeedback({ type: 'error', message });
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setCategory('career');
        setTargetDate(new Date());
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
                        <Text style={styles.title}>New Vision</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
                            <Text style={styles.label}>Goal Title</Text>
                            <Input
                                placeholder="What do you want to achieve?"
                                value={title}
                                onChangeText={setTitle}
                                autoFocus
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Description (Optional)</Text>
                            <Input
                                placeholder="Add more details..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                                style={{ height: 80, textAlignVertical: 'top' }}
                            />
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

                        <View style={styles.section}>
                            <Text style={styles.label}>Target Date</Text>
                            <DatePicker
                                value={targetDate}
                                onChange={setTargetDate}
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
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="Set Goal"
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
        height: '90%',
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
        paddingVertical: 8,
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
        paddingVertical: 8,
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
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#1A1A23',
    },
});
