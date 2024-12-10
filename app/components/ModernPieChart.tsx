import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
  const [currentColors, setCurrentColors] = useState(getProgressColor(0));

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.value / data.total) * circumference;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: data.value / data.total,
      duration,
      useNativeDriver: true,
    }).start(() => {
      onComplete?.();
    });
  }, [data]);

  useEffect(() => {
    const percentage = (data.value / data.total) * 100;
    const colors = getProgressColor(percentage);
    setCurrentColors(colors);
  }, [data]);

  // Calculate responsive font sizes
  const percentageFontSize = size * 0.15;
  const labelFontSize = size * 0.06;

  return (
    <Surface style={[styles.container, { 
      width: size, 
      height: size+50,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
      padding: size * 0.05,
    }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={currentColors.start} stopOpacity="1" />
            <Stop offset="100%" stopColor={currentColors.end} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceVariant}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={[styles.content, { padding: size * 0.1 }]}>
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
    aspectRatio: 1,
    height: 270,
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