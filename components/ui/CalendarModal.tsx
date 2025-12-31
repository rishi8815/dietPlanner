import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';

interface CalendarModalProps {
    visible: boolean;
    onClose: () => void;
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
    visible,
    onClose,
    selectedDate,
    onDateSelect,
}) => {
    const { colors } = useTheme();

    const handleDayPress = (day: any) => {
        onDateSelect(day.dateString);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    {/* Handle Bar */}
                    <View style={styles.handleBar}>
                        <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Select Date</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Calendar */}
                    <RNCalendar
                        current={selectedDate}
                        onDayPress={handleDayPress}
                        markedDates={{
                            [selectedDate]: {
                                selected: true,
                                selectedColor: colors.primary,
                            },
                        }}
                        theme={{
                            backgroundColor: colors.surface,
                            calendarBackground: colors.surface,
                            textSectionTitleColor: colors.textSecondary,
                            selectedDayBackgroundColor: colors.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: colors.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.textMuted,
                            dotColor: colors.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: colors.primary,
                            monthTextColor: colors.text,
                            indicatorColor: colors.primary,
                            textDayFontWeight: '400',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '600',
                            textDayFontSize: 16,
                            textMonthFontSize: 18,
                            textDayHeaderFontSize: 14,
                        }}
                        style={styles.calendar}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default CalendarModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        paddingBottom: 30,
    },
    handleBar: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    calendar: {
        paddingHorizontal: 8,
        paddingBottom: 10,
    },
});
