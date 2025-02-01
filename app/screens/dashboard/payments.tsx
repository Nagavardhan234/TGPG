import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Card, Paragraph, Searchbar, List, Divider, useTheme } from 'react-native-paper';
import { useAuth } from '@/app/context/AuthContext';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import api from '@/app/services/api';

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: number;
  recentTransactions: Array<{
    id: number;
    studentName: string;
    amount: number;
    status: 'PAID' | 'PENDING' | 'FAILED';
    date: string;
  }>;
}

export default function PaymentsOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const { theme, isDarkMode } = useTheme();
  const { pg } = useAuth();

  useEffect(() => {
    loadPaymentStats();
  }, []);

  const loadPaymentStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!pg?.PGID) {
        throw new Error('PG information not found');
      }

      const response = await api.get(`/api/payments/pg/${pg.PGID}/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load payment statistics');
      }
    } catch (error: any) {
      console.error('Error loading payment stats:', error);
      setError(error.message || 'Failed to load payment statistics');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = stats?.recentTransactions.filter(transaction =>
    transaction.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return <PageLoader message="Loading payment statistics..." />;
  }

  if (error) {
    return (
      <NetworkErrorView
        message={error}
        onRetry={loadPaymentStats}
        showAnimation={false}
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.text }]}>Payments Overview</Title>

      <View style={styles.summaryCards}>
        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Total Revenue</Title>
            <Paragraph style={{ color: theme.colors.text }}>
              ₹{stats?.totalRevenue.toLocaleString() || '0'}
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>Pending Payments</Title>
            <Paragraph style={{ color: theme.colors.text }}>
              ₹{stats?.pendingPayments.toLocaleString() || '0'}
            </Paragraph>
          </Card.Content>
        </Card>

        <Card style={[styles.summaryCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.text }}>This Month</Title>
            <Paragraph style={{ color: theme.colors.text }}>
              ₹{stats?.monthlyRevenue.toLocaleString() || '0'}
            </Paragraph>
          </Card.Content>
        </Card>
      </View>

      <Title style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Title>

      <Searchbar
        placeholder="Search transactions..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchBar, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface
        }]}
        iconColor={theme.colors.text}
        placeholderTextColor={theme.colors.textSecondary}
        inputStyle={{ color: theme.colors.text }}
      />

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <List.Icon icon="cash" color={theme.colors.primary} />
          <Title style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {searchQuery ? 'No matching transactions found' : 'No recent transactions'}
          </Title>
        </View>
      ) : (
        <List.Section>
          {filteredTransactions.map((transaction, index) => (
            <React.Fragment key={transaction.id}>
              <List.Item
                title={transaction.studentName}
                description={new Date(transaction.date).toLocaleDateString()}
                left={props => (
                  <List.Icon 
                    {...props} 
                    icon={transaction.status === 'PAID' ? 'check-circle' : 'clock-outline'} 
                    color={transaction.status === 'PAID' ? theme.colors.primary : theme.colors.error} 
                  />
                )}
                right={() => (
                  <Paragraph style={{ 
                    color: transaction.status === 'PAID' ? theme.colors.primary : theme.colors.error 
                  }}>
                    ₹{transaction.amount.toLocaleString()}
                  </Paragraph>
                )}
                titleStyle={{ color: theme.colors.text }}
                descriptionStyle={{ color: theme.colors.textSecondary }}
              />
              {index < filteredTransactions.length - 1 && (
                <Divider style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0' }} />
              )}
            </React.Fragment>
          ))}
        </List.Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 0,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
  },
}); 