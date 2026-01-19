// components/FloatingInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    Animated,
    StyleSheet,
    Easing,
    TextInputProps,
    StyleProp,
    ViewStyle,
    
} from 'react-native';

interface FloatingInputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    style?: StyleProp<ViewStyle>;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ label, style, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(props.value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused || props.value ? 1 : 0,
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
        }).start();
    }, [focusAnim, isFocused, props.value]);

    const animatedLabelStyle = {
        top: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, -2],
        }),
        fontSize: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: focusAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['#aaa', '#1a5dab'],
        }),
    };

    return (
        <View style={[styles.container, style]}>
            <Animated.Text style={[styles.label, animatedLabelStyle]}>
                {label}
            </Animated.Text>
            <TextInput
                {...props}
                style={[
                    styles.input,
                    { borderColor: isFocused ? '#1a5dab' : '#ddd' }
                ]}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    setIsFocused(false);
                    if (props.onBlur) props.onBlur(e);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        paddingTop: 5,
    },
    label: {
        position: 'absolute', 
        left: 12,
        backgroundColor: 'white',
        paddingHorizontal: 4,
        zIndex: 1,
    },
    input: {
        height: 56,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#333',
    },
});

export default FloatingInput;