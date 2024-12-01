import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const rotateAnim = new Animated.Value(isDarkMode ? 1 : 0);

  const handlePress = () => {
    Animated.spring(rotateAnim, {
      toValue: isDarkMode ? 0 : 1,
      useNativeDriver: true,
    }).start();
    toggleTheme();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <IconButton
        icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
        size={24}
        onPress={handlePress}
        style={styles.button}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
}); 