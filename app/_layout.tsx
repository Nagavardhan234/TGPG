import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="screens/LoginScreen" />
      <Stack.Screen 
        name="screens/DashboardScreen" 
        options={{
          // Prevent going back to login screen
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
