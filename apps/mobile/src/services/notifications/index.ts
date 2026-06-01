/**
 * Notification Service
 * Handles local scheduling of task reminders and daily prompts.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler (skip on web)
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

export const NotificationService = {
    /**
     * Request permissions and configure channels
     */
    initialize: async () => {
        // Skip on web
        if (Platform.OS === 'web') return true;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        return true;
    },

    /**
     * Schedule a notification for a specific task
     */
    scheduleTaskReminder: async (taskId: string, title: string, date: Date) => {
        // Skip on web
        if (Platform.OS === 'web') return;

        // Cancel any existing notification for this task to avoid duplicates
        await NotificationService.cancelTaskReminder(taskId);

        const triggerDate = new Date(date);
        // Schedule 10 minutes before
        triggerDate.setMinutes(triggerDate.getMinutes() - 10);

        // Don't schedule if in the past
        if (triggerDate.getTime() <= Date.now()) return;

        const id = await Notifications.scheduleNotificationAsync({
            identifier: `task_${taskId}`,
            content: {
                title: 'Upcoming Task',
                body: `"${title}" starts in 10 minutes.`,
                sound: true,
                data: { taskId },
                badge: 1,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
            },
        });

        return id;
    },

    /**
     * Cancel a task reminder
     */
    cancelTaskReminder: async (taskId: string) => {
        // Skip on web
        if (Platform.OS === 'web') return;

        await Notifications.cancelScheduledNotificationAsync(`task_${taskId}`);
    },

    /**
     * Schedule daily reflection reminder (e.g., 9 PM)
     */
    scheduleDailyReflection: async (hour: number = 21, minute: number = 0) => {
        // Skip on web
        if (Platform.OS === 'web') return;

        await Notifications.cancelScheduledNotificationAsync('daily_reflection');

        await Notifications.scheduleNotificationAsync({
            identifier: 'daily_reflection',
            content: {
                title: 'Daily Reflection',
                body: 'Time to review your day. Close your rings and clear your mind.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    },

    /**
     * Schedule morning briefing (e.g., 7 AM)
     */
    scheduleMorningBriefing: async (hour: number = 7, minute: number = 0) => {
        // Skip on web
        if (Platform.OS === 'web') return;

        await Notifications.cancelScheduledNotificationAsync('morning_briefing');

        await Notifications.scheduleNotificationAsync({
            identifier: 'morning_briefing',
            content: {
                title: 'Morning Briefing',
                body: 'Review your goals and tasks for the day.',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    },

    /**
     * Cancel all notifications
     */
    cancelAll: async () => {
        // Skip on web
        if (Platform.OS === 'web') return;

        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
