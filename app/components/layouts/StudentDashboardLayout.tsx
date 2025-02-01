import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
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
import { router, usePathname } from 'expo-router';
import { OfflineScreen } from '../OfflineScreen';
import { useNetworkStore } from '../../stores/networkStore';
import { LoadingOverlay } from '../LoadingOverlay';

type StudentRoutes = {
  '/screens/student/dashboard': undefined;
  '/screens/student/community': undefined;
  '/screens/student/messages': undefined;
  '/screens/student/meals': undefined;
  '/screens/student/split-work': undefined;
  '/screens/student/complaints': undefined;
  '/screens/student/profile': undefined;
  '/screens/student/login': undefined;
};

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: () => React.ReactNode;
  loading?: boolean;
  onRetry?: () => void;
}

const studentMenuItems = [
  {
    icon: 'view-dashboard',
    label: 'Dashboard',
    route: '/screens/student/dashboard' as keyof StudentRoutes
  },
  {
    icon: 'account-group',
    label: 'Community',
    route: '/screens/student/community' as keyof StudentRoutes
  },
  {
    icon: 'message-text',
    label: 'Messages',
    route: '/screens/student/messages' as keyof StudentRoutes
  },
  {
    icon: 'food',
    label: 'Meal Menu',
    route: '/screens/student/meals' as keyof StudentRoutes
  },
  {
    icon: 'account-group-outline',
    label: 'Split Work',
    route: '/screens/student/split-work' as keyof StudentRoutes
  },
  {
    icon: 'alert-circle',
    label: 'Complaints',
    route: '/screens/student/complaints' as keyof StudentRoutes
  }
];

export const StudentDashboardLayout: React.FC<Props> = ({ 
  children, 
  title, 
  subtitle, 
  headerRight,
  loading,
  onRetry 
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();
  const { student, isAuthenticated, logout } = useStudentAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const pathname = usePathname();
  const isConnected = useNetworkStore((state) => state.isConnected);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsInitialized(true);
      }
    }, 0);
    return () => {
      setIsMounted(false);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (isInitialized && (!isAuthenticated || !student) && isMounted) {
      router.replace('/screens/student/login');
    }
  }, [isInitialized, isAuthenticated, student, isMounted]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/screens/student/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderMenuItem = (item: typeof studentMenuItems[number]) => (
    <List.Item
      key={item.route}
      title={item.label}
      left={props => <List.Icon {...props} icon={item.icon} />}
      onPress={() => {
        router.push(item.route as any);
        setIsDrawerOpen(false);
      }}
      style={[
        styles.menuItem,
        item.route === '/screens/student/dashboard' && { 
          backgroundColor: theme.colors.primary + '20'
        }
      ]}
      titleStyle={[
        { color: theme.colors.text },
        item.route === '/screens/student/dashboard' && { 
          color: theme.colors.primary,
          fontWeight: '600'
        }
      ]}
    />
  );

  if (!isInitialized) {
    return <LoadingOverlay />;
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
            <TouchableOpacity onPress={() => router.push('/screens/student/profile' as any)}>
              <Avatar.Text
                size={35}
                label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
                style={{ backgroundColor: theme.colors.primary + '20' }}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {loading ? (
          <LoadingOverlay />
        ) : (
          <>
            <OfflineScreen onRetry={onRetry} />
            {children}
          </>
        )}
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
              onPress={handleLogout}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
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
  menuItem: {
    padding: 12,
  },
}); 