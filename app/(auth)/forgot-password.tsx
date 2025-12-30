import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useTheme } from '@/components/ThemeContext';
import { useAuth } from '@/components/AuthContext';
import { showToast } from '@/components/ToastConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
    const { colors, isDark } = useTheme();
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = () => {
        if (!email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email');
            return false;
        }
        setError('');
        return true;
    };

    const handleResetPassword = async () => {
        if (!validateEmail()) return;

        setIsLoading(true);
        const { error } = await resetPassword(email);
        setIsLoading(false);

        if (error) {
            showToast.error('Error', error.message);
        } else {
            showToast.success('Email Sent', 'Check your inbox for the password reset link');
            setEmailSent(true);
        }
    };

    const styles = createStyles(colors, isDark);

    if (emailSent) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                        <Ionicons name="mail-open" size={64} color={colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successMessage}>
                        We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
                    </Text>
                    <TouchableOpacity
                        style={styles.backToSignInButton}
                        onPress={() => router.replace('/(auth)/sign-in' as Href)}
                    >
                        <Text style={styles.backToSignInText}>Back to Sign In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => setEmailSent(false)}
                    >
                        <Text style={styles.resendText}>Didn't receive email? Resend</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.logoContainer}>
                        <Ionicons name="key" size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Don't worry! Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.inputContainer, error && styles.inputError]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>

                    {/* Reset Password Button */}
                    <TouchableOpacity
                        style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>Send Reset Link</Text>
                        )}
                    </TouchableOpacity>

                    {/* Back to Sign In */}
                    <TouchableOpacity
                        style={styles.backLink}
                        onPress={() => router.replace('/(auth)/sign-in' as Href)}
                    >
                        <Ionicons name="arrow-back" size={18} color={colors.primary} />
                        <Text style={styles.backLinkText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
        },
        header: {
            alignItems: 'center',
            marginBottom: 40,
        },
        backButton: {
            position: 'absolute',
            left: 0,
            top: 0,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        logoContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 16,
        },
        form: {
            flex: 1,
        },
        inputGroup: {
            marginBottom: 24,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            height: 56,
        },
        inputError: {
            borderColor: colors.statusError,
        },
        inputIcon: {
            marginRight: 12,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: colors.text,
        },
        errorText: {
            fontSize: 12,
            color: colors.statusError,
            marginTop: 4,
        },
        resetButton: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        resetButtonDisabled: {
            opacity: 0.7,
        },
        resetButtonText: {
            fontSize: 18,
            fontWeight: '600',
            color: '#fff',
        },
        backLink: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 24,
            gap: 8,
        },
        backLinkText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary,
        },
        // Success State
        successContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
        },
        successIconContainer: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
        },
        successTitle: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
        },
        successMessage: {
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
        },
        backToSignInButton: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            height: 54,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
        },
        backToSignInText: {
            fontSize: 17,
            fontWeight: '600',
            color: '#fff',
        },
        resendButton: {
            padding: 12,
        },
        resendText: {
            fontSize: 14,
            color: colors.primary,
            fontWeight: '500',
        },
    });
