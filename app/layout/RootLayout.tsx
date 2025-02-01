import React from 'react';
import { View } from 'react-native';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';
import { StudentAuthProvider } from '@/app/context/StudentAuthContext';
import ErrorBoundary from '@/app/components/ErrorBoundary';
import AccessibilityWrapper from '@/app/components/AccessibilityWrapper';
import LoadingManager from '@/app/components/LoadingManager';

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to your error tracking service
    console.error('Error caught by root boundary:', error, errorInfo);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <AccessibilityWrapper
          accessibilityRole="application"
          accessibilityLabel="Main application"
          importantForAccessibility="yes"
        >
          <LoadingManager>
            <AuthProvider>
              <StudentAuthProvider>
                <View style={{ flex: 1 }}>
                  {children}
                </View>
              </StudentAuthProvider>
            </AuthProvider>
          </LoadingManager>
        </AccessibilityWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default RootLayout; 