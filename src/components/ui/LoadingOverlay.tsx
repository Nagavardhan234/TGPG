import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Please wait...' }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Surface style={styles.loader}>
        <ActivityIndicator size="large" color="#6750A4" />
        <Text style={styles.text}>{message}</Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loader: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 16,
    elevation: 5,
  },
  text: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
}); 