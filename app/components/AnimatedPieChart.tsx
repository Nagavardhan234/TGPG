import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';

interface PieChartData {
  value: number;
  color: string;
  label: string;
}

interface Props {
  data: PieChartData[];
  size: number;
  title: string;
  total: string;
  onViewMore: () => void;
  viewMoreText: string;
  theme: any;
}

export const AnimatedPieChart = ({ data, size, title, total, onViewMore, viewMoreText, theme }: Props) => {
  console.log('PieChart Props:', { data, size, title, total, theme });

  if (!theme) {
    console.log('No theme provided to PieChart');
    return null;
  }

  const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;
  const countAnimations = useRef(data.map(() => new Animated.Value(0))).current;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    // Animate pie segments
    Animated.parallel([
      ...animatedValues.map((anim, index) =>
        Animated.timing(anim, {
          toValue: data[index].value,
          duration: 1500,
          useNativeDriver: false,
        })
      ),
      ...countAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: data[index].value,
          duration: 1500,
          useNativeDriver: false,
        })
      )
    ]).start();
  }, []);

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const createPieSegment = (startPercent: number, endPercent: number, color: string) => {
    const start = getCoordinatesForPercent(startPercent);
    const end = getCoordinatesForPercent(endPercent);
    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${start[0]} ${start[1]}`,
      `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
      'L 0 0',
    ].join(' ');

    return (
      <Path
        d={pathData}
        fill={color}
        transform={`translate(${size/2}, ${size/2}) scale(${size/2})`}
      />
    );
  };

  const renderSegments = () => {
    let currentPercent = 0;
    return data.map((segment, i) => {
      const startPercent = currentPercent;
      const percent = segment.value / totalValue;
      currentPercent += percent;

      return (
        <G key={i}>
          {createPieSegment(startPercent, currentPercent, segment.color)}
        </G>
      );
    });
  };

  // Get available students (assuming it's the first item in data array)
  const availableCount = data[0].value;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size/2}
            cy={size/2}
            r={size/2 - 1}
            fill={theme.colors.background}
            stroke={theme.colors.surfaceVariant}
            strokeWidth="2"
          />
          {/* Pie segments */}
          {renderSegments()}
          {/* Center circle for donut effect */}
          <Circle
            cx={size/2}
            cy={size/2}
            r={size/3}
            fill={theme.colors.background}
            stroke={theme.colors.surfaceVariant}
            strokeWidth="1"
          />
          {/* Center text */}
          <SvgText
            x={size/2}
            y={size/2 - 10}
            fontSize="24"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={theme.colors.text}
          >
            {availableCount}
          </SvgText>
          <SvgText
            x={size/2}
            y={size/2 + 15}
            fontSize="14"
            textAnchor="middle"
            alignmentBaseline="middle"
            fill={theme.colors.textSecondary}
          >
            Available
          </SvgText>
        </Svg>
      </View>

      {/* Legend with animated numbers */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={[
            styles.legendItem,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.surfaceVariant,
              borderWidth: 1,
            }
          ]}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { 
                color: theme.colors.text,
                fontWeight: '500',
                fontSize: 14,
              }]}>
                {item.label}
              </Text>
            </View>
            <Text style={[styles.legendValue, { 
              color: theme.colors.text,
              fontWeight: 'bold',
              fontSize: 14,
            }]}>
              {Math.round((item.value/totalValue) * 100)}%
            </Text>
          </View>
        ))}
      </View>

      <Button 
        mode="text" 
        onPress={onViewMore}
        style={styles.button}
        textColor={theme.colors.primary}
      >
        {viewMoreText} →
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chartContainer: {
    marginBottom: 8,
  },
  legend: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 0,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendValue: {
    fontWeight: 'bold',
  },
  button: {
    marginTop: 8,
  },
}); 