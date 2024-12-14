import React from 'react';
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
  MD3Colors
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
    label: 'Community',
    icon: 'account-group',
    children: [
      {
        icon: 'poll',
        label: 'Polls & Events',
        route: '/screens/student/community/polls'
      },
      {
        icon: 'trophy',
        label: 'Rankings',
        route: '/screens/student/community/rankings'
      },
      {
        icon: 'calendar-check',
        label: 'Events',
        route: '/screens/student/community/events'
      }
    ]
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
    icon: 'washing-machine',
    label: 'Laundry',
    route: '/screens/student/laundry'
  },
  {
    icon: 'alert-circle',
    label: 'Complaints',
    route: '/screens/student/complaints'
  }
];

export default function StudentDashboardLayout({ children, title, subtitle, headerRight }: Props) {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { student, logout } = useStudentAuth();
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null);

  const renderMenuItem = (item: typeof studentMenuItems[0]) => {
    if ('children' in item) {
      return (
        <List.Accordion
          key={item.label}
          title={item.label}
          left={props => <List.Icon {...props} icon={item.icon} />}
          expanded={expandedMenu === item.label}
          onPress={() => setExpandedMenu(expandedMenu === item.label ? null : item.label)}
        >
          {item.children?.map(child => (
            <List.Item
              key={child.label}
              title={child.label}
              left={props => <List.Icon {...props} icon={child.icon} />}
              onPress={() => {
                router.push(child.route);
                setIsDrawerOpen(false);
              }}
              style={{ paddingLeft: 32 }}
            />
          ))}
        </List.Accordion>
      );
    }

    return (
      <List.Item
        key={item.label}
        title={item.label}
        left={props => <List.Icon {...props} icon={item.icon} />}
        onPress={() => {
          router.push(item.route);
          setIsDrawerOpen(false);
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Surface style={[styles.header, { backgroundColor: theme?.colors?.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <IconButton 
              icon="menu" 
              onPress={() => setIsDrawerOpen(true)} 
            />
            <View>
              <Text style={[styles.title, { color: theme?.colors?.onSurface }]}>
                {title || 'Dashboard'}
              </Text>
              {subtitle && (
                <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <IconButton icon="bell" onPress={() => {}} />
            <IconButton icon="theme-light-dark" onPress={() => {}} />
            <Avatar.Text
              size={35}
              label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={{ backgroundColor: theme?.colors?.primary + '20' }}
            />
          </View>
        </View>
      </Surface>

      <Portal>
        <Modal
          visible={isDrawerOpen}
          onDismiss={() => setIsDrawerOpen(false)}
          contentContainerStyle={[
            styles.drawer,
            { backgroundColor: theme?.colors?.surface }
          ]}
        >
          <Surface style={[styles.drawerHeader, { backgroundColor: theme?.colors?.surface }]}>
            <Avatar.Text
              size={50}
              label={student?.FullName?.substring(0, 2).toUpperCase() || 'ST'}
              style={{ backgroundColor: theme?.colors?.primary }}
            />
            <View style={styles.drawerHeaderInfo}>
              <Text style={[styles.drawerHeaderName, { color: theme?.colors?.onSurface }]}>
                {student?.FullName}
              </Text>
              <Text style={{ color: theme?.colors?.onSurfaceVariant }}>
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
              left={props => <List.Icon {...props} icon="logout" />}
              onPress={() => {
                logout();
                setIsDrawerOpen(false);
              }}
            />
          </View>
        </Modal>
      </Portal>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 4,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  drawerHeaderInfo: {
    flex: 1,
  },
  drawerHeaderName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    elevation: 16,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
}); 