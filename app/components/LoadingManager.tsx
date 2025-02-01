import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import useAppStore from '../stores/appStore';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const LoadingManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { setInitialLoadingComplete } = useAppStore();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    async function prepare() {
      try {
        // Load icon fonts with error handling
        try {
          await Promise.all([
            Font.loadAsync(Ionicons.font),
            Font.loadAsync(MaterialIcons.font),
            Font.loadAsync(FontAwesome.font),
          ]);
        } catch (e) {
          console.warn('Icon fonts failed to load, continuing anyway:', e);
        }

        // Pre-load critical images
        try {
          await Asset.loadAsync([
            require('../../assets/images/splash-icon.png'),
            require('../../assets/images/Logo.png'),
          ]);
        } catch (e) {
          console.warn('Some images failed to load, continuing anyway:', e);
        }

        // Small delay for stability
        await new Promise(resolve => setTimeout(resolve, 50));

        setIsReady(true);
        setInitialLoadingComplete(true);
      } catch (e) {
        console.error('Fatal error during resource loading:', e);
        setLoadingError('Failed to load app resources');
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200, // Slightly faster transition
        useNativeDriver: true,
      }).start(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      });
    }
  }, [isReady, fadeAnim]);

  // Handle fatal loading errors
  if (loadingError) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Don't show anything while loading
  if (!isReady) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          backgroundColor: theme.colors.background 
        }
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingManager; 