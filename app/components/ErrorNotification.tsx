import React from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { Surface, Text, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

interface ErrorNotificationProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  visible,
  message,
  onDismiss,
  type = 'error'
}) => {
  const { theme, isDarkMode } = useTheme();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'warning':
        return { icon: 'alert', color: '#FFA726' };
      case 'info':
        return { icon: 'information', color: '#29B6F6' };
      default:
        return { icon: 'alert-circle', color: '#EF5350' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Surface style={[
        styles.surface,
        { 
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : theme.colors.surface,
          borderLeftColor: color,
        }
      ]}>
        <View style={styles.content}>
          <IconButton
            icon={icon}
            size={24}
            iconColor={color}
            style={styles.icon}
          />
          <Text style={[
            styles.message,
            { color: theme.colors.text }
          ]}>
            {message}
          </Text>
          <IconButton
            icon="close"
            size={20}
            onPress={onDismiss}
            iconColor={theme.colors.text}
          />
        </View>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  surface: {
    borderRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  icon: {
    margin: 0,
  },
  message: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
  },
}); 