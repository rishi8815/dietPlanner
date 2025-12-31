import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import NetInfo from '@react-native-community/netinfo';

interface NoInternetScreenProps {
    onRetry?: () => void;
}

export const NoInternetScreen: React.FC<NoInternetScreenProps> = ({ onRetry }) => {
    const { colors, isDark } = useTheme();

    const handleRetry = async () => {
        const state = await NetInfo.fetch();
        if (state.isConnected && state.isInternetReachable) {
            onRetry?.();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: colors.dangerBackground }]}>
                    <Ionicons name="cloud-offline" size={64} color={colors.accent} />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                    No Internet Connection
                </Text>

                {/* Description */}
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    Please check your network connection and try again. This app requires an internet connection to work.
                </Text>

                {/* Retry Button */}
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={handleRetry}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>

                {/* Tips */}
                <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.tipsTitle, { color: colors.text }]}>
                        Things to try:
                    </Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="wifi" size={16} color={colors.textMuted} />
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                            Check if Wi-Fi is enabled
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="cellular" size={16} color={colors.textMuted} />
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                            Check your mobile data
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="airplane" size={16} color={colors.textMuted} />
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                            Turn off Airplane mode
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        alignItems: 'center',
        maxWidth: 340,
        width: '100%',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    tipsContainer: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
    },
});
