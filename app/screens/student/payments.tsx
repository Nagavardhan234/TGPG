import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Button, Card, ProgressBar, Chip, IconButton, TextInput } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

// Dummy data
const paymentHistory = [
  { id: 1, date: '2024-03-01', amount: 3500, mode: 'UPI', status: 'success' },
  { id: 2, date: '2024-02-01', amount: 3500, mode: 'Card', status: 'success' },
  { id: 3, date: '2024-01-01', amount: 3500, mode: 'Cash', status: 'success' },
];

const splitPayments = [
  { id: 1, name: 'John Doe', amount: 2000, status: 'paid' },
  { id: 2, name: 'Mike Smith', amount: 2000, status: 'pending' },
  { id: 3, name: 'You', amount: 2000, status: 'paid' },
];

export default function PaymentsScreen() {
  const { theme } = useTheme();
  const [emiAmount, setEmiAmount] = useState('');
  const [showEmiPlan, setShowEmiPlan] = useState(false);

  const totalDue = 6000;
  const totalPaid = 3500;
  const progress = totalPaid / (totalPaid + totalDue);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
        return theme.colors.primary;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Payment Summary */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Payment Summary</Text>
        <View style={styles.summaryContainer}>
          <ProgressBar 
            progress={progress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <View style={styles.amountDetails}>
            <View>
              <Text style={{ color: theme.colors.text }}>Total Paid</Text>
              <Text style={[styles.amount, { color: theme.colors.primary }]}>₹{totalPaid}</Text>
            </View>
            <View>
              <Text style={{ color: theme.colors.text }}>Due Amount</Text>
              <Text style={[styles.amount, { color: theme.colors.error }]}>₹{totalDue}</Text>
            </View>
          </View>
        </View>

        {/* Early Payment Incentive */}
        <Card style={styles.incentiveCard}>
          <Card.Content>
            <View style={styles.incentiveContent}>
              <IconButton icon="gift" size={24} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.text }}>
                Pay before 10th to get ₹200 cashback!
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Surface>

      {/* Payment Options */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Payment Options</Text>
        <Button 
          mode="contained"
          style={styles.payButton}
          onPress={() => {}}
        >
          Pay Full Amount (₹{totalDue})
        </Button>

        <Button 
          mode="outlined"
          style={styles.emiButton}
          onPress={() => setShowEmiPlan(!showEmiPlan)}
        >
          Setup EMI Plan
        </Button>

        {showEmiPlan && (
          <View style={styles.emiContainer}>
            <TextInput
              label="Monthly EMI Amount (min ₹500)"
              value={emiAmount}
              onChangeText={setEmiAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.emiInput}
            />
            <Button 
              mode="contained"
              disabled={!emiAmount || Number(emiAmount) < 500}
              onPress={() => {}}
            >
              Setup EMI
            </Button>
          </View>
        )}
      </Surface>

      {/* Payment History */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Payment History</Text>
        {paymentHistory.map(payment => (
          <Card key={payment.id} style={styles.historyCard}>
            <Card.Content style={styles.historyContent}>
              <View>
                <Text style={{ color: theme.colors.text }}>₹{payment.amount}</Text>
                <Text style={{ color: theme.colors.secondary }}>{payment.date}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={{ color: theme.colors.secondary }}>{payment.mode}</Text>
                <Chip 
                  textStyle={{ color: theme.colors.surface }}
                  style={{ backgroundColor: getStatusColor(payment.status) }}
                >
                  {payment.status}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>

      {/* Split Payments */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Split Payments</Text>
        {splitPayments.map(split => (
          <Card key={split.id} style={styles.splitCard}>
            <Card.Content style={styles.splitContent}>
              <Text style={{ color: theme.colors.text }}>{split.name}</Text>
              <View style={styles.splitRight}>
                <Text style={{ color: theme.colors.text }}>₹{split.amount}</Text>
                <Chip 
                  textStyle={{ color: theme.colors.surface }}
                  style={{ backgroundColor: getStatusColor(split.status) }}
                >
                  {split.status}
                </Chip>
              </View>
            </Card.Content>
          </Card>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  amountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  incentiveCard: {
    marginTop: 16,
  },
  incentiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButton: {
    marginBottom: 12,
  },
  emiButton: {
    marginBottom: 12,
  },
  emiContainer: {
    gap: 12,
  },
  emiInput: {
    marginBottom: 8,
  },
  historyCard: {
    marginBottom: 8,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  splitCard: {
    marginBottom: 8,
  },
  splitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
}); 