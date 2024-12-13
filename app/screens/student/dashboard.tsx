import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, Avatar, IconButton, Button, ProgressBar, Card } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';
import { router } from 'expo-router';

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

  const renderDashboardContent = () => (
    <ScrollView style={styles.container}>
      {/* Welcome Section */}
      <Surface style={[styles.section, { backgroundColor: theme?.colors?.surface }]}>
        <View style={styles.welcomeContainer}>
          <Avatar.Text 
            size={50} 
            label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
            style={{ backgroundColor: theme?.colors?.primary }}
          />
          <View style={styles.welcomeText}>
            <Text style={[styles.greeting, { color: theme?.colors?.text }]}>
              Welcome back,
            </Text>
            <Text style={[styles.name, { color: theme?.colors?.primary }]}>
              {student?.FullName}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Notifications Section */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.notificationsContainer}
      >
        {notifications.map((notification) => (
          <Surface 
            key={notification.id} 
            style={[styles.notificationCard, { backgroundColor: theme?.colors?.surface }]}
          >
            <View style={styles.notificationContent}>
              <IconButton
                icon={getNotificationIcon(notification.type)}
                size={24}
                iconColor={
                  notification.type === 'warning' 
                    ? theme?.colors?.error 
                    : theme?.colors?.primary
                }
              />
              <Text style={[styles.notificationText, { color: theme?.colors?.text }]}>
                {notification.message}
              </Text>
            </View>
          </Surface>
        ))}
      </ScrollView>

      {/* Quick Actions */}
      <Surface style={[styles.section, { backgroundColor: theme?.colors?.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme?.colors?.primary }]}>
          Quick Actions
        </Text>
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            icon="cash"
            onPress={() => handleNavigation('/screens/student/payments')}
            style={styles.actionButton}
          >
            Pay Now
          </Button>
          <Button 
            mode="contained" 
            icon="alert"
            onPress={() => handleNavigation('/screens/student/complaints')}
            style={styles.actionButton}
          >
            Complaint
          </Button>
          <Button 
            mode="contained" 
            icon="message"
            onPress={() => handleNavigation('/screens/student/messages')}
            style={styles.actionButton}
          >
            Message
          </Button>
        </View>
      </Surface>

      {/* Rest of your sections... */}
    </ScrollView>
  );

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
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    elevation: 2,
    width: Dimensions.get('window').width * 0.85,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
}); 