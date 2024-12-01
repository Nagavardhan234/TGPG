import { Stack } from 'expo-router';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { PaperProvider } from 'react-native-paper';

export default function Layout() {
  return (
    <ThemeProvider>
      {({ theme }) => (
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="screens/LoginScreen" />
            <Stack.Screen name="screens/ManagerRegistration" />
            <Stack.Screen 
              name="screens/dashboard" 
              options={{
                gestureEnabled: false,
                headerBackVisible: false,
              }}
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </PaperProvider>
      )}
    </ThemeProvider>
  );
}
