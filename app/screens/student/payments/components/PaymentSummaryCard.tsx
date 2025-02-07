import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Surface, Text, useTheme, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Color from 'color';

const { width } = Dimensions.get('window');

interface PaymentSummaryCardProps {
  totalPaid: number;
  totalDue: number;
  dueDate: string;
  monthlyRent: number;
  status: string;
}

export const PaymentSummaryCard = ({
  totalPaid = 0,
  totalDue = 0,
  dueDate = new Date().toISOString(),
  monthlyRent = 0,
  status = 'PENDING'
}: PaymentSummaryCardProps) => {
  const { colors } = useTheme();
  const total = totalPaid + totalDue;
  const progress = total > 0 ? (totalPaid / total) * 100 : 0;

  const getStatusColor = () => {
    switch (status) {
      case 'PAID':
        return colors.primary;
      case 'OVERDUE':
        return colors.error;
      default:
        return colors.warning || '#FFA000';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusColor = getStatusColor();
  const statusBgColor = Color(statusColor).alpha(0.1).rgb().string();

  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
        <MaterialCommunityIcons 
          name={status === 'PAID' ? 'check-circle' : status === 'OVERDUE' ? 'alert-circle' : 'clock-outline'} 
          size={16} 
          color={statusColor}
        />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {status}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Monthly Rent Section */}
        <View style={styles.rentSection}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            Monthly Rent
          </Text>
          <Text style={[styles.rentAmount, { color: colors.onSurface }]}>
            {formatAmount(monthlyRent)}
          </Text>
        </View>

        {/* Payment Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.amountRow}>
            <View>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Paid Amount</Text>
              <Text style={[styles.amount, { color: colors.primary }]}>{formatAmount(totalPaid)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Due Amount</Text>
              <Text style={[styles.amount, { color: colors.error }]}>{formatAmount(totalDue)}</Text>
            </View>
          </View>

          {/* Modern Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: Color(colors.primary).alpha(0.12).rgb().string() }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${progress}%` 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.onSurfaceVariant }]}>
              {Math.round(progress)}% Complete
            </Text>
          </View>
        </View>

        {/* Due Date Section */}
        <View style={styles.dueSection}>
          <MaterialCommunityIcons 
            name="calendar-clock" 
            size={20} 
            color={colors.onSurfaceVariant}
          />
          <Text style={[styles.dueText, { color: colors.onSurfaceVariant }]}>
            Due Date: {formatDate(dueDate)}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 20,
    elevation: 2,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 16,
    marginBottom: 0,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  mainContent: {
    padding: 16,
  },
  rentSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  rentAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 24,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600',
  },
  amountDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressContainer: {
    gap: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease-in-out',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  dueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  dueText: {
    fontSize: 14,
  },
}); 