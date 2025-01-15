import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, Button, TextInput, ActivityIndicator, Portal, Dialog, Snackbar, List, SegmentedButtons } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { getSettings, verifyPassword, updatePaymentSettings, changePassword } from '@/app/services/settings.service';

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Password Verification State
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Password Change State
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    paymentMethod: 'upi',
    upiId: '••••••••',
    bankDetails: {
      bankName: '••••••••',
      accountNumber: '••••••••',
      ifscCode: '••••••••'
    }
  });

  // Add missing error state
  const [paymentSettingsError, setPaymentSettingsError] = useState('');

  // Store actual payment details separately
  const [actualPaymentSettings, setActualPaymentSettings] = useState({
    paymentMethod: 'upi',
    upiId: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      
      // Store actual values
      setActualPaymentSettings({
        paymentMethod: data.paymentMethod || 'upi',
        upiId: data.upiId || '',
        bankDetails: {
          bankName: data.bankDetails?.bankName || '',
          accountNumber: data.bankDetails?.accountNumber || '',
          ifscCode: data.bankDetails?.ifscCode || ''
        }
      });

      // Show masked values initially
      setPaymentSettings({
        paymentMethod: data.paymentMethod || 'upi',
        upiId: data.upiId ? '••••••••' : '',
        bankDetails: {
          bankName: data.bankDetails?.bankName ? '••••••••' : '',
          accountNumber: data.bankDetails?.accountNumber ? '••••••••' : '',
          ifscCode: data.bankDetails?.ifscCode ? '••••••••' : ''
        }
      });
    } catch (error: any) {
      setError(error.message);
      setSnackbarMessage(error.message);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerification = async () => {
    try {
      setPasswordError('');

      if (!password) {
        setPasswordError('Password is required');
        return;
      }

      await verifyPassword(password);
      setIsPasswordVerified(true);
      // Show actual values after password verification
      setPaymentSettings(actualPaymentSettings);
      setShowPasswordDialog(false);
      setPassword('');
    } catch (error: any) {
      setPasswordError(error.message);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setChangePasswordError('');

      if (!oldPassword || !newPassword || !confirmPassword) {
        setChangePasswordError('All fields are required');
        return;
      }

      if (newPassword !== confirmPassword) {
        setChangePasswordError('New passwords do not match');
        return;
      }

      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

      if (newPassword.length < 8) {
        setChangePasswordError('Password must be at least 8 characters long');
        return;
      }
      if (!hasUpperCase) {
        setChangePasswordError('Password must contain at least one uppercase letter');
        return;
      }
      if (!hasLowerCase) {
        setChangePasswordError('Password must contain at least one lowercase letter');
        return;
      }
      if (!hasNumbers) {
        setChangePasswordError('Password must contain at least one number');
        return;
      }
      if (!hasSpecialChar) {
        setChangePasswordError('Password must contain at least one special character');
        return;
      }

      await changePassword(oldPassword, newPassword);
      setShowChangePasswordDialog(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSnackbarMessage('Password changed successfully');
      setSnackbarVisible(true);
    } catch (error: any) {
      setChangePasswordError(error.message);
    }
  };

  const handlePaymentSettingsUpdate = async () => {
    try {
      setPaymentSettingsError('');

      // Check if password is verified first
      if (!isPasswordVerified) {
        setShowPasswordDialog(true);
        return;
      }

      if (paymentSettings.paymentMethod === 'upi') {
        if (!paymentSettings.upiId) {
          setPaymentSettingsError('UPI ID is required');
          return;
        }
        // UPI validation based on PaymentSettings table
        if (!/^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z][a-zA-Z]{2,64}$/i.test(paymentSettings.upiId)) {
          setPaymentSettingsError('Please enter a valid UPI ID');
          return;
        }
      } else {
        if (!paymentSettings.bankDetails.bankName) {
          setPaymentSettingsError('Bank name is required');
          return;
        }
        if (!paymentSettings.bankDetails.accountNumber) {
          setPaymentSettingsError('Account number is required');
          return;
        }
        if (!paymentSettings.bankDetails.ifscCode) {
          setPaymentSettingsError('IFSC code is required');
          return;
        }
        // Account number validation based on PaymentSettings table
        if (!/^\d{9,18}$/.test(paymentSettings.bankDetails.accountNumber)) {
          setPaymentSettingsError('Account number must be between 9 and 18 digits');
          return;
        }
        // IFSC validation based on PaymentSettings table
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(paymentSettings.bankDetails.ifscCode)) {
          setPaymentSettingsError('Please enter a valid IFSC code');
          return;
        }
      }

      await updatePaymentSettings({
        paymentMethod: paymentSettings.paymentMethod as 'upi' | 'bank',
        upiId: paymentSettings.upiId,
        bankDetails: paymentSettings.bankDetails
      });

      // Store actual values after successful save
      setActualPaymentSettings(paymentSettings);
      setSnackbarMessage('Payment settings updated successfully');
      setSnackbarVisible(true);
      setIsPasswordVerified(false);
      
      // Mask values again after saving
      setPaymentSettings(prev => ({
        ...prev,
        upiId: prev.upiId ? '••••••••' : '',
        bankDetails: {
          bankName: prev.bankDetails.bankName ? '••••••••' : '',
          accountNumber: prev.bankDetails.accountNumber ? '••••••••' : '',
          ifscCode: prev.bankDetails.ifscCode ? '••••••••' : ''
        }
      }));
    } catch (error: any) {
      setPaymentSettingsError(error.message);
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
      {/* Payment Settings */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Payment Settings</Text>
        
        <SegmentedButtons
          value={paymentSettings.paymentMethod}
          onValueChange={value => 
            setPaymentSettings({ ...paymentSettings, paymentMethod: value })}
          buttons={[
            { value: 'upi', label: 'UPI' },
            { value: 'bank', label: 'Bank Transfer' }
          ]}
          style={styles.segmentedButtons}
        />

        {paymentSettingsError ? (
          <Text style={styles.errorText}>{paymentSettingsError}</Text>
        ) : null}

        {paymentSettings.paymentMethod === 'upi' ? (
          <TextInput
            label="UPI ID"
            value={paymentSettings.upiId}
            onChangeText={text => {
              if (!isPasswordVerified) {
                setShowPasswordDialog(true);
                return;
              }
              setPaymentSettings({ ...paymentSettings, upiId: text });
            }}
            style={styles.input}
            disabled={!isPasswordVerified}
            placeholder={isPasswordVerified ? "Enter UPI ID" : "••••••••"}
          />
        ) : (
          <View>
            <TextInput
              label="Bank Name"
              value={paymentSettings.bankDetails.bankName}
              onChangeText={text => {
                if (!isPasswordVerified) {
                  setShowPasswordDialog(true);
                  return;
                }
                setPaymentSettings({
                  ...paymentSettings,
                  bankDetails: { ...paymentSettings.bankDetails, bankName: text }
                });
              }}
              style={styles.input}
              disabled={!isPasswordVerified}
              placeholder={isPasswordVerified ? "Enter bank name" : "••••••••"}
            />
            <TextInput
              label="Account Number"
              value={paymentSettings.bankDetails.accountNumber}
              onChangeText={text => {
                if (!isPasswordVerified) {
                  setShowPasswordDialog(true);
                  return;
                }
                setPaymentSettings({
                  ...paymentSettings,
                  bankDetails: { ...paymentSettings.bankDetails, accountNumber: text }
                });
              }}
              style={styles.input}
              disabled={!isPasswordVerified}
              keyboardType="numeric"
              placeholder={isPasswordVerified ? "Enter account number" : "••••••••"}
            />
            <TextInput
              label="IFSC Code"
              value={paymentSettings.bankDetails.ifscCode}
              onChangeText={text => {
                if (!isPasswordVerified) {
                  setShowPasswordDialog(true);
                  return;
                }
                setPaymentSettings({
                  ...paymentSettings,
                  bankDetails: { ...paymentSettings.bankDetails, ifscCode: text.toUpperCase() }
                });
              }}
              style={styles.input}
              disabled={!isPasswordVerified}
              autoCapitalize="characters"
              placeholder={isPasswordVerified ? "Enter IFSC code" : "••••••••"}
            />
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => {
            if (!isPasswordVerified) {
              setShowPasswordDialog(true);
              return;
            }
            handlePaymentSettingsUpdate();
          }}
          style={styles.button}
          icon={isPasswordVerified ? "content-save" : "lock"}
        >
          {isPasswordVerified ? 'Save Payment Settings' : 'Unlock to Edit'}
        </Button>
      </Surface>

      {/* Security Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Security</Text>
        
        <Button
          mode="outlined"
          onPress={() => setShowChangePasswordDialog(true)}
          style={styles.button}
          icon="lock"
        >
          Change Password
        </Button>
      </Surface>

      {/* Theme Section */}
      <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Appearance</Text>
        
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon={isDarkMode ? 'weather-night' : 'white-balance-sunny'} />}
          right={() => (
            <Button
              mode="outlined"
              onPress={toggleTheme}
              style={styles.themeButton}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          )}
        />
      </Surface>

      {/* Password Change Dialog */}
      <Portal>
        <Dialog visible={showChangePasswordDialog} onDismiss={() => setShowChangePasswordDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
            />
            {changePasswordError ? (
              <Text style={styles.errorText}>{changePasswordError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowChangePasswordDialog(false)}>Cancel</Button>
            <Button onPress={handlePasswordChange}>Change Password</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Password Verification Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Verify Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
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

      {/* Snackbar for notifications */}
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  themeButton: {
    marginVertical: 4,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    marginTop: 4,
  },
  segmentedButtons: {
    marginBottom: 16,
  }
}); 