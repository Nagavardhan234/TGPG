import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PaymentChartData } from '@/app/types/payment.types';
import { paymentAnalyticsService } from '@/app/services/payment.analytics.service';
import { router } from 'expo-router';
import Color from 'color';

interface Props {
  data: PaymentChartData[];
  isDarkMode: boolean;
  onBarPress?: (label: string) => void;
}

export const PaymentAnalyticsChart: React.FC<Props> = ({ 
  data = [], 
  isDarkMode,
  onBarPress 
}) => {
  const { colors } = useTheme();
  const validData = data.filter(item => item && typeof item === 'object');
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [barScales] = useState(validData.map(() => new Animated.Value(0)));
  const [countAnimations] = useState(validData.map(() => new Animated.Value(0)));
  const [glowAnimations] = useState(validData.map(() => new Animated.Value(0)));

  // Initialize animations on mount
  useEffect(() => {
    const animations = validData.map((_, index) => [
      Animated.spring(barScales[index], {
        toValue: 1,
        useNativeDriver: true,
        delay: index * 100,
      }),
      Animated.timing(countAnimations[index], {
        toValue: validData[index]?.count || 0,
        duration: 1000,
        useNativeDriver: false,
        delay: index * 100,
      })
    ]).flat();

    Animated.parallel(animations).start();

    // Start glow animations
    validData.forEach((_, index) => {
      startGlowAnimation(index);
    });
  }, [validData]);

  const startGlowAnimation = (index: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimations[index], {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimations[index], {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handleBarPress = (index: number) => {
    setSelectedBar(index);
    setTooltipVisible(true);
    
    // Animate the pressed bar
    Animated.spring(barScales[index], {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();

    // Navigate to payments page with filter
    if (onBarPress) {
      onBarPress(validData[index]?.label || '');
    }
  };

  const handleBarRelease = (index: number) => {
    // Reset bar scale
    Animated.spring(barScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const renderTooltip = (item: PaymentChartData) => {
    if (!tooltipVisible) return null;

    return (
      <BlurView
        intensity={isDarkMode ? 40 : 70}
        tint={isDarkMode ? 'dark' : 'light'}
        style={[
          styles.tooltip,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(0,0,0,0.8)' 
              : 'rgba(255,255,255,0.8)',
          }
        ]}
      >
        <Text style={[styles.tooltipTitle, { color: item.color }]}>
          {item.label}
        </Text>
        <Text style={{ color: colors.onSurface }}>
          Count: {item.count} tenants
        </Text>
        <Text style={{ color: colors.onSurface }}>
          {((item.count / item.total) * 100).toFixed(1)}%
        </Text>
      </BlurView>
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.barsContainer}>
        {validData.map((item, index) => (
          <View key={item?.label || index} style={styles.barWrapper}>
            <Animated.View
              style={[
                styles.barContainer,
                {
                  transform: [{ scale: barScales[index] }],
                }
              ]}
            >
              <Pressable
                onPressIn={() => handleBarPress(index)}
                onPressOut={() => handleBarRelease(index)}
                style={styles.barPressable}
              >
                {/* Glow effect */}
                <Animated.View
                  style={[
                    styles.glow,
                    {
                      backgroundColor: item.glowColor,
                      opacity: glowAnimations[index],
                    }
                  ]}
                />
                
                {/* Bar with gradient */}
                <LinearGradient
                  colors={[item.color, item.glowColor]}
                  style={[
                    styles.bar,
                    {
                      height: (item.count / Math.max(...validData.map(d => d.count))) * 200,
                    }
                  ]}
                />

                {/* Count label */}
                <Animated.Text style={[
                  styles.countLabel,
                  { color: colors.onSurface }
                ]}>
                  {countAnimations[index].interpolate({
                    inputRange: [0, item.count || 0],
                    outputRange: ['0', (item.count || 0).toString()],
                  })}
                </Animated.Text>

                {/* Bar label */}
                <Text style={[
                  styles.barLabel,
                  { color: colors.onSurface }
                ]}>
                  {item.label}
                </Text>
              </Pressable>
            </Animated.View>

            {selectedBar === index && renderTooltip(item)}
          </View>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 50,
  },
  barPressable: {
    alignItems: 'center',
    width: '100%',
  },
  glow: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    borderRadius: 8,
    height: 20,
    transform: [{ scaleY: 3 }],
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 40,
  },
  countLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  barLabel: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  tooltip: {
    position: 'absolute',
    top: -80,
    padding: 12,
    borderRadius: 8,
    width: 150,
    elevation: 5,
    zIndex: 1000,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
}); 