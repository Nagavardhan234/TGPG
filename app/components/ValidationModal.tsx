import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Modal, Portal, Text, Button, Surface, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { BlurView } from 'expo-blur';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationModalProps {
  visible: boolean;
  onDismiss: () => void;
  errors: ValidationError[];
  title?: string;
}

export default function ValidationModal({ 
  visible, 
  onDismiss, 
  errors,
  title = 'Validation Failed'
}: ValidationModalProps) {
  const { theme, isDarkMode } = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Surface style={[styles.content, { 
          backgroundColor: isDarkMode 
            ? 'rgba(30, 30, 30, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)'
        }]}>
          <IconButton
            icon="alert-circle"
            size={40}
            iconColor={theme.colors.error}
            style={styles.icon}
          />
          
          <Text style={[styles.title, { color: theme.colors.error }]}>
            {title}
          </Text>

          <View style={styles.errorList}>
            {errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <IconButton
                  icon="alert"
                  size={20}
                  iconColor={theme.colors.error}
                />
                <Text style={[styles.errorText, { 
                  color: isDarkMode ? '#fff' : '#000',
                  opacity: 0.87
                }]}>
                  {error.message}
                </Text>
              </View>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={onDismiss}
            style={[styles.button, { backgroundColor: theme.colors.error }]}
          >
            Got it
          </Button>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorList: {
    width: '100%',
    marginBottom: 24,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    width: '100%',
    marginTop: 8,
  },
}); 