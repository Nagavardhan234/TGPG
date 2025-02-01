import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Snackbar } from 'react-native-paper';
import { initNetworkMonitoring } from '../utils/networkStatus';
import { useNetworkStore } from '../stores/networkStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const isConnected = useNetworkStore((state) => state.isConnected);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const init = async () => {
      const unsubscribe = initNetworkMonitoring();
      setIsInitialized(true);
      return unsubscribe;
    };

    init();
  }, []);

  useEffect(() => {
    if (isInitialized && !isConnected) {
      setShowOfflineMessage(true);
    } else {
      setShowOfflineMessage(false);
    }
  }, [isConnected, isInitialized]);

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {children}
      <Snackbar
        visible={showOfflineMessage}
        onDismiss={() => setShowOfflineMessage(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setShowOfflineMessage(false),
        }}
      >
        You are currently offline
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
}); 