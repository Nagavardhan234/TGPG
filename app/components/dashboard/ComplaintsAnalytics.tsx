import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Card, Text, useTheme, ProgressBar } from 'react-native-paper';
import { ComplaintStats } from '@/app/services/manager.complaints.service';
import { BarChart } from 'react-native-chart-kit';

interface Props {
  stats: ComplaintStats;
}

// Helper function to safely parse numbers
const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Calculate percentage safely
const calculatePercentage = (count: number, total: number): number => {
  if (!total || total <= 0) return 0;
  return Math.round((count / total) * 100);
};

export default function ComplaintsAnalytics({ stats }: Props) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Safely parse all stats values
  const safeStats = {
    total: safeNumber(stats.total),
    pending: safeNumber(stats.pending),
    inProgress: safeNumber(stats.inProgress),
    resolved: safeNumber(stats.resolved),
    cancelled: safeNumber(stats.cancelled),
    avgResolutionTime: safeNumber(stats.avgResolutionTime),
  };

  // Log the stats for debugging
  console.log('Stats received:', stats);
  console.log('Safe stats:', safeStats);

  const statusData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [safeStats.pending, safeStats.inProgress, safeStats.resolved],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.8,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  // Process categories with safe number handling
  const categoryStats = (stats.categories || []).map(cat => {
    const count = safeNumber(cat.count);
    const percentage = calculatePercentage(count, safeStats.total);
    
    // Debug log
    console.log(`Category ${cat.name}:`, {
      count,
      total: safeStats.total,
      percentage
    });

    return {
      ...cat,
      count,
      progress: percentage / 100,
      percentage
    };
  });

  return (
    <ScrollView style={styles.container}>
      {/* Overview Cards */}
      <View style={styles.cardRow}>
        <Card style={[styles.smallCard, { backgroundColor: '#FFAB40' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>
              {safeStats.pending}
            </Text>
            <Text variant="bodyMedium" style={styles.lightText}>Pending</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.smallCard, { backgroundColor: '#6200EE' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>
              {safeStats.inProgress}
            </Text>
            <Text variant="bodyMedium" style={styles.lightText}>In Progress</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.smallCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>
              {safeStats.resolved}
            </Text>
            <Text variant="bodyMedium" style={styles.lightText}>Resolved</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Status Distribution Chart */}
      <Card style={styles.card}>
        <Card.Title title="Status Distribution" />
        <Card.Content>
          <BarChart
            data={statusData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            showValuesOnTopOfBars
            fromZero
          />
        </Card.Content>
      </Card>

      {/* Category Distribution */}
      <Card style={styles.card}>
        <Card.Title title="Category Distribution" />
        <Card.Content>
          {categoryStats.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text variant="bodyLarge">{category.name}</Text>
                <Text variant="bodyMedium">
                  {category.count} ({category.percentage}%)
                </Text>
              </View>
              <ProgressBar
                progress={category.progress}
                color="#6200EE"
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Title title="Performance Metrics" />
        <Card.Content>
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={{ color: '#6200EE' }}>
                {safeStats.avgResolutionTime.toFixed(1)}h
              </Text>
              <Text variant="bodyMedium">Avg. Resolution Time</Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={{ color: '#6200EE' }}>
                {calculatePercentage(safeStats.resolved, safeStats.total)}%
              </Text>
              <Text variant="bodyMedium">Resolution Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  smallCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  lightText: {
    color: 'white',
  },
  card: {
    marginBottom: 16,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
  },
}); 