import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';

export default function Layout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PaperProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </PaperProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export const routeMap = {
  '/': 'index',
  '/screens/LoginScreen': 'login',
  '/screens/ManagerRegistration': 'manager-registration',
  '/screens/dashboard': 'dashboard',
  'screens/dashboard/students': 'dashboard/students',
  'screens/dashboard/rooms': 'dashboard/rooms',
  'screens/dashboard/messages': 'dashboard/messages',
  'screens/dashboard/payments': 'dashboard/payments',
  'screens/dashboard/profile': 'dashboard/profile',
  'screens/dashboard/settings': 'dashboard/settings',
  'screens/dashboard/notifications': 'dashboard/notifications',
  'screens/student/dashboard': 'student/dashboard',
} as const;

export type RouteMap = typeof routeMap;
