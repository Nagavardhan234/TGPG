import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Surface, Text, Avatar, IconButton, Button, ProgressBar, Card, Checkbox } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { router } from 'expo-router';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Remove Carousel temporarily and use a simple ScrollView for notifications
interface Notification {
  id: number;
  message: string;
  type: 'warning' | 'info' | 'event';
}

const notifications: Notification[] = [
  { id: 1, message: "Payment due in 2 days!", type: "warning" },
  { id: 2, message: "Room inspection tomorrow!", type: "info" },
  { id: 3, message: "New event: PG Festival this weekend!", type: "event" },
];

const upcomingEvents = [
  { id: 1, title: "Roommate's Birthday", date: "Tomorrow" },
  { id: 2, title: "PG Festival", date: "This Weekend" },
  { id: 3, title: "Monthly Meeting", date: "Next Week" },
];

// Add new interfaces
interface Task {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface RoommateScore {
  id: number;
  name: string;
  points: number;
  isYou?: boolean;
}

// Add dummy data
const tasks: Task[] = [
  { id: 1, title: 'Laundry', isCompleted: false },
  { id: 2, title: 'Room Inspection', isCompleted: false },
  { id: 3, title: 'Clean Common Area', isCompleted: true },
];

const roommateScores: RoommateScore[] = [
  { id: 1, name: 'Rahul', points: 12 },
  { id: 2, name: 'You', points: 10, isYou: true },
  { id: 3, name: 'Amit', points: 8 },
];

// Add event interface
interface PGEvent {
  date: string;
  title: string;
  type: 'birthday' | 'event' | 'maintenance' | 'payment';
}

// Add dummy events
const pgEvents: PGEvent[] = [
  { date: '2024-03-15', title: 'PG Movie Night', type: 'event' },
  { date: '2024-03-18', title: 'Room Inspection', type: 'maintenance' },
  { date: '2024-03-20', title: "Rahul's Birthday", type: 'birthday' },
  { date: '2024-03-25', title: 'Rent Due', type: 'payment' },
];

export default function StudentDashboard() {
  const { theme } = useTheme();
  const { student } = useStudentAuth();

  const menuItems = [
    {
      key: 'profile',
      title: 'Profile',
      icon: 'account-outline',
      route: '/screens/student/profile'
    },
    {
      key: 'roommates',
      title: 'Roommates',
      icon: 'account-group-outline',
      route: '/screens/student/roommates'
    },
    {
      key: 'payments',
      title: 'Payments',
      icon: 'credit-card-outline',
      route: '/screens/student/payments'
    },
    {
      key: 'messages',
      title: 'Messages',
      icon: 'message-outline',
      route: '/screens/student/messages'
    },
    {
      key: 'games',
      title: 'Games',
      icon: 'gamepad-variant-outline',
      route: '/screens/student/games'
    },
    {
      key: 'complaints',
      title: 'Complaints',
      icon: 'alert-outline',
      route: '/screens/student/complaints'
    },
    {
      key: 'suggestions',
      title: 'Suggestions',
      icon: 'lightbulb-outline',
      route: '/screens/student/suggestions'
    }
  ];

  const handleNavigation = (route: string) => {
    router.push(route as never);
  };

  const renderStudentCard = () => (
    <Surface style={[styles.studentCard, { backgroundColor: theme?.colors?.surface }]}>
      <View style={styles.studentCardHeader}>
        <Avatar.Text 
          size={50} 
          label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
          style={{ backgroundColor: theme?.colors?.primary }}
        />
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: theme?.colors?.onSurface }]}>
            {student?.FullName}
          </Text>
          <Text style={[styles.studentDetails, { color: theme?.colors?.secondary }]}>
            Room {student?.Room_No}
          </Text>
        </View>
        <IconButton 
          icon="qrcode"
          size={24}
          iconColor={theme?.colors?.primary}
          onPress={() => {/* Handle QR code */}}
        />
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>120</Text>
          <Text style={[styles.statLabel, { color: theme?.colors?.secondary }]}>Days</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>4/6</Text>
          <Text style={[styles.statLabel, { color: theme?.colors?.secondary }]}>Payments</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme?.colors?.primary }]}>85%</Text>
          <Text style={[styles.statLabel, { color: theme?.colors?.secondary }]}>Rating</Text>
        </View>
      </View>
    </Surface>
  );

  const renderDashboardContent = () => {
    // Create marked dates for calendar
    const markedDates = pgEvents.reduce((acc, event) => {
      const dotColor = event.type === 'birthday' ? theme?.colors?.secondary :
                      event.type === 'payment' ? theme?.colors?.error :
                      event.type === 'maintenance' ? theme?.colors?.warning :
                      theme?.colors?.primary;
      
      return {
        ...acc,
        [event.date]: {
          marked: true,
          dotColor,
          selected: true,
          selectedColor: theme?.colors?.surfaceVariant
        }
      };
    }, {});

    return (
      <ScrollView style={styles.container}>
        {/* Student Card at the top */}
        {renderStudentCard()}

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <Surface style={[styles.quickStatCard, { backgroundColor: theme?.colors?.primaryContainer }]}>
            <IconButton icon="calendar-today" size={24} iconColor={theme?.colors?.primary} />
            <Text style={[styles.quickStatValue, { color: theme?.colors?.primary }]}>
              {pgEvents.length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme?.colors?.onPrimaryContainer }]}>
              Upcoming Events
            </Text>
          </Surface>

          <Surface style={[styles.quickStatCard, { backgroundColor: theme?.colors?.secondaryContainer }]}>
            <IconButton icon="check-circle" size={24} iconColor={theme?.colors?.secondary} />
            <Text style={[styles.quickStatValue, { color: theme?.colors?.secondary }]}>
              {tasks.filter(t => t.isCompleted).length}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme?.colors?.onSecondaryContainer }]}>
              Tasks Done
            </Text>
          </Surface>

          <Surface style={[styles.quickStatCard, { backgroundColor: theme?.colors?.tertiaryContainer }]}>
            <IconButton icon="trophy" size={24} iconColor={theme?.colors?.tertiary} />
            <Text style={[styles.quickStatValue, { color: theme?.colors?.tertiary }]}>
              {roommateScores.find(r => r.isYou)?.points || 0}
            </Text>
            <Text style={[styles.quickStatLabel, { color: theme?.colors?.onTertiaryContainer }]}>
              Your Points
            </Text>
          </Surface>
        </View>

        {/* Action Buttons with Modern Design */}
        <View style={styles.actionGrid}>
          {[
            { 
              icon: 'cash-fast', 
              label: 'Pay Rent', 
              route: '/screens/student/payments',
              color: theme?.colors?.primary,
              bgColor: theme?.colors?.primaryContainer
            },
            { 
              icon: 'alert-octagon', 
              label: 'Report Issue', 
              route: '/screens/student/complaints',
              color: theme?.colors?.error,
              bgColor: theme?.colors?.errorContainer
            },
            { 
              icon: 'gamepad-variant', 
              label: 'Play Games', 
              route: '/screens/student/games',
              color: theme?.colors?.tertiary,
              bgColor: theme?.colors?.tertiaryContainer
            },
            { 
              icon: 'message-text', 
              label: 'Messages', 
              route: '/screens/student/messages',
              color: theme?.colors?.secondary,
              bgColor: theme?.colors?.secondaryContainer
            },
          ].map((action) => (
            <TouchableOpacity 
              key={action.label}
              style={[styles.modernActionCard, { backgroundColor: action.bgColor }]}
              onPress={() => handleNavigation(action.route)}
            >
              <IconButton 
                icon={action.icon} 
                size={32} 
                iconColor={action.color}
                style={styles.actionIcon}
              />
              <Text style={[styles.modernActionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar Section */}
        <Surface style={[styles.calendarSection, { backgroundColor: theme?.colors?.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
              PG Calendar
            </Text>
            <Button 
              mode="text"
              onPress={() => {}}
              icon="calendar-month"
            >
              View All
            </Button>
          </View>
          
          <Calendar
            markedDates={markedDates}
            theme={{
              backgroundColor: theme?.colors?.surface,
              calendarBackground: theme?.colors?.surface,
              textSectionTitleColor: theme?.colors?.primary,
              selectedDayBackgroundColor: theme?.colors?.primary,
              selectedDayTextColor: theme?.colors?.onPrimary,
              todayTextColor: theme?.colors?.primary,
              dayTextColor: theme?.colors?.onSurface,
              textDisabledColor: theme?.colors?.outline,
              dotColor: theme?.colors?.primary,
              monthTextColor: theme?.colors?.primary,
              indicatorColor: theme?.colors?.primary,
              arrowColor: theme?.colors?.primary,
            }}
          />

          {/* Upcoming Events List */}
          <View style={styles.eventsList}>
            {pgEvents.slice(0, 3).map((event, index) => (
              <Surface 
                key={index}
                style={[styles.eventCard, { backgroundColor: theme?.colors?.surfaceVariant }]}
              >
                <IconButton
                  icon={
                    event.type === 'birthday' ? 'cake-variant' :
                    event.type === 'payment' ? 'cash' :
                    event.type === 'maintenance' ? 'tools' : 'calendar-star'
                  }
                  size={24}
                  iconColor={
                    event.type === 'birthday' ? theme?.colors?.secondary :
                    event.type === 'payment' ? theme?.colors?.error :
                    event.type === 'maintenance' ? theme?.colors?.warning :
                    theme?.colors?.primary
                  }
                />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: theme?.colors?.onSurface }]}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventDate, { color: theme?.colors?.onSurfaceVariant }]}>
                    {new Date(event.date).toLocaleDateString()}
                  </Text>
                </View>
              </Surface>
            ))}
          </View>
        </Surface>

        {/* Rest of the content remains same... */}
      </ScrollView>
    );
  };

  return (
    <DashboardLayout
      title="Student Dashboard"
      subtitle={`Room ${student?.Room_No}`}
      menuItems={menuItems}
      onMenuItemPress={handleNavigation}
    >
      {renderDashboardContent()}
    </DashboardLayout>
  );
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return 'alert';
    case 'event':
      return 'calendar';
    default:
      return 'information';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  statsContent: {
    alignItems: 'center',
    gap: 12,
  },
  statsInfo: {
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsSubtext: {
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  actionCard: {
    width: '45%',
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    borderRadius: 16,
    padding: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  leaderboardCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    borderLeftWidth: 4,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickStatsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  modernActionCard: {
    width: '45%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 8,
  },
  modernActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarSection: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    elevation: 4,
  },
  eventsList: {
    marginTop: 16,
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 12,
  },
  studentCard: {
    margin: 16,
    borderRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentDetails: {
    fontSize: 14,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
}); 