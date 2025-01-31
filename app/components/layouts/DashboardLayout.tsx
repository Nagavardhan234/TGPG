import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Drawer, Appbar, Menu, Avatar, Divider, Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuth } from '@/app/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const menuItems = [
  {
    key: 'index',
    title: 'Dashboard',
    icon: 'view-dashboard-outline',
    route: '/screens/dashboard'
  },
  {
    key: 'students',
    title: 'Student Management',
    icon: 'account-group-outline',
    route: '/screens/dashboard/students'
  },
  {
    key: 'rooms',
    title: 'Room Management',
    icon: 'home-outline',
    route: '/screens/dashboard/rooms'
  },
  {
    key: 'complaints',
    title: 'Complaints',
    icon: 'alert-circle-outline',
    route: '/screens/dashboard/complaints'
  },
  {
    key: 'payments',
    title: 'Payments Overview',
    icon: 'credit-card-outline',
    route: '/screens/dashboard/payments'
  }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { logout, manager } = useAuth();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getCurrentRouteKey = (path: string) => {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart || 'index';
  };

  const currentRouteKey = getCurrentRouteKey(pathname);
  const currentRoute = menuItems.find(item => item.key === currentRouteKey) || menuItems[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={isDarkMode 
          ? ['#333333', '#4A4A4A']
          : ['#FFFFFF', '#FAFAFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Appbar.Action 
          icon={isDrawerVisible ? "close" : "menu"} 
          onPress={() => setIsDrawerVisible(!isDrawerVisible)}
          color={isDarkMode ? "#fff" : theme.colors.primary}
          style={styles.menuButton}
        />
        <Appbar.Content 
          title={currentRoute.title} 
          color={isDarkMode ? "#fff" : theme.colors.primary}
          style={styles.headerTitle}
        />
        <View style={styles.headerRight}>
          <Appbar.Action 
            icon={isDarkMode ? "weather-night" : "weather-sunny"} 
            onPress={toggleTheme}
            color={isDarkMode ? "#fff" : theme.colors.primary}
          />
          <Appbar.Action 
            icon="bell-outline" 
            onPress={() => router.push('/screens/dashboard/notifications')}
            color={isDarkMode ? "#fff" : theme.colors.primary}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="account-circle"
                color={isDarkMode ? "#fff" : theme.colors.primary}
                onPress={() => setMenuVisible(true)}
                style={styles.profileButton}
              />
            }
            contentStyle={[
              styles.menuContent,
              { 
                backgroundColor: isDarkMode ? '#2D2D2D' : '#FFFFFF',
              }
            ]}
          >
            <View style={styles.menuHeader}>
              <IconButton
                icon="account-circle"
                size={50}
                iconColor={theme.colors.primary}
              />
              <View style={styles.menuHeaderText}>
                <Text style={[
                  styles.menuName,
                  { color: theme.colors.text }
                ]}>
                  {manager?.fullName || 'Manager'}
                </Text>
                <Text style={[
                  styles.menuEmail,
                  { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }
                ]}>
                  {manager?.email || 'manager@example.com'}
                </Text>
              </View>
            </View>
            
            <Divider style={styles.menuDivider} />
            
            <Menu.Item 
              leadingIcon="account-outline"
              onPress={() => {
                setMenuVisible(false);
                router.push('/screens/dashboard/profile');
              }}
              title="Profile"
              theme={{ colors: { onSurface: theme.colors.text } }}
            />
            <Menu.Item 
              leadingIcon="cog-outline"
              onPress={() => {
                setMenuVisible(false);
                router.push('/screens/dashboard/settings');
              }}
              title="Settings"
              theme={{ colors: { onSurface: theme.colors.text } }}
            />
            <Divider />
            <Menu.Item 
              leadingIcon="logout"
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
              title="Logout"
              theme={{ colors: { onSurface: theme.colors.error } }}
            />
          </Menu>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {children}

        {isDrawerVisible && (
          <>
            <Pressable 
              style={[
                styles.overlay,
                { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }
              ]}
              onPress={() => setIsDrawerVisible(false)}
            />
            
            <View style={[
              styles.drawer, 
              { 
                backgroundColor: isDarkMode ? '#1A1A1A' : '#fff',
              }
            ]}>
              <View style={styles.drawerHeader}>
                <LinearGradient
                  colors={isDarkMode 
                    ? ['#4A4A4A', '#333333']
                    : ['#4568DC', '#B06AB3']}
                  style={styles.drawerGradient}
                >
                  <IconButton
                    icon="account-circle"
                    size={60}
                    iconColor="#fff"
                    style={styles.drawerAvatar}
                  />
                  <Text style={styles.drawerName}>{manager?.fullName || 'Manager'}</Text>
                  <Text style={styles.drawerEmail}>{manager?.email || 'manager@example.com'}</Text>
                </LinearGradient>
              </View>
              <Drawer.Section>
                {menuItems.map((item) => (
                  <Drawer.Item
                    key={item.key}
                    icon={item.icon}
                    label={item.title}
                    active={currentRouteKey === item.key}
                    onPress={() => {
                      router.push(item.route);
                      setIsDrawerVisible(false);
                    }}
                    theme={{
                      colors: {
                        onSurfaceVariant: isDarkMode ? '#fff' : '#000',
                        onSecondaryContainer: theme.colors.primary,
                        secondaryContainer: isDarkMode ? 'rgba(208, 188, 255, 0.1)' : theme.colors.primaryContainer,
                      }
                    }}
                    style={styles.drawerItem}
                  />
                ))}
              </Drawer.Section>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  menuButton: {
    marginLeft: 8,
  },
  avatar: {
    marginRight: 8,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  drawerHeader: {
    height: 170,
    overflow: 'hidden',
  },
  drawerGradient: {
    height: '100%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  drawerAvatar: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  drawerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  drawerEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  drawerItem: {
    borderRadius: 0,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  menuContent: {
    marginTop: 44,
    minWidth: 200,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuEmail: {
    fontSize: 12,
  },
  menuDivider: {
    marginVertical: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  profileButton: {
    marginRight: 8,
  },
}); 