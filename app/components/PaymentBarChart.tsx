import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Color from 'color';

const { width } = Dimensions.get('window');

interface PaymentBarChartProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const PaymentBarChart: React.FC<PaymentBarChartProps> = ({
  label,
  count,
  total,
  color,
}) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    // Reset animations
    heightAnim.setValue(0);
    countAnim.setValue(0);

    // Calculate percentage (avoid division by zero)
    const percentage = total > 0 ? (count / total) * 100 : 0;

    // Add listener for count animation
    const listener = countAnim.addListener(({ value }) => {
      setDisplayCount(Math.round(value));
    });

    // Start animations
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: percentage,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(countAnim, {
        toValue: count,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();

    return () => {
      countAnim.removeListener(listener);
    };
  }, [count, total]);

  // Calculate max height based on screen size
  const maxHeight = width < 768 ? 120 : 180;
  
  const barHeight = heightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, maxHeight],
  });

  return (
    <View style={styles.barContainer}>
      <Text style={styles.barCount}>
        {displayCount}
      </Text>
      <View style={styles.barWrapper}>
        <Animated.View
          style={[
            styles.bar,
            {
              height: barHeight,
              backgroundColor: color,
            },
          ]}
        >
          <LinearGradient
            colors={[Color(color).alpha(0.8).toString(), color]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      </View>
      <Text style={styles.barLabel} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
      {total > 0 && (
        <Text style={styles.percentage}>
          {Math.round((count / total) * 100)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    alignItems: 'center',
    width: '22%',
    marginHorizontal: '1.5%',
  },
  barWrapper: {
    width: '100%',
    height: width < 768 ? 120 : 180,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 2,
  },
  barCount: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  percentage: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
});

export default PaymentBarChart; 