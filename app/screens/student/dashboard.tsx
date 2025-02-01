import React from 'react';
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
  useTheme as usePaperTheme
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { StudentDashboardLayout } from '@/app/components/layouts';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

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

// Add this interface
interface PaymentHistory {
  id: number;
  amount: number;
  date: string;
  type: 'rent' | 'deposit' | 'maintenance';
  status: 'success' | 'pending' | 'failed';
}

// Add dummy payment history data
const paymentHistory: PaymentHistory[] = [
  {
    id: 1,
    amount: 6000,
    date: '2024-03-01',
    type: 'rent',
    status: 'success'
  },
  {
    id: 2,
    amount: 500,
    date: '2024-02-15',
    type: 'maintenance',
    status: 'success'
  },
  {
    id: 3,
    amount: 6000,
    date: '2024-02-01',
    type: 'rent',
    status: 'success'
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

export default function StudentDashboard() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();
  const paperTheme = usePaperTheme();

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
        <Surface 
          style={[
            styles.paymentCard, 
            dynamicStyles.card,
            styles.glassEffect
          ]}
        >
          {/* Add gradient background */}
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.1)',
              'rgba(255, 255, 255, 0.05)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassGradient}
          />
          
          {/* Update floating shapes to use dynamic styles */}
          <View style={dynamicStyles.floatingShapes.shape1} />
          <View style={dynamicStyles.floatingShapes.shape2} />
          <View style={dynamicStyles.floatingShapes.shape3} />

          <View style={styles.paymentHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
                Payment Progress
              </Text>
              <View style={styles.dueDateContainer}>
                <IconButton 
                  icon="clock-alert-outline"
                  size={18}
                  iconColor={theme?.colors?.error}
                  style={styles.clockIcon}
                />
                <Text style={[styles.dueText, { color: theme?.colors?.error }]}>
                  Due in 5 days
                </Text>
              </View>
            </View>
            <LinearGradient
              colors={[theme?.colors?.primary || '#6200ee', `${theme?.colors?.primary}80` || '#8F6BF2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentBadge}
            >
              <Text style={styles.paymentBadgeText}>Monthly Rent</Text>
            </LinearGradient>
          </View>

          <View style={styles.amountContainer}>
            <View style={styles.amountWrapper}>
              <Text style={[styles.currencySymbol, { color: theme?.colors?.onSurfaceVariant }]}>₹</Text>
              <Text style={[styles.amount, { color: theme?.colors?.onSurface }]}>
                4,000
              </Text>
            </View>
            <Text style={[styles.amountSeparator, { color: theme?.colors?.onSurfaceVariant }]}> of </Text>
            <Text style={[styles.totalAmount, { color: theme?.colors?.onSurface }]}>
              ₹6,000
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBackground, dynamicStyles.surfaceVariant]}>
              <LinearGradient
                colors={[theme?.colors?.primary || '#6200ee', `${theme?.colors?.primary}80` || '#8F6BF2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: '67%' }]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme?.colors?.onSurfaceVariant }]}>
              67% Complete
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={() => router.push('/screens/student/payments')}
            style={[styles.payButton, { backgroundColor: theme?.colors?.primary }]}
            contentStyle={styles.payButtonContent}
            labelStyle={styles.payButtonLabel}
            icon={({ size, color }) => (
              <IconButton
                icon="wallet"
                size={20}
                iconColor={color}
                style={{ margin: 0, padding: 0 }}
              />
            )}
          >
            Pay Now
          </Button>
        </Surface>

        {/* Menu Sections */}
        {menuItems.map(renderMenuSection)}

        <Surface style={[styles.recentPayments, { backgroundColor: theme?.colors?.surface }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
              Recent Payments
            </Text>
            <Button 
              mode="text" 
              compact
              onPress={() => router.push('/screens/student/payments/history')}
              labelStyle={{ color: theme?.colors?.primary }}
            >
              View All
            </Button>
          </View>
          
          {paymentHistory.map((payment) => (
            <Surface 
              key={payment.id}
              style={[
                styles.paymentItem, 
                { 
                  backgroundColor: theme?.colors?.surfaceVariant + '10',
                  borderColor: theme?.colors?.surfaceVariant + '20',
                  borderWidth: 1,
                }
              ]}
            >
              <View style={styles.paymentItemLeft}>
                <Surface 
                  style={[
                    styles.paymentIconContainer, 
                    { 
                      backgroundColor: theme?.colors?.primary + '15',
                      borderRadius: 12 
                    }
                  ]}
                >
                  <IconButton
                    icon={
                      payment.type === 'rent' ? 'home' :
                      payment.type === 'deposit' ? 'bank' : 'tools'
                    }
                    iconColor={theme?.colors?.primary}
                    size={20}
                  />
                </Surface>
                <View style={styles.paymentInfo}>
                  <Text 
                    style={[
                      styles.paymentType, 
                      { color: theme?.colors?.onSurface }
                    ]}
                    numberOfLines={1}
                  >
                    {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)} Payment
                  </Text>
                  <Text 
                    style={[
                      styles.paymentDate, 
                      { color: theme?.colors?.onSurfaceVariant }
                    ]}
                  >
                    {new Date(payment.date).toLocaleDateString('en-US', { 
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentItemRight}>
                <Text 
                  style={[
                    styles.paymentAmount, 
                    { color: theme?.colors?.onSurface }
                  ]}
                >
                  ₹{payment.amount.toLocaleString()}
                </Text>
                <Chip 
                  compact
                  icon={payment.status === 'success' ? 'check-circle' : 'clock'}
                  style={[
                    styles.statusChip,
                    { 
                      backgroundColor: payment.status === 'success' ? 
                        theme?.colors?.primary + '15' : 
                        theme?.colors?.surfaceVariant + '30'
                    }
                  ]}
                  textStyle={{ fontSize: 12 }}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Chip>
              </View>
            </Surface>
          ))}
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
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
    marginRight: 8,
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentItemRight: {
    alignItems: 'flex-end',
  },
  paymentType: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentDate: {
    fontSize: 12,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    height: 22,
    borderRadius: 11,
  },
  paymentSection: {
    padding: 16,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clockIcon: {
    margin: 0,
    padding: 0,
  },
  dueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    marginBottom: 16,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  amountLabel: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '500',
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
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
  paymentCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clockIcon: {
    margin: 0,
    padding: 0,
  },
  dueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 24,
    marginRight: 2,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 44,
  },
  amountSeparator: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '600',
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
}); 