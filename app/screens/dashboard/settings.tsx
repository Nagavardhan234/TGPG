import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Switch, Button, ActivityIndicator, Portal, Dialog, TextInput, List, Divider, Snackbar } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { getSettings, updateSettings, updatePaymentDetails, verifyPassword } from '@/app/services/settings.service';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Payment Settings State
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    darkMode: isDarkMode,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setPaymentDetails({
        cardNumber: data.payment.cardNumber,
        expiryDate: data.payment.expiryDate,
        cvv: '',
      });
      setPaymentHistory(data.payment.history);
      setGeneralSettings({
        notifications: data.general.notifications,
        darkMode: data.general.darkMode,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    try {
      const isValid = await verifyPassword(password);
      if (!isValid) {
        setPasswordError('Invalid password');
        return;
      }

      await updatePaymentDetails(paymentDetails);
      setShowPaymentDialog(false);
      setPassword('');
      setPasswordError('');
      setSnackbarMessage('Payment details updated successfully');
      setSnackbarVisible(true);
      loadSettings();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const newSettings = {
        ...generalSettings,
        notifications: !generalSettings.notifications,
      };
      await updateSettings(newSettings);
      setGeneralSettings(newSettings);
      setSnackbarMessage('Notification settings updated');
      setSnackbarVisible(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleTheme = async () => {
    try {
      const newSettings = {
        ...generalSettings,
        darkMode: !generalSettings.darkMode,
      };
      await updateSettings(newSettings);
      setGeneralSettings(newSettings);
      toggleTheme();
      setSnackbarMessage('Theme updated');
      setSnackbarVisible(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Payment Settings Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Payment Settings</Text>
        
        <View style={styles.cardInfo}>
          <Text style={styles.label}>Card Number</Text>
          <Text style={styles.value}>
            •••• •••• •••• {paymentDetails.cardNumber.slice(-4)}
          </Text>
          
          <Text style={styles.label}>Expiry Date</Text>
          <Text style={styles.value}>{paymentDetails.expiryDate}</Text>
        </View>

        <Button
          mode="contained"
          onPress={() => setShowPaymentDialog(true)}
          style={styles.button}
        >
          Update Payment Details
        </Button>

        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Payment History</Text>
        {paymentHistory.map((payment, index) => (
          <React.Fragment key={payment.id}>
            <List.Item
              title={`₹${payment.amount}`}
              description={payment.date}
              left={props => <List.Icon {...props} icon="cash" />}
            />
            {index < paymentHistory.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Surface>

      {/* General Settings Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>General Settings</Text>
        
        <View style={styles.settingItem}>
          <Text>Notifications</Text>
          <Switch
            value={generalSettings.notifications}
            onValueChange={handleToggleNotifications}
          />
        </View>

        <View style={styles.settingItem}>
          <Text>Dark Mode</Text>
          <Switch
            value={generalSettings.darkMode}
            onValueChange={handleToggleTheme}
          />
        </View>
      </Surface>

      {/* Payment Update Dialog */}
      <Portal>
        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>Update Payment Details</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Card Number"
              value={paymentDetails.cardNumber}
              onChangeText={text => setPaymentDetails({ ...paymentDetails, cardNumber: text })}
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              label="Expiry Date (MM/YY)"
              value={paymentDetails.expiryDate}
              onChangeText={text => setPaymentDetails({ ...paymentDetails, expiryDate: text })}
              style={styles.input}
            />
            <TextInput
              label="CVV"
              value={paymentDetails.cvv}
              onChangeText={text => setPaymentDetails({ ...paymentDetails, cvv: text })}
              style={styles.input}
              keyboardType="numeric"
              secureTextEntry
            />
            <TextInput
              label="Verify Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              error={!!passwordError}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdatePayment}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Error Dialog */}
      <Portal>
        <Dialog visible={!!error} onDismiss={() => setError(null)}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setError(null)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  cardInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    marginVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
}); 