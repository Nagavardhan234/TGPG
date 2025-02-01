import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface Props {
  message?: string;
}

export const LoadingOverlay: React.FC<Props> = ({ message = 'Loading...' }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LottieView
        source={require('../../assets/Animations/Loading.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={[styles.message, { color: colors.onSurface }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animation: {
    width: width * 0.5,
    height: width * 0.5,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
}); 