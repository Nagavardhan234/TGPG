import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface Props {
  message?: string;
  showAnimation?: boolean;
}

export const PageLoader: React.FC<Props> = ({ 
  message = 'Loading...',
  showAnimation = true
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showAnimation ? (
        <LottieView
          source={require('../../assets/Animations/Loading.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      
      <Text style={[styles.message, { color: colors.onSurface }]}>
        {message}
      </Text>
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
    width: width * 0.5,
    height: width * 0.5,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
}); 