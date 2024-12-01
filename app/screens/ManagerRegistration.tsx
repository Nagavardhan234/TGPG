import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  Provider as PaperProvider,
  MD3LightTheme,
  Surface,
  Checkbox,
  HelperText,
} from 'react-native-paper';
import { API_URL } from '@/config/api.config';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFFFF',
  },
};

const facilities = [
  'Wi-Fi',
  'Laundry',
  'Meals',
  'AC',
  'Power Backup',
  'Security',
  'Parking',
];

interface FormErrors {
  email: any;
  fullName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  pgName?: string;
  pgAddress?: string;
  pgCapacity?: string;
  aadhaar?: string;
  agreeToTerms?: string;
}

export default function ManagerRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pgName: '',
    pgAddress: '',
    pgCapacity: '',
    aadhaar: '',
    selectedFacilities: [] as string[],
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = () => {
    const newErrors: FormErrors = {
      email: undefined
    };

    // Required fields validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.pgName.trim()) {
      newErrors.pgName = 'PG name is required';
    }

    if (!formData.pgAddress.trim()) {
      newErrors.pgAddress = 'PG address is required';
    }

    if (!formData.pgCapacity.trim()) {
      newErrors.pgCapacity = 'PG capacity is required';
    } else if (isNaN(Number(formData.pgCapacity))) {
      newErrors.pgCapacity = 'Please enter a valid number';
    }

    // Optional Aadhaar validation (if provided)
    if (formData.aadhaar && !/^\d{12}$/.test(formData.aadhaar)) {
      newErrors.aadhaar = 'Please enter a valid 12-digit Aadhaar number';
    }

    // Email validation (optional)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 debugger;
  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      const requestBody = {
        fullName: formData.fullName,
        email: formData.email || null,
        phone: formData.phone,
        password: formData.password,
        pgName: formData.pgName,
        pgAddress: formData.pgAddress,
        pgCapacity: parseInt(formData.pgCapacity),
        aadhaar: formData.aadhaar || null,
        agreeToTerms: formData.agreeToTerms,
        facilities: formData.selectedFacilities
      };
debugger;
      try {
        const response = await fetch(`${API_URL}/api/managers/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
          alert('Registration successful!');
          router.replace('/screens/LoginScreen');
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateFormData = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleFacility = (facility: string) => {
    const facilities = [...formData.selectedFacilities];
    const index = facilities.indexOf(facility);
    if (index === -1) {
      facilities.push(facility);
    } else {
      facilities.splice(index, 1);
    }
    updateFormData('selectedFacilities', facilities);
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Surface style={styles.card} elevation={2}>
            <Image
              source={require('../../assets/images/_63473394-ef87-4fcf-b0e6-95ac94b42b1b.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text variant="headlineSmall" style={styles.title}>
              Manager Registration
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              for PG Management System
            </Text>

            <TextInput
              mode="outlined"
              label="Full Name *"
              value={formData.fullName}
              onChangeText={(text) => updateFormData('fullName', text)}
              style={styles.input}
              error={!!errors.fullName}
              left={<TextInput.Icon icon="account" />}
            />
            {errors.fullName && <HelperText type="error">{errors.fullName}</HelperText>}

            <TextInput
              mode="outlined"
              label="Email (Optional)"
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              keyboardType="email-address"
              style={styles.input}
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}

            <TextInput
              mode="outlined"
              label="Phone Number *"
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              keyboardType="phone-pad"
              style={styles.input}
              error={!!errors.phone}
              left={<TextInput.Icon icon="phone" />}
            />
            {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}

            <TextInput
              mode="outlined"
              label="Password *"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry
              style={styles.input}
              error={!!errors.password}
              left={<TextInput.Icon icon="lock" />}
            />
            {errors.password && <HelperText type="error">{errors.password}</HelperText>}

            <TextInput
              mode="outlined"
              label="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry
              style={styles.input}
              error={!!errors.confirmPassword}
              left={<TextInput.Icon icon="lock" />}
            />
            {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}

            <TextInput
              mode="outlined"
              label="PG Name *"
              value={formData.pgName}
              onChangeText={(text) => updateFormData('pgName', text)}
              style={styles.input}
              error={!!errors.pgName}
              left={<TextInput.Icon icon="home" />}
            />
            {errors.pgName && <HelperText type="error">{errors.pgName}</HelperText>}

            <TextInput
              mode="outlined"
              label="PG Address *"
              value={formData.pgAddress}
              onChangeText={(text) => updateFormData('pgAddress', text)}
              multiline
              numberOfLines={3}
              style={styles.input}
              error={!!errors.pgAddress}
              left={<TextInput.Icon icon="map-marker" />}
            />
            {errors.pgAddress && <HelperText type="error">{errors.pgAddress}</HelperText>}

            <TextInput
              mode="outlined"
              label="PG Capacity (number of rooms) *"
              value={formData.pgCapacity}
              onChangeText={(text) => updateFormData('pgCapacity', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.pgCapacity}
              left={<TextInput.Icon icon="bed" />}
            />
            {errors.pgCapacity && <HelperText type="error">{errors.pgCapacity}</HelperText>}

            <TextInput
              mode="outlined"
              label="Aadhaar Number (Optional)"
              value={formData.aadhaar}
              onChangeText={(text) => updateFormData('aadhaar', text)}
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.aadhaar}
              left={<TextInput.Icon icon="card-account-details" />}
            />
            {errors.aadhaar && <HelperText type="error">{errors.aadhaar}</HelperText>}

            <Text variant="bodyLarge" style={styles.sectionTitle}>
              Available Facilities
            </Text>
            <View style={styles.facilitiesContainer}>
              {facilities.map((facility) => (
                <View key={facility} style={styles.facilityItem}>
                  <Checkbox.Item
                    label={facility}
                    status={formData.selectedFacilities.includes(facility) ? 'checked' : 'unchecked'}
                    onPress={() => toggleFacility(facility)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.termsContainer}>
              <Checkbox.Item
                label="I agree to the Terms of Service and Privacy Policy *"
                status={formData.agreeToTerms ? 'checked' : 'unchecked'}
                onPress={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
              />
              {errors.agreeToTerms && <HelperText type="error">{errors.agreeToTerms}</HelperText>}
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.registerButton}
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
              style={styles.loginLink}
            >
              Already have an account? Login
            </Button>
          </Surface>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  facilitiesContainer: {
    marginBottom: 16,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsContainer: {
    marginBottom: 16,
  },
  registerButton: {
    marginBottom: 16,
    borderRadius: 8,
    padding: 8,
  },
  loginLink: {
    marginBottom: 16,
  },
});