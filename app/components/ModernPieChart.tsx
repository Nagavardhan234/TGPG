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

  // Calculate responsive dimensions based on screen size
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const baseSize = Math.min(screenWidth, screenHeight) * 0.35; // Reduced size
  const containerSize = Math.min(size, baseSize);
  const cardPadding = containerSize * 0.12; // Increased padding
  
  // Calculate SVG and progress bar dimensions
  const svgSize = containerSize - (cardPadding * 1.2); // Larger SVG relative to container
  const actualStrokeWidth = svgSize * 0.06; // Thinner stroke for more elegant look
  const radius = (svgSize - actualStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (data.value / data.total) * circumference;

  // Calculate font sizes based on container size - significantly reduced
  const percentageFontSize = svgSize * 0.18; // Smaller percentage
  const labelFontSize = svgSize * 0.07; // Smaller label

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

  return (
    <Surface style={[styles.container, { 
      width: containerSize + cardPadding * 2,
      height: containerSize + cardPadding * 2,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
      margin: containerSize * 0.03,
      padding: cardPadding,
      borderRadius: Math.min(25, (containerSize + cardPadding * 2) * 0.12),
      elevation: isDarkMode ? 4 : 2, // Reduced elevation for subtler shadow
    }]}>
      <View style={styles.svgContainer}>
        <Svg width={svgSize} height={svgSize}>
          <Defs>
            <LinearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={currentColors.start} stopOpacity="1" />
              <Stop offset="100%" stopColor={currentColors.end} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Track Circle */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}
            strokeWidth={actualStrokeWidth}
            fill="none"
          />

          {/* Progress Circle */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={`url(#${uniqueId})`}
            strokeWidth={actualStrokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          />
        </Svg>

        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: 'spring',
              duration: 800,
              damping: 20,
              stiffness: 200
            }}
            style={styles.textContainer}
          >
            <Text style={[styles.percentage, { 
              fontSize: percentageFontSize,
              color: isDarkMode ? '#FFFFFF' : theme.colors.text,
            }]}>
              {Math.round(data.value / data.total * 100)}%
            </Text>
            <Text style={[styles.label, { 
              fontSize: labelFontSize,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              marginTop: cardPadding * 0.2,
            }]}>
              {data.label}
            </Text>
          </MotiView>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
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
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontWeight: '600', // Slightly reduced weight
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: undefined,
  },
  label: {
    textAlign: 'center',
    opacity: 1, // Full opacity with rgba color instead
    fontWeight: '400', // Lighter weight for better contrast
    includeFontPadding: false,
    lineHeight: undefined,
  },
}); 