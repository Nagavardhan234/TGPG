import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Drawer, Appbar, Avatar, Menu } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { useTheme } from '@/app/context/ThemeContext';

const menuItems = [
  {
    key: 'index',
    title: 'Dashboard',
    icon: 'view-dashboard',
    route: '/screens/dashboard'
  },
  {
    key: 'students',
    title: 'Student Management',
    icon: 'account-group',
    route: '/screens/dashboard/students'
  },
  {
    key: 'rooms',
    title: 'Room Management',
    icon: 'home',
    route: '/screens/dashboard/rooms'
  },
  {
    key: 'payments',
    title: 'Payments Overview',
    icon: 'credit-card',
    route: '/screens/dashboard/payments'
  },
  {
    key: 'messages',
    title: 'Messages',
    icon: 'message',
    route: '/screens/dashboard/messages'
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme, isDarkMode } = useTheme();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const pathname = usePathname();

  if (!theme) return null;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    router.replace('/screens/LoginScreen');
  };

  const getCurrentRouteKey = (path: string) => {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart || 'index';
  };

  const currentRouteKey = getCurrentRouteKey(pathname);
  const currentRoute = menuItems.find(item => item.key === currentRouteKey) || menuItems[0];

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: isDarkMode ? '#121212' : theme.colors.background 
    }]}>
      <Appbar.Header style={[styles.header, { 
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface 
      }]}>
        <Appbar.Action 
          icon={isMenuVisible ? "close" : "menu"} 
          onPress={() => setIsMenuVisible(!isMenuVisible)}
          iconColor={isDarkMode ? '#FFFFFF' : undefined}
        />
        <Appbar.Content 
          title={currentRoute.title} 
          titleStyle={{ color: isDarkMode ? '#FFFFFF' : undefined }}
        />
        <ThemeToggle />
        <Appbar.Action 
          icon="bell" 
          onPress={() => {}}
          iconColor={isDarkMode ? '#FFFFFF' : undefined}
        />
        <Menu
          visible={isProfileMenuVisible}
          onDismiss={() => setIsProfileMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="account-circle"
              onPress={() => setIsProfileMenuVisible(true)}
              iconColor={isDarkMode ? '#FFFFFF' : undefined}
            />
          }
          contentStyle={{
            backgroundColor: isDarkMode ? '#1E1E1E' : theme.colors.surface
          }}
        >
          <Menu.Item 
            onPress={() => {}} 
            title="Profile" 
            titleStyle={{ color: isDarkMode ? '#FFFFFF' : undefined }}
          />
          <Menu.Item 
            onPress={() => {}} 
            title="Settings" 
            titleStyle={{ color: isDarkMode ? '#FFFFFF' : undefined }}
          />
          <Menu.Item 
            onPress={handleLogout} 
            title="Logout" 
            titleStyle={{ color: isDarkMode ? '#FFFFFF' : undefined }}
          />
        </Menu>
      </Appbar.Header>

      <View style={styles.content}>
        <View style={[styles.mainContent, {
          backgroundColor: isDarkMode ? '#121212' : theme.colors.background
        }]}>
          {children}
        </View>

        {isMenuVisible && (
          <View style={[
            styles.drawer, 
            { 
              backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : theme.colors.surface,
              borderRightColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceVariant 
            }
          ]}>
            <Drawer.Section>
              {menuItems.map((item) => (
                <Drawer.Item
                  key={item.key}
                  icon={item.icon}
                  label={item.title}
                  active={currentRouteKey === item.key}
                  onPress={() => {
                    router.push(item.route);
                    setIsMenuVisible(false);
                  }}
                  theme={{
                    colors: {
                      onSurfaceVariant: isDarkMode ? '#FFFFFF' : undefined,
                      onSecondaryContainer: isDarkMode ? '#D0BCFF' : undefined,
                      secondaryContainer: isDarkMode ? 'rgba(208, 188, 255, 0.1)' : undefined
                    }
                  }}
                />
              ))}
            </Drawer.Section>
          </View>
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
    elevation: 0,
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    zIndex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRightWidth: 1,
  },
}); 