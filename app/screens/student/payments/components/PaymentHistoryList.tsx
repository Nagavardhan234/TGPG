import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, IconButton, Chip } from 'react-native-paper';
import Color from 'color';

interface Payment {
  paymentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: string;
  transactionId?: string;
}

interface PaymentHistoryListProps {
  payments: Payment[];
}

export const PaymentHistoryList = ({ payments }: PaymentHistoryListProps) => {
  const { colors } = useTheme();

  const getMethodIcon = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'UPI':
        return 'qrcode';
      case 'BANK_TRANSFER':
        return 'bank';
      case 'CASH':
        return 'cash';
      default:
        return 'cash';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return colors.primary;
      case 'PENDING':
        return colors.warning;
      case 'FAILED':
        return colors.error;
      default:
        return colors.onSurfaceVariant;
    }
  };

  const getBackgroundColor = (color: string) => {
    try {
      return Color(color).alpha(0.15).rgb().string();
    } catch (e) {
      return Color(colors.surfaceVariant).alpha(0.15).rgb().string();
    }
  };

  if (!payments.length) {
    return (
      <Surface style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.onSurfaceVariant }}>
          No payment history available
        </Text>
      </Surface>
    );
  }

  return (
    <View style={styles.container}>
      {payments.map((payment, index) => (
        <Surface 
          key={payment.paymentId} 
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            index === 0 && styles.firstCard,
            index === payments.length - 1 && styles.lastCard
          ]}
        >
          <View style={styles.leftContent}>
            <IconButton
              icon={getMethodIcon(payment.paymentMethod)}
              size={24}
              iconColor={colors.primary}
              style={styles.methodIcon}
            />
            <View style={styles.details}>
              <Text style={[styles.amount, { color: colors.onSurface }]}>
                ₹{payment.amount.toLocaleString()}
              </Text>
              <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>
                {new Date(payment.paymentDate).toLocaleDateString()}
              </Text>
              {payment.transactionId && (
                <Text style={[styles.transactionId, { color: colors.onSurfaceVariant }]}>
                  {payment.transactionId}
                </Text>
              )}
            </View>
          </View>

          <Chip
            mode="flat"
            style={[
              styles.statusChip,
              { backgroundColor: getBackgroundColor(getStatusColor(payment.status)) }
            ]}
            textStyle={[styles.statusText, { color: getStatusColor(payment.status) }]}
          >
            {payment.status}
          </Chip>
        </Surface>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
  },
  firstCard: {
    marginTop: 0,
  },
  lastCard: {
    marginBottom: 0,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    margin: 0,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  transactionId: {
    fontSize: 12,
    marginTop: 2,
  },
  statusChip: {
    height: 24,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 