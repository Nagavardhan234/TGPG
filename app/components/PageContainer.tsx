import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import useAppStore from '../stores/appStore';

interface PageContainerProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  requiresAuth?: boolean;
  requiresInitialLoad?: boolean;
  onLoadStart?: () => Promise<void>;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  loading = false,
  loadingMessage = 'Loading...',
  requiresAuth = true,
  requiresInitialLoad = true,
  onLoadStart,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(loading);
  const { initialLoadingComplete, isAuthenticated } = useAppStore();

  useEffect(() => {
    let mounted = true;

    const initializePage = async () => {
      if (onLoadStart) {
        setIsLoading(true);
        try {
          await onLoadStart();
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    };

    if ((!requiresInitialLoad || initialLoadingComplete) && 
        (!requiresAuth || isAuthenticated)) {
      initializePage();
    }

    return () => {
      mounted = false;
    };
  }, [onLoadStart, initialLoadingComplete, isAuthenticated, requiresInitialLoad, requiresAuth]);

  // Show nothing while initial loading is not complete
  if (requiresInitialLoad && !initialLoadingComplete) {
    return null;
  }

  // Show loading state
  if (isLoading || loading) {
    return (
      <View 
        style={[
          styles.container, 
          styles.loadingContainer,
          { backgroundColor: theme.colors.background }
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Render page content
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PageContainer; 