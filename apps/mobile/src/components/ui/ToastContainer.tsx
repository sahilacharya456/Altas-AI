import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useToastStore } from '../../stores/toastStore';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';

export function ToastContainer() {
    const toasts = useToastStore((state) => state.toasts);

    if (toasts.length === 0) return null;

    return (
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
            <View style={styles.container} pointerEvents="box-none">
                {toasts.map((toast) => {
                    const backgroundColor =
                        toast.type === 'success' ? ALTASAI_COLORS.success.primary :
                        toast.type === 'error' ? ALTASAI_COLORS.error.primary :
                        ALTASAI_COLORS.info.primary;

                    return (
                        <Animated.View
                            key={toast.id}
                            entering={FadeInUp.duration(300)}
                            exiting={FadeOutUp.duration(300)}
                            style={[styles.toast, { backgroundColor }]}
                        >
                            <Text style={styles.toastText}>{toast.message}</Text>
                        </Animated.View>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
    },
    container: {
        width: '100%',
        paddingHorizontal: ALTASAI_SPACING[4],
        paddingTop: ALTASAI_SPACING[2],
        gap: ALTASAI_SPACING[2],
        alignItems: 'center',
    },
    toast: {
        width: '90%',
        maxWidth: 400,
        paddingVertical: ALTASAI_SPACING[3],
        paddingHorizontal: ALTASAI_SPACING[4],
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: ALTASAI_TYPOGRAPHY.size.sm,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
        textAlign: 'center',
    },
});
