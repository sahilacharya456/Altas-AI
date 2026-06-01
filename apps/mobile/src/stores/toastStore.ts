import { create } from 'zustand';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastStore {
    toasts: Toast[];
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    hideToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    showToast: (message, type) => {
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));
        // Auto-hide after 3 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, 3000);
    },
    hideToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));
