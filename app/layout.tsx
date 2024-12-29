import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import Toast from './components/Toast';
import { useSessionExpired } from './hooks/useSessionExpired';

export default function RootLayout() {
  // Initialize session expiration handling
  useSessionExpired();

  return (
    <View style={{ flex: 1 }}>
      <Stack />
      <Toast />
    </View>
  );
} 