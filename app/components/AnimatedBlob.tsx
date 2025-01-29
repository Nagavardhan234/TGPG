import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export const AnimatedBlob = () => {
  const { theme } = useTheme();
  const animation1 = new Animated.Value(0);
  const animation2 = new Animated.Value(0);

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation1, {
              toValue: 1,
              duration: 8000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(animation1, {
              toValue: 0,
              duration: 8000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation2, {
              toValue: 1,
              duration: 12000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
            Animated.timing(animation2, {
              toValue: 0,
              duration: 12000,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    };

    animate();
  }, []);

  const blob1Transform = {
    transform: [
      {
        scale: animation1.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
      {
        rotate: animation1.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const blob2Transform = {
    transform: [
      {
        scale: animation2.interpolate({
          inputRange: [0, 1],
          outputRange: [1.2, 1],
        }),
      },
      {
        rotate: animation2.interpolate({
          inputRange: [0, 1],
          outputRange: ['360deg', '0deg'],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.blob,
          styles.blob1,
          { backgroundColor: theme.colors.primary + '40' },
          blob1Transform,
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blob2,
          { backgroundColor: theme.colors.secondary + '40' },
          blob2Transform,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  blob1: {
    top: -100,
    right: -100,
  },
  blob2: {
    bottom: -100,
    left: -100,
  },
}); 