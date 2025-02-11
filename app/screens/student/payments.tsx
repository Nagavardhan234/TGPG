import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { PaymentSummaryCard } from './payments/components/PaymentSummaryCard';
import { PaymentHistoryList } from './payments/components/PaymentHistoryList';
import { PaymentMethodSelector } from './payments/components/PaymentMethodSelector';
import { Surface, Text, Button, TextInput, useTheme } from 'react-native-paper';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import { paymentService } from '@/app/services/payment.service';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { validatePaymentInput } from '@/app/utils/validators';
import { showMessage } from 'react-native-flash-message';

type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH';

function PaymentsContent() {
  const { colors } = useTheme();
  const { student } = useStudentAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      if (!student?.TenantID) {
        throw new Error('Student information not found');
      }

      const [summary, history] = await Promise.all([
        paymentService.getPaymentSummary(student.TenantID.toString()),
        paymentService.getPaymentHistory(student.TenantID.toString())
      ]);

      setPaymentSummary(summary);
      setPaymentHistory(history);
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      setError(error.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePayment = async () => {
    try {
      if (!student?.TenantID) {
        showMessage({
          message: 'Error',
          description: 'Student information not found',
          type: 'danger',
          duration: 4000,
          floating: true,
          icon: 'danger'
        });
        return;
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        showMessage({
          message: 'Invalid Amount',
          description: 'Please enter a valid amount',
          type: 'warning',
          duration: 4000,
          floating: true,
          icon: 'warning'
        });
        return;
      }

      if ((selectedMethod === 'UPI' || selectedMethod === 'BANK_TRANSFER') && !transactionId.trim()) {
        showMessage({
          message: 'Transaction ID Required',
          description: `Please enter a valid ${selectedMethod} transaction ID`,
          type: 'warning',
          duration: 4000,
          floating: true,
          icon: 'warning'
        });
        return;
      }

      // Validate payment input
      const validation = validatePaymentInput(selectedMethod, amount, transactionId);
      if (!validation.isValid) {
        showMessage({
          message: 'Invalid Input',
          description: validation.error || 'Please check your payment details',
          type: 'warning',
          duration: 4000,
          floating: true,
          icon: 'warning'
        });
        return;
      }

      setLoading(true);

      const response = await paymentService.submitPayment(student.TenantID.toString(), {
        amount: parseFloat(amount),
        paymentMethod: selectedMethod,
        transactionId: transactionId.trim()
      });

      // Show success message
      showMessage({
        message: 'Success',
        description: 'Payment submitted successfully',
        type: 'success',
        duration: 4000,
        floating: true,
        icon: 'success'
      });

      // Reset form and reload data only after successful submission
      setAmount('');
      setTransactionId('');
      await loadPaymentData();

    } catch (error: any) {
      console.error('Error processing payment:', error);
      showMessage({
        message: 'Payment Failed',
        description: error.message || 'Failed to process payment',
        type: 'danger',
        duration: 4000,
        floating: true,
        icon: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentSummary) {
    return <PageLoader message="Loading payment details..." />;
  }

  if (error && !paymentSummary) {
    return (
      <NetworkErrorView
        message={error}
        onRetry={() => loadPaymentData()}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadPaymentData(true)} />
      }
    >
      {paymentSummary && (
        <PaymentSummaryCard
          totalPaid={Number(paymentSummary.AmountPaid) || 0}
          totalDue={Number(paymentSummary.TotalRent - paymentSummary.AmountPaid) || 0}
          dueDate={paymentSummary.DueDate || new Date().toISOString()}
          monthlyRent={Number(paymentSummary.TotalRent) || 0}
          status={paymentSummary.Status || 'PENDING'}
        />
      )}

      <Surface style={[styles.paymentForm, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Make Payment
        </Text>

        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
        />

        <View style={styles.inputContainer}>
          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />
        </View>

        {(selectedMethod === 'UPI' || selectedMethod === 'BANK_TRANSFER') && (
          <View style={styles.inputContainer}>
            <TextInput
              label={`${selectedMethod} Transaction ID`}
              value={transactionId}
              onChangeText={setTransactionId}
              mode="outlined"
              style={styles.input}
              disabled={loading}
            />
          </View>
        )}

        <Button
          mode="contained"
          onPress={handlePayment}
          loading={loading}
          disabled={loading || !amount || ((selectedMethod === 'UPI' || selectedMethod === 'BANK_TRANSFER') && !transactionId.trim())}
          style={styles.submitButton}
        >
          Submit Payment
        </Button>
      </Surface>

      <View style={styles.historySection}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Payment History
        </Text>
        <PaymentHistoryList payments={paymentHistory} />
              </View>
    </ScrollView>
  );
}

export default function PaymentsScreen() {
  return (
    <StudentDashboardLayout title="Payments">
      <PaymentsContent />
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  error: {
    margin: 16,
    textAlign: 'center',
  },
  paymentForm: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  submitButton: {
    marginTop: 8,
  },
  historySection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
}); 