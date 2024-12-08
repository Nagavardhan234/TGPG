import { Stack } from 'expo-router/stack';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@/app/context/AuthContext';
import { useTheme } from '@/app/context/ThemeContext';

function AppContent() {
  const { theme } = useTheme();

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="screens/LoginScreen" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="screens/ManagerRegistration" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="screens/dashboard" 
          options={{
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
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
} as const;

export type RouteMap = typeof routeMap;
