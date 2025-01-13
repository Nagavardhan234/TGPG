import React from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Card, Text, useTheme, ProgressBar } from 'react-native-paper';
import { ComplaintStats } from '@/app/services/manager.complaints.service';
import { BarChart } from 'react-native-chart-kit';

interface Props {
  stats: ComplaintStats;
}

export default function ComplaintsAnalytics({ stats }: Props) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const statusData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [stats.pending || 0, stats.inProgress || 0, stats.resolved || 0],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const index = Math.floor(Math.random() * 3);
      const barColors = [
        `rgba(255, 171, 64, ${opacity})`, // warning/orange for pending
        `rgba(98, 0, 238, ${opacity})`,   // primary/purple for in progress
        `rgba(76, 175, 80, ${opacity})`,  // success/green for resolved
      ];
      return barColors[index];
    },
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

  // Calculate percentages for each category
  const totalComplaints = stats.total || 1; // Prevent division by zero
  const categoryStats = stats.categories?.map(cat => ({
    ...cat,
    percentage: (cat.count / totalComplaints) * 100
  })) || [];

  return (
    <ScrollView style={styles.container}>
      {/* Overview Cards */}
      <View style={styles.cardRow}>
        <Card style={[styles.smallCard, { backgroundColor: '#FFAB40' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>{stats.pending}</Text>
            <Text variant="bodyMedium" style={styles.lightText}>Pending</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.smallCard, { backgroundColor: '#6200EE' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>{stats.inProgress}</Text>
            <Text variant="bodyMedium" style={styles.lightText}>In Progress</Text>
          </Card.Content>
        </Card>
        <Card style={[styles.smallCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.lightText}>{stats.resolved}</Text>
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
                <Text variant="bodyMedium">{category.count} ({category.percentage.toFixed(1)}%)</Text>
              </View>
              <ProgressBar
                progress={category.percentage / 100}
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
                {stats.avgResolutionTime ? stats.avgResolutionTime.toFixed(1) : '0.0'}h
              </Text>
              <Text variant="bodyMedium">Avg. Resolution Time</Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={{ color: '#6200EE' }}>
                {((stats.resolved / stats.total) * 100).toFixed(1)}%
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