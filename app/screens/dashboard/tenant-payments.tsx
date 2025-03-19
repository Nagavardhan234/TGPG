import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, useTheme, DataTable } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { paymentService } from '@/app/services/payment.service';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import { format } from 'date-fns';

interface PaymentMonth {
  month: string;
  year: number;
  monthlyRent: number;
  amountPaid: number;
  dueAmount: number;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
  dueDate: string;
}

export default function TenantPaymentsScreen() {
  const { tenantId, name } = useLocalSearchParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentMonth[]>([]);
  const [summary, setSummary] = useState<{
    totalExpected: number;
    totalPaid: number;
    totalDue: number;
    monthsElapsed: number;
    monthlyRent: number;
  }>({
    totalExpected: 0,
    totalPaid: 0,
    totalDue: 0,
    monthsElapsed: 0,
    monthlyRent: 0
  });

  useEffect(() => {
    loadTenantPayments();
  }, [tenantId]);

  const loadTenantPayments = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const response = await paymentService.getTenantPaymentHistory(tenantId.toString());
      
      setPaymentHistory(response.monthlyPayments || []);
      setSummary({
        totalExpected: response.totalExpected || 0,
        totalPaid: response.totalPaid || 0,
        totalDue: response.totalDue || 0,
        monthsElapsed: response.monthsElapsed || 0,
        monthlyRent: response.monthlyRent || 0
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return theme.colors.success || '#4CAF50';
      case 'PARTIALLY_PAID':
        return theme.colors.warning || '#FFA000';
      case 'OVERDUE':
        return theme.colors.error || '#F44336';
      default:
        return theme.colors.info || '#2196F3';
    }
  };

  if (loading) {
    return <PageLoader message="Loading payment history..." />;
  }

  if (error) {
    return (
      <NetworkErrorView 
        message={error}
        onRetry={loadTenantPayments}
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.tenantName, { color: theme.colors.onSurface }]}>
          {name}
        </Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Monthly Rent
            </Text>
            <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
              ₹{summary.monthlyRent.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Total Expected
            </Text>
            <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
              ₹{summary.totalExpected.toLocaleString()}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              ({summary.monthsElapsed} months)
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Total Paid
            </Text>
            <Text style={[styles.amount, { color: theme.colors.primary }]}>
              ₹{summary.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Total Due
            </Text>
            <Text style={[styles.amount, { color: theme.colors.error }]}>
              ₹{summary.totalDue.toLocaleString()}
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={[styles.tableCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.tableTitle, { color: theme.colors.primary }]}>
          Monthly Payment History
        </Text>
        
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Month</DataTable.Title>
            <DataTable.Title numeric>Expected</DataTable.Title>
            <DataTable.Title numeric>Paid</DataTable.Title>
            <DataTable.Title numeric>Due</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
          </DataTable.Header>

          {paymentHistory.map((payment, index) => (
            <DataTable.Row key={`${payment.month}-${payment.year}`}>
              <DataTable.Cell>
                {payment.month} {payment.year}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                ₹{payment.monthlyRent.toLocaleString()}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                ₹{payment.amountPaid.toLocaleString()}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                ₹{payment.dueAmount.toLocaleString()}
              </DataTable.Cell>
              <DataTable.Cell>
                <Text style={{ color: getStatusColor(payment.status) }}>
                  {payment.status}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  tenantName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tableCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 