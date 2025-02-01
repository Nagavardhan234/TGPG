import React from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme, isDarkMode } = useTheme();
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      animatedValue.stopAnimation();
    };
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDarkMode ? '#404040' : '#E1E9EE',
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

// Predefined skeleton layouts
export const SkeletonLayouts = {
  // Text line skeleton
  TextLine: ({ width = '100%', style }: { width?: string | number; style?: any }) => (
    <Skeleton width={width} height={16} style={style} />
  ),

  // Avatar skeleton
  Avatar: ({ size = 40, style }: { size?: number; style?: any }) => (
    <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />
  ),

  // Card skeleton
  Card: ({ height = 100, style }: { height?: number; style?: any }) => (
    <Skeleton width="100%" height={height} borderRadius={8} style={style} />
  ),

  // List item skeleton
  ListItem: () => (
    <View style={styles.listItem}>
      <Skeleton width={40} height={40} borderRadius={20} style={styles.avatar} />
      <View style={styles.content}>
        <Skeleton width="60%" height={16} style={styles.title} />
        <Skeleton width="90%" height={12} style={styles.subtitle} />
      </View>
    </View>
  ),
};

const listItemStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {},
});

export default Skeleton; 