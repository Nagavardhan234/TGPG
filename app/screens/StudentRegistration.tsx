import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, Animated } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, IconButton, Portal } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { studentRegistrationService } from '@/app/services/student.registration.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteMap } from '@/app/_layout';

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenantRegId: string;
  roomNumber: string;
  joiningDate: Date;
}

interface FormErrors {
  [key: string]: string;
}

interface ApiError {
  message: string;
}

export default function StudentRegistration() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpVerified, setOTPVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantRegId: '',
    roomNumber: '',
    joiningDate: new Date()
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateField = (name: keyof FormData, value: string) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!/^[A-Za-z\s]+$/.test(value)) {
          error = 'Only alphabets and spaces are allowed';
        }
        break;
      case 'phone':
        if (!/^\d{10}$/.test(value)) {
          error = 'Phone number must be exactly 10 digits';
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'password':
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
          error = 'Password must have 8+ characters with uppercase, lowercase, number and special character';
        }
        break;
      case 'confirmPassword':
        if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'tenantRegId':
        if (!/^\d{5,}$/.test(value)) {
          error = 'Please enter a valid Tenant Registration ID (minimum 5 digits)';
        }
        break;
      case 'roomNumber':
        if (!/^\d+$/.test(value)) {
          error = 'Room number must be numeric';
        }
        break;
    }
    return error;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, joiningDate: selectedDate }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Client-side validation first
      const formErrors: FormErrors = {};
      (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
        const error = validateField(field, formData[field].toString());
        if (error) {
          formErrors[field] = error;
        }
      });

      if (Object.keys(formErrors).length > 0) {
        setFormErrors(formErrors);
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
        setLoading(false);
        return;
      }

      // Server-side validation before OTP
      try {
        const validationResponse = await studentRegistrationService.register({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          joiningDate: formData.joiningDate,
          roomNumber: formData.roomNumber,
          managerId: formData.tenantRegId,
          checkOnly: true // Just validate, don't register
        });

        // If validation passes, proceed with OTP
        if (!otpVerified) {
          try {
            await studentRegistrationService.sendOTP(formData.phone);
            setShowOTPModal(true);
          } catch (err) {
            const error = err as ApiError;
            console.error('Failed to send OTP:', error);
            setError(error.message || 'Failed to send OTP');
          }
          setLoading(false);
          return;
        }

        // If OTP is verified, proceed with actual registration
        const response = await studentRegistrationService.register({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          joiningDate: formData.joiningDate,
          roomNumber: formData.roomNumber,
          managerId: formData.tenantRegId
        });

        if (response.success) {
          router.push('screens/student/registration-status');
        } else {
          setError(response.message || 'Registration failed');
        }
      } catch (err) {
        const error = err as ApiError;
        console.error('Registration error:', error);
        if (error.message?.includes('email is already registered')) {
          setFormErrors(prev => ({ ...prev, email: error.message }));
        } else if (error.message?.includes('phone number is already registered')) {
          setFormErrors(prev => ({ ...prev, phone: error.message }));
        } else if (error.message?.includes('Room')) {
          setFormErrors(prev => ({ ...prev, roomNumber: error.message }));
        } else if (error.message?.includes('Tenant Registration ID')) {
          setFormErrors(prev => ({ ...prev, tenantRegId: error.message }));
        } else {
          setError(error.message || 'Registration failed');
        }
      }

    } catch (err) {
      const error = err as ApiError;
      console.error('Registration error:', error);
      if (error.message?.includes('email is already registered')) {
        setFormErrors(prev => ({ ...prev, email: error.message }));
      } else if (error.message?.includes('phone number is already registered')) {
        setFormErrors(prev => ({ ...prev, phone: error.message }));
      } else if (error.message?.includes('Room')) {
        setFormErrors(prev => ({ ...prev, roomNumber: error.message }));
      } else if (error.message?.includes('Tenant Registration ID')) {
        setFormErrors(prev => ({ ...prev, tenantRegId: error.message }));
      } else {
        setError(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setOtpError('');
      const response = await studentRegistrationService.verifyOTP(formData.phone, otp);
      if (response.success) {
        setOTPVerified(true);
        setShowOTPModal(false);
        // Instead of calling handleSubmit, proceed with registration directly
        const registrationResponse = await studentRegistrationService.register({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          joiningDate: formData.joiningDate,
          roomNumber: formData.roomNumber,
          managerId: formData.tenantRegId
        });

        if (registrationResponse.success) {
          router.push('screens/student/registration-status');
        } else {
          setError(registrationResponse.message || 'Registration failed');
        }
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      const error = err as ApiError;
      setOtpError(error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (showOTPModal) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [showOTPModal]);

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { backgroundColor: theme.colors.background }
      ]}
    >
      <Surface style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isDarkMode ? theme.colors.outline : 'transparent',
          borderWidth: isDarkMode ? 1 : 0
        }
      ]}>
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Student Registration
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(value) => handleChange('fullName', value)}
            mode="outlined"
            error={!!formErrors.fullName}
            style={styles.input}
          />
          {formErrors.fullName && (
            <HelperText type="error">{formErrors.fullName}</HelperText>
          )}

          <TextInput
            label="Phone Number"
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!formErrors.phone}
            style={styles.input}
          />
          {formErrors.phone && (
            <HelperText type="error">{formErrors.phone}</HelperText>
          )}

          <TextInput
            label="Email (Optional)"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            mode="outlined"
            keyboardType="email-address"
            error={!!formErrors.email}
            style={styles.input}
          />
          {formErrors.email && (
            <HelperText type="error">{formErrors.email}</HelperText>
          )}

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
            mode="outlined"
            secureTextEntry={!showPassword}
            error={!!formErrors.password}
            style={styles.input}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
          />
          {formErrors.password && (
            <HelperText type="error">{formErrors.password}</HelperText>
          )}

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleChange('confirmPassword', value)}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            error={!!formErrors.confirmPassword}
            style={styles.input}
            right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
          />
          {formErrors.confirmPassword && (
            <HelperText type="error">{formErrors.confirmPassword}</HelperText>
          )}

          <TextInput
            label="Tenant Registration ID"
            value={formData.tenantRegId}
            onChangeText={(value) => handleChange('tenantRegId', value)}
            mode="outlined"
            keyboardType="numeric"
            error={!!formErrors.tenantRegId}
            style={styles.input}
          />
          {formErrors.tenantRegId && (
            <HelperText type="error">{formErrors.tenantRegId}</HelperText>
          )}

          <TextInput
            label="Room Number"
            value={formData.roomNumber}
            onChangeText={(value) => handleChange('roomNumber', value)}
            mode="outlined"
            keyboardType="numeric"
            error={!!formErrors.roomNumber}
            style={styles.input}
          />
          {formErrors.roomNumber && (
            <HelperText type="error">{formErrors.roomNumber}</HelperText>
          )}

          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text>Joining Date: {formData.joiningDate.toLocaleDateString()}</Text>
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={formData.joiningDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          >
            Register
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Back to Login
          </Button>
        </View>
      </Surface>

      <Portal>
        <Modal
          visible={showOTPModal}
          onDismiss={() => setShowOTPModal(false)}
          transparent
        >
          <Animated.View style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              }],
            },
          ]}>
            <Surface style={[styles.otpCard, {
              backgroundColor: theme.colors.surface,
              borderColor: isDarkMode ? theme.colors.outline : 'transparent',
              borderWidth: isDarkMode ? 1 : 0,
            }]}>
              <Text style={[styles.otpTitle, { color: theme.colors.primary }]}>
                Enter OTP
              </Text>
              <Text style={[styles.otpSubtitle, { color: theme.colors.onSurface }]}>
                Please enter the OTP sent to {formData.phone}
              </Text>
              
              <TextInput
                label="OTP"
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                keyboardType="numeric"
                maxLength={6}
                style={styles.otpInput}
                error={!!otpError}
              />
              {otpError && (
                <HelperText type="error">{otpError}</HelperText>
              )}

              <View style={styles.otpButtons}>
                <Button
                  mode="text"
                  onPress={() => setShowOTPModal(false)}
                  style={styles.otpButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  style={styles.otpButton}
                >
                  Verify
                </Button>
              </View>
            </Surface>
          </Animated.View>
        </Modal>
      </Portal>

      {error && (
        <ErrorNotification
          visible={!!error}
          message={error}
          onDismiss={() => setError(null)}
          type="error"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  formContainer: {
    gap: 8,
  },
  input: {
    marginBottom: 4,
  },
  dateButton: {
    marginVertical: 8,
  },
  submitButton: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  otpCard: {
    padding: 24,
    borderRadius: 12,
    elevation: 8,
    width: '90%',
    maxWidth: 400,
  },
  otpTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  otpInput: {
    marginBottom: 24,
    fontSize: 24,
    letterSpacing: 8,
  },
  otpButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  otpButton: {
    minWidth: 100,
  },
}); 