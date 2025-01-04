import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Surface, 
  IconButton, 
  Avatar,
  Divider,
  Portal,
  Modal,
  List,
  useTheme as usePaperTheme,
  ActivityIndicator
} from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { useStudentAuth } from '@/app/context/StudentAuthContext';
import { router } from 'expo-router';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: () => React.ReactNode;
}

const studentMenuItems = [
  {
    icon: 'view-dashboard',
    label: 'Dashboard',
    route: '/screens/student/dashboard'
  },
  {
    icon: 'account-group',
    label: 'Community',
    route: '/screens/student/community'
  },
  {
    icon: 'message-text',
    label: 'Messages',
    route: '/screens/student/messages'
  },
  {
    icon: 'food',
    label: 'Meal Menu',
    route: '/screens/student/meals'
  },
  {
    icon: 'account-group-outline',
    label: 'Split Work',
    route: '/screens/student/split-work'
  },
  {
    icon: 'alert-circle',
    label: 'Complaints',
    route: '/screens/student/complaints'
  }
];

export default function StudentDashboardLayout({ children, title, subtitle, headerRight }: Props) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const { student, isAuthenticated, logout } = useStudentAuth();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || !student)) {
      router.replace('/screens/student/login');
    }
  }, [isInitialized, isAuthenticated, student]);

  const renderMenuItem = (item: typeof studentMenuItems[number]) => (
    <List.Item
      key={item.route}
      title={item.label}
      left={props => <List.Icon {...props} icon={item.icon} />}
      onPress={() => {
        router.push(item.route);
        setIsDrawerOpen(false);
      }}
      style={[
        router.pathname === item.route && { 
          backgroundColor: theme.colors.primary + '20'
        }
      ]}
      titleStyle={[
        { color: theme.colors.text },
        router.pathname === item.route && { 
          color: theme.colors.primary,
          fontWeight: '600'
        }
      ]}
    />
  );

  if (!isAuthenticated || !student) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface, elevation: 2 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton 
              icon="menu" 
              onPress={() => setIsDrawerOpen(true)}
              iconColor={theme.colors.text}
            />
            <View>
              <Text variant="titleLarge" style={{ color: theme.colors.text }}>
                {title || 'Dashboard'}
              </Text>
              {subtitle && (
                <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <IconButton 
              icon="bell" 
              onPress={() => {}}
              style={[styles.headerIcon, { backgroundColor: theme.colors.surfaceVariant }]}
              iconColor={theme.colors.text}
            />
            <IconButton 
              icon={isDarkMode ? 'weather-sunny' : 'weather-night'}
              onPress={toggleTheme}
              style={[styles.headerIcon, { backgroundColor: theme.colors.surfaceVariant }]}
              iconColor={theme.colors.text}
            />
            <Avatar.Text
              size={35}
              label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={{ backgroundColor: theme.colors.primary + '20' }}
              color={theme.colors.primary}
            />
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {children}
      </View>

      <Portal>
        <Modal
          visible={isDrawerOpen}
          onDismiss={() => setIsDrawerOpen(false)}
          contentContainerStyle={[styles.drawer, { backgroundColor: theme.colors.surface }]}
        >
          <Surface style={[styles.drawerHeader, { backgroundColor: theme.colors.surface }]}>
            <Avatar.Text
              size={50}
              label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={{ backgroundColor: theme.colors.primary + '20' }}
              color={theme.colors.primary}
            />
            <View style={styles.drawerHeaderInfo}>
              <Text variant="titleMedium" style={{ color: theme.colors.text }}>
                {student?.FullName}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.textSecondary }}>
                Room {student?.Room_No}
              </Text>
            </View>
          </Surface>
          <Divider />
          <View style={{ flex: 1 }}>
            <List.Section>
              {studentMenuItems.map(renderMenuItem)}
            </List.Section>
            <Divider />
            <List.Item
              title="Logout"
              titleStyle={{ color: theme.colors.error }}
              left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={() => {
                logout();
                setIsDrawerOpen(false);
              }}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 360,
    paddingTop: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  drawerHeaderInfo: {
    flex: 1,
  },
}); 