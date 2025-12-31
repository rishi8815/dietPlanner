import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import StorageService from '@/services/StorageService';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    colors: typeof lightColors;
}

// Light theme colors
const lightColors = {
    background: '#f1e3ec',
    surface: '#ffffff',
    surfaceSecondary: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    primary: '#4CAF50',
    primaryLight: '#E8F5E8',
    accent: '#FF5722',
    accentLight: '#FFF3E0',
    border: '#E0E0E0',
    borderLight: '#EEEEEE',
    icon: '#4CAF50',
    iconMuted: '#CCC',
    cardBackground: '#ffffff',
    modalBackground: '#f1e3ec',
    dangerBackground: '#FFF3E0',
    switchTrackInactive: '#E0E0E0',
    switchThumb: '#f4f3f4',
    statusSuccess: '#4CAF50',
    statusError: '#FF5722',
};

// Dark theme colors
const darkColors: typeof lightColors = {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#2C2C2C',
    text: '#ECEDEE',
    textSecondary: '#A0A0A0',
    textMuted: '#707070',
    primary: '#66BB6A',
    primaryLight: '#1B3D1C',
    accent: '#FF7043',
    accentLight: '#3D2A1F',
    border: '#3D3D3D',
    borderLight: '#2C2C2C',
    icon: '#66BB6A',
    iconMuted: '#555555',
    cardBackground: '#1E1E1E',
    modalBackground: '#121212',
    dangerBackground: '#3D2A1F',
    switchTrackInactive: '#3D3D3D',
    switchThumb: '#707070',
    statusSuccess: '#66BB6A',
    statusError: '#FF7043',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const deviceColorScheme = useDeviceColorScheme();
    // Default to 'system' to automatically follow device theme
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await StorageService.getThemePreference();
            if (savedTheme) {
                setThemeModeState(savedTheme as ThemeMode);
            }
            // If no saved preference, keep 'system' as default
        } catch (error) {
            console.error('Error loading theme preference:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await StorageService.saveThemePreference(mode);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
        setThemeMode(newMode);
    };

    // Resolve the actual theme based on mode and system preference
    const resolvedTheme: ResolvedTheme =
        themeMode === 'system'
            ? (deviceColorScheme === 'dark' ? 'dark' : 'light')
            : themeMode;

    const isDark = resolvedTheme === 'dark';
    const colors = isDark ? darkColors : lightColors;

    const value: ThemeContextType = {
        themeMode,
        resolvedTheme,
        isDark,
        setThemeMode,
        toggleTheme,
        colors,
    };

    // Don't render children until theme is loaded to prevent flash
    if (isLoading) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export { lightColors, darkColors };
