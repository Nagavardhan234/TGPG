import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
  Portal,
} from 'react-native-paper';
import { API_URL } from '@/config/api.config';
import { Facility, FacilityResponse } from '@/src/interfaces/Facility';
import { FormErrors } from '@/src/interfaces/forms';
import { LoadingOverlay } from '@/src/components/ui/LoadingOverlay';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    background: '#FFFFFF',
  },
};

interface ApiErrorResponse {
  success: boolean;
  error: string;
}

export default function ManagerRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
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
    selectedFacilities: [] as number[],
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    message: '',
    title: '',
    showCancel: true,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [loadingMessage, setLoadingMessage] = useState('Please wait...');

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/api/facilities`);
        const data: FacilityResponse = await response.json();
        
        if (data.success) {
          setFacilities(data.facilities);
        } else {
          console.error('Failed to fetch facilities');
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
      }
    };

    fetchFacilities();
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};

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
    if (formData.email) {
      // More flexible email validation pattern
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms and Conditions';
    }

    return newErrors;
  }, [formData]);

  const showModal = (config: Partial<typeof modalConfig>) => {
    setModalConfig(prev => ({
      ...prev,
      visible: true,
      ...config,
    }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      setLoadingMessage('Registering your account...');
      setIsLoading(true);
      try {
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

        const response = await fetch(`${API_URL}/api/managers/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json() as ApiErrorResponse;

        if (data.success) {
          showModal({
            title: 'Success',
            message: 'Registration successful!',
            showCancel: false,
            confirmText: 'Go to Login',
            onConfirm: () => router.replace('/screens/LoginScreen'),
          });
        } else {
          if (data.error?.toLowerCase().includes('phone number')) {
            showModal({
              title: 'Phone Number Already Registered',
              message: 'This phone number is already registered. Would you like to login instead?',
              confirmText: 'Go to Login',
              cancelText: 'Try Again',
              onConfirm: () => router.replace('/screens/LoginScreen'),
              onCancel: () => setModalConfig(prev => ({ ...prev, visible: false })),
            });
          } else {
            showModal({
              title: 'Registration Failed',
              message: data.error || 'Registration failed. Please try again.',
              showCancel: false,
              onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false })),
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
        showModal({
          title: 'Error',
          message: 'Registration failed. Please try again.',
          showCancel: false,
          onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false })),
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const updateFormData = (field: string, value: string | boolean | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleFacility = (facilityId: number) => {
    const selectedIds = [...formData.selectedFacilities];
    const index = selectedIds.indexOf(facilityId);
    if (index === -1) {
      selectedIds.push(facilityId);
    } else {
      selectedIds.splice(index, 1);
    }
    updateFormData('selectedFacilities', selectedIds);
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
                <View key={facility.Id} style={styles.facilityItem}>
                  <Checkbox.Item
                    label={facility.Name}
                    status={formData.selectedFacilities.includes(facility.Id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleFacility(facility.Id)}
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
              disabled={isLoading}
            >
              Register
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

        <LoadingOverlay visible={isLoading} message={loadingMessage} />

        <Portal>
          <Modal
            visible={modalConfig.visible}
            onDismiss={() => setModalConfig(prev => ({ ...prev, visible: false }))}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
              <Text style={styles.modalText}>{modalConfig.message}</Text>
              <View style={styles.modalButtons}>
                {modalConfig.showCancel && (
                  <Button
                    mode="text"
                    onPress={() => modalConfig.onCancel()}
                    style={styles.modalButton}
                  >
                    {modalConfig.cancelText}
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={() => modalConfig.onConfirm()}
                  style={styles.modalButton}
                >
                  {modalConfig.confirmText}
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>
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
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
});