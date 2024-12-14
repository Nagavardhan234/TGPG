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
  Divider
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import StudentDashboardLayout from '@/app/components/layouts/StudentDashboardLayout';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';

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
        icon: 'washing-machine', 
        label: 'Laundry',
        route: '/screens/student/laundry',
        color: '#6C5CE7'
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

export default function StudentDashboard() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();

  const renderMenuSection = (section: typeof menuItems[0]) => (
    <View key={section.title} style={styles.menuSection}>
      <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
        {section.title}
      </Text>
      <View style={styles.menuGrid}>
        {section.items.map((item, index) => (
          <Surface 
            key={index}
            style={[styles.menuCard, { backgroundColor: theme?.colors?.surface }]}
          >
            <LinearGradient
              colors={[`${item.color}20`, 'transparent']}
              style={styles.menuGradient}
            />
            <IconButton
              icon={item.icon}
              size={28}
              iconColor={item.color}
              style={styles.menuIcon}
              onPress={() => router.push(item.route)}
            />
            <Text style={[styles.menuLabel, { color: theme?.colors?.onSurface }]}>
              {item.label}
            </Text>
          </Surface>
        ))}
      </View>
    </View>
  );

  return (
    <StudentDashboardLayout>
      <ScrollView style={styles.container}>
        {/* Student Profile Card */}
        <Surface style={[styles.profileCard, { backgroundColor: theme?.colors?.surface }]}>
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

        {/* Menu Sections */}
        {menuItems.map(renderMenuSection)}
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
  },
  menuGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuIcon: {
    margin: 8,
  },
  menuLabel: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
}); 