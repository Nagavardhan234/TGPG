import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, IconButton } from 'react-native-paper';
import { useTheme } from '@/app/context/ThemeContext';
import { studentRegistrationService } from '@/app/services/student.registration.service';
import { ErrorNotification } from '@/app/components/ErrorNotification';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function StudentRegistration() {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantRegId: '',
    roomNumber: '',
    joiningDate: new Date()
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
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

  const handleChange = (name: string, value: string) => {
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
    try {
      // Validate all fields
      const errors: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        if (key !== 'joiningDate') {
          const error = validateField(key, formData[key as keyof typeof formData] as string);
          if (error) errors[key] = error;
        }
      });

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await studentRegistrationService.register({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        joiningDate: formData.joiningDate.toISOString().split('T')[0],
        roomNumber: formData.roomNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        managerId: formData.tenantRegId
      });
      
      if (response.success) {
        router.push({
          pathname: '/screens/LoginScreen',
          params: {
            message: 'Registration successful. Pending manager approval.'
          }
        } as any);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
}); 