import { Stack } from 'expo-router/stack';
import { useTheme } from '@/app/context/ThemeContext';
import DashboardLayout from '@/app/components/layouts/DashboardLayout';

export default function Layout() {
  const { theme } = useTheme();

  return (
    <DashboardLayout>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            title: "Dashboard",
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="students"
          options={{
            title: "Student Management",
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="rooms"
          options={{
            title: "Room Management",
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="payments"
          options={{
            title: "Payments Overview",
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="messages" 
          options={{ 
            title: "Messages",
            headerShown: false 
          }}
        />
      </Stack>
    </DashboardLayout>
  );
} 