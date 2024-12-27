import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Svg, { Circle, Defs, LinearGradient, Stop, Filter, FeGaussianBlur, FeOffset, FeComposite } from 'react-native-svg';
import { useTheme } from '@/app/context/ThemeContext';
import { MotiView } from 'moti';

interface PieChartData {
  value: number;
  total: number;
  label: string;
}

interface ModernPieChartProps {
  data: PieChartData;
  size: number;
  strokeWidth?: number;
  duration?: number;
  onComplete?: () => void;
}

// Move getProgressColor function before its usage
const getProgressColor = (percentage: number) => {
  // Modern gradient colors based on percentage
  if (percentage >= 75) {
    return {
      start: '#00C6FB',
      end: '#005BEA'
    };
  } else if (percentage >= 50) {
    return {
      start: '#38EF7D',
      end: '#11998E'
    };
  } else if (percentage >= 25) {
    return {
      start: '#FFE259',
      end: '#FFA751'
    };
  } else {
    return {
      start: '#FF5E62',
      end: '#FF9966'
    };
  }
};

export const ModernPieChart: React.FC<ModernPieChartProps> = ({
  data,
  size,
  strokeWidth = size * 0.08,
  duration = 1500,
  onComplete
}) => {
  const { theme, isDarkMode } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const uniqueId = useRef(`grad-${Math.random().toString(36).substr(2, 9)}`).current;
  const [currentColors, setCurrentColors] = useState(() => {
    const percentage = (data.value / data.total) * 100;
    return getProgressColor(percentage);
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.value / data.total) * circumference;

  // Force update colors on mount and data change
  useEffect(() => {
    const percentage = (data.value / data.total) * 100;
    setCurrentColors(getProgressColor(percentage));
  }, [data.value, data.total]);

  // Handle animation
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: data.value / data.total,
      duration,
      useNativeDriver: true,
    }).start(() => {
      onComplete?.();
    });
  }, [data.value, data.total, duration]);

  // Calculate responsive dimensions
  const containerSize = Math.min(size, Dimensions.get('window').width * 0.9);
  const percentageFontSize = containerSize * 0.15;
  const labelFontSize = containerSize * 0.06;

  // Inline styles for gradient colors
  const gradientStyle = {
    stroke: `url(#${uniqueId})`,
  };

  return (
    <Surface style={[styles.container, { 
      width: containerSize, 
      height: containerSize + containerSize * 0.2,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
      padding: containerSize * 0.05,
    }]}>
      <Svg width={containerSize} height={containerSize}>
        <Defs>
          <LinearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={currentColors.start} stopOpacity="1" />
            <Stop offset="100%" stopColor={currentColors.end} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <Circle
          cx={containerSize / 2}
          cy={containerSize / 2}
          r={radius}
          style={gradientStyle}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${containerSize / 2} ${containerSize / 2})`}
        />
      </Svg>

      <View style={[styles.content, { padding: containerSize * 0.1 }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 1000 }}
        >
          <Text style={[styles.percentage, { 
            fontSize: percentageFontSize,
            color: isDarkMode ? '#FFFFFF' : theme.colors.text,
          }]}>
            {Math.round(data.value / data.total * 100)}%
          </Text>
          <Text style={[styles.label, { 
            fontSize: labelFontSize,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : theme.colors.textSecondary
          }]}>
            {data.label}
          </Text>
        </MotiView>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  percentage: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
    lineHeight: undefined,
  },
  label: {
    textAlign: 'center',
    marginTop: '2%',
    opacity: 0.8,
    includeFontPadding: false,
    lineHeight: undefined,
  },
}); 