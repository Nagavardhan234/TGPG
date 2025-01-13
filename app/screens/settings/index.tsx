import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Switch, Button, TextInput, ActivityIndicator, Portal, Dialog, Snackbar, List } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { getSettings, updateSettings, updatePaymentDetails, verifyPassword } from '@/app/services/settings.service';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    currentMethod: '',
    history: [] as { date: string; amount: number; status: string }[],
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newPaymentDetails, setNewPaymentDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    emailNotifications: false,
    smsNotifications: false,
    darkMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setPaymentSettings({
        currentMethod: data.paymentMethod,
        history: data.paymentHistory,
      });
      setGeneralSettings({
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        darkMode: isDarkMode,
      });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerification = async () => {
    try {
      setPasswordError('');
      const isValid = await verifyPassword(password);
      if (isValid) {
        setShowPasswordDialog(false);
        setShowPaymentForm(true);
        setPassword('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error: any) {
      setPasswordError(error.message);
    }
  };

  const handlePaymentUpdate = async () => {
    try {
      await updatePaymentDetails(newPaymentDetails);
      setShowPaymentForm(false);
      setSnackbarMessage('Payment details updated successfully');
      setSnackbarVisible(true);
      loadSettings(); // Reload settings to show updated payment method
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      await updateSettings({
        emailNotifications: generalSettings.emailNotifications,
        smsNotifications: generalSettings.smsNotifications,
      });
      setSnackbarMessage('Settings updated successfully');
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
        
        <List.Item
          title="Current Payment Method"
          description={paymentSettings.currentMethod || 'No payment method set'}
          left={props => <List.Icon {...props} icon="credit-card" />}
        />

        <Button
          mode="outlined"
          onPress={() => setShowPasswordDialog(true)}
          style={styles.button}
        >
          Change Payment Details
        </Button>

        <Text style={[styles.subtitle, { color: theme.colors.primary }]}>Payment History</Text>
        {paymentSettings.history.map((payment, index) => (
          <List.Item
            key={index}
            title={`₹${payment.amount} - ${payment.status}`}
            description={payment.date}
            left={props => (
              <List.Icon
                {...props}
                icon={payment.status === 'Success' ? 'check-circle' : 'alert-circle'}
                color={payment.status === 'Success' ? 'green' : 'red'}
              />
            )}
          />
        ))}
      </Surface>

      {/* General Settings Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>General Settings</Text>

        <List.Item
          title="Email Notifications"
          left={props => <List.Icon {...props} icon="email" />}
          right={() => (
            <Switch
              value={generalSettings.emailNotifications}
              onValueChange={value =>
                setGeneralSettings({ ...generalSettings, emailNotifications: value })
              }
            />
          )}
        />

        <List.Item
          title="SMS Notifications"
          left={props => <List.Icon {...props} icon="message" />}
          right={() => (
            <Switch
              value={generalSettings.smsNotifications}
              onValueChange={value =>
                setGeneralSettings({ ...generalSettings, smsNotifications: value })
              }
            />
          )}
        />

        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={() => {
                toggleTheme();
                setGeneralSettings({ ...generalSettings, darkMode: !isDarkMode });
              }}
            />
          )}
        />

        <Button
          mode="contained"
          onPress={handleSettingsUpdate}
          style={styles.button}
        >
          Save Changes
        </Button>
      </Surface>

      {/* Password Verification Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Verify Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={!!passwordError}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handlePasswordVerification}>Verify</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Payment Form Dialog */}
      <Portal>
        <Dialog visible={showPaymentForm} onDismiss={() => setShowPaymentForm(false)}>
          <Dialog.Title>Update Payment Details</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Account Number"
              value={newPaymentDetails.accountNumber}
              onChangeText={text =>
                setNewPaymentDetails({ ...newPaymentDetails, accountNumber: text })
              }
              style={styles.input}
            />
            <TextInput
              label="IFSC Code"
              value={newPaymentDetails.ifscCode}
              onChangeText={text =>
                setNewPaymentDetails({ ...newPaymentDetails, ifscCode: text })
              }
              style={styles.input}
            />
            <TextInput
              label="Account Holder Name"
              value={newPaymentDetails.accountHolderName}
              onChangeText={text =>
                setNewPaymentDetails({ ...newPaymentDetails, accountHolderName: text })
              }
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentForm(false)}>Cancel</Button>
            <Button onPress={handlePaymentUpdate}>Save</Button>
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

      {/* Success Snackbar */}
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
  button: {
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
}); 