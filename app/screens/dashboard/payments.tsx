import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, Pressable, Easing, Alert, Linking } from 'react-native';
import { Surface, Text, useTheme, IconButton, Button, Searchbar, Chip, TouchableRipple } from 'react-native-paper';
import { useAuth } from '@/app/context/AuthContext';
import { NetworkErrorView } from '@/app/components/NetworkErrorView';
import { PageLoader } from '@/app/components/PageLoader';
import { LinearGradient } from 'expo-linear-gradient';
import Color from 'color';
import { paymentService } from '@/app/services/payment.service';
import type { PaymentStats } from '@/app/services/payment.service';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Skeleton from '@/app/components/Skeleton';
import { ENDPOINTS } from '../../constants/endpoints';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import PaymentBarChart from '@/app/components/PaymentBarChart';
import { debounce } from 'lodash';

const { width } = Dimensions.get('window');

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  monthlyRevenue: number;
  paymentDistribution: {
    paid: number;
    unpaid: number;
    overdue: number;
    partiallyPaid: number;
  };
  recentTransactions: Array<{
    id: number;
    studentName: string;
    amount: number;
    totalAmount: number;
    status: 'PAID' | 'PENDING' | 'FAILED' | 'PARTIALLY_PAID';
    date: string;
    phoneNumber: string;
  }>;
}

interface TenantPayment {
  id: number;
  name: string;
  roomNumber: string;
  phoneNumber: string;
  totalDue: number;
  totalPaid: number;
  currentMonthPaid: number;
  monthlyRent: number;
  monthsElapsed: number;
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID' | 'OVERDUE';
  dueDate: string;
  overdueMonths?: number;
  joinedDate?: string;
}

interface PaymentStatusBadgeProps {
  status: TenantPayment['status'];
  overdueMonths?: number;
}

const PaymentStatusBadge = ({ status, overdueMonths }: PaymentStatusBadgeProps) => {
  const theme = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'PAID':
        return theme.colors.success || '#4CAF50';
      case 'PARTIALLY_PAID':
        return theme.colors.warning || '#FFA000';
      case 'OVERDUE':
        return theme.colors.error || '#F44336';
      case 'UNPAID':
        return theme.colors.info || '#2196F3';
      default:
        return theme.colors.info || '#2196F3';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'PAID':
        return 'Paid';
      case 'PARTIALLY_PAID':
        return 'Partial';
      case 'OVERDUE':
        return `${overdueMonths} Month${overdueMonths !== 1 ? 's' : ''} Overdue`;
      case 'UNPAID':
        return 'Unpaid';
      default:
        return status;
    }
  };

  const color = getStatusColor();
  const backgroundColor = Color(color).alpha(0.1).rgb().string();

  return (
    <Chip
      style={[
        styles.statusChip,
        { backgroundColor }
      ]}
      textStyle={{ color }}
    >
      {getStatusText()}
    </Chip>
  );
};

const StatusCard = ({ title, amount, icon, color, style }: any) => {
  const theme = useTheme();
  const isDarkMode = theme?.dark || false;

  // Return null if theme is not initialized
  if (!theme?.colors) {
    return null;
  }

  const [scaleAnim] = useState(new Animated.Value(1));

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Format amount with fallback to 0
  const formattedAmount = (amount || 0).toLocaleString();

  return (
    <Animated.View
      style={[
        styles.statusCard,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: isDarkMode 
            ? Color(theme.colors.surface).darken(0.2).rgb().string()
            : theme.colors.surface,
        },
        style
      ]}
      onTouchStart={onPressIn}
      onTouchEnd={onPressOut}
    >
      <LinearGradient
        colors={[
          Color(color).alpha(0.1).rgb().string(),
          Color(color).alpha(0).rgb().string(),
        ]}
        style={styles.cardGradient}
      />
      <View style={styles.cardIcon}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{title}</Text>
      <Text style={[styles.cardAmount, { color }]}>₹{formattedAmount}</Text>
    </Animated.View>
  );
};

const chartColors = {
  paid: '#4CAF50',      // Success Green
  unpaid: '#FFA726',    // Warning Orange
  partiallyPaid: '#42A5F5', // Info Blue
  overdue: '#F44336'    // Error Red
};

