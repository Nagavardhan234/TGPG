import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { 
  Surface, 
  Text, 
  Avatar, 
  IconButton, 
  Button, 
  ProgressBar,
  Card,
  Divider,
  Chip,
  Badge,
  useTheme as usePaperTheme,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import api from '@/app/services/api';
import { PaymentService } from '@/app/services/payment.service';
import type { PaymentHistory } from '@/app/services/payment.types';

// Menu items for student features
const menuItems = [
  {
    title: 'Community',
    items: [
      { 
        icon: 'poll', 
        label: 'Polls & Events',
        route: '/screens/student/community/polls',
        color: '#FF6B6B'
      },
      { 
        icon: 'trophy', 
        label: 'Rankings',
        route: '/screens/student/community/rankings',
        color: '#4ECDC4'
      },
      { 
        icon: 'calendar-check', 
        label: 'Events',
        route: '/screens/student/community/events',
        color: '#45B7D1'
      },
    ]
  },
  {
    title: 'Communication',
    items: [
      { 
        icon: 'message-text', 
        label: 'Messages',
        route: '/screens/student/messages',
        color: '#96CEB4'
      },
      { 
        icon: 'qrcode-scan', 
        label: 'Scan QR',
        route: '/screens/student/qr-scanner',
        color: '#D4A5A5'
      }
    ]
  },
  {
    title: 'Quick Actions',
    items: [
      { 
        icon: 'food', 
        label: 'Meal Menu',
        route: '/screens/student/meals',
        color: '#FFD93D'
      },
      { 
        icon: 'account-group-outline', 
        label: 'Split Work',
        route: '/screens/student/split-work',
        color: '#6C5CE7',
        badge: '2'
      },
      { 
        icon: 'alert-circle', 
        label: 'Complaints',
        route: '/screens/student/complaints',
        color: '#FF8066'
      }
    ]
  }
];

// Update the color helper function to properly handle rgba colors
const withOpacity = (color: string | undefined, opacity: number) => {
  if (!color) return `rgba(0, 0, 0, ${opacity})`;
  
  try {
    // For rgb/rgba colors
    if (color.startsWith('rgb')) {
      const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (rgbaMatch) {
        const [_, r, g, b] = rgbaMatch;
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }
    }
    
    // For hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return `rgba(0, 0, 0, ${opacity})`;
  } catch {
    return `rgba(0, 0, 0, ${opacity})`;
  }
};

const PaymentCard = () => {
  const { theme } = useTheme();
  const { student } = useStudentAuth();
  const paperTheme = usePaperTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentData, setRentData] = useState<any>(null);

  // Add card dynamic styles
  const cardDynamicStyles = {
    card: {
      backgroundColor: paperTheme.dark 
        ? withOpacity(theme.colors.surface, 0.9)
        : withOpacity(theme.colors.surface, 0.95),
      borderColor: paperTheme.dark 
        ? withOpacity(theme.colors.primary, 0.1)
        : withOpacity(theme.colors.outline, 0.1),
      borderWidth: 1,
      elevation: 4,
      margin: 16,
      borderRadius: 24,
      padding: 20,
    },
    progressBackground: {
      backgroundColor: paperTheme.dark
        ? withOpacity(theme.colors.primary, 0.15)
        : withOpacity(theme.colors.primary, 0.1),
      borderRadius: 12,
      height: 12,
    },
    progressFill: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      height: '100%',
    }
  };

  useEffect(() => {
    if (!student?.TenantID) {
      setError('Student ID not found');
      setLoading(false);
      return;
    }
    loadRentData();
  }, [student?.TenantID]);

  const loadRentData = async () => {
    try {
      if (!student?.TenantID) {
        throw new Error('Student ID not found');
      }

      setLoading(true);
      setError(null);

      console.log('Loading rent data for tenant:', student.TenantID);
      const data = await PaymentService.getPaymentSummary(student.TenantID.toString());
      console.log('Received payment data:', data);
      
      if (!data) {
        throw new Error('No payment data received');
      }

      setRentData({
        totalAmount: data.TotalRent || 0,
        totalPaid: data.AmountPaid || 0,
        dueAmount: (data.TotalRent || 0) - (data.AmountPaid || 0),
        daysUntilDue: data.DaysUntilDue || 0,
        status: data.Status || 'PENDING'
      });
    } catch (err: any) {
      console.error('Error loading rent data:', err);
      const errorMessage = err.message === 'Network error. Please check your connection.'
        ? 'Please check your internet connection'
        : err.response?.data?.message || err.message || 'Failed to load payment data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentNavigation = () => {
    console.log('[Dashboard:PaymentCard] Navigating to payments screen');
    router.push('/screens/student/payments');
  };

  if (loading) {
    return (
      <Surface style={[styles.paymentCard, cardDynamicStyles.card]}>
        <View style={[styles.paymentSection, { alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
          <LottieView
            source={require('../../../assets/Animations/Loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading payment details...
          </Text>
        </View>
      </Surface>
    );
  }

  if (error || !rentData) {
    return (
      <Surface style={[styles.paymentCard, cardDynamicStyles.card]}>
        <View style={[styles.paymentSection, { alignItems: 'center', padding: 20 }]}>
          <LottieView
            source={require('../../../assets/Animations/networkerror.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
          <Text style={[styles.errorText, { color: theme.colors.error, marginVertical: 12 }]}>
            {error || 'No payment data available'}
          </Text>
          <Button 
            mode="contained"
            onPress={() => loadRentData()}
            disabled={loading}
            style={styles.retryButton}
          >
            Retry Loading
          </Button>
        </View>
      </Surface>
    );
  }

  const progress = ((rentData.totalPaid || 0) / (rentData.totalAmount || 1)) * 100;
  const statusColor = rentData.status === 'PAID' 
    ? theme.colors.primary 
    : rentData.status === 'OVERDUE' 
      ? theme.colors.error 
      : theme.colors.warning || '#FFA000';

  return (
    <Surface style={[styles.paymentCard, cardDynamicStyles.card]}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: withOpacity(statusColor, 0.1) }]}>
        <IconButton 
          icon={rentData.status === 'PAID' ? 'check-circle' : rentData.status === 'OVERDUE' ? 'alert-circle' : 'clock-outline'}
          size={18}
          iconColor={statusColor}
          style={styles.statusIcon}
        />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {rentData.status}
        </Text>
      </View>

      {/* Due Date Section */}
      <View style={styles.dueDateRow}>
        <IconButton 
          icon="calendar-clock"
          size={20}
          iconColor={theme.colors.onSurfaceVariant}
          style={styles.clockIcon}
        />
        <Text style={[styles.dueText, { color: theme.colors.onSurfaceVariant }]}>
          Due in {rentData.daysUntilDue || 0} days
        </Text>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <View>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>Due Amount</Text>
            <Text style={[styles.amount, { color: theme.colors.onSurface }]}>
              ₹{(rentData.dueAmount || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>Total Rent</Text>
            <Text style={[styles.totalAmount, { color: theme.colors.onSurface }]}>
              ₹{(rentData.totalAmount || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, cardDynamicStyles.progressBackground]}>
            <View 
              style={[
                styles.progressFill,
                cardDynamicStyles.progressFill,
                { width: `${progress}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
            {Math.round(progress)}% Paid
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <Button
        mode="contained"
        onPress={handlePaymentNavigation}
        style={styles.payButton}
        contentStyle={styles.payButtonContent}
      >
        Make Payment
      </Button>
    </Surface>
  );
};

export default function StudentDashboard() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();
  const paperTheme = usePaperTheme();
  const [recentPayments, setRecentPayments] = useState<PaymentHistory[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    if (student?.TenantID) {
      loadRecentPayments();
    }
  }, [student?.TenantID]);

  const loadRecentPayments = async () => {
    try {
      setLoadingPayments(true);
      setPaymentError(null);
      
      const history = await PaymentService.getPaymentHistory(student!.TenantID.toString());
      // Take only the 3 most recent payments
      setRecentPayments(history.slice(0, 3));
    } catch (error: any) {
      console.error('Error loading recent payments:', error);
      setPaymentError(error.message || 'Failed to load recent payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const totalAmount = 6000;
  const paidAmount = 4000;
  const progress = paidAmount / totalAmount;
  const isOverdue = false;

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: paperTheme.dark ? '#121212' : theme?.colors?.background,
    },
    card: {
      backgroundColor: paperTheme.dark 
        ? 'rgba(30, 30, 30, 0.8)' 
        : 'rgba(255, 255, 255, 0.8)',
      borderColor: paperTheme.dark 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
    },
    menuCard: {
      backgroundColor: paperTheme.dark ? '#1E1E1E' : theme?.colors?.surface,
      borderColor: paperTheme.dark ? '#2C2C2C' : undefined,
      borderWidth: paperTheme.dark ? 1 : 0,
    },
    progressBackground: {
      height: 8,
      backgroundColor: paperTheme.dark ? '#2C2C2C' : '#E8E8E8',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
    surfaceVariant: {
      backgroundColor: paperTheme.dark ? '#2C2C2C' : '#E8E8E8',
    },
    floatingShapes: {
      shape1: {
        width: 150,
        height: 150,
        backgroundColor: theme?.colors?.primary || '#6200ee',
        top: -30,
        right: -30,
        transform: [{ scale: 1.2 }],
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
      },
      shape2: {
        width: 100,
        height: 100,
        backgroundColor: paperTheme.dark ? '#8F6BF2' : '#4CAF50',
        bottom: -20,
        left: -20,
        transform: [{ scale: 0.8 }],
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
      },
      shape3: {
        width: 80,
        height: 80,
        backgroundColor: theme?.colors?.secondary || '#03DAC6',
        top: '50%',
        right: '20%',
        transform: [{ scale: 0.6 }],
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
      }
    }
  };

  const renderMenuSection = (section: typeof menuItems[0]) => (
    <View key={section.title} style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
        {section.title}
      </Text>
      <View style={styles.menuGrid}>
        {section.items.map((item, index) => (
          <Surface 
            key={index}
            style={[styles.menuCard, dynamicStyles.menuCard]}
          >
            <LinearGradient
              colors={[`${item.color}20`, 'transparent']}
              style={styles.menuGradient}
            />
            <View style={styles.menuCardContent}>
              <View style={styles.menuIconContainer}>
                <IconButton
                  icon={item.icon}
                  size={28}
                  iconColor={item.color}
                  style={[styles.menuIcon, dynamicStyles.menuIcon]}
                  onPress={() => router.push(item.route)}
                />
                {item.badge && (
                  <Badge
                    size={20}
                    style={[styles.menuBadge, { backgroundColor: theme?.colors?.error }]}
                  >
                    {item.badge}
                  </Badge>
                )}
              </View>
              <Text style={[styles.menuLabel, { color: theme?.colors?.onSurface }]}>
                {item.label}
              </Text>
            </View>
          </Surface>
        ))}
      </View>
    </View>
  );

  return (
    <StudentDashboardLayout>
      <ScrollView style={dynamicStyles.container}>
        {/* Student Profile Card */}
        <Surface style={[styles.profileCard, dynamicStyles.card]}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Avatar.Text
                size={60}
                label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
                style={{ backgroundColor: theme?.colors?.primary }}
              />
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: theme?.colors?.onSurface }]}>
                  {student?.FullName}
                </Text>
                <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                  Room {student?.Room_No}
                </Text>
              </View>
            </View>
            <IconButton 
              icon="qrcode"
              size={24}
              onPress={() => router.push('/screens/student/qr-code')}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>120</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>15</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </Surface>

        {/* Payment Progress Tracker */}
        <PaymentCard />

        {/* Menu Sections */}
        {menuItems.map(renderMenuSection)}

        {/* Recent Payments Section */}
        <Surface style={[styles.recentPayments, { backgroundColor: theme?.colors?.surface }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
              Recent Payments
            </Text>
            <Button 
              mode="text" 
              compact
              onPress={() => router.push('/screens/student/payments')}
            >
              View All
            </Button>
          </View>

          {loadingPayments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme?.colors?.primary} />
              <Text style={{ color: theme?.colors?.onSurfaceVariant, marginTop: 8 }}>
                Loading payments...
              </Text>
            </View>
          ) : paymentError ? (
            <View style={styles.errorContainer}>
              <Text style={{ color: theme?.colors?.error, textAlign: 'center' }}>
                {paymentError}
              </Text>
              <Button 
                mode="contained" 
                onPress={loadRecentPayments}
                style={{ marginTop: 8 }}
              >
                Retry
              </Button>
            </View>
          ) : recentPayments.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme?.colors?.onSurfaceVariant }]}>
              No recent payments found
            </Text>
          ) : (
            recentPayments.map(payment => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentAmount, { color: theme?.colors?.onSurface }]}>
                    ₹{payment.amount.toLocaleString()}
                  </Text>
                  <Text style={[styles.paymentDate, { color: theme?.colors?.onSurfaceVariant }]}>
                    {new Date(payment.date).toLocaleDateString()}
                  </Text>
                </View>
                <Chip
                  style={{ 
                    backgroundColor: withOpacity(
                      payment.status === 'SUCCESS' ? theme?.colors?.primary :
                      payment.status === 'PENDING' ? theme?.colors?.warning || '#FFA000' :
                      theme?.colors?.error,
                      0.1
                    )
                  }}
                  textStyle={{ 
                    color: payment.status === 'SUCCESS' ? theme?.colors?.primary :
                           payment.status === 'PENDING' ? theme?.colors?.warning || '#FFA000' :
                           theme?.colors?.error
                  }}
                >
                  {payment.status}
                </Chip>
              </View>
            ))
          )}
        </Surface>
      </ScrollView>
    </StudentDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileDetails: {
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: (Dimensions.get('window').width - 56) / 3,
    aspectRatio: 1,
    borderRadius: 20,
    elevation: 2,
    overflow: 'hidden',
    padding: 8,
  },
  menuCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuIconContainer: {
    position: 'relative',
    marginTop: 8,
  },
  menuIcon: {
    margin: 0,
    borderRadius: 16,
  },
  menuBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  menuGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountPrefix: {
    fontSize: 20,
    marginRight: 2,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  amountSeparator: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  payButton: {
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  payButtonContent: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recentPayments: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
  glassEffect: {
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  glassGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  paymentCard: {
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingRight: 12,
    marginBottom: 16,
  },
  statusIcon: {
    margin: 0,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  clockIcon: {
    margin: 0,
    marginRight: 4,
  },
  dueText: {
    fontSize: 14,
  },
  amountSection: {
    gap: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 12,
  },
}); 