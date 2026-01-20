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
    Text,
    TouchableOpacity
    
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingInputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    style?: StyleProp<ViewStyle>;
    errorText?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ label, style, errorText, secureTextEntry, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);
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
            outputRange: [errorText ? '#d32f2f' : '#aaa', errorText ? '#d32f2f' : '#1a5dab'],
        }),
    };

    const borderColor = errorText ? '#d32f2f' : (isFocused ? '#1a5dab' : '#ddd');

    return (
        <View style={[styles.container, style]}>
            <Animated.Text style={[styles.label, animatedLabelStyle]}>
                {label}
            </Animated.Text>
        <View>
            <TextInput
                {...props}
                secureTextEntry={isSecure}
                style={[
                    styles.input,
                    { borderColor: borderColor },
                    secureTextEntry ? {paddingRight: 50} : {}
                ]}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    setIsFocused(false);
                    if (props.onBlur) props.onBlur(e);
                }}
            />

            {secureTextEntry && (
                <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setIsSecure(!isSecure)}
                >
                <Ionicons 
                    name={isSecure ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color="#888" 
                />
                </TouchableOpacity>
            )}
        </View>

            {errorText ? (
                <Text style={styles.errorText}>{errorText}</Text>
            ) : null}
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
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 16, 
    zIndex: 10
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  }
});

export default FloatingInput;