const glowColors = {
  paid: Color(chartColors.paid).alpha(0.4).toString(),
  unpaid: Color(chartColors.unpaid).alpha(0.4).toString(),
  partiallyPaid: Color(chartColors.partiallyPaid).alpha(0.4).toString(),
  overdue: Color(chartColors.overdue).alpha(0.4).toString()
};

const PaymentScreen = () => {
  const theme = useTheme();
  const { manager, pg, isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    paymentDistribution: {
      paid: 0,
      unpaid: 0,
      overdue: 0,
      partiallyPaid: 0
    },
    recentTransactions: []
  });

  // Separate state for tenants list
  const [tenants, setTenants] = useState<Array<TenantPayment>>([]);

  const router = useRouter();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!pg?.PGID) return;
      
      setIsSearching(true);
      try {
        const paymentStats = await paymentService.getPaymentStats(pg.PGID, {
          page: 1,
          limit: 10,
          search: query
        });
        setStats(paymentStats);
        setTotalPages(paymentStats.pagination?.totalPages || 1);
        setPage(1);
      } catch (err: any) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [pg?.PGID]
  );

  // Handle search input change
  const handleSearchChange = (query: string) => {
    setSearchText(query);
    debouncedSearch(query);
  };

  // Load payment stats and tenant data
  const loadData = useCallback(async () => {
    if (!pg?.PGID) return;
    
    setLoading(true);
    setError(null);
    try {
      const paymentStats = await paymentService.getPaymentStats(pg.PGID);

      // Ensure we have valid data before setting state
      if (paymentStats && typeof paymentStats === 'object') {
        setStats({
          totalRevenue: paymentStats.totalRevenue || 0,
          pendingPayments: paymentStats.pendingPayments || 0,
          monthlyRevenue: paymentStats.monthlyRevenue || 0,
          paymentDistribution: {
            paid: paymentStats.paymentDistribution?.paid || 0,
            unpaid: paymentStats.paymentDistribution?.unpaid || 0,
            partiallyPaid: paymentStats.paymentDistribution?.partiallyPaid || 0,
            overdue: paymentStats.paymentDistribution?.overdue || 0,
            total: paymentStats.paymentDistribution?.total || 0,
          },
          recentTransactions: Array.isArray(paymentStats.recentTransactions) ? paymentStats.recentTransactions : []
        });

        // Set tenant payments directly from the stats
        if (Array.isArray(paymentStats.tenantPayments)) {
          setTenants(paymentStats.tenantPayments);
        }
      }

      setTotalPages(paymentStats?.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Error loading payment data:', err);
      setError(err.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [pg?.PGID, page, searchText]);

  // Initial data load
  useEffect(() => {
    if (isAuthenticated && manager && pg?.PGID) {
      loadData();
    }
  }, [isAuthenticated, manager, pg?.PGID, page]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Filter tenants based on payment status
  const filteredTenants = useMemo(() => {
    if (!tenantFilter) return tenants;
    return tenants.filter(t => t.status === tenantFilter);
  }, [tenants, tenantFilter]);

  // Call tenant handler
  const handleCall = (phoneNumber: string, name: string, roomNumber: string) => {
    Alert.alert(
      'Call Tenant',
      `Call ${name} from Room ${roomNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          }
        }
      ]
    );
  };

  // Send payment reminder
  const sendReminder = async (tenantId: number, name: string) => {
    try {
      await paymentService.sendPaymentReminder(tenantId);
      Alert.alert('Success', `Payment reminder sent to ${name}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to send payment reminder');
    }
  };

  // Calculate total tenants for payment distribution
  const totalTenants = useMemo(() => {
    const distribution = stats.paymentDistribution;
    return (distribution.paid || 0) + 
           (distribution.unpaid || 0) + 
           (distribution.partiallyPaid || 0) + 
           (distribution.overdue || 0);
  }, [stats.paymentDistribution]);

  const calculateProgress = (totalPaid: number, totalDue: number) => {
    if (totalDue === 0) return 100;
    return Math.min(100, (totalPaid / totalDue) * 100);
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

  const handleTenantPress = (tenantId: number, name: string) => {
    router.push({
      pathname: '/screens/dashboard/tenant-payments',
      params: { tenantId: tenantId.toString(), name }
    });
  };

  const renderTenantPayment = (tenant: TenantPayment) => {
    if (!tenant) return null;

    console.log('Rendering tenant payment:', tenant);

    // Ensure all numeric values are properly parsed
    const totalDue = parseFloat(tenant.totalDue?.toString() || '0');
    const totalPaid = parseFloat(tenant.totalPaid?.toString() || '0');
    const monthlyRent = parseFloat(tenant.monthlyRent?.toString() || '0');
    const monthsElapsed = Math.max(0, parseInt(tenant.monthsElapsed?.toString() || '0'));
    const overdueMonths = parseInt(tenant.overdueMonths?.toString() || '0');
    
    console.log('Parsed values:', { totalDue, totalPaid, monthlyRent, monthsElapsed, overdueMonths });
    
    // Calculate progress based on total due amount from backend
    const progress = totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 100;

    // Format joined date
    const joinedDate = tenant.joinedDate ? new Date(tenant.joinedDate).toLocaleDateString() : 'N/A';

    console.log('Calculated values:', { totalDue, progress, overdueMonths });

    return (
      <Surface 
        style={[styles.card, { backgroundColor: theme.colors.surface }]} 
        elevation={1}
      >
        <TouchableRipple
          onPress={() => handleTenantPress(tenant.id, tenant.name)}
          style={styles.cardContent}
        >
          <View>
            <View style={styles.header}>
              <View style={styles.nameContainer}>
                <Text style={[styles.name, { color: theme.colors.onSurface }]}>
                  {tenant.name}
                </Text>
                <Text style={[styles.roomNumber, { color: theme.colors.onSurfaceVariant }]}>
                  Room {tenant.roomNumber}
                </Text>
              </View>
              <PaymentStatusBadge status={tenant.status} overdueMonths={overdueMonths} />
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.amountRow}>
                <View>
                  <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Total Due</Text>
                  <Text style={[styles.amount, { color: theme.colors.error }]}>
                    ₹{totalDue.toLocaleString()}
                  </Text>
                  <Text style={[styles.monthsElapsed, { color: theme.colors.onSurfaceVariant }]}>
                    ({monthsElapsed} months)
                  </Text>
                </View>
                <View style={styles.amountDivider} />
                <View>
                  <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Total Paid</Text>
                  <Text style={[styles.amount, { color: theme.colors.primary }]}>
                    ₹{totalPaid.toLocaleString()}
                  </Text>
                  <Text style={[styles.dueAmount, { color: theme.colors.error }]}>
                    Due: ₹{Math.max(0, totalDue - totalPaid).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        backgroundColor: getStatusColor(tenant.status),
                        width: `${progress}%`
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                  {Math.round(progress)}% Paid
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.joinedDateContainer}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text style={[styles.joinedDate, { color: theme.colors.onSurfaceVariant }]}>
                  Joined: {joinedDate}
                </Text>
              </View>
              <View style={styles.monthlyRentContainer}>
                <MaterialCommunityIcons 
                  name="currency-inr" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text style={[styles.monthlyRent, { color: theme.colors.onSurfaceVariant }]}>
                  Monthly: ₹{monthlyRent.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableRipple>
      </Surface>
    );
  };

  // Render tenant list with filters
  const TenantsList = React.memo(() => (
    <Surface style={[styles.tenantsContainer, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.tenantsHeader}>
        <Text style={[styles.tenantsTitle, { color: theme.colors.onSurface }]}>
          Tenant Payments
        </Text>
        
        <Searchbar
          placeholder="Search tenants..."
          onChangeText={handleSearchChange}
          value={searchText}
          style={styles.searchBar}
          inputStyle={styles.searchBarInput}
          loading={isSearching}
        />

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          {['ALL', 'PAID', 'UNPAID', 'PARTIALLY_PAID', 'OVERDUE'].map((status) => (
            <Button
              key={status}
              mode={tenantFilter === (status === 'ALL' ? null : status) ? 'contained' : 'outlined'}
              onPress={() => setTenantFilter(status === 'ALL' ? null : status)}
              style={styles.filterButton}
              labelStyle={styles.filterButtonLabel}
              contentStyle={styles.filterButtonContent}
              compact
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </ScrollView>
      </View>

      {filteredTenants.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            No tenants found
          </Text>
        </View>
      ) : (
        <>
          {filteredTenants.map((tenant) => {
            return renderTenantPayment(tenant);
          })}
          
          {/* Pagination */}
          <View style={styles.pagination}>
            <Button
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              compact
            >
              Previous
            </Button>
            <Text style={styles.pageInfo}>
              Page {page} of {totalPages}
            </Text>
            <Button
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              compact
            >
              Next
            </Button>
          </View>
        </>
      )}
    </Surface>
  ));

  // Add error boundary for the chart section
  const PaymentDistributionChart = React.memo(() => {
    if (!stats.paymentDistribution) return null;

    return (
      <Surface style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
          Payment Distribution
        </Text>
        <View style={styles.barsContainer}>
          <PaymentBarChart
            label="Paid"
            count={stats.paymentDistribution.paid || 0}
            total={totalTenants}
            color={chartColors.paid}
          />
          <PaymentBarChart
            label="Partial"
            count={stats.paymentDistribution.partiallyPaid || 0}
            total={totalTenants}
            color={chartColors.partiallyPaid}
          />
          <PaymentBarChart
            label="Unpaid"
            count={stats.paymentDistribution.unpaid || 0}
            total={totalTenants}
            color={chartColors.unpaid}
          />
          <PaymentBarChart
            label="Overdue"
            count={stats.paymentDistribution.overdue || 0}
            total={totalTenants}
            color={chartColors.overdue}
          />
        </View>
      </Surface>
    );
  });

  if (!theme) {
    return null;
  }

  if (!manager) {
    return null;
  }

  if (!pg?.PGID) {
    return (
      <NetworkErrorView 
        message="PG profile not set up"
        actionButton={{
          label: 'Setup PG Profile',
          onPress: () => router.push('/screens/ManagerProfile')
        }}
      />
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <NetworkErrorView 
        message={error}
        onRetry={loadData}
      />
    );
  }

  const isDarkMode = theme.dark;

  return (
    <ErrorBoundary>
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsContainer}>
            <StatusCard
              title="Total Revenue"
              amount={stats.totalRevenue}
              icon="wallet"
              color={chartColors.paid}
              style={styles.card}
            />
            <StatusCard
              title="Monthly Revenue"
              amount={stats.monthlyRevenue}
              icon="calendar"
              color={chartColors.partiallyPaid}
              style={styles.card}
            />
            <StatusCard
              title="Pending"
              amount={stats.pendingPayments}
              icon="clock"
              color={chartColors.unpaid}
              style={styles.card}
            />
          </View>

          <PaymentDistributionChart />
          <TenantsList />
        </ScrollView>
      </Surface>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: width > 768 ? 200 : (width - 48) / 2,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tenantsContainer: {
    padding: width < 768 ? 12 : 16,
    borderRadius: 12,
    elevation: 2,
    marginTop: 16,
  },
  tenantsHeader: {
    marginBottom: 12,
  },
  tenantsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginHorizontal: -2,
  },
  filterButton: {
    marginHorizontal: 2,
    marginBottom: 4,
    paddingHorizontal: 6,
    height: 28,
    minWidth: width < 768 ? (width - 80) / 3 : 100,
  },
  filterButtonLabel: {
    fontSize: 10,
    marginVertical: 0,
    marginHorizontal: 4,
  },
  filterButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  tenantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: width < 768 ? 12 : 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tenantInfo: {
    flex: 1,
    marginRight: 12,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  dueDate: {
    fontSize: 11,
    marginTop: 2,
  },
  tenantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  statusCard: {
    flex: 1,
    minWidth: width > 768 ? 200 : (width - 48) / 2,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  cardAmount: {
    fontSize: width < 768 ? 18 : 24,
    fontWeight: 'bold',
  },
  barContainer: {
    alignItems: 'center',
    width: '22%',
    marginHorizontal: '1.5%',
  },
  barWrapper: {
    width: '100%',
    height: width < 768 ? 150 : 200,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barCount: {
    fontSize: width < 768 ? 14 : 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: width < 768 ? 200 : 250,
    paddingHorizontal: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  partialPayment: {
    fontSize: 11,
    marginTop: 4,
  },
  callButton: {
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  searchBarInput: {
    fontSize: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
    height: 40,
  },
  pageInfo: {
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    width: '100%',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roomNumber: {
    fontSize: 14,
    opacity: 0.7,
  },
  paymentDetails: {
    gap: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  monthlyRent: {
    fontSize: 12,
    marginTop: 2,
  },
  monthsElapsed: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  dueAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  joinedDate: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roomNumber: {
    fontSize: 14,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  joinedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthlyRentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardContent: {
    padding: 12,
  },
  statusChip: {
    borderRadius: 16,
    height: 24,
    paddingHorizontal: 8,
  },
});

export default PaymentScreen; 