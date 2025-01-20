import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { Surface, Text, IconButton, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/context/ThemeContext';
import { ModernPieChart } from '@/app/components/ModernPieChart';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';
import { getDashboardStats, DashboardStats } from '@/app/services/dashboard.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/app/services/api';
import { studentRegistrationService } from '@/app/services/student.registration.service';

export default function DashboardHome() {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  
  // All hooks should be at the top level
  const [showCharts, setShowCharts] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerName, setManagerName] = useState<string>('');
  const [pgName, setPgName] = useState<string>('');
  const [animatedPieData, setAnimatedPieData] = useState([
    { name: "Available", population: 0, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Unavailable", population: 0, color: "#F44336", legendFontColor: "#7F7F7F", legendFontSize: 12 }
  ]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);
  const [showTenantId, setShowTenantId] = useState(false);
  const [manager, setManager] = useState(null);
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});
  const [actionError, setActionError] = useState<{[key: number]: string}>({});

  // Refs should also be at the top
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const availableStudentsAnim = useRef(new Animated.Value(0)).current;
  const unavailableStudentsAnim = useRef(new Animated.Value(0)).current;

  // useEffects should come after all state and ref declarations
  useEffect(() => {
    const checkStoredData = async () => {
      const manager = await AsyncStorage.getItem('manager');
      const pg = await AsyncStorage.getItem('pg');
      console.log('Stored Manager Data:', manager);
      console.log('Stored PG Data:', pg);
    };
    
    checkStoredData();
    loadDashboardData();
    loadManagerData();
  }, []);

  useEffect(() => {
    const availableListener = availableStudentsAnim.addListener(({ value }) => {
      setAnimatedPieData(prev => [
        { ...prev[0], population: Math.floor(value) },
        prev[1]
      ]);
    });

    const unavailableListener = unavailableStudentsAnim.addListener(({ value }) => {
      setAnimatedPieData(prev => [
        prev[0],
        { ...prev[1], population: Math.floor(value) }
      ]);
    });

    return () => {
      availableStudentsAnim.removeListener(availableListener);
      unavailableStudentsAnim.removeListener(unavailableListener);
    };
  }, []);

  useEffect(() => {
    const fetchPendingRegistrations = async () => {
      try {
        const managerData = await AsyncStorage.getItem('manager');
        if (!managerData) return;
        const manager = JSON.parse(managerData);
        const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
        setPendingRegistrations(response.pendingRegistrations || []);
      } catch (error) {
        console.error('Error fetching pending registrations:', error);
        setPendingError('Failed to load pending registrations');
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingRegistrations();
  }, []);

  // Move all the helper functions after hooks
  const loadManagerData = async () => {
    try {
      const managerData = await AsyncStorage.getItem('manager');
      const pgData = await AsyncStorage.getItem('pg');
      
      if (!managerData) {
        console.error('No manager data found');
        router.replace('/auth/login');
        return;
      }

      const manager = JSON.parse(managerData);
      setManager(manager);
      setManagerName(manager.fullName || 'Manager');

      if (!pgData && manager.pgId) {
        // Store PG ID from manager data
        await AsyncStorage.setItem('pg', JSON.stringify({ PGID: manager.pgId }));
        setPgName('Your PG'); // Default name until we get more details
      } else if (pgData) {
        try {
          const pg = JSON.parse(pgData);
          setPgName(pg.PGName || 'Your PG');
        } catch (parseError) {
          console.error('Error parsing PG data:', parseError);
          setPgName('Your PG');
        }
      } else {
        console.error('No PG associated with this manager');
        setPgName('No PG Found');
      }
    } catch (error) {
      console.error('Error loading manager/PG data:', error);
      setManagerName('Manager');
      setPgName('Your PG');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check manager data
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) {
        console.error('No manager data found');
        setError('Please login again');
        router.replace('/auth/login');
        return;
      }

      // Parse manager data
      const manager = JSON.parse(managerData);
      if (!manager.id) {
        setError('Invalid manager data');
        return;
      }
      
      try {
        // Fetch dashboard stats using manager ID
        const dashboardStats = await getDashboardStats(manager.id);
        if (!dashboardStats) {
          setError('No dashboard data available');
          return;
        }
        
        setStats(dashboardStats);

        // Animate the stats if needed
        if (dashboardStats.students) {
          Animated.parallel([
            Animated.timing(availableStudentsAnim, {
              toValue: dashboardStats.students.available || 0,
              duration: 1000,
              useNativeDriver: false
            }),
            Animated.timing(unavailableStudentsAnim, {
              toValue: dashboardStats.students.occupied || 0,
              duration: 1000,
              useNativeDriver: false
            })
          ]).start();
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load dashboard data';
        setError(errorMessage);
        
        if (errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
          router.replace('/auth/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (pendingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [pendingId]: true }));
      setActionError(prev => ({ ...prev, [pendingId]: '' }));
      
      // First refresh the pending registrations list to ensure we're working with current data
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) {
        throw new Error('Manager data not found');
      }
      
      const manager = JSON.parse(managerData);
      
      // Get latest pending registrations before attempting approval
      const currentRegistrations = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      
      // Check if the registration still exists and is pending
      const pendingRegistration = currentRegistrations.pendingRegistrations?.find(
        reg => reg.PendingID === pendingId && reg.Status === 'PENDING'
      );
      
      if (!pendingRegistration) {
        throw new Error('This registration request no longer exists or has already been processed');
      }
      
      // Proceed with approval
      console.log('Dashboard: Approving registration:', pendingId);
      console.log('Dashboard: Registration details:', pendingRegistration);
      
      await studentRegistrationService.approveRegistration(pendingId);
      
      // Refresh data after successful approval
      const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      setPendingRegistrations(response.pendingRegistrations || []);
      
      // Refresh dashboard stats to show new tenant and possibly new room
      await loadDashboardData();
      
      console.log('Dashboard: Successfully approved and refreshed data');
    } catch (error) {
      console.error('Dashboard: Error approving registration:', error);
      let errorMessage = error.message || 'Failed to approve registration. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('room capacity')) {
        errorMessage = 'Room is at full capacity. Please assign a different room.';
      } else if (error.message?.includes('room not found')) {
        errorMessage = 'Room will be created automatically for this student.';
      }
      
      setActionError(prev => ({ ...prev, [pendingId]: errorMessage }));
    } finally {
      setActionLoading(prev => ({ ...prev, [pendingId]: false }));
    }
  };

  const handleDecline = async (pendingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [pendingId]: true }));
      setActionError(prev => ({ ...prev, [pendingId]: '' }));
      
      // First refresh the pending registrations list to ensure we're working with current data
      const managerData = await AsyncStorage.getItem('manager');
      if (!managerData) {
        throw new Error('Manager data not found');
      }
      
      const manager = JSON.parse(managerData);
      
      // Get latest pending registrations before attempting decline
      const currentRegistrations = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      
      // Check if the registration still exists and is pending
      const registrationExists = currentRegistrations.pendingRegistrations?.some(
        reg => reg.PendingID === pendingId && reg.Status === 'PENDING'
      );
      
      if (!registrationExists) {
        throw new Error('This registration request no longer exists or has already been processed');
      }
      
      // Proceed with decline
      console.log('Dashboard: Declining registration:', pendingId);
      await studentRegistrationService.declineRegistration(pendingId);
      
      // Refresh data after successful decline
      const response = await studentRegistrationService.getPendingRegistrations(manager.tenantRegId);
      setPendingRegistrations(response.pendingRegistrations || []);
      
      console.log('Dashboard: Successfully declined and refreshed data');
    } catch (error) {
      console.error('Dashboard: Error declining registration:', error);
      setActionError(prev => ({ 
        ...prev, 
        [pendingId]: error.message || 'Failed to decline registration. Please try again.'
      }));
    } finally {
      setActionLoading(prev => ({ ...prev, [pendingId]: false }));
    }
  };

  // Render loading state
  if (!theme) return null;
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        <Button mode="contained" onPress={loadDashboardData}>Retry</Button>
      </View>
    );
  }

  // Move data preparation here
  const statsData = [
    { 
      icon: "account-group", 
      value: stats?.students?.total?.toString() || "0", 
      label: "Students" 
    },
    { 
      icon: "home", 
      value: stats?.rooms?.total?.toString() || "0", 
      label: "Rooms" 
    },
    { 
      icon: "currency-inr", 
      value: `₹${((stats?.revenue?.monthly || 0)/1000).toFixed(1)}K`, 
      label: "Revenue" 
    }
  ];

  const chartConfig = {
    backgroundGradientFrom: isDarkMode ? "#333333" : "#fff",
    backgroundGradientTo: isDarkMode ? "#4A4A4A" : "#fff",
    color: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(103, 80, 164, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const studentData = [
    { value: 84, color: '#4CAF50', label: 'Available' },
    { value: 36, color: '#F44336', label: 'Unavailable' }
  ];

  const roomData = [
    { value: 28, color: '#2196F3', label: 'Occupied' },
    { value: 7, color: '#9E9E9E', label: 'Vacant' }
  ];

  console.log('Theme:', theme);
  console.log('ShowCharts:', showCharts);
  console.log('StudentData:', studentData);

  if (!theme) return null;
  const renderPendingRegistrations = () => {
    if (pendingLoading) {
      return (
        <Surface style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Student Registrations</Text>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </Surface>
      );
    }

    if (pendingError) {
      return (
        <Surface style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Student Registrations</Text>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{pendingError}</Text>
        </Surface>
      );
    }

    if (!pendingRegistrations || pendingRegistrations.length === 0) {
      return (
        <Surface style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Student Registrations</Text>
          <Text style={styles.noDataText}>No pending registrations</Text>
        </Surface>
      );
    }

    return (
      <Surface style={styles.pendingSection}>
        <Text style={styles.sectionTitle}>Pending Student Registrations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingCards}>
          {pendingRegistrations.map((registration) => (
            <Surface key={registration.PendingID} style={styles.pendingCard}>
              <View style={styles.pendingDetails}>
                <Text style={styles.pendingText}>Name: {registration.FullName}</Text>
                <Text style={styles.pendingText}>Phone: {registration.Phone}</Text>
                <Text style={styles.pendingText}>Email: {registration.Email || 'N/A'}</Text>
                <Text style={styles.pendingText}>Room: {registration.RoomNumber}</Text>
                <Text style={styles.pendingText}>Joining: {registration.JoiningDate}</Text>
              </View>
              {actionError[registration.PendingID] && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {actionError[registration.PendingID]}
                </Text>
              )}
              <View style={styles.pendingActions}>
                <Button 
                  mode="contained" 
                  onPress={() => handleApprove(registration.PendingID)}
                  loading={actionLoading[registration.PendingID]}
                  disabled={actionLoading[registration.PendingID]}
                  style={styles.actionButton}
                >
                  Approve
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => handleDecline(registration.PendingID)}
                  loading={actionLoading[registration.PendingID]}
                  disabled={actionLoading[registration.PendingID]}
                  style={styles.actionButton}
                >
                  Decline
                </Button>
              </View>
            </Surface>
          ))}
        </ScrollView>
      </Surface>
    );
  };

  const actionButtons = [
    { 
      icon: 'account-plus', 
      label: 'Add Student',
      onPress: () => router.push('/screens/dashboard/students')
    },
    { 
      icon: 'home-plus', 
      label: 'Add Room',
      onPress: () => router.push('/screens/dashboard/rooms')
    },
    { 
      icon: 'bell-ring', 
      label: 'Send Reminder',
      onPress: () => router.push('/screens/dashboard/messages')
    },
    { 
      icon: 'file-export', 
      label: 'Export Report',
      onPress: () => {
        // TODO: Implement export functionality
        console.log('Export Report clicked');
      }
    }
  ];

  // Update stat card colors
  const statCardGradient = isDarkMode 
    ? ['#2D2D2D', '#383838'] as const
    : ['#FFFFFF', '#F8F8F8'] as const;

  // Update chart card colors
  const chartCardGradient = isDarkMode 
    ? ['#2D2D2D', '#383838'] as const
    : ['#FFFFFF', '#F8F8F8'] as const;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Card */}
      <LinearGradient
        colors={isDarkMode 
          ? ['#333333', '#4A4A4A']
          : ['#6750A4', '#9C27B0']} // Updated to match theme primary colors
        style={styles.headerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { opacity: isDarkMode ? 0.7 : 0.9 }]}>👋 Hello,</Text>
            <Text style={styles.managerName}>{managerName}</Text>
            <Text style={[styles.role, { opacity: isDarkMode ? 0.7 : 0.9 }]}>Hostel Manager</Text>
            <View style={styles.idContainer}>
              <Text style={[styles.idText, { opacity: isDarkMode ? 0.7 : 0.9 }]}>
                ID: {showTenantId ? manager?.tenantRegId || 'N/A' : '•••••'}
              </Text>
              <IconButton
                icon={showTenantId ? 'eye-off' : 'eye'}
                iconColor={isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)'}
                size={20}
                onPress={() => setShowTenantId(!showTenantId)}
              />
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.hostelName}>{pgName}</Text>
            <View style={[styles.membersBadge, {
              backgroundColor: isDarkMode 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.2)'
            }]}>
              <Text style={styles.totalMembers}>
                🏠 Members Available: {stats?.students?.occupied || 0}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <LinearGradient
            key={index}
            colors={statCardGradient}
            style={[
              styles.statCard,
              {
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
          >
            <IconButton 
              icon={stat.icon} 
              size={30} 
              iconColor={theme.colors.primary}
            />
            <Text style={[styles.statNumber, { 
              color: theme.colors.text,
              fontSize: 24,
              fontWeight: 'bold',
              marginVertical: 8,
            }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: 14,
            }]}>
              {stat.label}
            </Text>
          </LinearGradient>
        ))}
      </View>
      {renderPendingRegistrations()}
      {/* Charts */}
      <View style={styles.chartsRow}>
        <LinearGradient
          colors={chartCardGradient}
          style={[styles.chartCard, {
            flex: 1,
            padding: 16,
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Students Overview
          </Text>
          <ModernPieChart
            data={{
              value: stats?.students?.occupied || 0,
              total: stats?.students?.total || 1,
              label: 'Available Students'
            }}
            size={Math.min(screenWidth * 0.42, 220)}
          />
        </LinearGradient>

        <LinearGradient
          colors={chartCardGradient}
          style={[styles.chartCard, {
            flex: 1,
            padding: 16,
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text,marginBottom: 35 }]}>
            Room Status
          </Text>
          <ModernPieChart
            data={{
              value: stats?.rooms?.occupied || 0,
              total: stats?.rooms?.total || 1,
              label: 'Occupied Rooms'
            }}
            size={Math.min(screenWidth * 0.42, 220)}
          />
        </LinearGradient>
      </View>

      <View style={[styles.chartsContainer, { padding: 12 }]}>
        <LinearGradient
          colors={chartCardGradient}
          style={[styles.chartCard, styles.fullWidth, {
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
          }]}
        >
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Monthly Payment Collection
          </Text>
          <LineChart
            data={{
              labels: stats?.monthlyPayments?.map(p => p.month) || [],
              datasets: [{
                data: stats?.monthlyPayments?.map(p => p.amount) || [0]
              }]
            }}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.lineChart}
          />
          <View style={[styles.paymentSummary, {
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'
          }]}>
            <Text style={{ color: theme.colors.text }}>
              Total Collected: ₹{(stats?.revenue?.total || 0).toLocaleString()}
            </Text>
            <Text style={{ color: theme.colors.text }}>
              Pending: ₹{(stats?.revenue?.pending || 0).toLocaleString()}
            </Text>
            <Button 
              mode="text" 
              onPress={() => router.push('/screens/dashboard/payments')}
              textColor={theme.colors.primary}
            >
              View Payment Details →
            </Button>
          </View>
        </LinearGradient>
        <View style={styles.actionButtons}>
          {actionButtons.map((button, index) => (
            <LinearGradient
              key={index}
              colors={isDarkMode 
                ? ['#6750A4', '#9C27B0']
                : ['#6750A4', '#9C27B0']}
              style={[styles.actionButton, {
                borderRadius: 12,
              }]}
            >
              <Button 
                mode="contained" 
                icon={button.icon}
                onPress={button.onPress}
                style={{ backgroundColor: 'transparent' }}
                labelStyle={{
                  color: '#FFFFFF',
                }}
              >
                {button.label}
              </Button>
            </LinearGradient>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: 20,
    borderRadius: 0,
    minHeight: 150,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerLeft: {
    justifyContent: 'space-between',
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  managerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  hostelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  membersBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  totalMembers: {
    fontSize: 12,
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 0,
    minHeight: 120,
    overflow: 'hidden',
  },
  statNumber: {
    textAlign: 'center',
  },
  statLabel: {
    textAlign: 'center',
  },
  chartsContainer: {
    padding: 12,
    gap: 12,
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 0,
    alignItems: 'center',
    minHeight: 300,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
    overflow: 'hidden',
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontWeight: '500',
  },
  totalCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  fullWidth: {
    width: '100%',
  },
  paymentSummary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 0,  // Remove shadow for glass effect
    // For iOS glass effect
    shadowColor: 'transparent',
    backdropFilter: 'blur(10px)',
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  idText: {
    color: '#fff',
    fontSize: 14,
  },
  pendingSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pendingCards: {
    flexDirection: 'row',
    gap: 12,
  },
  pendingCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
  },
  pendingDetails: {
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 16,
    marginBottom: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.7,
  },
}); 