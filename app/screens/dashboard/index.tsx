import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Animated } from 'react-native';
import { Surface, Text, IconButton, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/app/context/ThemeContext';
import { ModernPieChart } from '@/app/components/ModernPieChart';
import { LineChart } from 'react-native-chart-kit';
import { router } from 'expo-router';

export default function DashboardHome() {
  const { theme, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [showCharts, setShowCharts] = useState(true);
  const fadeAnim = new Animated.Value(1);
  
  // Animated values for pie chart
  const availableStudentsAnim = useRef(new Animated.Value(0)).current;
  const unavailableStudentsAnim = useRef(new Animated.Value(0)).current;
  const [animatedPieData, setAnimatedPieData] = useState([
    { name: "Available", population: 0, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
    { name: "Unavailable", population: 0, color: "#F44336", legendFontColor: "#7F7F7F", legendFontSize: 12 }
  ]);

  const statsData = [
    { icon: "account-group", value: "120", label: "Students" },
    { icon: "home", value: "35", label: "Rooms" },
    { icon: "currency-inr", value: "₹12.5K", label: "Revenue" }
  ];

  useEffect(() => {
    setShowCharts(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update pie data when animated values change
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

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(103, 80, 164, ${opacity})`,
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

  const actionButtons = [
    { 
      icon: 'account-plus', 
      label: 'Add Student',
      onPress: () => router.push('/screens/dashboard/students?action=add')
    },
    { 
      icon: 'home-plus', 
      label: 'Add Room',
      onPress: () => router.push('/screens/dashboard/rooms?action=add')
    },
    { 
      icon: 'bell-ring', 
      label: 'Send Reminder',
      onPress: () => router.push('/screens/dashboard/messages?action=new')
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Card */}
      <LinearGradient
        colors={['#4568DC', '#B06AB3']}
        style={styles.headerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>👋 Hello,</Text>
            <Text style={styles.managerName}>John Doe</Text>
            <Text style={styles.role}>Hostel Manager</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.hostelName}>Green Valley Hostel</Text>
            <View style={styles.membersBadge}>
              <Text style={styles.totalMembers}>🏠 Total Members: 120</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <Surface 
            key={index} 
            style={[
              styles.statCard,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e0e0e0',
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
              fontSize: 24,  // Increased font size
              fontWeight: 'bold',
              marginVertical: 8,  // Added spacing
            }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { 
              color: theme.colors.textSecondary,
              fontSize: 14,  // Increased font size
            }]}>
              {stat.label}
            </Text>
          </Surface>
        ))}
      </View>

      {/* Charts */}
      <View style={styles.chartsRow}>
        <Surface style={[styles.chartCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e0e0e0',
          flex: 1,
          padding: 16,
        }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Students Overview
          </Text>
          <ModernPieChart
            data={{
              value: 84,
              total: 120,
              label: 'Available Students'
            }}
            size={Math.min(screenWidth * 0.42, 220)}
          />
        </Surface>

        <Surface style={[styles.chartCard, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e0e0e0',
          flex: 1,
          padding: 16,
        }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text,marginBottom: 35 }]}>
            Room Status
          </Text>
          <ModernPieChart
            data={{
              value: 28,
              total: 35,
              label: 'Occupied Rooms'
            }}
            size={Math.min(screenWidth * 0.42, 220)}
          />
        </Surface>
      </View>

      <View style={[styles.chartsContainer, { padding: 12 }]}>
        <Surface style={[styles.chartCard, styles.fullWidth, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#e0e0e0',
        }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
            Monthly Payment Collection
          </Text>
          <LineChart
            data={lineData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              ...chartConfig,
              backgroundColor: 'transparent',
              backgroundGradientFrom: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff',
              backgroundGradientTo: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#fff',
              color: (opacity = 1) => isDarkMode ? 
                `rgba(255, 255, 255, ${opacity})` : 
                `rgba(103, 80, 164, ${opacity})`,
              labelColor: (opacity = 1) => isDarkMode ? 
                `rgba(255, 255, 255, ${opacity})` : 
                `rgba(0, 0, 0, ${opacity})`,
            }}
            bezier
            style={styles.lineChart}
          />
          <View style={[styles.paymentSummary, {
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'
          }]}>
            <Text style={{ color: theme.colors.text }}>Total Collected: ₹10,000</Text>
            <Text style={{ color: theme.colors.text }}>Pending: ₹2,500</Text>
            <Button 
              mode="text" 
              onPress={() => router.push('/screens/dashboard/payments')}
              textColor={theme.colors.primary}
            >
              View Payment Details →
            </Button>
          </View>
        </Surface>
        <View style={styles.actionButtons}>
          {actionButtons.map((button, index) => (
            <Button 
              key={index}
              mode="contained" 
              icon={button.icon}
              onPress={button.onPress}
              style={[styles.actionButton, {
                backgroundColor: theme.colors.primary,
                borderRadius: 12,
              }]}
              labelStyle={{
                color: isDarkMode ? '#000' : '#fff',
              }}
            >
              {button.label}
            </Button>
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
    minHeight: 120,  // Added minimum height
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
}); 