import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Dimensions,
    Animated,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 80;

interface BottomSheetModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxHeight?: number;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
    visible,
    onClose,
    title,
    children,
    maxHeight = SCREEN_HEIGHT * 0.85,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(0)).current;
    const [isDragging, setIsDragging] = useState(false);

    // Reset when modal opens
    React.useEffect(() => {
        if (visible) {
            translateY.setValue(0);
        }
    }, [visible]);

    const handleClose = () => {
        // Just call onClose - the Modal's animationType="slide" handles the animation
        onClose();
    };





    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Backdrop */}

                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Modal Content */}
                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.background,
                            maxHeight,
                            paddingBottom: Math.max(insets.bottom, 20),
                            transform: [{ translateY }],
                        }
                    ]}
                >



                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.surface }]}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        contentContainerStyle={styles.contentContainer}
                        showsVerticalScrollIndicator={true}
                        bounces={true}
                    >
                        {children}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    handleArea: {
        alignItems: 'center',
        paddingVertical: 12,
        cursor: 'grab',
    },
    handle: {
        width: 48,
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
    },
    swipeHint: {
        fontSize: 11,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
});
