import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Searchbar, useTheme } from 'react-native-paper';
import { PaymentAnalytics, PaymentChartData } from '../../types/payment.types';
import { getPaymentStats } from '../../services/api';
import { debounce } from 'lodash';
import PaymentAnalyticsChart from '../../components/charts/PaymentAnalyticsChart';
import { colors } from '../../theme/colors';

export default function PaymentAnalyticsScreen() {
  const theme = useTheme();
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PaymentAnalytics | null>(null);
  const [chartData, setChartData] = useState<PaymentChartData[]>([]);

  const fetchAnalytics = async (search?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPaymentStats({ search });
      
      if (response.success && response.data) {
        setAnalyticsData(response.data);
        
        // Transform data for chart
        const distribution = response.data.paymentDistribution;
        const newChartData: PaymentChartData[] = [
          {
            label: 'Paid',
            value: distribution.paid,
            count: response.data.paidCount,
            total: response.data.totalRevenue,
            color: colors.chart.paid,
            glowColor: colors.successLight
          },
          {
            label: 'Unpaid',
            value: distribution.unpaid,
            count: response.data.unpaidCount,
            total: response.data.pendingPayments,
            color: colors.chart.unpaid,
            glowColor: colors.warningLight
          },
          {
            label: 'Partially Paid',
            value: distribution.partiallyPaid,
            count: response.data.partiallyPaidCount,
            total: response.data.pendingPayments,
            color: colors.chart.partiallyPaid,
            glowColor: colors.infoLight
          },
          {
            label: 'Overdue',
            value: distribution.overdue,
            count: response.data.overdueCount,
            total: response.data.pendingPayments,
            color: colors.chart.overdue,
            glowColor: colors.errorLight
          }
        ];
        setChartData(newChartData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((search: string) => fetchAnalytics(search), 500),
    []
  );

  useEffect(() => {
    fetchAnalytics();
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  const handleSearch = (text: string) => {
    setSearchText(text);
    debouncedFetch(text);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search payments..."
        onChangeText={handleSearch}
        value={searchText}
        loading={isLoading}
        style={styles.searchBar}
      />
      
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : (
        <View style={styles.content}>
          {analyticsData && (
            <>
              <View style={styles.statsContainer}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                  Payment Analytics
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Total Revenue: ₹{analyticsData.totalRevenue.toFixed(2)}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Monthly Revenue: ₹{analyticsData.monthlyRevenue.toFixed(2)}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Pending Payments: ₹{analyticsData.pendingPayments.toFixed(2)}
                </Text>
                <Text style={{ color: theme.colors.onSurface }}>
                  Collection Efficiency: {analyticsData.collectionEfficiency}%
                </Text>
              </View>
              
              <View style={styles.chartContainer}>
                <PaymentAnalyticsChart 
                  data={chartData} 
                  isDarkMode={theme.dark}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    marginBottom: 24,
  },
  chartContainer: {
    flex: 1,
    minHeight: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  error: {
    textAlign: 'center',
    marginTop: 16,
  },
}); 