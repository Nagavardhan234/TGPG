import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: theme.colors.background }
      ]}
      accessible={true}
      accessibilityLabel="Error screen"
    >
      <MaterialIcons 
        name="error-outline" 
        size={48} 
        color={theme.colors.error}
        accessibilityLabel="Error icon"
      />
      <Text 
        style={[
          styles.title, 
          { color: theme.colors.error }
        ]}
        accessibilityRole="header"
      >
        Oops! Something went wrong
      </Text>
      <Text 
        style={[
          styles.message, 
          { color: theme.colors.text }
        ]}
        accessibilityRole="text"
      >
        {error?.message || 'An unexpected error occurred'}
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={onReset}
        accessible={true}
        accessibilityLabel="Try again button"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundaryClass; 