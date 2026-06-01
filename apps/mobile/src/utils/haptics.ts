import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const safeImpactAsync = async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === 'web') {
        return;
    }
    try {
        await Haptics.impactAsync(style);
    } catch (error) {
        // Ignore haptics errors generally
        console.warn('Haptics error:', error);
    }
};

export const safeNotificationAsync = async (type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS === 'web') {
        return;
    }
    try {
        await Haptics.notificationAsync(type);
    } catch (error) {
        console.warn('Haptics error:', error);
    }
};

export const safeSelectionAsync = async () => {
    if (Platform.OS === 'web') {
        return;
    }
    try {
        await Haptics.selectionAsync();
    } catch (error) {
        console.warn('Haptics error:', error);
    }
};

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;
