import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Props {
  message?: string;
  onRetry?: () => void;
  icon?: string;
  showAnimation?: boolean;
}

export const NetworkErrorView: React.FC<Props> = ({ 
  message = 'Something went wrong. Please try again.',
  onRetry,
  icon = 'alert-circle-outline',
  showAnimation = true
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showAnimation ? (
        <LottieView
          source={require('../../assets/Animations/networkerror.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      ) : (
        <MaterialCommunityIcons
          name={icon}
          size={64}
          color={colors.error}
          style={styles.icon}
        />
      )}
      
      <Text style={[styles.message, { color: colors.error }]}>
        {message}
      </Text>
      
      {onRetry && (
        <Button
          mode="contained"
          onPress={onRetry}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          Try Again
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
  icon: {
    marginBottom: 20,
    opacity: 0.8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 30,
  },
}); 