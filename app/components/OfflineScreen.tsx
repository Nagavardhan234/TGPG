import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { useNetworkStore } from '../stores/networkStore';

const { width } = Dimensions.get('window');

interface Props {
  onRetry?: () => void;
}

export const OfflineScreen: React.FC<Props> = ({ onRetry }) => {
  const { colors } = useTheme();
  const isConnected = useNetworkStore((state) => state.isConnected);

  if (isConnected) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView
        source={require('../../assets/Animations/networkerror.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={[styles.title, { color: colors.primary }]}>
        No Internet Connection
      </Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Please check your internet connection and try again
      </Text>
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Retry
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  animation: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 30,
  },
}); 