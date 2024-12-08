import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';

interface ValidationModalProps {
  visible: boolean;
  onDismiss: () => void;
  errors: Array<{ field: string; message: string }>;
  title: string;
}

export default function ValidationModal({ visible, onDismiss, errors, title }: ValidationModalProps) {
  const { theme } = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.error }]}>
          {title}
        </Text>
        
        <View style={styles.errorList}>
          {errors.map((error, index) => (
            <View key={index} style={styles.errorItem}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                • {error.message}
              </Text>
            </View>
          ))}
        </View>

        <Button 
          mode="contained" 
          onPress={onDismiss}
          style={styles.button}
        >
          OK
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorList: {
    width: '100%',
    marginBottom: 16,
  },
  errorItem: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
  },
  button: {
    width: '100%',
  },
}); 