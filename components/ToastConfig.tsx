import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const getToastConfig = (isDark: boolean) => ({
    success: {
        icon: 'checkmark-circle',
        bgColor: isDark ? '#1a2e1a' : '#f0fdf4',
        iconColor: '#22c55e',
        borderColor: '#22c55e',
    },
    error: {
        icon: 'close-circle',
        bgColor: isDark ? '#2e1a1a' : '#fef2f2',
        iconColor: '#ef4444',
        borderColor: '#ef4444',
    },
    info: {
        icon: 'information-circle',
        bgColor: isDark ? '#1a1a2e' : '#eff6ff',
        iconColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    warning: {
        icon: 'warning',
        bgColor: isDark ? '#2e2a1a' : '#fffbeb',
        iconColor: '#f59e0b',
        borderColor: '#f59e0b',
    },
});

const ToastItem: React.FC<{
    toast: ToastMessage;
    onHide: (id: string) => void;
    isDark: boolean;
    colors: any;
}> = ({ toast, onHide, isDark, colors }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;
    const toastConfig = getToastConfig(isDark);
    const config = toastConfig[toast.type];

    React.useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 12,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 12,
            }),
        ]).start();

        // Auto hide after delay
        const hideTimeout = setTimeout(() => {
            hideToast();
        }, toast.type === 'error' ? 4000 : 3000);

        return () => clearTimeout(hideTimeout);
    }, []);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -30,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.9,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => onHide(toast.id));
    };

    return (
        <Animated.View
            style={[
                styles.toastContainer,
                {
                    backgroundColor: config.bgColor,
                    borderLeftColor: config.borderColor,
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            <Ionicons name={config.icon as any} size={18} color={config.iconColor} />
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {toast.title}
                </Text>
                {toast.message && (
                    <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={1}>
                        {toast.message}
                    </Text>
                )}
            </View>
            <TouchableOpacity onPress={hideToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
        </Animated.View>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const insets = useSafeAreaInsets();
    const { isDark, colors } = useTheme();

    const showToast = useCallback((type: ToastType, title: string, message?: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, title, message }]);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <View style={[styles.toastWrapper, { top: insets.top + 16 }]} pointerEvents="box-none">
                {toasts.map((toast) => (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        onHide={hideToast}
                        isDark={isDark}
                        colors={colors}
                    />
                ))}
            </View>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Singleton helper for showing toasts without hook (useful in callbacks)
let toastRef: ToastContextType | null = null;

export const setToastRef = (ref: ToastContextType) => {
    toastRef = ref;
};

export const showToast = {
    success: (title: string, message?: string) => toastRef?.showToast('success', title, message),
    error: (title: string, message?: string) => toastRef?.showToast('error', title, message),
    info: (title: string, message?: string) => toastRef?.showToast('info', title, message),
    warning: (title: string, message?: string) => toastRef?.showToast('warning', title, message),
};

// Component to set toast ref
export const ToastRefSetter: React.FC = () => {
    const toast = useToast();
    React.useEffect(() => {
        setToastRef(toast);
    }, [toast]);
    return null;
};

const { width } = Dimensions.get('window');
const toastMaxWidth = Math.min(360, width - 48);

const styles = StyleSheet.create({
    toastWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        ...Platform.select({
            web: {
                position: 'fixed' as any,
            },
        }),
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderLeftWidth: 3,
        marginBottom: 8,
        maxWidth: toastMaxWidth,
        minWidth: 200,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    contentContainer: {
        flex: 1,
        marginRight: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    message: {
        fontSize: 12,
        marginTop: 1,
    },
});
